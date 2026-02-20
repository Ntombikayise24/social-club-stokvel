import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Target, Wallet, Shield, ArrowRight, Settings, X, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin credentials (hidden from UI but working)
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'admin@123';

  const handleAdminClick = () => {
    setShowAdminModal(true);
    setLoginError('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    // Simulate API call
    setTimeout(() => {
      if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
        // Successful login
        setShowAdminModal(false);
        navigate('/admin');
      } else {
        // Failed login
        setLoginError('Invalid email or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  const closeModal = () => {
    setShowAdminModal(false);
    setLoginError('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full relative animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Admin Access</h3>
                  <p className="text-sm text-gray-500">Enter your admin credentials</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
              {/* Error Message */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="admin email"
                  />
                </div>
              </div>

              {/* Password Field with Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Hint that password can be viewed */}
                <p className="text-xs text-gray-400 mt-1">
                  Click the eye icon to {showPassword ? 'hide' : 'view'} password
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Access Admin Dashboard'
                )}
              </button>
            </form>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                This area is restricted to administrators only.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Admin Button - Now opens modal */}
              <button
                onClick={handleAdminClick}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="font-medium">Admin</span>
              </button>
              <Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Save Together,{' '}
                <span className="text-primary-600">Grow Together</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Join a community of savers. Reach your financial goals faster with SOCIAL CLUB - 
                the digital Stokvel management system that brings transparency and trust to group savings.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                  <p className="text-2xl font-bold text-primary-600">R126K+</p>
                  <p className="text-sm text-gray-500">Total Saved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">18</p>
                  <p className="text-sm text-gray-500">Active Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">30%</p>
                  <p className="text-sm text-gray-500">Interest Rate</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Column - Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Set Goals</h3>
                <p className="text-sm text-gray-500">R7,000 or R15,000 targets that work for you</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-secondary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Borrow Smart</h3>
                <p className="text-sm text-gray-500">Borrow 50% of your savings at 30% interest</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">18 Members</h3>
                <p className="text-sm text-gray-500">Close-knit groups with shared goals</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">100% Transparent</h3>
                <p className="text-sm text-gray-500">Every transaction timestamped and visible</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2026 SOCIAL CLUB. All rights reserved. Your trusted Stokvel partner.
          </p>
        </div>
      </footer>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;