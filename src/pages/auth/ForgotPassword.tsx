import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Users, AlertCircle, Lock } from 'lucide-react';

// Mock user database - make it mutable so we can update passwords
let mockUsers = [
  { email: 'nkulumo.nkuna@email.com', password: 'password123' },
  { email: 'thabo.mbeki@email.com', password: 'password123' },
  { email: 'sarah.jones@email.com', password: 'password123' },
  { email: 'john.doe@email.com', password: 'password123' },
  { email: 'mary.johnson@email.com', password: 'password123' },
  { email: 'peter.williams@email.com', password: 'password123' },
  { email: 'demo@hennessy.co.za', password: 'demo123' },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const userExists = mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!userExists) {
        setError('No account found with this email address');
        setIsLoading(false);
        return;
      }

      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setResetCode(code);
      console.log('Reset code (in real app would be emailed):', code); // For demo purposes
      
      setStep('code');
      setIsLoading(false);
    }, 1500);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // In a real app, this would verify the code
      setStep('newPassword');
      setIsLoading(false);
    }, 1000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // ACTUALLY UPDATE THE PASSWORD in mock database
      mockUsers = mockUsers.map(user => 
        user.email.toLowerCase() === email.toLowerCase() 
          ? { ...user, password: newPassword } 
          : user
      );
      
      console.log('Password updated for:', email);
      console.log('New mock users:', mockUsers);
      
      setIsLoading(false);
      // Redirect to login with success message
      navigate('/login?reset=success');
    }, 1500);
  };

  const resendCode = () => {
    setIsLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setResetCode(code);
      console.log('New reset code:', code);
      setIsLoading(false);
      alert('New code sent! (Check console)');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>

        {step === 'email' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Forgot Password?</h2>
            <p className="text-center text-gray-500 mb-8">
              Enter your email address and we'll send you a verification code.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="thabo@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Check Your Email</h2>
            <p className="text-center text-gray-500 mb-6">
              We've sent a 6-digit verification code to:<br />
              <span className="font-medium text-gray-800">{email}</span>
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-yellow-700">
                For demo purposes, check the console for the code: <strong>{resetCode}</strong>
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="000000"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || resetCode.length !== 6}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={resendCode}
                disabled={isLoading}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Resend Code
              </button>
            </div>
          </>
        )}

        {step === 'newPassword' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Reset Password</h2>
            <p className="text-center text-gray-500 mb-8">
              Enter your new password below.
            </p>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* Back to Login */}
        <Link
          to="/login"
          className="mt-6 flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}