import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Lock,
  User,
  Save,
  CreditCard,
  Shield,
  LogOut
} from 'lucide-react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    loanReminders: true,
    contributionReminders: true,
    groupAnnouncements: true
  });

  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

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
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary-600" />
            Profile Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input 
                type="text" 
                defaultValue="Nkulumo Nkuna"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                defaultValue="nkulumo.nkuna@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input 
                type="tel" 
                defaultValue="082 123 4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary-600" />
            Notification Preferences
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Email Alerts</span>
              <input 
                type="checkbox" 
                checked={notifications.emailAlerts}
                onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">SMS Alerts</span>
              <input 
                type="checkbox" 
                checked={notifications.smsAlerts}
                onChange={(e) => setNotifications({...notifications, smsAlerts: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Loan Reminders</span>
              <input 
                type="checkbox" 
                checked={notifications.loanReminders}
                onChange={(e) => setNotifications({...notifications, loanReminders: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Contribution Reminders</span>
              <input 
                type="checkbox" 
                checked={notifications.contributionReminders}
                onChange={(e) => setNotifications({...notifications, contributionReminders: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Group Announcements</span>
              <input 
                type="checkbox" 
                checked={notifications.groupAnnouncements}
                onChange={(e) => setNotifications({...notifications, groupAnnouncements: e.target.checked})}
                className="w-5 h-5 text-primary-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Sun className="w-5 h-5 mr-2 text-primary-600" />
            Appearance
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                    theme === 'light' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                    theme === 'dark' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">isiZulu</option>
                <option value="xh">isiXhosa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-primary-600" />
            Security
          </h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-gray-700">Change Password</span>
              <span className="text-primary-600">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-gray-700">Two-Factor Authentication</span>
              <span className="text-primary-600">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className="text-gray-700">Login History</span>
              <span className="text-primary-600">→</span>
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
            Payment Methods
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-xs text-gray-500">Expires 12/25</p>
                </div>
              </div>
              <button className="text-red-600 hover:text-red-700 text-sm">Remove</button>
            </div>
            <button className="w-full flex items-center justify-center space-x-2 p-3 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Add Payment Method</span>
            </button>
          </div>
        </div>

        {/* Privacy & Legal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary-600" />
            Privacy & Legal
          </h3>
          <div className="space-y-2">
            <Link to="/privacy" className="block p-3 hover:bg-gray-50 rounded-lg">Privacy Policy</Link>
            <Link to="/terms" className="block p-3 hover:bg-gray-50 rounded-lg">Terms of Service</Link>
            <button className="block w-full text-left p-3 hover:bg-gray-50 rounded-lg text-red-600">
              Delete Account
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </div>
      </main>
    </div>
  );
}