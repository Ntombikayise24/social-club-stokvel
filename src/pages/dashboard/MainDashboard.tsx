import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import ProfileSwitcher from './ProfileSwitcher';

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
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDiscoverStokvels, setShowDiscoverStokvels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Constants
  const TARGET_DATE = "06 Dec 2026";
  
  // Mock profiles data with status
  const mockProfiles: Profile[] = [
    {
      id: '1',
      name: 'Nkulumo Nkuna',
      stokvelName: 'COLLECTIVE POT',
      stokvelId: 'collective-pot',
      role: 'member',
      targetAmount: 7000,
      savedAmount: 1070,
      progress: 13,
      status: 'active'
    },
    {
      id: '2',
      name: 'Nkulumo Nkuna',
      stokvelName: 'SUMMER SAVERS',
      stokvelId: 'summer-savers',
      role: 'member',
      targetAmount: 5000,
      savedAmount: 850,
      progress: 17,
      status: 'active'
    },
    {
      id: '3',
      name: 'Nkulumo Nkuna',
      stokvelName: 'EDUCATION FUND',
      stokvelId: 'education-fund',
      role: 'member',
      targetAmount: 10000,
      savedAmount: 0,
      progress: 0,
      status: 'pending'
    },
    {
      id: '4',
      name: 'Nkulumo Nkuna',
      stokvelName: 'EMERGENCY FUND',
      stokvelId: 'emergency-fund',
      role: 'member',
      targetAmount: 5000,
      savedAmount: 0,
      progress: 0,
      status: 'rejected'
    }
  ];

  // Available stokvels in the system
  const availableStokvels: AvailableStokvel[] = [
    {
      id: 'collective-pot',
      name: 'COLLECTIVE POT',
      description: 'Community savings for year-end celebrations',
      memberCount: 18,
      targetAmount: 7000,
      cycle: 'Weekly (Sunday)',
      category: 'Social',
      status: 'active'
    },
    {
      id: 'summer-savers',
      name: 'SUMMER SAVERS',
      description: 'Save for summer holidays and festivals',
      memberCount: 8,
      targetAmount: 5000,
      cycle: 'Monthly',
      category: 'Holiday',
      status: 'active'
    },
    {
      id: 'education-fund',
      name: 'EDUCATION FUND',
      description: 'Save for school fees and educational expenses',
      memberCount: 12,
      targetAmount: 10000,
      cycle: 'Monthly',
      category: 'Education',
      status: 'pending'
    },
    {
      id: 'emergency-fund',
      name: 'EMERGENCY FUND',
      description: 'Rainy day savings for unexpected expenses',
      memberCount: 25,
      targetAmount: 5000,
      cycle: 'Weekly (Friday)',
      category: 'Emergency',
      status: 'available'
    },
    {
      id: 'investment-club',
      name: 'INVESTMENT CLUB',
      description: 'Pool resources for property and stock investments',
      memberCount: 10,
      targetAmount: 20000,
      cycle: 'Quarterly',
      category: 'Investment',
      status: 'available'
    },
    {
      id: 'travel-stokvel',
      name: 'TRAVEL STOKVEL',
      description: 'Save for group travel and adventures',
      memberCount: 15,
      targetAmount: 15000,
      cycle: 'Monthly',
      category: 'Travel',
      status: 'available'
    },
    {
      id: 'business-starters',
      name: 'BUSINESS STARTERS',
      description: 'Fund small business ventures together',
      memberCount: 7,
      targetAmount: 25000,
      cycle: 'Bi-weekly',
      category: 'Business',
      status: 'available'
    }
  ];

  // Filter stokvels based on search and category
  const filteredStokvels = availableStokvels.filter(stokvel => {
    const matchesSearch = stokvel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stokvel.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || stokvel.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Categories for filter
  const categories = ['all', 'Social', 'Holiday', 'Education', 'Emergency', 'Investment', 'Travel', 'Business'];

  // Get initial profile from URL params or localStorage
  const getInitialProfile = (): Profile => {
    const profileIdFromUrl = searchParams.get('profile');
    
    if (profileIdFromUrl) {
      const foundProfile = mockProfiles.find(p => p.id === profileIdFromUrl);
      if (foundProfile) return foundProfile;
    }
    
    // Try to get from localStorage
    const savedProfileId = localStorage.getItem('activeProfileId');
    if (savedProfileId) {
      const foundProfile = mockProfiles.find(p => p.id === savedProfileId);
      if (foundProfile) return foundProfile;
    }
    
    // Default to first profile
    return mockProfiles[0];
  };

  // Active Profile State
  const [activeProfile, setActiveProfile] = useState<Profile>(getInitialProfile);

  // Update URL and localStorage when profile changes
  const handleProfileSwitch = (profile: Profile) => {
    setActiveProfile(profile);
    setSearchParams({ profile: profile.id });
    localStorage.setItem('activeProfileId', profile.id);
  };

  // Contribution form state
  const [contributionData, setContributionData] = useState({
    amount: '',
    paymentMethod: 'card_4242'
  });

  // Calculate remaining amount for this profile
  const remainingAmount = activeProfile.targetAmount - activeProfile.savedAmount;
  const progressPercentage = (activeProfile.savedAmount / activeProfile.targetAmount) * 100;

  // Calculate loan data based on actual savings
  const maxBorrowable = Math.floor(activeProfile.savedAmount * 0.5);
  const borrowedSoFar = Math.floor(activeProfile.savedAmount * 0.3);
  const remainingBorrowable = maxBorrowable - borrowedSoFar;

  const loanData = {
    available: maxBorrowable,
    borrowed: borrowedSoFar,
    remaining: Math.max(0, remainingBorrowable),
    progress: Math.min(100, Math.floor((borrowedSoFar / maxBorrowable) * 100)) || 0
  };

  // Stokvel data based on active profile
  const getStokvelData = (profile: Profile): StokvelData => {
    switch(profile.stokvelId) {
      case 'collective-pot':
        return {
          name: 'COLLECTIVE POT',
          total: 9800,
          target: 126000,
          progress: 8,
          memberCount: 18,
          cycle: "Weekly (Sunday)",
          nextPayout: TARGET_DATE,
          individualTarget: profile.targetAmount
        };
      case 'summer-savers':
        return {
          name: 'SUMMER SAVERS',
          total: 4250,
          target: 40000,
          progress: 11,
          memberCount: 8,
          cycle: "Monthly",
          nextPayout: "31 Dec 2026",
          individualTarget: profile.targetAmount
        };
      default:
        return {
          name: profile.stokvelName,
          total: 0,
          target: 0,
          progress: 0,
          memberCount: 0,
          cycle: "Weekly",
          nextPayout: TARGET_DATE,
          individualTarget: profile.targetAmount
        };
    }
  };

  const currentStokvel = getStokvelData(activeProfile);

  // Handle join request
  const handleJoinRequest = (stokvelId: string) => {
    alert(`Join request sent to ${stokvelId} admin for approval! (Demo)`);
    // In a real app, this would make an API call
  };

  // Regular notifications
  const notifications = [
    { id: 1, message: `Contribution of R200 confirmed for ${activeProfile.stokvelName}`, time: '2 hours ago', read: false },
    { id: 2, message: 'Loan repayment due in 3 days', time: '1 day ago', read: false },
    { id: 3, message: 'Welcome to HENNESSY SOCIAL CLUB!', time: '2 days ago', read: true },
    { id: 4, message: 'Weekly meeting this Sunday at 10am', time: '3 days ago', read: true },
    { id: 5, message: 'Your request to join EDUCATION FUND is pending approval', time: '3 days ago', read: false },
  ];

  // Get rejected profiles to show in notifications only
  const rejectedProfiles = mockProfiles.filter(p => p.status === 'rejected');
  
  // Combine notifications with rejected profiles for display in notifications dropdown only
  const allNotifications = [
    ...notifications,
    ...rejectedProfiles.map(profile => ({
      id: `rejected-${profile.id}`,
      message: `Your request to join ${profile.stokvelName} was not approved`,
      time: '2 days ago',
      read: false,
      type: 'rejected',
      profile
    }))
  ];

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const handleAddContribution = () => {
    // Check if amount is valid
    if (!contributionData.amount || parseInt(contributionData.amount) < 100 || parseInt(contributionData.amount) > remainingAmount) {
      return;
    }

    // Simulate payment processing
    setShowAddContribution(false);
    
    // Show a success message based on selected card
    const cardSelected = contributionData.paymentMethod;
    let cardMessage = '';
    
    if (cardSelected === 'card_4242') {
      cardMessage = 'Visa •••• 4242';
    } else if (cardSelected === 'card_8888') {
      cardMessage = 'Mastercard •••• 8888';
    } else {
      cardMessage = 'Card';
    }
    
    alert(`✅ Payment Successful!\n\nR ${contributionData.amount} paid to ${activeProfile.stokvelName}\nCard: ${cardMessage}\n\nReference: TRX-${Math.floor(Math.random() * 10000)}`);
    
    // Reset form
    setContributionData({ amount: '', paymentMethod: 'card_4242' });
  };

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
                <h1 className="text-xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
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
                profiles={mockProfiles}
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
                      onClick={() => setShowUserMenu(false)}
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

              {/* Payment Method - Card Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Card
                </label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={contributionData.paymentMethod}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'new') {
                      setShowAddContribution(false);
                      window.location.href = '/cards';
                    } else {
                      setContributionData({...contributionData, paymentMethod: value});
                    }
                  }}
                >
                  <option value="card_4242">💳 Visa •••• 4242 (Default)</option>
                  <option value="card_8888">💳 Mastercard •••• 8888</option>
                  <option value="new">➕ Add New Card</option>
                </select>
                
                <div className="flex justify-between items-center mt-2">
                  <Link to="/cards" className="text-xs text-primary-600 hover:text-primary-700">
                    Manage Cards →
                  </Link>
                  <span className="text-xs text-gray-400">🔒 Secured by SSL</span>
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
                  onClick={() => setShowAddContribution(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!contributionData.amount || parseInt(contributionData.amount) < 100 || parseInt(contributionData.amount) > remainingAmount}
                  onClick={handleAddContribution}
                >
                  Add Contribution
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}