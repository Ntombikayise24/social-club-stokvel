import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { 
  Users,
  DollarSign,
  Clock,
  Settings,
  LogOut,
  Edit2,
  Trash2,
  Search,
  UserPlus,
  Shield,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Download,
  RefreshCw,
  Mail,
  Phone,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Tag,
  Users as UsersIcon,
  Archive,
  RotateCcw,
  UserCheck,
  XCircle
} from 'lucide-react';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending' | 'deleted';
  joinedDate: string;
  lastActive?: string;
  deletedAt?: string;
  profiles: Profile[];
}

interface Profile {
  id: string;
  stokvelId: number;
  stokvelName: string;
  role: 'member' | 'admin';
  targetAmount: number;
  savedAmount: number;
  joinedDate: string;
}

interface Stokvel {
  id: number;
  name: string;
  type: 'traditional' | 'flexible';
  description: string;
  targetAmount: number;
  maxMembers: number;
  currentMembers: number;
  interestRate: number;
  cycle: 'weekly' | 'monthly' | 'quarterly';
  meetingDay?: string;
  nextPayout: string;
  status: 'active' | 'inactive' | 'upcoming';
  icon: string;
  color: string;
  createdAt: string;
  createdBy: string;
}

interface Contribution {
  id: number;
  userId: number;
  userName: string;
  userInitials: string;
  stokvelId: number;
  stokvelName: string;
  amount: number;
  date: string;
  status: 'confirmed' | 'pending' | 'deleted';
  confirmedBy?: string;
  confirmedAt?: string;
  paymentMethod: string;
  reference?: string;
  deletedAt?: string;
}

interface DeletedUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  joinRequests?: { stokvelId: number; stokvelName: string; status: string }[];
  stokvels?: { stokvelId: number; stokvelName: string; status: string }[];
  originalData: User;
}

// Add User Modal Component
interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: any) => void;
  stokvels: Stokvel[];
}

