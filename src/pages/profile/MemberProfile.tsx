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
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function MemberProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Nkulumo Nkuna",
    email: "nkulumo.nkuna@email.com",
    mobile: "082 123 4567",
    memberSince: "21 January 2026"
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const stats = {
    totalSaved: 1070,
    contributions: 9800,
    activeGroups: 2
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">SOCIAL CLUB</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Profile</span>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-700" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">
                  {profile.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{profile.fullName}</h2>
                <p className="text-gray-500">Member since {profile.memberSince}</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Total Saved</span>
                <DollarSign className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-2xl font-bold text-primary-800">
                R {stats.totalSaved.toLocaleString()}
              </p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Contributions</span>
                <Users className="w-5 h-5 text-secondary-600" />
              </div>
              <p className="text-2xl font-bold text-secondary-800">
                R {stats.contributions.toLocaleString()}
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

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-800">{profile.fullName}</p>
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
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-800">{profile.email}</p>
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
                    value={editedProfile.mobile}
                    onChange={(e) => setEditedProfile({...editedProfile, mobile: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-gray-800">{profile.mobile}</p>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-800">{profile.memberSince}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/contributions" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center">
            <Clock className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Contribution History</span>
          </Link>
          <Link to="/loans" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center">
            <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Loan History</span>
          </Link>
          <Link to="/groups" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center">
            <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">My Groups</span>
          </Link>
          <Link to="/settings" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors text-center">
            <Edit2 className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <span className="text-sm text-gray-600">Settings</span>
          </Link>
        </div>
      </main>
    </div>
  );
}