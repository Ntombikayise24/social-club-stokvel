import { useState, useEffect } from 'react';
import { X, Save, Mail, Phone, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface InlineEditUserModalProps {
  user: any;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
}

export default function InlineEditUserModal({ user, onClose, onSave }: InlineEditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'member',
    status: user.status || 'pending'
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false
  });

  const validateForm = () => {
    const newErrors = { name: '', email: '', phone: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
      isValid = false;
    } else if (!/^[0-9\s\+\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (touched.name || touched.email || touched.phone) {
      validateForm();
    }
  }, [formData, touched]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({ ...user, ...formData });
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all animate-slideIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
            <p className="text-sm text-gray-500 mt-1">Update user information and permissions</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                onBlur={() => handleBlur('name')}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.name && touched.name
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'
                }`}
                placeholder="John Doe"
              />
              {touched.name && !errors.name && formData.name && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.name && touched.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                onBlur={() => handleBlur('email')}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.email && touched.email
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'
                }`}
                placeholder="john@example.com"
              />
              {touched.email && !errors.email && formData.email && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.email && touched.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                onBlur={() => handleBlur('phone')}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.phone && touched.phone
                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'
                }`}
                placeholder="082 123 4567"
              />
              {touched.phone && !errors.phone && formData.phone && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
            </div>
            {errors.phone && touched.phone && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="member">Member</option>
                <option value="treasurer">Treasurer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.role === 'admin' && 'Full access to all features and settings'}
              {formData.role === 'treasurer' && 'Can manage payments and contributions'}
              {formData.role === 'member' && 'Basic access to stokvel features'}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Warning for status change */}
          {formData.status === 'inactive' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2 animate-pulse">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Setting user as inactive will prevent them from making contributions and accessing their account.
              </p>
            </div>
          )}

          {formData.status === 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Pending users need to be approved before they can access the system.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 font-medium shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}