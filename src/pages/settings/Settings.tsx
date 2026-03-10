import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Bell,
  Lock,
  User,
  Save,
  CreditCard,
  Shield,
  LogOut,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { userApi, settingsApi } from '../../api';
import { showToast } from '../../utils/toast';
import { logout } from '../../utils/auth';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Profile Settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'en'
  });

  const [isEditing, setIsEditing] = useState(false);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    loanReminders: true,
    contributionReminders: true,
    groupAnnouncements: true,
    marketingEmails: false
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [memberSince, setMemberSince] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, settingsRes] = await Promise.all([
          userApi.getMe(),
          settingsApi.get().catch(() => ({ data: {} }))
        ]);

        const user = userRes.data;
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          language: 'en'
        });

        // Set member since from created_at
        if (user.createdAt || user.created_at) {
          const d = new Date(user.createdAt || user.created_at);
          setMemberSince(d.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }));
        }

        const s = settingsRes.data || {};
        setNotifications({
          emailAlerts: s.emailNotifications ?? true,
          smsAlerts: s.smsNotifications ?? false,
          loanReminders: s.loanAlerts ?? true,
          contributionReminders: s.contributionReminders ?? true,
          groupAnnouncements: s.pushNotifications ?? true,
          marketingEmails: false
        });
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await userApi.updateProfile({
        fullName: profile.name,
        email: profile.email,
        phone: profile.phone
      });
      setIsEditing(false);
      setShowSuccessMessage('Profile updated successfully');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await settingsApi.update({
        emailNotifications: notifications.emailAlerts,
        smsNotifications: notifications.smsAlerts,
        loanAlerts: notifications.loanReminders,
        contributionReminders: notifications.contributionReminders,
        pushNotifications: notifications.groupAnnouncements
      });
      setShowSuccessMessage('Notification preferences saved');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save notification settings', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowSuccessMessage('Password changed successfully');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm');
      return;
    }
    setDeleteError('');
    setIsDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      // Clear all stored data and redirect to login
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'privacy', label: 'Privacy & Legal', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center animate-fadeIn">
          <CheckCircle className="w-5 h-5 mr-2" />
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">FUND MATE</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (<>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${
                    activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-sm border border-primary-100 p-4">
              <h4 className="text-sm font-medium text-primary-800 mb-2">Account Status</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium">{memberSince || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary-600" />
                    Profile Information
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      {isEditing ? (
                        <input 
                          type="email" 
                          value={profile.email}
                          onChange={(e) => setProfile({...profile, email: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{profile.email}</p>
                      )}
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      {isEditing ? (
                        <input 
                          type="tel" 
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">{profile.phone}</p>
                      )}
                      <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <div className="relative">
                      {isEditing ? (
                        <select 
                          value={profile.language}
                          onChange={(e) => setProfile({...profile, language: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                          <option value="en">English</option>
                          <option value="af">Afrikaans</option>
                          <option value="zu">isiZulu</option>
                          <option value="xh">isiXhosa</option>
                        </select>
                      ) : (
                        <p className="text-gray-800 bg-gray-50 px-4 py-2 rounded-lg">
                          {profile.language === 'en' ? 'English' : 
                           profile.language === 'af' ? 'Afrikaans' :
                           profile.language === 'zu' ? 'isiZulu' : 'isiXhosa'}
                        </p>
                      )}
                      <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {isEditing && (
                    <button 
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Notification Preferences */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-primary-600" />
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  {Object.entries(notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <input 
                        type="checkbox" 
                        checked={value}
                        onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSaveNotifications}
                  className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-primary-600" />
                    Password & Authentication
                  </h3>
                  
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-gray-700">Change Password</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{passwordError}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <span className="text-gray-700">Two-Factor Authentication</span>
                      <span className="text-green-600 text-sm font-medium">Enabled</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="font-medium text-gray-800 mb-4">Login History</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-gray-500">Active now</p>
                      </div>
                      <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">Active Now</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {activeTab === 'payment' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
                  Payments
                </h3>

                {/* Payment Provider Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Secure Payments via Paystack</p>
                      <p className="text-sm text-gray-600">All contributions are processed securely through Paystack</p>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-gray-700">How Contributions Work</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">1</div>
                      <div>
                        <p className="font-medium text-sm">Click "Contribute" on your dashboard</p>
                        <p className="text-xs text-gray-500">Enter the amount you want to contribute</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">2</div>
                      <div>
                        <p className="font-medium text-sm">Secure payment page opens</p>
                        <p className="text-xs text-gray-500">Enter your card details on Paystack's secure page</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">3</div>
                      <div>
                        <p className="font-medium text-sm">Payment confirmed instantly</p>
                        <p className="text-xs text-gray-500">Your contribution is recorded and your balance updates</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supported Methods */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Supported Payment Methods</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium">💳 Visa</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium">💳 Mastercard</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium">🏦 Bank Transfer</span>
                    <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium">📱 USSD</span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                  <span>🔒 256-bit SSL encryption</span>
                  <span>PCI DSS compliant</span>
                </div>
              </div>
            )}

            {/* Privacy & Legal */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary-600" />
                  Privacy & Legal
                </h3>
                <div className="space-y-2">
                  <Link to="/privacy" className="block p-3 hover:bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Privacy Policy</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">How we handle your data</p>
                  </Link>
                  <Link to="/terms" className="block p-3 hover:bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Terms of Service</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Terms and conditions of using FUND MATE</p>
                  </Link>
                  <button onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(''); }} className="w-full text-left p-3 hover:bg-red-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-600">Delete Account</span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Permanently delete your account and data</p>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Last updated: February 2026
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 text-center border-t border-gray-200 pt-8">
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
        </>)}
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Account</h3>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium">This action is permanent and cannot be undone.</p>
              <ul className="text-xs text-red-600 mt-2 space-y-1 list-disc list-inside">
                <li>All your profile data will be removed</li>
                <li>Your cards and settings will be deleted</li>
                <li>You will lose access to all stokvels</li>
                <li>Contribution history will be anonymized</li>
              </ul>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your current password"
              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-2"
            />

            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}