import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Edit2,
  Save,
  X,
  DollarSign,
  Users,
  ArrowLeft,
  ChevronRight,
  Target,
  LogOut
} from 'lucide-react';

interface Profile {
  id: string;
  stokvelName: string;
  stokvelId: string;
  role: 'member' | 'admin';
  targetAmount: number;
  savedAmount: number;
  progress: number;
  joinedDate: string;
  icon: string;
  color: string;
}

interface UserData {
  fullName: string;
  email: string;
  phone: string;
  mainMemberSince: string;
  profiles: Profile[];
}

export default function MemberProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user data with the two profiles we've been using
  const [userData, setUserData] = useState<UserData>({
    fullName: "Nkulumo Nkuna",
    email: "nkulumo.nkuna@email.com",
    phone: "082 123 4567",
    mainMemberSince: "21 January 2026",
    profiles: [
      {
        id: '1',
        stokvelName: 'COLLECTIVE POT',
        stokvelId: 'collective-pot',
        role: 'member',
        targetAmount: 7000,
        savedAmount: 1070,
        progress: 13,
        joinedDate: '21 Jan 2026',
        icon: '🌱',
        color: 'primary'
      },
      {
        id: '2',
        stokvelName: 'SUMMER SAVERS',
        stokvelId: 'summer-savers',
        role: 'member',
        targetAmount: 5000,
        savedAmount: 850,
        progress: 17,
        joinedDate: '05 Feb 2026',
        icon: '💰',
        color: 'secondary'
      }
    ]
  });

  const [editedUserData, setEditedUserData] = useState({ ...userData });

  const stats = {
    totalSaved: userData.profiles.reduce((sum, p) => sum + p.savedAmount, 0),
    totalTarget: userData.profiles.reduce((sum, p) => sum + p.targetAmount, 0),
    activeGroups: userData.profiles.length
  };

  const handleSave = () => {
    setUserData(editedUserData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUserData(userData);
    setIsEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Profile</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header with Single Edit Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">
                  {userData.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{userData.fullName}</h2>
                <p className="text-gray-500">Member since {userData.mainMemberSince}</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {/* Overall Stats - Shows totals across both profiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Total Saved (All Stokvels)</span>
                <DollarSign className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-2xl font-bold text-primary-800">
                {formatCurrency(stats.totalSaved)}
              </p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Total Target</span>
                <Target className="w-5 h-5 text-secondary-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-800">
                {formatCurrency(stats.totalTarget)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Active Groups</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {stats.activeGroups}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information - Single Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Personal Information</h3>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUserData.fullName}
                    onChange={(e) => setEditedUserData({...editedUserData, fullName: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-800">{userData.fullName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedUserData.email}
                    onChange={(e) => setEditedUserData({...editedUserData, email: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-800">{userData.email}</p>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Mobile Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedUserData.phone}
                    onChange={(e) => setEditedUserData({...editedUserData, phone: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-800">{userData.phone}</p>
                )}
              </div>
            </div>

            {/* Member Since - Single Instance */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-800">{userData.mainMemberSince}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Stokvels Section - Just the two profiles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">My Stokvels</h3>
            <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
              {stats.activeGroups} Active
            </span>
          </div>

          <div className="space-y-4">
            {userData.profiles.map((profile) => (
              <div 
                key={profile.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Profile Icon */}
                    <div className={`w-12 h-12 bg-${profile.color}-100 rounded-xl flex items-center justify-center text-2xl`}>
                      {profile.icon}
                    </div>
                    
                    {/* Profile Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-800">{profile.stokvelName}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full bg-${profile.color}-100 text-${profile.color}-700`}>
                          {profile.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-gray-600">Saved: <span className="font-medium">{formatCurrency(profile.savedAmount)}</span></span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">Target: <span className="font-medium">{formatCurrency(profile.targetAmount)}</span></span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">Joined: <span className="font-medium">{profile.joinedDate}</span></span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3 w-64">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className={`font-medium text-${profile.color}-600`}>{profile.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${profile.color}-600 h-2 rounded-full`} 
                            style={{ width: `${profile.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/dashboard?profile=${profile.id}`}
                      className="flex items-center space-x-1 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <span className="text-sm">Switch</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Using first profile as default */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to={`/contributions?profile=${userData.profiles[0]?.id || '1'}`} 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center"
          >
            <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Contributions</span>
          </Link>
          <Link 
            to={`/loans?profile=${userData.profiles[0]?.id || '1'}`} 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center"
          >
            <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Loans</span>
          </Link>
          <Link 
            to={`/dashboard?profile=${userData.profiles[0]?.id || '1'}`} 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center"
          >
            <Target className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Dashboard</span>
          </Link>
          <Link 
            to="/help" 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center"
          >
            <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Help</span>
          </Link>
        </div>

        {/* Logout */}
        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </div>
      </main>
    </div>
  );
}