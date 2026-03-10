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
import { userApi, stokvelApi, loanApi, contributionApi, notificationApi, paymentApi, finesApi, cardApi } from '../../api';
import { showToast } from '../../utils/toast';
import { logout } from '../../utils/auth';

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
  meetingDay: string;
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
  const [interestPot, setInterestPot] = useState({ totalInterest: 0, activeLoans: 0, paidInterest: 0 });
  const [madalaSideTotal, setMadalaSideTotal] = useState(0);
  const [userFines, setUserFines] = useState<any[]>([]);
  const [finesSummary, setFinesSummary] = useState({ unpaidTotal: 0, paidTotal: 0, unpaidCount: 0 });
  const [payingFineId, setPayingFineId] = useState<number | null>(null);
  const [showFinePayModal, setShowFinePayModal] = useState<any | null>(null);
  const [finePayMethod, setFinePayMethod] = useState<'card' | 'cash'>('card');
  const [fineSelectedCard, setFineSelectedCard] = useState('');
  const [fineCards, setFineCards] = useState<any[]>([]);
  
  // Fetch data from backend
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userRes, stokvelsRes, notifRes] = await Promise.all([
        userApi.getMe(),
        stokvelApi.list(),
        notificationApi.list({ limit: 10 }).catch(() => ({ data: [] })),
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
      const pendingStokvelIds = (user.pendingJoinRequests || []).map((jr: any) => String(jr.stokvelId));
      const allStokvels: AvailableStokvel[] = (stokvelsRes.data || []).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        description: s.description || '',
        memberCount: s.currentMembers || 0,
        targetAmount: s.targetAmount || 0,
        cycle: s.cycle || 'weekly',
        category: s.type || 'General',
        status: userStokvelIds.includes(String(s.id)) 
          ? 'active' as const 
          : pendingStokvelIds.includes(String(s.id))
            ? 'pending' as const
            : 'available' as const,
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

      // Loan stats are now calculated per-profile in the activeProfile effect

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

  // Fetch stokvel details and per-profile loan stats when active profile changes
  useEffect(() => {
    if (!activeProfile?.stokvelId) return;
    
    // Fetch stokvel details
    stokvelApi.getDetails(Number(activeProfile.stokvelId))
      .then(res => {
        const s = res.data;
        setStokvelDetails({
          name: s.name,
          total: s.totalPool || 0,
          target: (s.currentMembers || 0) * (activeProfile.targetAmount || 0),
          progress: 0,
          memberCount: s.currentMembers || 0,
          cycle: s.cycle || 'weekly',
          meetingDay: s.meetingDay || 'Sunday',
          nextPayout: s.nextPayout ? new Date(s.nextPayout).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD',
          individualTarget: activeProfile.targetAmount,
        });
        if (s.interestPot) {
          // Interest pot data is now calculated per-user from loans
        }
      })
      .catch(() => {
        setStokvelDetails({
          name: activeProfile.stokvelName,
          total: 0,
          target: 0,
          progress: 0,
          memberCount: 0,
          cycle: 'weekly',
          meetingDay: 'Sunday',
          nextPayout: 'TBD',
          individualTarget: activeProfile.targetAmount,
        });
      });

    // Fetch per-profile loan stats (principal only)
    loanApi.list({ profileId: Number(activeProfile.id) })
      .then(res => {
        const loans = res.data?.data || [];
        const activeLoans = loans.filter((l: any) => l.status === 'active' || l.status === 'overdue');
        const borrowed = activeLoans.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
        // Limit is 50% of TOTAL contributions (current savings + what's currently borrowed)
        const totalContributions = activeProfile.savedAmount + borrowed;
        const maxBorrowable = Math.floor(totalContributions * 0.5);
        setLoanStats({
          available: maxBorrowable,
          borrowed,
          remaining: Math.max(0, maxBorrowable - borrowed),
          progress: maxBorrowable > 0 ? Math.min(100, Math.floor((borrowed / maxBorrowable) * 100)) : 0,
        });

        // Per-user interest data
        const pendingInterest = activeLoans.reduce((sum: number, l: any) => sum + (l.interest || 0), 0);
        const repaidLoans = loans.filter((l: any) => l.status === 'repaid');
        const paidInterest = repaidLoans.reduce((sum: number, l: any) => sum + (l.interest || 0), 0);
        setInterestPot({
          totalInterest: pendingInterest,
          activeLoans: activeLoans.length,
          paidInterest,
        });
      })
      .catch(() => {
        const maxBorrowable = Math.floor(activeProfile.savedAmount * 0.5);
        setLoanStats({ available: maxBorrowable, borrowed: 0, remaining: maxBorrowable, progress: 0 });
        setInterestPot({ totalInterest: 0, activeLoans: 0, paidInterest: 0 });
      });

    // Fetch Madala Side contribution total
    contributionApi.list({ profileId: Number(activeProfile.id), limit: 1000 })
      .then(res => {
        const contributions = res.data?.data || [];
        const madalaSideConfirmed = contributions
          .filter((c: any) => c.contributionType === 'madala-side' && c.status === 'confirmed')
          .reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
        setMadalaSideTotal(madalaSideConfirmed);
      })
      .catch(() => setMadalaSideTotal(0));

    // Fetch user's fines
    finesApi.list()
      .then(res => {
        setUserFines(res.data.data || []);
        setFinesSummary(res.data.summary || { unpaidTotal: 0, paidTotal: 0, unpaidCount: 0 });
      })
      .catch(() => {
        setUserFines([]);
        setFinesSummary({ unpaidTotal: 0, paidTotal: 0, unpaidCount: 0 });
      });
  }, [activeProfile]);

  // Update URL and localStorage when profile changes
  const handleProfileSwitch = (profile: Profile) => {
    setActiveProfile(profile);
    setSearchParams({ profile: profile.id });
    localStorage.setItem('activeProfileId', profile.id);
  };

  const handlePayFine = async (fine: any) => {
    // Open payment modal instead of paying directly
    setShowFinePayModal(fine);
    setFinePayMethod('card');
    // Load cards
    try {
      const cardsRes = await cardApi.list();
      const cardsList = (cardsRes.data || []).map((c: any) => ({
        id: String(c.id),
        type: c.cardType || 'visa',
        last4: c.last4 || '****',
        label: `${c.cardType === 'visa' ? 'Visa' : c.cardType === 'mastercard' ? 'Mastercard' : c.cardType} •••• ${c.last4}`,
        isDefault: c.isDefault
      }));
      setFineCards(cardsList);
      const defaultCard = cardsList.find((c: any) => c.isDefault) || cardsList[0];
      if (defaultCard) setFineSelectedCard(defaultCard.id);
    } catch { 
      setFineCards([]);
    }
  };

  const confirmFinePay = async () => {
    if (!showFinePayModal) return;
    try {
      setPayingFineId(showFinePayModal.id);
      await finesApi.pay(showFinePayModal.id, { 
        paymentMethod: finePayMethod, 
        cardId: finePayMethod === 'card' && fineSelectedCard ? Number(fineSelectedCard) : undefined 
      });
      showToast.success(finePayMethod === 'cash' ? 'Cash payment submitted! Pending admin confirmation.' : 'Fine paid successfully!');
      setShowFinePayModal(null);
      // Refresh fines
      const res = await finesApi.list();
      setUserFines(res.data.data || []);
      setFinesSummary(res.data.summary || { unpaidTotal: 0, paidTotal: 0, unpaidCount: 0 });
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to pay fine');
    } finally {
      setPayingFineId(null);
    }
  };

  // Contribution form state
  const [contributionData, setContributionData] = useState({
    amount: ''
  });
  const [contributionTarget, setContributionTarget] = useState<'your-target' | 'madala-side'>('your-target');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  // Calculate remaining amount based on selected target
  const MADALA_SIDE_TARGET = 2200;
  const MADALA_SIDE_MIN = 200;
  const remainingAmount = activeProfile
    ? contributionTarget === 'madala-side'
      ? MADALA_SIDE_TARGET
      : Math.max(0, activeProfile.targetAmount - activeProfile.savedAmount)
    : 0;
  const minContribution = contributionTarget === 'madala-side' ? MADALA_SIDE_MIN : 100;
  const progressPercentage = activeProfile ? (activeProfile.targetAmount > 0 ? Math.min(100, (activeProfile.savedAmount / activeProfile.targetAmount) * 100) : 0) : 0;

  // Use loan stats from backend
  const loanData = loanStats;

  // Stokvel data from details fetch
  const currentStokvel = stokvelDetails || {
    name: activeProfile?.stokvelName || '',
    total: 0,
    target: 0,
    progress: 0,
    memberCount: 0,
    cycle: 'weekly',
    meetingDay: 'Sunday',
    nextPayout: 'TBD',
    individualTarget: activeProfile?.targetAmount || 0,
  };
  // Calculate stokvel progress
  if (currentStokvel.target > 0) {
    currentStokvel.progress = Math.min(100, Math.round((currentStokvel.total / currentStokvel.target) * 100));
  }

  // Handle join request
  const handleJoinRequest = async (stokvelId: string) => {
    try {
      await stokvelApi.joinRequest(Number(stokvelId));
      showToast.success('Join request sent! Awaiting admin approval.');
      fetchData();
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to send join request');
    }
  };

  // Get rejected profiles to show in notifications only
  const rejectedProfiles = profiles.filter(p => p.status === 'rejected');
  
  const unreadCount = notifications.filter(n => !n.read).length + rejectedProfiles.length;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleAddContribution = async () => {
    if (!activeProfile) return;
    const amount = parseInt(contributionData.amount);
    if (!amount || amount < minContribution || amount > remainingAmount) return;

    setIsProcessingPayment(true);

    try {
      if (paymentMethod === 'cash') {
        // Cash contribution — goes to pending until admin confirms
        await paymentApi.cash({
          amount,
          profileId: Number(activeProfile.id),
          stokvelId: Number(activeProfile.stokvelId),
          contributionType: contributionTarget,
        });

        setShowAddContribution(false);
        setIsProcessingPayment(false);
        setContributionData({ amount: '' });
        setContributionTarget('your-target');
        setPaymentMethod('card');
        showToast.success('Cash contribution submitted! Admin will confirm at the next Sunday meeting.');
        fetchData();
        return;
      }

      // Card payment — existing Paystack flow
      const res = await paymentApi.initialize({
        amount,
        profileId: Number(activeProfile.id),
        stokvelId: Number(activeProfile.stokvelId),
        contributionType: contributionTarget,
      });

      const { authorizationUrl, reference } = res.data.data;

      // Open Paystack payment page
      const paymentWindow = window.open(authorizationUrl, '_blank');

      // Poll for payment completion + detect window close
      const checkPayment = setInterval(async () => {
        try {
          // If user closed the payment window without completing, cancel
          if (paymentWindow && paymentWindow.closed) {
            clearInterval(checkPayment);
            clearTimeout(pollTimeout);
            setShowAddContribution(false);
            setIsProcessingPayment(false);
            setContributionData({ amount: '' });
            setContributionTarget('your-target');
            setPaymentMethod('card');
            showToast.error('Payment was cancelled. You can try again anytime.');
            fetchData();
            navigate('/dashboard');
            return;
          }

          const verifyRes = await paymentApi.verify(reference);
          if (verifyRes.data.data?.status === 'success') {
            clearInterval(checkPayment);
            clearTimeout(pollTimeout);
            setShowAddContribution(false);
            setIsProcessingPayment(false);
            setContributionData({ amount: '' });
            setContributionTarget('your-target');
            setPaymentMethod('card');
            showToast.success(`Payment of R ${contributionData.amount} confirmed! Your contribution has been recorded.`);
            fetchData();
          } else if (verifyRes.data.status === false) {
            // Payment was declined or failed
            clearInterval(checkPayment);
            clearTimeout(pollTimeout);
            if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
            setShowAddContribution(false);
            setIsProcessingPayment(false);
            setContributionData({ amount: '' });
            setContributionTarget('your-target');
            setPaymentMethod('card');
            showToast.error('Payment was declined. Please try again or use a different payment method.');
            fetchData();
            navigate('/dashboard');
          }
        } catch {
          // Still pending, keep polling
        }
      }, 3000);

      // Stop polling after 5 minutes
      const pollTimeout = setTimeout(() => {
        clearInterval(checkPayment);
        setIsProcessingPayment(false);
      }, 300000);

      return () => {
        clearInterval(checkPayment);
        clearTimeout(pollTimeout);
      };

    } catch (err: any) {
      setIsProcessingPayment(false);
      const errorCode = err.response?.data?.code;
      const errorMsg = err.response?.data?.error || 'Failed to process contribution. Please try again.';
      
      if (errorCode === 'NO_CARD') {
        showToast.error(errorMsg);
        setTimeout(() => navigate('/cards'), 1500);
      } else {
        showToast.error(errorMsg);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no profiles exist at all, show a pending state
  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Membership Pending</h2>
          <p className="text-gray-600 mb-6">
            Your membership is awaiting admin approval. You'll receive a notification once approved.
          </p>
          <button
            onClick={() => { logout(); }}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign Out
          </button>
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
                <h1 className="text-xl font-bold text-primary-800">FUND MATE</h1>
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
                  <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
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
                      {notifications.slice(0, 5).map(notif => (
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
                                    <span className="text-gray-500 ml-2">Recently</span>
                                  </div>
                                  <button 
                                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                    onClick={() => {
                                      setShowNotifications(false);
                                      setShowDiscoverStokvels(true);
                                    }}
                                  >
                                    Browse other groups →
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
                  </>
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
                  <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
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
                      onClick={(e) => {
                        e.preventDefault();
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </Link>
                  </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome + Quick Stats Row */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
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

        {/* Top Row - 3 Column Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          {/* YOUR TARGET */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-primary-100 rounded-xl">
                <Target className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Your Target</h3>
                <p className="text-xs text-gray-400">Personal savings</p>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-800">
                R {activeProfile.savedAmount.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm ml-1">
                / R {activeProfile.targetAmount.toLocaleString()}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">Progress</span>
                <span className="font-semibold text-primary-600">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-lg">
              <div className="flex items-center text-gray-600">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-primary-500" />
                <span>R {remainingAmount.toLocaleString()} to go</span>
              </div>
              <span className="text-gray-400">Due {TARGET_DATE}</span>
            </div>
          </div>

          {/* COLLECTIVE POT */}
          <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-sm border border-primary-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary-200 rounded-xl">
                  <Users className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Collective Pot</h3>
                  <p className="text-xs text-gray-500">{currentStokvel.memberCount} members</p>
                </div>
              </div>
              <span className="text-xs bg-primary-200/70 text-primary-800 px-2.5 py-1 rounded-full font-medium">
                R{currentStokvel.individualTarget} each
              </span>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-800">
                R {currentStokvel.total.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm ml-1">
                / R {currentStokvel.target.toLocaleString()}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">Group Progress</span>
                <span className="font-semibold text-primary-600">{currentStokvel.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${currentStokvel.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-white/60 p-2 rounded-lg text-center">
                <p className="text-gray-400">Cycle</p>
                <p className="font-semibold text-gray-700">{currentStokvel.cycle}</p>
              </div>
              <div className="bg-white/60 p-2 rounded-lg text-center">
                <p className="text-gray-400">Meeting</p>
                <p className="font-semibold text-primary-700">{currentStokvel.meetingDay || 'Sunday'}</p>
              </div>
            </div>

            <Link 
              to={`/group/${activeProfile.stokvelId}?profile=${activeProfile.id}`}
              className="block text-center text-primary-700 hover:text-primary-800 text-sm font-medium py-2 hover:bg-primary-100/50 rounded-lg transition-colors"
            >
              View Group Details →
            </Link>
          </div>

          {/* MADALA SIDE */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-sm border border-green-200 p-5 hover:shadow-md transition-all md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-200 rounded-xl">
                  <span className="text-lg">🌱</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Madala Side</h3>
                  <p className="text-xs text-gray-500">R200/month</p>
                </div>
              </div>
              <span className="text-xs bg-green-200/70 text-green-800 px-2.5 py-1 rounded-full font-medium">
                R2,200 target
              </span>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-green-800">
                R {madalaSideTotal.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm ml-1">
                / R 2,200
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500">Progress</span>
                <span className="font-semibold text-green-600">{Math.min(100, Math.round((madalaSideTotal / MADALA_SIDE_TARGET) * 100))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((madalaSideTotal / MADALA_SIDE_TARGET) * 100))}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/60 p-2 rounded-lg text-center">
                <p className="text-gray-400">Min. Monthly</p>
                <p className="font-semibold text-gray-700">R200</p>
              </div>
              <div className="bg-white/60 p-2 rounded-lg text-center">
                <p className="text-gray-400">Period</p>
                <p className="font-semibold text-green-700">Jan – Nov</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Loan Status (wider) + Interest Pot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LOAN STATUS - Spans 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary-100 rounded-xl">
                  <Wallet className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Loan Status</h3>
                  <p className="text-xs text-gray-400">Borrow against your savings</p>
                </div>
              </div>
              <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium">
                50% max
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Available to borrow</p>
                <span className="text-xl font-bold text-green-600">
                  R {loanData.remaining.toLocaleString()}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Already borrowed</p>
                <span className="text-xl font-bold text-primary-800">
                  R {loanData.borrowed.toLocaleString()}
                </span>
              </div>
            </div>

            {loanData.available > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Borrowed R {loanData.borrowed.toLocaleString()} of R {loanData.available.toLocaleString()} limit</span>
                  <span className="text-gray-500">R {loanData.remaining.toLocaleString()} left</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${loanData.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link 
                to={`/loans/request?profile=${activeProfile.id}`}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm"
              >
                Apply for Loan (30% interest)
              </Link>
              <Link 
                to={`/loans?profile=${activeProfile.id}`} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
              >
                View Loan History →
              </Link>
            </div>
          </div>

          {/* INTEREST POT - Per User */}
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-sm border border-amber-200 p-5 hover:shadow-md transition-all">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-amber-200 rounded-xl">
                <span className="text-lg">🏺</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Your Loan Interest</h3>
                <p className="text-xs text-gray-400">Interest on active loans</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-amber-700">
                R {interestPot.totalInterest.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-gray-400 mt-1">Outstanding interest</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/70 p-3 rounded-xl text-center">
                <p className="text-xs text-gray-400 mb-0.5">Active Loans</p>
                <p className="text-lg font-bold text-amber-700">{interestPot.activeLoans}</p>
              </div>
              <div className="bg-white/70 p-3 rounded-xl text-center">
                <p className="text-xs text-gray-400 mb-0.5">Interest Paid</p>
                <p className="text-lg font-bold text-green-700">R {interestPot.paidInterest.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">30% interest charged on every loan</p>
          </div>
        </div>

        {/* Fines Card */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-sm border border-red-200 p-5 mb-5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-xl">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Fines</h3>
                <p className="text-xs text-gray-400">Outstanding penalties</p>
              </div>
            </div>
            {finesSummary.unpaidCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {finesSummary.unpaidCount} unpaid
              </span>
            )}
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-red-700">
              R {finesSummary.unpaidTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-gray-400 mt-1">Total outstanding fines</p>
          </div>

          {userFines.filter((f: any) => f.status === 'unpaid').length > 0 ? (
            <div className="space-y-2">
              {userFines.filter((f: any) => f.status === 'unpaid').map((fine: any) => (
                <div key={fine.id} className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{fine.fineLabel}</p>
                    <p className="text-xs text-gray-400">
                      {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-red-600">R {fine.amount}</span>
                    <button
                      onClick={() => handlePayFine(fine)}
                      disabled={payingFineId === fine.id}
                      className="px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {payingFineId === fine.id ? 'Paying...' : 'Pay'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 bg-white/70 rounded-xl">
              <p className="text-sm text-gray-500">No outstanding fines 🎉</p>
            </div>
          )}

          {finesSummary.paidTotal > 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              R {finesSummary.paidTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} in fines paid
            </p>
          )}
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <button 
              onClick={() => remainingAmount > 0 ? setShowAddContribution(true) : showToast.info('You have already reached your contribution target!')}
              className="flex flex-col items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all group hover:shadow-sm"
            >
              <PlusCircle className="w-6 h-6 text-primary-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Contribute</span>
            </button>
            <Link to={`/contributions?profile=${activeProfile.id}`} className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all group hover:shadow-sm">
              <History className="w-6 h-6 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">History</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all group hover:shadow-sm">
              <User className="w-6 h-6 text-purple-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Profile</span>
            </Link>
            <Link to="/cards" className="flex flex-col items-center p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all group hover:shadow-sm">
              <CreditCard className="w-6 h-6 text-green-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Cards</span>
            </Link>
            <button 
              onClick={() => setShowDiscoverStokvels(true)}
              className="flex flex-col items-center p-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all group hover:shadow-sm"
            >
              <Search className="w-6 h-6 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-gray-700">Discover</span>
            </button>
          </div>
        </div>

        {/* Discover Stokvels Modal */}
        {showDiscoverStokvels && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">Discover Groups</h3>
                    <p className="text-sm text-gray-500 mt-1">Browse and join savings groups in the system</p>
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
                      placeholder="Search groups by name or description..."
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
                    <p className="text-gray-500">No groups found matching your criteria</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {filteredStokvels.length} groups</span>
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

        {/* Fine Payment Modal */}
        {showFinePayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Pay Fine</h3>
                <button onClick={() => setShowFinePayModal(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Fine Details */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Fine Type:</span>
                  <span className="font-semibold text-gray-800">{showFinePayModal.fineLabel}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Issued:</span>
                  <span className="text-sm text-gray-700">
                    {showFinePayModal.createdAt ? new Date(showFinePayModal.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-200">
                  <span className="font-medium text-gray-700">Amount to Pay:</span>
                  <span className="font-bold text-red-700 text-lg">R {showFinePayModal.amount}</span>
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFinePayMethod('card')}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                      finePayMethod === 'card'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${finePayMethod === 'card' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${finePayMethod === 'card' ? 'text-green-700' : 'text-gray-600'}`}>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinePayMethod('cash')}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                      finePayMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Wallet className={`w-5 h-5 ${finePayMethod === 'cash' ? 'text-amber-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${finePayMethod === 'cash' ? 'text-amber-700' : 'text-gray-600'}`}>Cash</span>
                  </button>
                </div>
              </div>

              {/* Card selector or cash info */}
              {finePayMethod === 'card' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pay From</label>
                  {fineCards.length > 0 ? (
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={fineSelectedCard}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          window.location.href = '/cards';
                        } else {
                          setFineSelectedCard(e.target.value);
                        }
                      }}
                    >
                      {fineCards.map((card: any) => (
                        <option key={card.id} value={card.id}>
                          💳 {card.label} {card.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                      <option value="new">➕ Add New Card</option>
                    </select>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-yellow-800">No cards found.</p>
                      <Link to="/cards" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Add a card →
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <Link to="/cards" className="text-xs text-primary-600 hover:text-primary-700">Manage Cards →</Link>
                    <span className="text-xs text-gray-400">🔒 Secured payment</span>
                  </div>
                </div>
              ) : (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Wallet className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Cash Payment</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Cash payment will be submitted as <span className="font-semibold">pending</span> until admin confirms at the next Sunday meeting.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFinePayModal(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={payingFineId === showFinePayModal.id}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFinePay}
                  disabled={payingFineId === showFinePayModal.id || (finePayMethod === 'card' && fineCards.length === 0)}
                  className={`flex-1 ${finePayMethod === 'cash' ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white py-3 rounded-lg transition-all font-medium shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center`}
                >
                  {payingFineId === showFinePayModal.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : finePayMethod === 'cash' ? (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Submit Cash
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay R {showFinePayModal.amount}
                    </>
                  )}
                </button>
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
                <button onClick={() => { setShowAddContribution(false); setContributionTarget('your-target'); setPaymentMethod('card'); }} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Target Selection Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contributing to *</label>
                <select
                  value={contributionTarget}
                  onChange={(e) => {
                    setContributionTarget(e.target.value as 'your-target' | 'madala-side');
                    setContributionData({ amount: '' });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="your-target">🎯 Your Target (Collective Pot — R{activeProfile.targetAmount.toLocaleString()})</option>
                  <option value="madala-side">🌱 Madala Side (R2,200 — R200/month)</option>
                </select>
              </div>
              
              {/* Stokvel Info */}
              <div className={`${contributionTarget === 'madala-side' ? 'bg-green-50 border-green-200' : 'bg-primary-50 border-primary-200'} border rounded-lg p-4 mb-6`}>
                <p className="text-xs text-gray-600 mb-1">Contributing to:</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {contributionTarget === 'madala-side' ? 'Madala Side' : activeProfile.stokvelName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {contributionTarget === 'madala-side'
                        ? 'Target: R2,200 (R200/month, Jan–Nov)'
                        : `Target: R${activeProfile.targetAmount.toLocaleString()} by ${TARGET_DATE}`}
                    </p>
                  </div>
                  {contributionTarget !== 'madala-side' && (
                    <span className="text-xs bg-primary-200 text-primary-800 px-2 py-1 rounded-full">
                      {progressPercentage.toFixed(0)}% complete
                    </span>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                {contributionTarget !== 'madala-side' && remainingAmount <= 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-800">Target Reached!</p>
                    <p className="text-xs text-green-600 mt-1">You've already met your contribution target.</p>
                  </div>
                ) : (
                  <>
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
                    min={minContribution}
                    max={remainingAmount}
                    step="50"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Minimum: R{minContribution}</p>
                  <p className="text-xs text-gray-500">
                    Remaining: R{remainingAmount.toLocaleString()}
                  </p>
                </div>
                {contributionData.amount && parseInt(contributionData.amount) > remainingAmount && (
                  <p className="text-xs text-red-600 mt-1">Amount exceeds your remaining target of R{remainingAmount.toLocaleString()}</p>
                )}
                  </>
                )}
              </div>

              {/* Payment Method Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-green-700' : 'text-gray-600'}`}>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Wallet className={`w-5 h-5 ${paymentMethod === 'cash' ? 'text-amber-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-amber-700' : 'text-gray-600'}`}>Cash</span>
                  </button>
                </div>

                {/* Payment Method Info */}
                {paymentMethod === 'card' ? (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <p className="text-xs text-green-700">Pay securely via Paystack (Visa, Mastercard, Bank Transfer)</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-700">Cash goes to <span className="font-semibold">pending</span> until admin confirms at the next Sunday meeting</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {contributionTarget === 'madala-side' ? 'Madala Side' : 'Current saved'}:
                  </span>
                  <span className="font-medium text-gray-800">
                    {contributionTarget === 'madala-side' ? 'R 0' : `R ${activeProfile.savedAmount.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Adding:</span>
                  <span className="font-medium text-green-600">+ R {contributionData.amount ? parseInt(contributionData.amount).toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Payment method:</span>
                  <span className={`font-bold text-sm ${paymentMethod === 'cash' ? 'text-amber-700' : 'text-green-700'}`}>
                    {paymentMethod === 'card' ? '💳 Card (Paystack)' : '💵 Cash (Pending)'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button 
                  onClick={() => { setShowAddContribution(false); setIsProcessingPayment(false); setContributionTarget('your-target'); setPaymentMethod('card'); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button 
                  className={`flex-1 ${paymentMethod === 'cash' ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white py-3 rounded-lg transition-all font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                  disabled={!contributionData.amount || parseInt(contributionData.amount) < minContribution || parseInt(contributionData.amount) > remainingAmount || isProcessingPayment}
                  onClick={handleAddContribution}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : paymentMethod === 'cash' ? (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Submit Cash
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Paystack
                    </>
                  )}
                </button>
              </div>
              {isProcessingPayment && paymentMethod === 'card' && (
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