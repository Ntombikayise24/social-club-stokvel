// src/pages/auth/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Users, AlertCircle, ArrowLeft } from 'lucide-react';

// Mock user database
const mockUsers = [
  { email: 'nkulumo.nkuna@email.com', password: 'password123', name: 'Nkulumo Nkuna', role: 'member' },
  { email: 'thabo.mbeki@email.com', password: 'password123', name: 'Thabo Mbeki', role: 'member' },
  { email: 'sarah.jones@email.com', password: 'password123', name: 'Sarah Jones', role: 'member' },
  { email: 'john.doe@email.com', password: 'password123', name: 'John Doe', role: 'member' },
  { email: 'mary.johnson@email.com', password: 'password123', name: 'Mary Johnson', role: 'member' },
  { email: 'peter.williams@email.com', password: 'password123', name: 'Peter Williams', role: 'member' },
  { email: 'admin@admin.com', password: 'admin@123', name: 'Admin User', role: 'admin' },
  { email: 'demo@hennessy.co.za', password: 'demo123', name: 'Demo User', role: 'member' },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = mockUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (user) {
        console.log('Login successful:', user);
        
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify({ email: user.email, name: user.name, role: user.role }));
        } else {
          sessionStorage.setItem('user', JSON.stringify({ email: user.email, name: user.name, role: user.role }));
        }
        
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid email or password');
      }
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-600 hover:text-primary-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-8">Sign in to your account</p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="admin@admin.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            {/* THIS IS THE FIX - Link to Forgot Password page */}
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Join a Stokvel
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center mb-2">Demo Credentials:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium text-gray-700">Admin</p>
              <p className="text-gray-500">admin@admin.com</p>
              <p className="text-gray-500">admin@123</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium text-gray-700">Member</p>
              <p className="text-gray-500">demo@hennessy.co.za</p>
              <p className="text-gray-500">demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}