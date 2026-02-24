import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowLeft, Users, Eye, EyeOff } from 'lucide-react';
import { authApi, stokvelApi } from '../../api';

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [stokvels, setStokvels] = useState<{ id: number; name: string; currentMembers: number; targetAmount: number; type: string }[]>([]);
  const [stokvelsLoading, setStokvelsLoading] = useState(true);
  const [stokvelsError, setStokvelsError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    selectedStokvel: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    selectedStokvel: ''
  });

  // Load stokvels from API
  const fetchStokvels = () => {
    setStokvelsLoading(true);
    setStokvelsError('');
    stokvelApi.list()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setStokvels(data);
      })
      .catch((err) => {
        console.error('Failed to load stokvels:', err);
        setStokvelsError('Failed to load stokvels. Please try again.');
      })
      .finally(() => setStokvelsLoading(false));
  };

  useEffect(() => {
    fetchStokvels();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Password validation
    if (name === 'password' || name === 'confirmPassword') {
      if (name === 'password' && formData.confirmPassword) {
        setErrors({
          ...errors,
          confirmPassword: value === formData.confirmPassword ? '' : 'Passwords do not match'
        });
      }
      if (name === 'confirmPassword') {
        setErrors({
          ...errors,
          confirmPassword: value === formData.password ? '' : 'Passwords do not match'
        });
      }
    }

    // Clear stokvel error when selected
    if (name === 'selectedStokvel') {
      setErrors({
        ...errors,
        selectedStokvel: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    // Validate phone number (SA format)
    const cleanPhone = formData.phone.replace(/\s|-/g, '');
    if (cleanPhone && !/^(\+27|0)\d{9}$/.test(cleanPhone)) {
      setErrors({ ...errors, phone: 'Enter a valid SA phone number (e.g. 0812345678)' });
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setErrors({ ...errors, password: 'Password must be at least 8 characters' });
      return;
    }
    if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[!@#$%^&*]/.test(formData.password)) {
      setErrors({ ...errors, password: 'Password must contain uppercase, number, and special character' });
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: 'Passwords do not match'
      });
      return;
    }

    // Validate stokvel selection
    if (!formData.selectedStokvel) {
      setErrors({
        ...errors,
        selectedStokvel: 'Please select a stokvel to join'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await authApi.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        selectedStokvel: parseInt(formData.selectedStokvel),
      });
      navigate('/registration-success');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
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

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Join HENNESSY SOCIAL CLUB</h2>
        <p className="text-center text-gray-500 mb-8">Create your account to start saving</p>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="fullName"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Thabo Mbeki"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="thabo@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="082 123 4567"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Min 8 chars, uppercase, number & special character (!@#$%^&*)</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Stokvel Selection - Updated with both options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Stokvel to Join</label>
            {stokvelsError ? (
              <div className="flex items-center space-x-2">
                <p className="text-sm text-red-600 flex-1">{stokvelsError}</p>
                <button
                  type="button"
                  onClick={fetchStokvels}
                  className="text-sm text-primary-600 hover:text-primary-700 underline whitespace-nowrap"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                name="selectedStokvel"
                required
                value={formData.selectedStokvel}
                onChange={handleChange}
                disabled={stokvelsLoading}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.selectedStokvel ? 'border-red-500' : 'border-gray-300'
                } ${stokvelsLoading ? 'bg-gray-100 cursor-wait' : ''}`}
              >
                <option value="">
                  {stokvelsLoading ? 'Loading stokvels...' : 'Choose a stokvel...'}
                </option>
                {stokvels.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.currentMembers} members · R{s.targetAmount?.toLocaleString()} target)
                  </option>
                ))}
              </select>
            )}
            {errors.selectedStokvel && (
              <p className="text-red-500 text-xs mt-1">{errors.selectedStokvel}</p>
            )}
          </div>

          {/* Info message about approval */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700 flex items-center">
              <Lock className="w-3 h-3 mr-1" />
              Your account will require admin approval before you can log in.
            </p>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start">
            <input
              type="checkbox"
              name="agreeTerms"
              required
              className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              checked={formData.agreeTerms}
              onChange={handleChange}
            />
            <span className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>

        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center justify-center w-full text-gray-500 hover:text-primary-600 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </button>
      </div>
    </div>
  );
}