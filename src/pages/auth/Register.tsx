import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowLeft, Users, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    preferredGroups: [] as number[],
    message: ''
  });

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: ''
  });

  // Available Stokvel groups - this would come from API in real app
  const availableGroups = [
    { id: 1, name: 'COLLECTIVE POT', icon: '🌱', description: '18 members · R7,000 target', capacity: '15/18 members', color: 'primary' },
    { id: 2, name: 'HENNESSY SOCIAL CLUB', icon: '🥃', description: 'Flexible · Up to R15,000 target', capacity: '8/50 members', color: 'secondary' },
    { id: 3, name: 'WINTER WARMTH SAVERS', icon: '❄️', description: 'Save for winter · R5,000 target', capacity: '0/15 members', color: 'blue' }
  ];

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      preferredGroups: prev.preferredGroups.includes(groupId)
        ? prev.preferredGroups.filter(id => id !== groupId)
        : [...prev.preferredGroups, groupId]
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: 'Passwords do not match'
      });
      return;
    }

    // Validate at least one group preference
    if (formData.preferredGroups.length === 0) {
      alert('Please select at least one Stokvel preference');
      return;
    }

    setIsLoading(true);
    
    // Simulate registration
    setTimeout(() => {
      setIsLoading(false);
      alert('Registration successful! Your preferences have been submitted for admin approval. You will receive an email once approved.');
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Join SOCIAL CLUB</h2>
        <p className="text-center text-gray-500 mb-6">Create your account and select your Stokvel preferences</p>

        {/* Approval Process Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">How it works:</p>
            <p className="text-xs text-blue-700 mt-1">
              1. Select which Stokvel(s) you'd like to join<br />
              2. Admin will review your request<br />
              3. You'll be approved based on capacity and eligibility<br />
              4. You can be added to multiple Stokvels
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Personal Information</h3>
            
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
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Security</h3>
            
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
          </div>

          {/* Stokvel Preferences */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">Stokvel Preferences</h3>
              <span className="text-xs text-gray-500">Select at least one</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {availableGroups.map(group => (
                <label
                  key={group.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.preferredGroups.includes(group.id)
                      ? `border-${group.color}-500 bg-${group.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.preferredGroups.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{group.icon}</span>
                        <span className="font-semibold text-gray-800">{group.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full bg-${group.color}-100 text-${group.color}-700`}>
                        {group.capacity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Message to Admin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Admin (Optional)
            </label>
            <textarea
              name="message"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Any additional information you'd like the admin to know..."
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-lg"
          >
            {isLoading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
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