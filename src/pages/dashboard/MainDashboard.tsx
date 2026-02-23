import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Target, 
  Users, 
  Wallet,
  ArrowUpRight,
  History,
  HelpCircle,
  PlusCircle,
  Bell,
  User,
  DollarSign,
  Calendar,
  Settings,
  LogOut,
  CreditCard,
  MoreVertical,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import ProfileSwitcher from './ProfileSwitcher';
import { userApi, stokvelApi, loanApi, contributionApi, notificationApi, cardApi, paymentApi } from '../../api';

interface Profile {
  id: string;
  name: string;
  stokvelName: string;
  stokvelId: string;
  role: 'member' | 'admin';
  targetAmount: number;
  savedAmount: number;
  progress: number;
  status?: 'active' | 'pending' | 'rejected';
}

interface StokvelData {
  name: string;
  total: number;
  target: number;
  progress: number;
  memberCount: number;
  cycle: string;
  nextPayout: string;
  individualTarget: number;
}

interface AvailableStokvel {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  targetAmount: number;
  cycle: string;
  category: string;
  status: 'active' | 'pending' | 'available';
}

export default function MainDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDiscoverStokvels, setShowDiscoverStokvels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  
  // Dynamic data from backend
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [availableStokvels, setAvailableStokvels] = useState<AvailableStokvel[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loanStats, setLoanStats] = useState({ available: 0, borrowed: 0, remaining: 0, progress: 0 });
  const [stokvelDetails, setStokvelDetails] = useState<StokvelData | null>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  
  // Fetch data from backend
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userRes, stokvelsRes, notifRes, cardsRes] = await Promise.all([
        userApi.getMe(),
        stokvelApi.list(),
        notificationApi.list({ limit: 10 }).catch(() => ({ data: [] })),
        cardApi.list().catch(() => ({ data: [] })),
      ]);

      const user = userRes.data;
      setUserName(user.name);

      // Map user profiles from backend
      const userProfiles: Profile[] = (user.profiles || []).map((p: any) => ({
        id: String(p.id),
        name: user.name,
        stokvelName: p.stokvelName,
        stokvelId: String(p.stokvelId),
        role: p.role || 'member',
        targetAmount: p.targetAmount || 0,
        savedAmount: p.savedAmount || 0,
        progress: p.progress || 0,
        status: p.status || 'active',
      }));
      setProfiles(userProfiles);

      // Map available stokvels
      const userStokvelIds = userProfiles.map((p: Profile) => p.stokvelId);
      const allStokvels: AvailableStokvel[] = (stokvelsRes.data || []).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        description: s.description || '',
        memberCount: s.currentMembers || 0,
        targetAmount: s.targetAmount || 0,
        cycle: s.cycle || 'Monthly',
        category: s.type || 'General',
        status: userStokvelIds.includes(String(s.id)) ? 'active' as const : 'available' as const,
      }));
      setAvailableStokvels(allStokvels);

      // Notifications
      const notifData = Array.isArray(notifRes.data) ? notifRes.data : notifRes.data?.data || [];
      setNotifications(notifData.map((n: any) => ({
        id: n.id,
        message: n.title || n.message,
        time: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '',
        read: n.isRead || false,
      })));

      // Cards
      setUserCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);

      // Fetch loan stats
      try {
        const loanRes = await loanApi.getStats();
        const ls = loanRes.data;
        const maxBorrowable = userProfiles.reduce((sum: number, p: Profile) => sum + Math.floor(p.savedAmount * 0.5), 0);
        const borrowed = ls.activeAmount || 0;
        setLoanStats({
          available: maxBorrowable,
          borrowed,
          remaining: Math.max(0, maxBorrowable - borrowed),
          progress: maxBorrowable > 0 ? Math.min(100, Math.floor((borrowed / maxBorrowable) * 100)) : 0,
        });
      } catch { /* no loans yet */ }

    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter stokvels based on search and category
  const filteredStokvels = availableStokvels.filter(stokvel => {
    const matchesSearch = stokvel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stokvel.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || stokvel.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Categories for filter
  const categories = ['all', ...new Set(availableStokvels.map(s => s.category))];

  // Get initial profile from URL params or localStorage
  const getInitialProfile = (): Profile | null => {
    if (profiles.length === 0) return null;
    const profileIdFromUrl = searchParams.get('profile');
    if (profileIdFromUrl) {
      const found = profiles.find(p => p.id === profileIdFromUrl);
      if (found) return found;
    }
    const savedProfileId = localStorage.getItem('activeProfileId');
    if (savedProfileId) {
      const found = profiles.find(p => p.id === savedProfileId);
      if (found) return found;
    }
    return profiles[0];
  };

  // Active Profile State
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  // Update active profile when profiles load
  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      setActiveProfile(getInitialProfile());
    }
  }, [profiles]);

  // Fetch stokvel details when active profile changes
  useEffect(() => {
    if (!activeProfile?.stokvelId) return;
    stokvelApi.getDetails(Number(activeProfile.stokvelId))
      .then(res => {
        const s = res.data;
        setStokvelDetails({
          name: s.name,
          total: s.totalPool || 0,
          target: (s.currentMembers || 0) * (activeProfile.targetAmount || 0),
          progress: 0,
          memberCount: s.currentMembers || 0,
          cycle: s.cycle ? `${s.cycle}${s.meetingDay ? ' (' + s.meetingDay + ')' : ''}` : 'Monthly',
          nextPayout: s.nextPayout ? new Date(s.nextPayout).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD',
          individualTarget: activeProfile.targetAmount,
        });
      })
      .catch(() => {
        setStokvelDetails({
          name: activeProfile.stokvelName,
          total: 0,
          target: 0,
          progress: 0,
          memberCount: 0,
          cycle: 'Monthly',
          nextPayout: 'TBD',
          individualTarget: activeProfile.targetAmount,
        });
      });
  }, [activeProfile]);

  // Update URL and localStorage when profile changes
  const handleProfileSwitch = (profile: Profile) => {
    setActiveProfile(profile);
    setSearchParams({ profile: profile.id });
    localStorage.setItem('activeProfileId', profile.id);
  };

  // Contribution form state
  const [contributionData, setContributionData] = useState({
    amount: '',
    paymentMethod: 'card'
  });

  // Calculate remaining amount for this profile
  const remainingAmount = activeProfile ? activeProfile.targetAmount - activeProfile.savedAmount : 0;
  const progressPercentage = activeProfile ? (activeProfile.targetAmount > 0 ? (activeProfile.savedAmount / activeProfile.targetAmount) * 100 : 0) : 0;

  // Use loan stats from backend
  const loanData = loanStats;

  // Stokvel data from details fetch
  const currentStokvel = stokvelDetails || {
    name: activeProfile?.stokvelName || '',
    total: 0,
    target: 0,
    progress: 0,
    memberCount: 0,
    cycle: 'Monthly',
    nextPayout: 'TBD',
    individualTarget: activeProfile?.targetAmount || 0,
  };
  // Calculate stokvel progress
  if (currentStokvel.target > 0) {
    currentStokvel.progress = Math.round((currentStokvel.total / currentStokvel.target) * 100);
  }

  // Handle join request
  const handleJoinRequest = async (stokvelId: string) => {
    try {
      await stokvelApi.joinRequest(Number(stokvelId));
      alert('Join request sent! Awaiting admin approval.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send join request');
    }
  };

  // Get rejected profiles to show in notifications only
  const rejectedProfiles = profiles.filter(p => p.status === 'rejected');
  
  const unreadCount = notifications.filter(n => !n.read).length + rejectedProfiles.length;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleAddContribution = async () => {
    if (!activeProfile) return;
    // Check if amount is valid
    if (!contributionData.amount || parseInt(contributionData.amount) < 100 || parseInt(contributionData.amount) > remainingAmount) {
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Initialize Paystack payment via backend
      const res = await paymentApi.initialize({
        amount: parseInt(contributionData.amount),
        profileId: Number(activeProfile.id),
      });

      const { authorizationUrl, reference } = res.data.data;

      // Open Paystack payment page
      const paymentWindow = window.open(authorizationUrl, '_blank');

      // Poll for payment completion
      const checkPayment = setInterval(async () => {
        try {
          const verifyRes = await paymentApi.verify(reference);
          if (verifyRes.data.data?.status === 'success') {
            clearInterval(checkPayment);
            setShowAddContribution(false);
            setIsProcessingPayment(false);
            setContributionData({ amount: '', paymentMethod: 'card' });
            alert(`✅ Payment of R ${contributionData.amount} confirmed! Your contribution has been recorded.`);
            fetchData();
          }
        } catch {
          // Still pending, keep polling
        }
      }, 5000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(checkPayment);
        setIsProcessingPayment(false);
      }, 300000);

    } catch (err: any) {
      setIsProcessingPayment(false);
      alert(err.response?.data?.error || 'Failed to initialize payment. Please try again.');
    }
  };

  if (isLoading || !activeProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Next payout date display
  const TARGET_DATE = currentStokvel.nextPayout || 'TBD';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary-800">{currentStokvel.name || 'STOKVEL CLUB'}</h1>
                <p className="text-xs text-gray-500">Member Dashboard</p>
              </div>
            </div>

            {/* Right Side - Notifications, Profile Switcher & 3-Dots Menu */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-700">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Regular notifications */}
                      {notifications.slice(0, 2).map(notif => (
                        <div key={notif.id} className={`p-3 hover:bg-gray-50 border-b border-gray-100 ${!notif.read ? 'bg-primary-50/50' : ''}`}>
                          <p className="text-sm text-gray-800">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                      
                      {/* Rejected Profiles Section - Only shown in notifications */}
                      {rejectedProfiles.length > 0 && (
                        <>
                          <div className="px-3 py-2 bg-red-50 border-t border-b border-red-100">
                            <p className="text-xs font-medium text-red-600 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              REJECTED REQUESTS
                            </p>
                          </div>
                          {rejectedProfiles.map(profile => (
                            <div key={`rejected-${profile.id}`} className="p-3 hover:bg-gray-50 border-b border-gray-100 bg-red-50/30">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-800">
                                    Your request to join <span className="font-semibold">{profile.stokvelName}</span> was not approved
                                  </p>
                                  <div className="flex items-center mt-2 text-xs">
                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                      Rejected
                                    </span>
                                    <span className="text-gray-500 ml-2">2 days ago</span>
                                  </div>
                                  <button 
                                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                    onClick={() => {
                                      setShowNotifications(false);
                                      setShowDiscoverStokvels(true);
                                    }}
                                  >
                                    Browse other stokvels →
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    <Link 
                      to="/notifications" 
                      className="block p-3 text-center text-sm text-primary-600 hover:text-primary-700 border-t border-gray-100"
                    >
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile Switcher */}
              <ProfileSwitcher 
                profiles={profiles}
                activeProfile={activeProfile}
                onSwitch={handleProfileSwitch}
                onAddProfile={() => setShowDiscoverStokvels(true)}
              />

              {/* 3-Dots Menu Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Menu"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{activeProfile.name}</p>
                      <p className="text-xs text-gray-500">{activeProfile.stokvelName}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Your Profile</span>
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </Link>
                    <Link 
                      to="/help" 
                      className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Help Center</span>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Link 
                      to="/" 
                      className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 text-red-600 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        localStorage.removeItem('token');
                        localStorage.removeItem('currentUser');
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('user');
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Welcome back, <span className="text-primary-700">{activeProfile.name.split(' ')[0]}</span>! 👋
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Viewing <span className="font-medium text-primary-600">{activeProfile.stokvelName}</span>
              </p>
            </div>
            
            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-white px-4 py-2 rounded-full border border-gray-200 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">R {activeProfile.savedAmount} saved</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-full border border-gray-200 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Target: {TARGET_DATE}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Personal Stats */}
          <div className="space-y-6">
            {/* YOUR TARGET - Personal Contribution Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Target className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Your Target</h3>
                    <p className="text-xs text-gray-500">Personal contribution summary</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-800">
                  R {activeProfile.savedAmount.toLocaleString()}
                </span>
                <span className="text-gray-600 text-lg ml-2">
                  of R {activeProfile.targetAmount.toLocaleString()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-primary-700">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-600">
                  <ArrowUpRight className="w-4 h-4 mr-1 text-primary-600" />
                  <span>R {remainingAmount.toLocaleString()} to go</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">Due {TARGET_DATE}</span>
              </div>
            </div>

            {/* LOAN CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Loan Status</h3>
                    <p className="text-xs text-gray-500">Borrow against your savings</p>
                  </div>
                </div>
                <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                  50% max
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Available to borrow</p>
                  <span className="text-xl font-bold text-green-600">
                    R {loanData.available.toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Already borrowed</p>
                  <span className="text-xl font-bold text-primary-800">
                    R {loanData.borrowed.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Loan Progress Bar */}
              {loanData.available > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Borrowed {loanData.progress}% of limit</span>
                    <span className="text-gray-500">R {loanData.remaining.toLocaleString()} left</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full" 
                      style={{ width: `${loanData.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* REQUEST LOAN BUTTON */}
              <div className="mt-4">
                <Link 
                  to={`/loans/request?profile=${activeProfile.id}`}
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
                >
                  Request Loan (30% interest)
                </Link>
              </div>

              <div className="mt-3 text-center">
                <Link to={`/loans?profile=${activeProfile.id}`} className="text-sm text-primary-600 hover:text-primary-700">
                  View loan history →
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Current Stokvel */}
          <div className="space-y-6">
            {/* Stokvel Card */}
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-sm border border-primary-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-primary-200 rounded-lg">
                    <Users className="w-5 h-5 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{currentStokvel.name}</h3>
                    <p className="text-xs text-gray-600">{currentStokvel.memberCount} members · R{currentStokvel.individualTarget} target each</p>
                  </div>
                </div>
                <span className="text-sm bg-primary-200 text-primary-800 px-3 py-1 rounded-full font-medium">
                  {currentStokvel.memberCount} members
                </span>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-800">
                  R {currentStokvel.total.toLocaleString()}
                </span>
                <span className="text-gray-600 text-lg ml-2">
                  of R {currentStokvel.target.toLocaleString()}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">{currentStokvel.memberCount} × R{currentStokvel.individualTarget}</span> yearly target
              </p>

              {/* Group Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Group Progress</span>
                  <span className="font-semibold text-primary-700">{currentStokvel.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full" 
                    style={{ width: `${currentStokvel.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-primary-200">
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Cycle</p>
                  <p className="font-semibold text-gray-800">{currentStokvel.cycle}</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Next Payout</p>
                  <p className="font-semibold text-primary-700">{currentStokvel.nextPayout}</p>
                </div>
              </div>

              <Link 
                to={`/group/${activeProfile.stokvelId}?profile=${activeProfile.id}`}
                className="block text-center text-primary-700 hover:text-primary-800 font-medium py-3 hover:bg-primary-100/50 rounded-lg transition-colors"
              >
                View Group Details →
              </Link>
            </div>

            {/* Quick Actions - NOW WITH BOTH CARDS AND DISCOVER */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setShowAddContribution(true)}
                  className="flex flex-col items-center p-4 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors group"
                >
                  <PlusCircle className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-700">Contribute</span>
                </button>
                
                <Link to={`/contributions?profile=${activeProfile.id}`} className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
                  <History className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-700">History</span>
                </Link>
                
                <Link to="/profile" className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group">
                  <User className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-700">Profile</span>
                </Link>

                {/* CARDS BUTTON - KEPT AS IS */}
                <Link to="/cards" className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group">
                  <CreditCard className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-700">Cards</span>
                </Link>

                {/* DISCOVER BUTTON - ADDED AS EXTRA */}
                <button 
                  onClick={() => setShowDiscoverStokvels(true)}
                  className="flex flex-col items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors group md:col-span-1"
                >
                  <Search className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-700">Discover</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Discover Stokvels Modal */}
        {showDiscoverStokvels && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">Discover Stokvels</h3>
                    <p className="text-sm text-gray-500 mt-1">Browse and join stokvels in the system</p>
                  </div>
                  <button 
                    onClick={() => setShowDiscoverStokvels(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stokvels by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stokvel List */}
              <div className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStokvels.map(stokvel => (
                    <div key={stokvel.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{stokvel.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{stokvel.description}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {stokvel.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Members</p>
                          <p className="font-medium">{stokvel.memberCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Target</p>
                          <p className="font-medium">R{stokvel.targetAmount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cycle</p>
                          <p className="font-medium">{stokvel.cycle}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        {stokvel.status === 'active' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="text-sm">Already a member</span>
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                        )}
                        {stokvel.status === 'pending' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-yellow-600">
                              <Clock className="w-4 h-4 mr-1" />
                              <span className="text-sm">Request pending approval</span>
                            </div>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              Pending
                            </span>
                          </div>
                        )}
                        {stokvel.status === 'available' && (
                          <button
                            onClick={() => handleJoinRequest(stokvel.id)}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Request to Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredStokvels.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No stokvels found matching your criteria</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {filteredStokvels.length} stokvels</span>
                  <button
                    onClick={() => setShowDiscoverStokvels(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Contribution Modal */}
        {showAddContribution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Add Contribution</h3>
                <button onClick={() => setShowAddContribution(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              {/* Stokvel Info */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-600 mb-1">Contributing to:</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{activeProfile.stokvelName}</p>
                    <p className="text-xs text-gray-500">Target: R{activeProfile.targetAmount.toLocaleString()} by {TARGET_DATE}</p>
                  </div>
                  <span className="text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full">
                    {progressPercentage.toFixed(0)}% complete
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (ZAR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                  <input 
                    type="number" 
                    placeholder="Enter amount"
                    value={contributionData.amount}
                    onChange={(e) => setContributionData({...contributionData, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="100"
                    max={remainingAmount}
                    step="50"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Minimum: R100</p>
                  <p className="text-xs text-gray-500">
                    Remaining: R{remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment Method - Paystack */}
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Pay securely with Paystack</p>
                      <p className="text-xs text-gray-500">Card, Bank Transfer, or USSD</p>
                    </div>
                  </div>
                  <div className="flex items-center mt-3 space-x-2">
                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">Visa</span>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">Mastercard</span>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">Bank Transfer</span>
                    <span className="text-xs text-gray-400 ml-auto">🔒 256-bit SSL</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current saved:</span>
                  <span className="font-medium text-gray-800">R {activeProfile.savedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Adding:</span>
                  <span className="font-medium text-green-600">+ R {contributionData.amount ? parseInt(contributionData.amount).toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">New total:</span>
                  <span className="font-bold text-lg text-primary-700">
                    R {(activeProfile.savedAmount + (parseInt(contributionData.amount) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => { setShowAddContribution(false); setIsProcessingPayment(false); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={!contributionData.amount || parseInt(contributionData.amount) < 100 || parseInt(contributionData.amount) > remainingAmount || isProcessingPayment}
                  onClick={handleAddContribution}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Paystack
                    </>
                  )}
                </button>
              </div>
              {isProcessingPayment && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Complete payment in the Paystack window. This page will update automatically.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}