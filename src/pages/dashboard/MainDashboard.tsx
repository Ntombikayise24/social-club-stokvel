import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Users, 
  Wallet,
  ArrowUpRight,
  History,
  Settings,
  HelpCircle,
  PlusCircle
} from 'lucide-react';

export default function MainDashboard() {
  const [showAddContribution, setShowAddContribution] = useState(false);

  // Mock data - we'll replace with real data later
  const userData = {
    name: "Nkulumo Nkuna",
    targetAmount: 8000,
    currentSaved: 1070,
    targetDate: "06 Dec 2026",
    minTarget: 7000,
    loanTarget: 2000,
    loanProgress: 57,
    borrowedSoFar: 1137,
    loanRemaining: 863,
    groupTotal: 9800,
    groupTarget: 126000,
    groupProgress: 8,
    memberCount: 18
  };

  const progressPercentage = (userData.currentSaved / userData.targetAmount) * 100;
  const remainingAmount = userData.targetAmount - userData.currentSaved;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-800">SOCIAL CLUB</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Dashboard</span>
              <Link 
                to="/profile"
                className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors"
              >
                <span className="text-sm font-medium text-primary-700">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message with clickable name */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome back,{' '}
            <Link to="/profile" className="text-primary-700 hover:text-primary-800 hover:underline">
              {userData.name}
            </Link>
          </h2>
          <Link 
            to="/profile" 
            className="text-sm bg-primary-100 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-200 transition-colors"
          >
            View Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Personal Stats */}
          <div className="space-y-6">
            {/* Target Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-700">YOUR TARGET</h3>
                </div>
                <span className="text-sm text-gray-500">Target date: {userData.targetDate}</span>
              </div>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-800">
                  R {userData.targetAmount.toLocaleString()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-primary-700">{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center text-gray-600 text-sm">
                <ArrowUpRight className="w-4 h-4 mr-1 text-primary-600" />
                <span>R {remainingAmount.toLocaleString()} remaining</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">Min target: R {userData.minTarget.toLocaleString()}</span>
              </div>
            </div>

            {/* Loan Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-secondary-600" />
                  <h3 className="font-semibold text-gray-700">Loan Target</h3>
                </div>
                <span className="text-sm text-gray-500">{userData.targetDate}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-2xl font-bold text-primary-800">
                    R {userData.loanTarget.toLocaleString()}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Target</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-primary-800">
                    {userData.loanProgress}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Progress</p>
                </div>
              </div>

              {/* Loan Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-secondary-500 h-2.5 rounded-full" 
                  style={{ width: `${userData.loanProgress}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600">Borrowed So Far</p>
                  <p className="font-semibold text-gray-800">R {userData.borrowedSoFar.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="font-semibold text-gray-800">R {userData.loanRemaining.toLocaleString()}</p>
                </div>
              </div>

              <button className="w-full bg-secondary-500 text-white py-3 rounded-lg hover:bg-secondary-600 transition-colors font-medium flex items-center justify-center space-x-2">
                <PlusCircle className="w-5 h-5" />
                <span>+ Borrow (30%)</span>
              </button>

              <Link to="/loans" className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-3">
                Tap to view loan history
              </Link>
            </div>
          </div>

          {/* Right Column - Collective Pot */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-700">COLLECTIVE POT</h3>
                </div>
                <span className="text-sm bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
                  Hennessy Social Club
                </span>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-primary-800">
                  R {userData.groupTotal.toLocaleString()}
                </span>
                <span className="text-gray-500 text-lg ml-2">
                  of R {userData.groupTarget.toLocaleString()} target
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                (18 × R7,000)
              </p>

              {/* Group Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Group Progress</span>
                  <span className="font-medium text-primary-700">{userData.groupProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${userData.groupProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-gray-600 mb-6">
                <Users className="w-4 h-4" />
                <span className="text-sm">{userData.memberCount} members contributing together</span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">CYCLE</p>
                  <p className="font-medium text-gray-800">Weekly</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">NEXT PAYOUT</p>
                  <p className="font-medium text-gray-800">06 Dec 2026</p>
                </div>
              </div>

              <Link 
                to="/group/hennessy" 
                className="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
              >
                View Group Details →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">QUICK ACTIONS</h3>
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setShowAddContribution(true)}
                  className="flex flex-col items-center p-3 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <PlusCircle className="w-6 h-6 text-primary-600 mb-1" />
                  <span className="text-xs text-gray-600">Contribute</span>
                </button>
                <Link to="/contributions" className="flex flex-col items-center p-3 hover:bg-primary-50 rounded-lg transition-colors">
                  <History className="w-6 h-6 text-primary-600 mb-1" />
                  <span className="text-xs text-gray-600">History</span>
                </Link>
                <Link to="/profile" className="flex flex-col items-center p-3 hover:bg-primary-50 rounded-lg transition-colors">
                  <Settings className="w-6 h-6 text-primary-600 mb-1" />
                  <span className="text-xs text-gray-600">Profile</span>
                </Link>
                <Link to="/help" className="flex flex-col items-center p-3 hover:bg-primary-50 rounded-lg transition-colors">
                  <HelpCircle className="w-6 h-6 text-primary-600 mb-1" />
                  <span className="text-xs text-gray-600">Help</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Add Contribution Modal */}
        {showAddContribution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add Contribution</h3>
              <p className="text-gray-600 mb-6">Make a contribution to your stokvel</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (ZAR) *
                </label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowAddContribution(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">
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