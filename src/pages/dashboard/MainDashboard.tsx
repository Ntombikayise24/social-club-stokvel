import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProfileSwitcher from './ProfileSwitcher';
import { useAuth, type ProfileData } from '../../context/AuthContext';
import { contributionAPI, notificationAPI, stokvelAPI } from '../../services/api';

interface Profile {
  id: string;
  name: string;
  stokvelName: string;
  stokvelId: string;
  role: 'member' | 'admin';
  targetAmount: number;
  savedAmount: number;
  progress: number;
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

export default function MainDashboard() {
  const { user, profiles: authProfiles, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Constants
  const TARGET_DATE = "06 Dec 2026";

  // Convert auth profiles to the component's Profile format
  const mappedProfiles: Profile[] = authProfiles.map((p: ProfileData) => ({
    id: String(p.id),
    name: user?.fullName || 'User',
    stokvelName: p.stokvelName,
    stokvelId: String(p.stokvelId),
    role: p.role as 'member' | 'admin',
    targetAmount: p.targetAmount,
    savedAmount: p.savedAmount,
    progress: p.progress,
  }));
  
  // Active Profile State
  const [activeProfile, setActiveProfile] = useState<Profile>(
    mappedProfiles[0] || {
      id: '0',
      name: user?.fullName || 'User',
      stokvelName: 'No Stokvel',
      stokvelId: '0',
      role: 'member',
      targetAmount: 0,
      savedAmount: 0,
      progress: 0,
    }
  );

  // Update active profile when auth profiles change (e.g. after refresh)
  useEffect(() => {
    if (mappedProfiles.length > 0) {
      const current = mappedProfiles.find(p => p.id === activeProfile.id);
      if (current) {
        setActiveProfile(current);
      } else {
        setActiveProfile(mappedProfiles[0]);
      }
    }
  }, [authProfiles]);

  // Stokvel details from API
  const [stokvelDetails, setStokvelDetails] = useState<any>(null);

  useEffect(() => {
    const fetchStokvel = async () => {
      try {
        const res = await stokvelAPI.getById(Number(activeProfile.stokvelId));
        setStokvelDetails(res.data.data);
      } catch {
        setStokvelDetails(null);
      }
    };
    if (activeProfile.stokvelId && activeProfile.stokvelId !== '0') {
      fetchStokvel();
    }
  }, [activeProfile.stokvelId]);

  // Notifications from API
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getAll();
        setNotifications(res.data.data || []);
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  // Contribution form state
  const [contributionData, setContributionData] = useState({
    amount: '',
    paymentMethod: 'card'
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

  // Stokvel data based on active profile — use API data when available
  const getStokvelData = (profile: Profile): StokvelData => {
    if (stokvelDetails) {
      return {
        name: stokvelDetails.name || profile.stokvelName,
        total: stokvelDetails.totalSaved || 0,
        target: stokvelDetails.groupTarget || 0,
        progress: stokvelDetails.progress || 0,
        memberCount: stokvelDetails.currentMembers || 0,
        cycle: stokvelDetails.cycle || 'Weekly',
        nextPayout: stokvelDetails.nextPayout || TARGET_DATE,
        individualTarget: profile.targetAmount,
      };
    }
    return {
      name: profile.stokvelName,
      total: 0,
      target: 0,
      progress: 0,
      memberCount: 0,
      cycle: 'Weekly',
      nextPayout: TARGET_DATE,
      individualTarget: profile.targetAmount,
    };
  };

  const currentStokvel = getStokvelData(activeProfile);

  const unreadCount = notifications.filter((n: any) => !n.read && !n.is_read).length;

  const handleAddContribution = async () => {
    if (!contributionData.amount) return;
    try {
      await contributionAPI.create({
        membershipId: Number(activeProfile.id),
        amount: parseInt(contributionData.amount),
        paymentMethod: contributionData.paymentMethod,
      });
      toast.success(`Contribution of R${contributionData.amount} submitted!`);
      setShowAddContribution(false);
      setContributionData({ amount: '', paymentMethod: 'card' });
      // Refresh user data to update saved amounts
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit contribution');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

            {/* Right Side - Notifications & Profile Switcher */}
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
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                      ) : notifications.map((notif: any) => (
                        <div key={notif.id} className={`p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${!(notif.read || notif.is_read) ? 'bg-primary-50/50' : ''}`}>
                          <p className="text-sm text-gray-800">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time || notif.created_at}</p>
                        </div>
                      ))}
                    </div>
                    <Link to="/notifications" className="block p-3 text-center text-sm text-primary-600 hover:text-primary-700 border-t border-gray-100">
                      View All Notifications
                    </Link>
                  </div>
                )}
              </div>

              {/* Profile Switcher */}
              <ProfileSwitcher 
                profiles={mappedProfiles}
                activeProfile={activeProfile}
                onSwitch={setActiveProfile}
                onAddProfile={() => {
                  alert('Navigate to add profile page');
                }}
              />
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
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

            {/* Quick Actions */}
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
                
                <Link to="/help" className="flex flex-col items-center p-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group">
                  <HelpCircle className="w-6 h-6 text-gray-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-700">Help</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Add Contribution Modal */}
        {showAddContribution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Add Contribution</h3>
                <button onClick={() => setShowAddContribution(false)} className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="w-5 h-5" />
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

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={contributionData.paymentMethod}
                  onChange={(e) => setContributionData({...contributionData, paymentMethod: e.target.value})}
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash (Admin will confirm)</option>
                </select>
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