function AddUserModal({ onClose, onAdd, stokvels }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'pending' as 'active' | 'pending',
    selectedStokvels: [] as number[]
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: ''
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
      isValid = false;
    } else if (!/^[0-9\s\+\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      joinedDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
      lastActive: formData.status === 'active' ? 'Just now' : 'Never',
      profiles: formData.selectedStokvels.map(stokvelId => {
        const stokvel = stokvels.find(s => s.id === stokvelId);
        return {
          id: `p${Date.now()}-${stokvelId}`,
          stokvelId,
          stokvelName: stokvel?.name || '',
          role: 'member',
          targetAmount: stokvel?.targetAmount || 0,
          savedAmount: 0,
          joinedDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
        };
      })
    };

    onAdd(newUser);
  };

  const toggleStokvel = (stokvelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedStokvels: prev.selectedStokvels.includes(stokvelId)
        ? prev.selectedStokvels.filter(id => id !== stokvelId)
        : [...prev.selectedStokvels, stokvelId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="082 123 4567"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'pending'})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">Pending (Requires Approval)</option>
                <option value="active">Active (Immediate Access)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Assign to Stokvels</h3>
            <p className="text-xs text-gray-500">Select which stokvels this user should join</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stokvels.filter(s => s.status === 'active').map(stokvel => (
                <label
                  key={stokvel.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.selectedStokvels.includes(stokvel.id)
                      ? `border-${stokvel.color}-500 bg-${stokvel.color}-50`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedStokvels.includes(stokvel.id)}
                    onChange={() => toggleStokvel(stokvel.id)}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{stokvel.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{stokvel.name}</p>
                      <p className="text-xs text-gray-500">
                        Target: R {stokvel.targetAmount.toLocaleString()} • {stokvel.currentMembers}/{stokvel.maxMembers} members
                      </p>
                    </div>
                    {formData.selectedStokvels.includes(stokvel.id) && (
                      <CheckCircle className={`w-5 h-5 text-${stokvel.color}-600`} />
                    )}
                  </div>
                </label>
              ))}
            </div>
            
            {formData.selectedStokvels.length === 0 && (
              <p className="text-xs text-yellow-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                User will have no stokvel access until assigned
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Stokvel Modal Component
interface AddStokvelModalProps {
  onClose: () => void;
  onAdd: (stokvel: any) => void;
}

function AddStokvelModal({ onClose, onAdd }: AddStokvelModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'traditional' as 'traditional' | 'flexible',
    description: '',
    targetAmount: '',
    maxMembers: '',
    cycle: 'weekly' as 'weekly' | 'monthly' | 'quarterly',
    meetingDay: '',
    icon: '',
    color: 'primary',
    status: 'upcoming' as 'active' | 'upcoming'
  });

  const [errors, setErrors] = useState({
    name: '',
    targetAmount: '',
    maxMembers: ''
  });

  const iconOptions = [
    { value: '💰', label: 'Money Bag' },
    { value: '🌱', label: 'Seedling' },
    { value: '❄️', label: 'Snowflake' },
    { value: '🏖️', label: 'Beach' },
    { value: '🎄', label: 'Christmas' },
    { value: '🏦', label: 'Bank' },
    { value: '📈', label: 'Growth' },
    { value: '💎', label: 'Diamond' }
  ];

  const cycleDays = {
    weekly: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    monthly: ['1st', '5th', '10th', '15th', '20th', '25th', 'Last day'],
    quarterly: ['Jan', 'Apr', 'Jul', 'Oct']
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      targetAmount: '',
      maxMembers: ''
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Stokvel name is required';
      isValid = false;
    }

    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required';
      isValid = false;
    } else if (parseInt(formData.targetAmount) < 1000) {
      newErrors.targetAmount = 'Minimum target is R 1,000';
      isValid = false;
    }

    if (!formData.maxMembers) {
      newErrors.maxMembers = 'Maximum members is required';
      isValid = false;
    } else if (parseInt(formData.maxMembers) < 5) {
      newErrors.maxMembers = 'Minimum 5 members required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newStokvel = {
      id: Date.now(),
      name: formData.name.toUpperCase(),
      type: formData.type,
      description: formData.description || `New ${formData.type} Stokvel - Save and grow together`,
      targetAmount: parseInt(formData.targetAmount),
      maxMembers: parseInt(formData.maxMembers),
      currentMembers: 0,
      interestRate: 30,
      cycle: formData.cycle,
      meetingDay: formData.meetingDay || (formData.cycle === 'weekly' ? 'Monday' : undefined),
      nextPayout: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: formData.status,
      icon: formData.icon || '💰',
      color: formData.color,
      createdAt: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdBy: 'Admin'
    };

    onAdd(newStokvel);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Create New Stokvel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Stokvel Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stokvel Name *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="WINTER WARMTH"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select an icon</option>
                  {iconOptions.map(icon => (
                    <option key={icon.value} value={icon.value}>
                      {icon.value} {icon.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the purpose of this Stokvel..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stokvel Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'traditional' | 'flexible'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="traditional">Traditional (Fixed)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'upcoming'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="upcoming">Upcoming (Not yet active)</option>
                  <option value="active">Active (Immediately)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Financial Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (R) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="3000"
                    min="1000"
                    step="100"
                  />
                </div>
                {errors.targetAmount && <p className="mt-1 text-xs text-red-600">{errors.targetAmount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Members *</label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.maxMembers ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12"
                    min="5"
                    max="50"
                  />
                </div>
                {errors.maxMembers && <p className="mt-1 text-xs text-red-600">{errors.maxMembers}</p>}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Interest rate is fixed at 30% for all Stokvels
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cycle Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Cycle</label>
                <select
                  value={formData.cycle}
                  onChange={(e) => {
                    setFormData({...formData, cycle: e.target.value as 'weekly' | 'monthly' | 'quarterly', meetingDay: ''});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day</label>
                <select
                  value={formData.meetingDay}
                  onChange={(e) => setFormData({...formData, meetingDay: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select day</option>
                  {cycleDays[formData.cycle].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Preview</h3>
            <div className={`border rounded-lg p-4 ${
              formData.status === 'upcoming' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{formData.icon || '💰'}</span>
                  <h4 className="font-semibold text-gray-800">{formData.name || 'NEW STOKVEL'}</h4>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  formData.status === 'upcoming' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {formData.status === 'upcoming' ? 'Upcoming' : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {formData.description || 'New Stokvel - Save and grow together'}
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Members:</span>
                  <span className="font-medium">0/{formData.maxMembers || '12'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target:</span>
                  <span className="font-medium">R {(parseInt(formData.targetAmount) || 3000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cycle:</span>
                  <span className="font-medium capitalize">
                    {formData.cycle} {formData.meetingDay ? `(${formData.meetingDay})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <PlusCircle className="w-5 h-5" />
              <span>Create Stokvel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  stokvels: Stokvel[];
}

function EditUserModal({ user, onClose, onSave, stokvels }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    selectedStokvels: user.profiles.map(p => p.stokvelId)
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: ''
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
      isValid = false;
    } else if (!/^[0-9\s\+\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      profiles: formData.selectedStokvels.map(stokvelId => {
        const stokvel = stokvels.find(s => s.id === stokvelId);
        const existingProfile = user.profiles.find(p => p.stokvelId === stokvelId);
        
        if (existingProfile) {
          return existingProfile;
        }
        
        return {
          id: `p${Date.now()}-${stokvelId}`,
          stokvelId,
          stokvelName: stokvel?.name || '',
          role: 'member',
          targetAmount: stokvel?.targetAmount || 0,
          savedAmount: 0,
          joinedDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
        };
      })
    };

    onSave(updatedUser);
  };

  const toggleStokvel = (stokvelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedStokvels: prev.selectedStokvels.includes(stokvelId)
        ? prev.selectedStokvels.filter(id => id !== stokvelId)
        : [...prev.selectedStokvels, stokvelId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="082 123 4567"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'pending'})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Stokvel Membership</h3>
            <p className="text-xs text-gray-500">Select which stokvels this user belongs to</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stokvels.filter(s => s.status === 'active').map(stokvel => (
                <label
                  key={stokvel.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.selectedStokvels.includes(stokvel.id)
                      ? `border-${stokvel.color}-500 bg-${stokvel.color}-50`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedStokvels.includes(stokvel.id)}
                    onChange={() => toggleStokvel(stokvel.id)}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{stokvel.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{stokvel.name}</p>
                      <p className="text-xs text-gray-500">
                        Target: R {stokvel.targetAmount.toLocaleString()}
                      </p>
                    </div>
                    {formData.selectedStokvels.includes(stokvel.id) && (
                      <CheckCircle className={`w-5 h-5 text-${stokvel.color}-600`} />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <Edit2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Stokvel Modal Component
interface EditStokvelModalProps {
  stokvel: Stokvel;
  onClose: () => void;
  onSave: (updatedStokvel: Stokvel) => void;
}

function EditStokvelModal({ stokvel, onClose, onSave }: EditStokvelModalProps) {
  const [formData, setFormData] = useState({
    name: stokvel.name,
    description: stokvel.description,
    targetAmount: stokvel.targetAmount.toString(),
    maxMembers: stokvel.maxMembers.toString(),
    cycle: stokvel.cycle,
    meetingDay: stokvel.meetingDay || '',
    status: stokvel.status,
    icon: stokvel.icon,
    color: stokvel.color
  });

  const [errors, setErrors] = useState({
    name: '',
    targetAmount: '',
    maxMembers: ''
  });

  const iconOptions = [
    { value: '💰', label: 'Money Bag' },
    { value: '🌱', label: 'Seedling' },
    { value: '❄️', label: 'Snowflake' },
    { value: '🏖️', label: 'Beach' },
    { value: '🎄', label: 'Christmas' },
    { value: '🏦', label: 'Bank' },
    { value: '📈', label: 'Growth' },
    { value: '💎', label: 'Diamond' }
  ];

  const colors = [
    { value: 'primary', label: 'Green' },
    { value: 'secondary', label: 'Orange' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' }
  ];

  const cycleDays = {
    weekly: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    monthly: ['1st', '5th', '10th', '15th', '20th', '25th', 'Last day'],
    quarterly: ['Jan', 'Apr', 'Jul', 'Oct']
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      targetAmount: '',
      maxMembers: ''
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Stokvel name is required';
      isValid = false;
    }

    if (!formData.targetAmount) {
      newErrors.targetAmount = 'Target amount is required';
      isValid = false;
    } else if (parseInt(formData.targetAmount) < 1000) {
      newErrors.targetAmount = 'Minimum target is R 1,000';
      isValid = false;
    }

    if (!formData.maxMembers) {
      newErrors.maxMembers = 'Maximum members is required';
      isValid = false;
    } else if (parseInt(formData.maxMembers) < 5) {
      newErrors.maxMembers = 'Minimum 5 members required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const updatedStokvel: Stokvel = {
      ...stokvel,
      name: formData.name.toUpperCase(),
      description: formData.description,
      targetAmount: parseInt(formData.targetAmount),
      maxMembers: parseInt(formData.maxMembers),
      cycle: formData.cycle as 'weekly' | 'monthly' | 'quarterly',
      meetingDay: formData.meetingDay || undefined,
      status: formData.status as 'active' | 'inactive' | 'upcoming',
      icon: formData.icon,
      color: formData.color
    };

    onSave(updatedStokvel);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Edit Stokvel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Stokvel Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stokvel Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {iconOptions.map(icon => (
                    <option key={icon.value} value={icon.value}>
                      {icon.value} {icon.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Financial Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (R) *</label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1000"
                  step="100"
                />
                {errors.targetAmount && <p className="mt-1 text-xs text-red-600">{errors.targetAmount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Members *</label>
                <input
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.maxMembers ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="5"
                  max="50"
                />
                {errors.maxMembers && <p className="mt-1 text-xs text-red-600">{errors.maxMembers}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cycle Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Cycle</label>
                <select
                  value={formData.cycle}
                  onChange={(e) => {
                    setFormData({...formData, cycle: e.target.value as 'weekly' | 'monthly' | 'quarterly', meetingDay: ''});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day</label>
                <select
                  value={formData.meetingDay}
                  onChange={(e) => setFormData({...formData, meetingDay: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select day</option>
                  {cycleDays[formData.cycle as keyof typeof cycleDays].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'upcoming'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {colors.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <Edit2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Approve User Modal Component
interface ApproveUserModalProps {
  user: User;
  onClose: () => void;
  onApprove: (userId: number, selectedStokvels: number[]) => void;
  onReject: (userId: number) => void;
  stokvels: Stokvel[];
}

function ApproveUserModal({ user, onClose, onApprove, onReject, stokvels }: ApproveUserModalProps) {
  const [selectedStokvels, setSelectedStokvels] = useState<number[]>([]);
  const [requestedStokvelIds, setRequestedStokvelIds] = useState<number[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch which stokvels this user requested to join
  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const res = await adminApi.getUserJoinRequests(user.id);
        const pending = (res.data || []).filter((r: any) => r.status === 'pending');
        const ids = pending.map((r: any) => r.stokvelId);
        setRequestedStokvelIds(ids);
        // Pre-select the requested stokvels
        setSelectedStokvels(ids);
      } catch (err) {
        console.error('Failed to fetch user join requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchUserRequests();
  }, [user.id]);

  const toggleStokvel = (stokvelId: number) => {
    setSelectedStokvels(prev =>
      prev.includes(stokvelId)
        ? prev.filter(id => id !== stokvelId)
        : [...prev, stokvelId]
    );
  };

  const handleApprove = () => {
    onApprove(user.id, selectedStokvels);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Approve User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3">User Details</h3>
            <div className="space-y-2">
              <p><span className="text-sm text-gray-500">Name:</span> <span className="font-medium">{user.name}</span></p>
              <p><span className="text-sm text-gray-500">Email:</span> <span className="font-medium">{user.email}</span></p>
              <p><span className="text-sm text-gray-500">Phone:</span> <span className="font-medium">{user.phone}</span></p>
              <p><span className="text-sm text-gray-500">Registered:</span> <span className="font-medium">{user.joinedDate}</span></p>
            </div>
          </div>

          {/* Show which stokvel the user requested */}
          {!loadingRequests && requestedStokvelIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Stokvel Requested During Registration
              </h3>
              <div className="flex flex-wrap gap-2">
                {requestedStokvelIds.map(id => {
                  const s = stokvels.find(sv => sv.id === id);
                  return s ? (
                    <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      <span>{s.icon}</span> {s.name}
                    </span>
                  ) : null;
                })}
              </div>
              <p className="text-xs text-blue-600 mt-2">This stokvel has been pre-selected below. You can change the selection if needed.</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Assign to Stokvels</h3>
            <p className="text-xs text-gray-500">Select which stokvels this user should join</p>
            
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stokvels.filter(s => s.status === 'active').map(stokvel => {
                  const isFull = stokvel.currentMembers >= stokvel.maxMembers;
                  const isRequested = requestedStokvelIds.includes(stokvel.id);
                  const isSelected = selectedStokvels.includes(stokvel.id);

                  return (
                    <label
                      key={stokvel.id}
                      className={`relative flex items-center p-4 border-2 rounded-lg transition-all ${
                        isFull && !isSelected
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : isSelected
                            ? 'border-green-500 bg-green-50 cursor-pointer shadow-sm'
                            : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isFull || isSelected ? toggleStokvel(stokvel.id) : null}
                        disabled={isFull && !isSelected}
                        className="hidden"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">{stokvel.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800">{stokvel.name}</p>
                            {isRequested && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">
                                Requested
                              </span>
                            )}
                            {isFull && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full">
                                Full
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Target: R {stokvel.targetAmount.toLocaleString()} • 
                            <span className={isFull ? ' text-red-600 font-semibold' : ''}>
                              {' '}{stokvel.currentMembers}/{stokvel.maxMembers} members
                            </span>
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            
            {selectedStokvels.length === 0 && !loadingRequests && (
              <p className="text-xs text-yellow-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                User will have no stokvel access until assigned
              </p>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => onReject(user.id)}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject User</span>
            </button>
            <div className="flex space-x-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={selectedStokvels.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve User</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Confirm Contribution Modal Component
interface ConfirmContributionModalProps {
  contribution: Contribution;
  onClose: () => void;
  onConfirm: (contributionId: number) => void;
  onConfirmAdjusted: (contributionId: number, adjustedAmount: number) => void;
  onReject: (contributionId: number, reason?: string) => void;
}

function ConfirmContributionModal({ contribution, onClose, onConfirm, onConfirmAdjusted, onReject }: ConfirmContributionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'review' | 'adjust' | 'reject'>('review');
  const [adjustedAmount, setAdjustedAmount] = useState(contribution.amount);
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirm = () => {
    setIsProcessing(true);
    if (mode === 'adjust' && adjustedAmount !== contribution.amount) {
      onConfirmAdjusted(contribution.id, adjustedAmount);
    } else {
      onConfirm(contribution.id);
    }
  };

  const handleReject = () => {
    setIsProcessing(true);
    onReject(contribution.id, rejectReason || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Review Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{contribution.userName}</p>
                <p className="text-sm text-gray-500">{contribution.stokvelName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-bold text-lg text-primary-600">
                R {contribution.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{contribution.date}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium capitalize">{contribution.paymentMethod}</span>
            </div>
          </div>

          {mode === 'review' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-yellow-700 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  You can confirm, adjust the amount, or reject this payment.
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm Full Amount (R {contribution.amount.toLocaleString()})</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setMode('adjust')}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Adjust Amount</span>
                </button>
                <button
                  onClick={() => setMode('reject')}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Payment</span>
                </button>
                <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={isProcessing}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {mode === 'adjust' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjusted Amount (R)</label>
                <input
                  type="number"
                  min={1}
                  value={adjustedAmount}
                  onChange={e => setAdjustedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {adjustedAmount !== contribution.amount && (
                  <p className="text-xs text-orange-600 mt-1">
                    Changed from R {contribution.amount.toLocaleString()} → R {adjustedAmount.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setMode('review')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={isProcessing}>
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing || adjustedAmount <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm R {adjustedAmount.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {mode === 'reject' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection (optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Amount received does not match, payment not verified..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setMode('review')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={isProcessing}>
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Reject Payment</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Loan Action Modal
interface LoanActionModalProps {
  loan: any;
  onClose: () => void;
  onApprove: (loanId: number) => void;
  onReject: (loanId: number, reason: string) => void;
}

function LoanActionModal({ loan, onClose, onApprove, onReject }: LoanActionModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    setIsProcessing(true);
    onApprove(loan.id);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    onReject(loan.id, rejectReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Review Loan Request</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{loan.userName}</p>
                <p className="text-sm text-gray-500">{loan.stokvelName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Loan Amount:</span>
              <span className="font-bold text-lg text-primary-600">
                R {Number(loan.amount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Interest (30%):</span>
              <span className="font-medium text-orange-600">
                R {(Number(loan.amount) * 0.3).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Repayment:</span>
              <span className="font-bold text-red-600">
                R {(Number(loan.amount) * 1.3).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Date Requested:</span>
              <span className="font-medium">{loan.createdAt ? new Date(loan.createdAt).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
            </div>
            {loan.purpose && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Purpose:</span>
                <span className="font-medium">{loan.purpose}</span>
              </div>
            )}
          </div>

          {mode === 'review' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-yellow-700 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Approving will deduct the loan amount from the member's savings and mark the loan as active.
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Loan</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setMode('reject')}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Loan</span>
                </button>
                <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={isProcessing}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {mode === 'reject' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Insufficient savings balance, outstanding loan exists..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setMode('review')} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={isProcessing}>
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Reject Loan</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSoftDelete?: boolean;
}

function DeleteConfirmModal({ title, message, onConfirm, onCancel, isSoftDelete = false }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${isSoftDelete ? 'bg-orange-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isSoftDelete ? (
              <Archive className="w-8 h-8 text-orange-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-500">{message}</p>
          {isSoftDelete && (
            <p className="text-xs text-orange-600 mt-2 flex items-center justify-center">
              <Archive className="w-3 h-3 mr-1" />
              User will be archived and can be restored later
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 ${isSoftDelete ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white py-2 rounded-lg transition-colors`}
          >
            {isSoftDelete ? 'Archive User' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings Modal Component
interface SettingsModalProps {
  onClose: () => void;
  onSave: (settings: any) => void;
}

function SettingsModal({ onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage if they exist
    const savedSettings = localStorage.getItem('adminSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      siteName: 'FUND MATE',
      adminEmail: 'admin@hennessyclub.co.za',
      currency: 'ZAR',
      dateFormat: 'DD MMM YYYY',
      timezone: 'Africa/Johannesburg',
      notifications: {
        emailAlerts: true,
        paymentConfirmations: true,
        newUserRegistrations: true,
        monthlyReports: false
      },
      paymentSettings: {
        autoConfirmPayments: false,
        requireReference: true,
        defaultPaymentMethod: 'card'
      },
      retention: {
        softDeleteDays: 30,
        autoPurge: false
      }
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">General Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DD MMM YYYY">21 Jan 2026</option>
                  <option value="YYYY-MM-DD">2026-01-21</option>
                  <option value="MM/DD/YYYY">01/21/2026</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Africa/Johannesburg">Johannesburg</option>
                  <option value="Africa/Cairo">Cairo</option>
                  <option value="Africa/Lagos">Lagos</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Notifications</h3>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Email Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailAlerts}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, emailAlerts: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Payment Confirmations</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.paymentConfirmations}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, paymentConfirmations: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">New User Registrations</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.newUserRegistrations}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, newUserRegistrations: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Monthly Reports</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.monthlyReports}
                  onChange={(e) => setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, monthlyReports: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Payment Settings</h3>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Auto-confirm payments</span>
                <input
                  type="checkbox"
                  checked={settings.paymentSettings.autoConfirmPayments}
                  onChange={(e) => setSettings({
                    ...settings, 
                    paymentSettings: {...settings.paymentSettings, autoConfirmPayments: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Require payment reference</span>
                <input
                  type="checkbox"
                  checked={settings.paymentSettings.requireReference}
                  onChange={(e) => setSettings({
                    ...settings, 
                    paymentSettings: {...settings.paymentSettings, requireReference: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Method</label>
                <select
                  value={settings.paymentSettings.defaultPaymentMethod}
                  onChange={(e) => setSettings({
                    ...settings, 
                    paymentSettings: {...settings.paymentSettings, defaultPaymentMethod: e.target.value}
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="card">Card Payment</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Data Retention</h3>
            
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soft Delete Retention (days)</label>
                <input
                  type="number"
                  value={settings.retention.softDeleteDays}
                  onChange={(e) => setSettings({
                    ...settings, 
                    retention: {...settings.retention, softDeleteDays: parseInt(e.target.value)}
                  })}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Number of days to keep deleted users before permanent deletion</p>
              </div>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Auto-purge deleted users</span>
                <input
                  type="checkbox"
                  checked={settings.retention.autoPurge}
                  onChange={(e) => setSettings({
                    ...settings, 
                    retention: {...settings.retention, autoPurge: e.target.checked}
                  })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Report Modal Component
interface ReportModalProps {
  onClose: () => void;
  onGenerate: (reportType: string, dateRange: string, format: string) => Promise<void> | void;
}

function ReportModal({ onClose, onGenerate }: ReportModalProps) {
  const [reportType, setReportType] = useState('users');
  const [dateRange, setDateRange] = useState('month');
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const range = dateRange === 'custom' ? `custom:${customStart}:${customEnd}` : dateRange;
      await onGenerate(reportType, range, format);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Generate Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="users">User Report</option>
              <option value="contributions">Contributions Report</option>
              <option value="loans">Loans Report</option>
              <option value="stokvels">Stokvel Performance Report</option>
              <option value="payments">Payment History Report</option>
              <option value="financial">Financial Summary Report</option>
              <option value="deleted">Deleted Users Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">PDF</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">Excel</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">CSV</span>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 flex items-center">
              <Download className="w-3 h-3 mr-1" />
              Report will be generated and downloaded in {format.toUpperCase()} format.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Deleted Users Modal Component
interface DeletedUsersModalProps {
  onClose: () => void;
  deletedUsers: DeletedUser[];
  onRestore: (userId: number) => void;
  onPermanentDelete: (userId: number) => void;
}

function DeletedUsersModal({ onClose, deletedUsers, onRestore, onPermanentDelete }: DeletedUsersModalProps) {
  const [selectedUser, setSelectedUser] = useState<DeletedUser | null>(null);
  const [showConfirmPermanent, setShowConfirmPermanent] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Deleted Users Archive</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {deletedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Deleted Users</h3>
              <p className="text-gray-500">There are no deleted users in the archive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedUsers.map(user => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Deleted: {user.deletedAt} • Reason: {user.reason || 'Not specified'}
                      </p>
                      {/* Show stokvels the user was part of */}
                      {user.stokvels && user.stokvels.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600">Member of:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.stokvels.map((s, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {s.stokvelName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Show stokvels the user wanted to join */}
                      {user.joinRequests && user.joinRequests.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600">Requested to join:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.joinRequests.map((jr, i) => (
                              <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                                jr.status === 'approved' ? 'bg-green-100 text-green-700' :
                                jr.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {jr.stokvelName} ({jr.status})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onRestore(user.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowConfirmPermanent(true);
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Permanently</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Permanent Delete Confirmation */}
      {showConfirmPermanent && selectedUser && (
        <DeleteConfirmModal
          title="Permanently Delete User"
          message={`Are you sure you want to permanently delete ${selectedUser.name}? This action cannot be undone.`}
          onConfirm={() => {
            onPermanentDelete(selectedUser.id);
            setShowConfirmPermanent(false);
            setSelectedUser(null);
          }}
          onCancel={() => {
            setShowConfirmPermanent(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStokvel, setSelectedStokvel] = useState('all');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStokvelModal, setShowAddStokvelModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState<User | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<number | null>(null);
  const [showEditStokvelModal, setShowEditStokvelModal] = useState<Stokvel | null>(null);
  const [showDeleteStokvelConfirm, setShowDeleteStokvelConfirm] = useState<number | null>(null);
  const [showApproveUserModal, setShowApproveUserModal] = useState<User | null>(null);
  const [showConfirmContributionModal, setShowConfirmContributionModal] = useState<Contribution | null>(null);
  const [showLoanActionModal, setShowLoanActionModal] = useState<any>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeletedUsersModal, setShowDeletedUsersModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Data from backend
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [stokvels, setStokvels] = useState<Stokvel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [pendingLoanRequests, setPendingLoanRequests] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState<any>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [finesSummary, setFinesSummary] = useState<any>({ unpaidTotal: 0, paidTotal: 0, unpaidCount: 0, totalCount: 0 });
  const [fineTypes, setFineTypes] = useState<any[]>([]);
  const [showIssueFineModal, setShowIssueFineModal] = useState(false);

  // ── Load all data from backend ──
  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.listUsers({ limit: 100 }),
        adminApi.listStokvels(),
        adminApi.listContributions({ limit: 100 }),
        adminApi.listDeletedUsers(),
        adminApi.listJoinRequests(),
        adminApi.listLoans({ status: 'pending' }),
        adminApi.listFines(),
      ]);

      const statsRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const usersRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const stokvelsRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const contributionsRes = results[3].status === 'fulfilled' ? results[3].value : null;
      const deletedRes = results[4].status === 'fulfilled' ? results[4].value : null;
      const joinReqRes = results[5].status === 'fulfilled' ? results[5].value : null;
      const loansRes = results[6].status === 'fulfilled' ? results[6].value : null;
      const finesRes = results[7].status === 'fulfilled' ? results[7].value : null;

      if (statsRes) setApiStats(statsRes.data);

      if (finesRes) {
        setFines(finesRes.data.data || []);
        setFinesSummary(finesRes.data.summary || { unpaidTotal: 0, paidTotal: 0, unpaidCount: 0, totalCount: 0 });
        setFineTypes(finesRes.data.fineTypes || []);
      }

      if (usersRes) {
      setUsers(
        (usersRes.data.data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          status: u.status,
          joinedDate: new Date(u.joinedDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
          lastActive: u.lastActive
            ? new Date(u.lastActive).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Never',
          profiles: (u.stokvels || []).map((s: any) => ({
            id: `p-${u.id}-${s.stokvelId}`,
            stokvelId: s.stokvelId,
            stokvelName: s.stokvelName,
            role: s.role || 'member',
            targetAmount: 0,
            savedAmount: 0,
            joinedDate: '',
          })),
        }))
      );
      }

      if (stokvelsRes) {
      setStokvels(
        (stokvelsRes.data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          description: s.description || '',
          targetAmount: s.targetAmount,
          maxMembers: s.maxMembers,
          currentMembers: s.currentMembers,
          interestRate: s.interestRate,
          cycle: s.cycle,
          meetingDay: s.meetingDay,
          nextPayout: s.nextPayout
            ? new Date(s.nextPayout).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
          status: s.status,
          icon: s.icon || '💰',
          color: s.color || 'primary',
          createdAt: new Date(s.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
          createdBy: s.createdBy || 'Admin',
        }))
      );
      }

      if (contributionsRes) {
      setContributions(
        (contributionsRes.data.data || []).map((c: any) => ({
          id: c.id,
          userId: c.userId,
          userName: c.userName,
          userInitials: c.userInitials || c.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          stokvelId: c.stokvelId || 0,
          stokvelName: c.stokvelName,
          amount: c.amount,
          date: new Date(c.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: c.status,
          confirmedBy: c.confirmedBy,
          confirmedAt: c.confirmedAt
            ? new Date(c.confirmedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : undefined,
          paymentMethod: c.paymentMethod,
          reference: c.reference,
        }))
      );
      }

      if (deletedRes) {
      setDeletedUsers(
        (deletedRes.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone,
          deletedAt: d.deletedAt
            ? new Date(d.deletedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
            : '',
          deletedBy: d.deletedBy || 'Admin',
          reason: d.reason,
          joinRequests: d.joinRequests || [],
          stokvels: d.stokvels || [],
          originalData: d,
        }))
      );
      }

      if (joinReqRes) setJoinRequests(joinReqRes.data || []);
      if (loansRes) setPendingLoanRequests(loansRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = apiStats
    ? {
        totalUsers: apiStats.totalMembers + (apiStats.pendingApprovals || 0),
        activeUsers: apiStats.totalMembers,
        pendingUsers: apiStats.pendingApprovals,
        deletedUsers: apiStats.deletedUsers || 0,
        totalStokvels: apiStats.totalStokvels,
        activeStokvels: apiStats.totalStokvels,
        upcomingStokvels: 0,
        totalContributions: apiStats.totalContributions,
        totalSaved: apiStats.totalSaved || 0,
        pendingContributions: apiStats.pendingContributionCount,
        pendingAmount: apiStats.pendingContributionAmount,
      }
    : {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        pendingUsers: users.filter(u => u.status === 'pending').length,
        deletedUsers: deletedUsers.length,
        totalStokvels: stokvels.length,
        activeStokvels: stokvels.filter(s => s.status === 'active').length,
        upcomingStokvels: stokvels.filter(s => s.status === 'upcoming').length,
        totalContributions: contributions.reduce((sum, c) => sum + c.amount, 0),
        totalSaved: 0,
        pendingContributions: contributions.filter(c => c.status === 'pending').length,
        pendingAmount: contributions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
      };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesStokvel = selectedStokvel === 'all' || 
                          user.profiles.some(p => p.stokvelId === parseInt(selectedStokvel));
    return matchesSearch && matchesStokvel;
  });

  const pendingUsers = users.filter(u => u.status === 'pending');
  const pendingContributions = contributions.filter(c => c.status === 'pending');

  const showSuccess = (msg: string) => {
    setShowErrorMessage('');  // Clear any existing error
    setShowSuccessMessage(msg);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const showError = (msg: string) => {
    setShowSuccessMessage('');  // Clear any existing success
    setShowErrorMessage(msg);
    setTimeout(() => setShowErrorMessage(''), 4000);
  };

  const handleAddUser = async (newUser: any) => {
    try {
      await adminApi.createUser({
        fullName: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        status: newUser.status,
        stokvelIds: newUser.profiles?.map((p: any) => p.stokvelId) || [],
      });
      setShowAddUserModal(false);
      showSuccess(`User ${newUser.name} created successfully!`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create user';
      showError(msg);
    }
  };

  const handleAddStokvel = async (newStokvel: any) => {
    try {
      await adminApi.createStokvel({
        name: newStokvel.name,
        type: newStokvel.type,
        description: newStokvel.description,
        targetAmount: newStokvel.targetAmount,
        maxMembers: newStokvel.maxMembers,
        interestRate: newStokvel.interestRate || 30,
        cycle: newStokvel.cycle,
        meetingDay: newStokvel.meetingDay,
        icon: newStokvel.icon,
        color: newStokvel.color,
      });
      setShowAddStokvelModal(false);
      showSuccess(`Stokvel ${newStokvel.name} created successfully!`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create stokvel';
      showError(msg);
    }
  };

  const handleEditUser = async (updatedUser: User) => {
    try {
      await adminApi.updateUser(updatedUser.id, {
        fullName: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        status: updatedUser.status,
        stokvelIds: updatedUser.profiles.map(p => p.stokvelId),
      });
      setShowEditUserModal(null);
      showSuccess(`User ${updatedUser.name} updated successfully!`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update user';
      showError(msg);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await adminApi.deleteUser(userId, 'User deleted by admin');
      setShowDeleteUserConfirm(null);
      showSuccess(`User ${user.name} has been archived. They can be restored from the archive.`);
      await fetchData();
    } catch (err: any) {
      setShowDeleteUserConfirm(null);
      const msg = err.response?.data?.error || 'Failed to delete user';
      showError(msg);
    }
  };

  const handleRestoreUser = async (userId: number) => {
    const deletedUser = deletedUsers.find(d => d.id === userId);
    if (!deletedUser) return;
    try {
      await adminApi.restoreUser(userId);
      showSuccess(`User ${deletedUser.name} has been restored.`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to restore user';
      showError(msg);
    }
  };

  const handlePermanentDelete = async (userId: number) => {
    const deletedUser = deletedUsers.find(d => d.id === userId);
    if (!deletedUser) return;
    try {
      await adminApi.permanentDeleteUser(userId);
      showSuccess(`User ${deletedUser.name} has been permanently deleted.`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to permanently delete user';
      showError(msg);
    }
  };

  const handleApproveJoinRequest = async (requestId: number) => {
    try {
      await adminApi.approveJoinRequest(requestId);
      showSuccess('Join request approved! The user has been added to the stokvel.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to approve join request';
      showError(msg);
    }
  };

  const handleRejectJoinRequest = async (requestId: number) => {
    try {
      await adminApi.rejectJoinRequest(requestId);
      showSuccess('Join request has been rejected.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to reject join request';
      showError(msg);
    }
  };

  const handleIssueFine = async (data: { userId: number; fineType: string; reason?: string }) => {
    try {
      const res = await adminApi.issueFine(data);
      showSuccess(res.data.message || 'Fine issued successfully');
      setShowIssueFineModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to issue fine';
      showError(msg);
    }
  };

  const handleDeleteFine = async (fineId: number) => {
    try {
      await adminApi.deleteFine(fineId);
      showSuccess('Fine removed');
      fetchData();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to delete fine');
    }
  };

  const handleEditStokvel = async (updatedStokvel: Stokvel) => {
    try {
      await adminApi.updateStokvel(updatedStokvel.id, {
        name: updatedStokvel.name,
        type: updatedStokvel.type,
        description: updatedStokvel.description,
        targetAmount: updatedStokvel.targetAmount,
        maxMembers: updatedStokvel.maxMembers,
        cycle: updatedStokvel.cycle,
        meetingDay: updatedStokvel.meetingDay,
        status: updatedStokvel.status,
        icon: updatedStokvel.icon,
        color: updatedStokvel.color,
      });
      setShowEditStokvelModal(null);
      showSuccess(`Stokvel ${updatedStokvel.name} updated successfully!`);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update stokvel';
      showError(msg);
    }
  };

  const handleDeleteStokvel = async (stokvelId: number) => {
    const stokvel = stokvels.find(s => s.id === stokvelId);
    try {
      await adminApi.deleteStokvel(stokvelId);
      setShowDeleteStokvelConfirm(null);
      showSuccess(`Stokvel ${stokvel?.name} deleted successfully!`);
      await fetchData();
    } catch (err: any) {
      setShowDeleteStokvelConfirm(null);
      const msg = err.response?.data?.error || 'Failed to delete stokvel';
      showError(msg);
    }
  };

  const handleApproveUser = async (userId: number, selectedStokvels: number[]) => {
    try {
      await adminApi.approveUser(userId, selectedStokvels);
      setShowApproveUserModal(null);
      showSuccess(`User approved successfully!`);
      await fetchData();
    } catch (err: any) {
      setShowApproveUserModal(null);
      const msg = err.response?.data?.error || 'Failed to approve user';
      showError(msg);
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      await adminApi.rejectUser(userId);
      setShowApproveUserModal(null);
      showSuccess('User has been rejected and removed from pending.');
      await fetchData();
    } catch (err: any) {
      setShowApproveUserModal(null);
      const msg = err.response?.data?.error || 'Failed to reject user';
      showError(msg);
    }
  };

  const handleConfirmContribution = async (contributionId: number) => {
    try {
      await adminApi.confirmContribution(contributionId);
      setShowConfirmContributionModal(null);
      showSuccess(`Payment confirmed successfully!`);
      await fetchData();
    } catch (err: any) {
      setShowConfirmContributionModal(null);
      const msg = err.response?.data?.error || 'Failed to confirm payment';
      showError(msg);
    }
  };

  const handleConfirmContributionAdjusted = async (contributionId: number, adjustedAmount: number) => {
    try {
      await adminApi.confirmContributionAdjusted(contributionId, adjustedAmount);
      setShowConfirmContributionModal(null);
      showSuccess(`Payment confirmed with adjusted amount of R ${adjustedAmount.toLocaleString()}!`);
      await fetchData();
    } catch (err: any) {
      setShowConfirmContributionModal(null);
      const msg = err.response?.data?.error || 'Failed to confirm payment';
      showError(msg);
    }
  };

  const handleRejectContribution = async (contributionId: number, reason?: string) => {
    try {
      await adminApi.rejectContribution(contributionId, reason);
      setShowConfirmContributionModal(null);
      showSuccess('Payment rejected.');
      await fetchData();
    } catch (err: any) {
      setShowConfirmContributionModal(null);
      const msg = err.response?.data?.error || 'Failed to reject payment';
      showError(msg);
    }
  };

  const handleApproveLoan = async (loanId: number) => {
    try {
      await adminApi.approveLoan(loanId);
      setShowLoanActionModal(null);
      showSuccess('Loan approved successfully!');
      await fetchData();
    } catch (err: any) {
      setShowLoanActionModal(null);
      const msg = err.response?.data?.error || 'Failed to approve loan';
      showError(msg);
    }
  };

  const handleRejectLoan = async (loanId: number, reason: string) => {
    try {
      await adminApi.rejectLoan(loanId, reason);
      setShowLoanActionModal(null);
      showSuccess('Loan request rejected.');
      await fetchData();
    } catch (err: any) {
      setShowLoanActionModal(null);
      const msg = err.response?.data?.error || 'Failed to reject loan';
      showError(msg);
    }
  };

  const handleSaveSettings = async (settings: any) => {
    try {
      await adminApi.updateSiteSettings(settings);
      showSuccess('Settings saved successfully!');
    } catch {
      // Fallback to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      showSuccess('Settings saved locally!');
    }
  };

  const handleGenerateReport = async (reportType: string, dateRange: string, format: string) => {
    try {
      let resolvedRange: { start: string; end: string };
      if (dateRange.startsWith('custom:')) {
        const parts = dateRange.split(':');
        resolvedRange = { start: parts[1], end: parts[2] };
      } else {
        const dateRanges: Record<string, { start: string; end: string }> = {
          today: { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
          week: { start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
          month: { start: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
          quarter: { start: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
          year: { start: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
        };
        resolvedRange = dateRanges[dateRange];
      }

      const apiReportType = reportType === 'users' ? 'members' : reportType;
      const res = await adminApi.generateReport({
        reportType: apiReportType,
        dateRange: resolvedRange,
        format,
      });

      // For binary formats (PDF, Excel, CSV), the response is a blob
      const extensions: Record<string, string> = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' };
      const ext = extensions[format] || 'pdf';
      const filename = `${reportType}-report-${dateRange}.${ext}`;

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`${reportType} report downloaded as ${ext.toUpperCase()}!`);
    } catch (err: any) {
      // When responseType is 'blob', error response data is a Blob — try to parse it
      let msg = 'Failed to generate report. Please try again.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) msg = parsed.error;
        } catch { /* use default message */ }
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      showError(msg);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Inactive</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
      case 'upcoming':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Upcoming</span>;
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Confirmed</span>;
      case 'deleted':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Deleted</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {showSuccessMessage}
        </div>
      )}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {showErrorMessage}
        </div>
      )}

      <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-primary-200" />
              <div>
                <h1 className="text-2xl font-bold">FUND MATE</h1>
                <p className="text-sm text-primary-200">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowDeletedUsersModal(true)}
                className="p-2 hover:bg-primary-700 rounded-lg transition-colors relative"
                title="View Deleted Users"
              >
                <Archive className="w-5 h-5" />
                {deletedUsers.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                    {deletedUsers.length}
                  </span>
                )}
              </button>
              <span className="text-sm bg-primary-700 px-3 py-1 rounded-full">Admin</span>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <Link to="/" className="p-2 hover:bg-primary-700 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white shadow-sm border-b sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'users'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('stokvels')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'stokvels'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Stokvels
            </button>
            <button
              onClick={() => setActiveTab('contributions')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'contributions'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Contributions
            </button>
            <button
              onClick={() => setActiveTab('join-requests')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 relative ${
                activeTab === 'join-requests'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Join Requests
              {joinRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {joinRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('fines')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 relative ${
                activeTab === 'fines'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Fines
              {finesSummary.unpaidCount > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
                  {finesSummary.unpaidCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading admin data...</p>
            </div>
          </div>
        ) : activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <button
                onClick={() => setActiveTab('users')}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Users</p>
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600">{stats.activeUsers} active</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-yellow-600">{stats.pendingUsers} pending</span>
                </div>
              </button>

              <button
                onClick={() => setShowDeletedUsersModal(true)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Deleted Users</p>
                  <Archive className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.deletedUsers}</p>
                <p className="text-xs text-orange-600 hover:text-orange-700 mt-2">
                  View Archive →
                </p>
              </button>

              <button
                onClick={() => setActiveTab('stokvels')}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Stokvels</p>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalStokvels}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600">{stats.activeStokvels} active</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-blue-600">{stats.upcomingStokvels} upcoming</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('contributions')}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Contributions</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalContributions)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-yellow-600">{stats.pendingContributions} pending</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('contributions')}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Saved</p>
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalSaved)}</p>
                <p className="text-xs text-gray-500 mt-2">Across all stokvels</p>
              </button>
            </div>

            {/* Interest Pot Section */}
            {apiStats?.interestPot && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-sm border border-amber-200 p-6">
                <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 text-amber-600 mr-2" />
                  Interest Pot
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Earned</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(apiStats.interestPot.totalEarned)}</p>
                    <p className="text-xs text-gray-400 mt-1">{apiStats.interestPot.repaidLoans} repaid loan{apiStats.interestPot.repaidLoans !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Pending Interest</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(apiStats.interestPot.pendingInterest)}</p>
                    <p className="text-xs text-gray-400 mt-1">{apiStats.interestPot.activeLoansCount} active loan{apiStats.interestPot.activeLoansCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Interest (Earned + Pending)</p>
                    <p className="text-xl font-bold text-amber-700">{formatCurrency(apiStats.interestPot.totalEarned + apiStats.interestPot.pendingInterest)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Active Loans</p>
                    <p className="text-xl font-bold text-blue-600">{apiStats.activeLoans || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(apiStats.activeLoanAmount || 0)} total</p>
                  </div>
                </div>
              </div>
            )}

            {/* All Members Section */}
            {apiStats?.allMembers && apiStats.allMembers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="w-5 h-5 text-primary-600 mr-2" />
                  All Members — Savings Progress
                  <span className="ml-2 bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {apiStats.allMembers.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {apiStats.allMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">
                            {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.stokvelName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{member.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, member.progress)}%` }}></div>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="font-semibold text-gray-800">{formatCurrency(member.savedAmount)}</p>
                          <p className="text-xs text-gray-500">of {formatCurrency(member.targetAmount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Active Loans Section */}
            {apiStats?.allActiveLoans && apiStats.allActiveLoans.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 text-red-500 mr-2" />
                  All Loans (Active, Overdue & Pending)
                  <span className="ml-2 bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {apiStats.allActiveLoans.length}
                  </span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200">
                        <th className="pb-2 font-medium">Member</th>
                        <th className="pb-2 font-medium">Target</th>
                        <th className="pb-2 font-medium">Principal</th>
                        <th className="pb-2 font-medium">Interest</th>
                        <th className="pb-2 font-medium">Total</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {apiStats.allActiveLoans.map((loan: any) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <p className="font-medium text-gray-800">{loan.userName}</p>
                            <p className="text-xs text-gray-500">{loan.stokvelName}</p>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${loan.loanTarget === 'madala-side' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {loan.loanTarget === 'madala-side' ? 'Madala Side' : 'Collective Pot'}
                            </span>
                          </td>
                          <td className="py-3 font-medium">{formatCurrency(loan.amount)}</td>
                          <td className="py-3 text-orange-600">{formatCurrency(loan.interest)}</td>
                          <td className="py-3 font-bold text-primary-700">{formatCurrency(loan.totalRepayable)}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              loan.status === 'active' ? 'bg-green-100 text-green-700' :
                              loan.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">
                            {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pendingUsers.length > 0 && (
              <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Pending User Approvals ({pendingUsers.length})
                </h3>
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <div key={user.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center"><Mail className="w-3 h-3 mr-1" />{user.email}</span>
                            <span>•</span>
                            <span className="flex items-center"><Phone className="w-3 h-3 mr-1" />{user.phone}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Registered: {user.joinedDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowApproveUserModal(user)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Review & Approve
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingContributions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-orange-500 mr-2" />
                  Pending Contribution Confirmations
                </h3>
                <div className="space-y-3">
                  {pendingContributions.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">{c.userInitials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{c.userName}</p>
                          <p className="text-sm text-gray-500">
                            {c.stokvelName} • {formatCurrency(c.amount)} • {c.date} • {c.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowConfirmContributionModal(c)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Review Payment
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingLoanRequests.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 text-blue-500 mr-2" />
                  Pending Loan Requests
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingLoanRequests.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {pendingLoanRequests.map((loan: any) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{loan.userName}</p>
                          <p className="text-sm text-gray-500">
                            {loan.stokvelName} • R {Number(loan.amount).toLocaleString()} • {new Date(loan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowLoanActionModal(loan)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Review Loan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 transition-colors text-left"
              >
                <UserPlus className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-800">Add New User</h3>
                <p className="text-sm text-gray-500 mt-1">Create a new member account</p>
              </button>
              
              <button
                onClick={() => setShowAddStokvelModal(true)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 transition-colors text-left"
              >
                <PlusCircle className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-800">Create Stokvel</h3>
                <p className="text-sm text-gray-500 mt-1">Start a new savings group</p>
              </button>
              
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 transition-colors text-left"
              >
                <Download className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-800">Generate Report</h3>
                <p className="text-sm text-gray-500 mt-1">Export transaction data</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Add User</span>
                  </button>
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={selectedStokvel}
                  onChange={(e) => setSelectedStokvel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Stokvels</option>
                  {stokvels.filter(s => s.status === 'active').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stokvels</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {user.profiles.map(profile => (
                              <span key={profile.id} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full inline-block w-fit">
                                {profile.stokvelName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.joinedDate}</td>
                        <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.lastActive}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setShowEditUserModal(user)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.email !== 'admin@stokvel.co.za' && (
                          <button
                            onClick={() => setShowDeleteUserConfirm(user.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          )}
                          <button
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                          >
                            {expandedUser === user.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stokvels' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Stokvel Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddStokvelModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>New Stokvel</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Export</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stokvels.map(stokvel => (
                  <div key={stokvel.id} className={`border rounded-lg p-4 ${
                    stokvel.status === 'active' ? 'border-green-200 bg-green-50' :
                    stokvel.status === 'upcoming' ? 'border-blue-200 bg-blue-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{stokvel.icon}</span>
                        <h4 className="font-semibold text-gray-800">{stokvel.name}</h4>
                      </div>
                      {getStatusBadge(stokvel.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{stokvel.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Members:</span>
                        <span className="font-medium">{stokvel.currentMembers}/{stokvel.maxMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Target:</span>
                        <span className="font-medium">R {stokvel.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cycle:</span>
                        <span className="font-medium capitalize">{stokvel.cycle} {stokvel.meetingDay ? `(${stokvel.meetingDay})` : ''}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setShowEditStokvelModal(stokvel)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteStokvelConfirm(stokvel.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        disabled={stokvel.currentMembers > 0}
                        title={stokvel.currentMembers > 0 ? "Cannot delete stokvel with members" : ""}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">All Contributions</h3>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Export</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Member</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stokvel</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contributions.map(c => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-700">{c.userInitials}</span>
                            </div>
                            <span>{c.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.stokvelName}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(c.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.date}</td>
                        <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{c.paymentMethod}</td>
                        <td className="px-4 py-3">
                          {c.status === 'pending' && (
                            <button
                              onClick={() => setShowConfirmContributionModal(c)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {c.status === 'confirmed' && (
                            <span className="text-xs text-gray-400">Confirmed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'join-requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Pending Join Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Users who requested to join a stokvel during registration or from their dashboard</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Export</span>
                </button>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {joinRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No pending requests</h3>
                <p className="text-sm text-gray-400 mt-1">All join requests have been processed</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stokvel Requested</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {joinRequests.map((req: any) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                {req.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{req.userName}</p>
                                <p className="text-sm text-gray-500">{req.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                              <Target className="w-3.5 h-3.5" />
                              {req.stokvelName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveJoinRequest(req.id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                <UserCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectJoinRequest(req.id)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fines' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Fines Management</h2>
                <p className="text-sm text-gray-500 mt-1">Issue and manage member fines</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowIssueFineModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Issue Fine
                </button>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Fine Types Reference */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {fineTypes.map((ft: any) => (
                <div key={ft.value} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-sm font-medium text-gray-700">{ft.label}</p>
                  <p className="text-xl font-bold text-red-600 mt-1">R {ft.amount}</p>
                </div>
              ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">Unpaid Fines</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(finesSummary.unpaidTotal)}</p>
                <p className="text-xs text-red-500">{finesSummary.unpaidCount} outstanding</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-600">Paid Fines</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(finesSummary.paidTotal)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600">Total Fines Issued</p>
                <p className="text-2xl font-bold text-gray-700">{finesSummary.totalCount}</p>
              </div>
            </div>

            {/* Fines Table */}
            {fines.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No fines issued yet</h3>
                <p className="text-sm text-gray-400 mt-1">Click "Issue Fine" to fine a member</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fines.map((fine: any) => (
                        <tr key={fine.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-xs">
                                {fine.userName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{fine.userName}</p>
                                <p className="text-xs text-gray-500">{fine.stokvelName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              {fine.fineLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">R {fine.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              fine.status === 'paid' ? 'bg-green-100 text-green-700' : fine.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {fine.status === 'paid' ? 'Paid' : fine.status === 'pending' ? 'Cash Pending' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {fine.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await adminApi.confirmFine(fine.id);
                                    showSuccess('Fine payment confirmed');
                                    fetchData();
                                  } catch { showError('Failed to confirm'); }
                                }}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                Confirm
                              </button>
                            )}
                            {fine.status !== 'paid' && (
                              <button
                                onClick={() => handleDeleteFine(fine.id)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Issue Fine Modal */}
      {showIssueFineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Issue a Fine</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              handleIssueFine({
                userId: Number(formData.get('userId')),
                fineType: formData.get('fineType') as string,
                reason: (formData.get('reason') as string) || undefined,
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
                <select name="userId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select a member</option>
                  {users.filter(u => u.status === 'active').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fine Type *</label>
                <select name="fineType" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Select fine type</option>
                  {fineTypes.map((ft: any) => (
                    <option key={ft.value} value={ft.value}>{ft.label} — R{ft.amount}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea name="reason" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Missed Sunday meeting..." />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowIssueFineModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">Issue Fine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={handleAddUser}
          stokvels={stokvels}
        />
      )}

      {showAddStokvelModal && (
        <AddStokvelModal
          onClose={() => setShowAddStokvelModal(false)}
          onAdd={handleAddStokvel}
        />
      )}

      {showEditUserModal && (
        <EditUserModal
          user={showEditUserModal}
          onClose={() => setShowEditUserModal(null)}
          onSave={handleEditUser}
          stokvels={stokvels}
        />
      )}

      {showDeleteUserConfirm && (
        <DeleteConfirmModal
          title="Delete User"
          message="Are you sure you want to delete this user? They will be moved to the archive and can be restored later."
          onConfirm={() => handleDeleteUser(showDeleteUserConfirm)}
          onCancel={() => setShowDeleteUserConfirm(null)}
          isSoftDelete={true}
        />
      )}

      {showEditStokvelModal && (
        <EditStokvelModal
          stokvel={showEditStokvelModal}
          onClose={() => setShowEditStokvelModal(null)}
          onSave={handleEditStokvel}
        />
      )}

      {showDeleteStokvelConfirm && (
        <DeleteConfirmModal
          title="Delete Stokvel"
          message="Are you sure you want to delete this stokvel? This action cannot be undone."
          onConfirm={() => handleDeleteStokvel(showDeleteStokvelConfirm)}
          onCancel={() => setShowDeleteStokvelConfirm(null)}
        />
      )}

      {showApproveUserModal && (
        <ApproveUserModal
          user={showApproveUserModal}
          onClose={() => setShowApproveUserModal(null)}
          onApprove={handleApproveUser}
          onReject={handleRejectUser}
          stokvels={stokvels}
        />
      )}

      {showConfirmContributionModal && (
        <ConfirmContributionModal
          contribution={showConfirmContributionModal}
          onClose={() => setShowConfirmContributionModal(null)}
          onConfirm={handleConfirmContribution}
          onConfirmAdjusted={handleConfirmContributionAdjusted}
          onReject={handleRejectContribution}
        />
      )}

      {showLoanActionModal && (
        <LoanActionModal
          loan={showLoanActionModal}
          onClose={() => setShowLoanActionModal(null)}
          onApprove={handleApproveLoan}
          onReject={handleRejectLoan}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}

      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onGenerate={handleGenerateReport}
        />
      )}

      {showDeletedUsersModal && (
        <DeletedUsersModal
          onClose={() => setShowDeletedUsersModal(false)}
          deletedUsers={deletedUsers}
          onRestore={handleRestoreUser}
          onPermanentDelete={handlePermanentDelete}
        />
      )}
    </div>
  );
}