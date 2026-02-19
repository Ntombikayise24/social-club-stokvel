import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Tag,
  Users as UsersIcon
} from 'lucide-react';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  joinedDate: string;
  lastActive?: string;
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
  status: 'confirmed' | 'pending';
  confirmedBy?: string;
  confirmedAt?: string;
  paymentMethod: string;
  reference?: string;
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
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

          {/* Stokvel Assignment */}
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Stokvel Details</h3>
            
            {/* Name and Icon */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stokvel Name *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the purpose of this Stokvel..."
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stokvel Type
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
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

          {/* Financial Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Financial Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount (R) *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Members *
                </label>
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

          {/* Cycle Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Cycle Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contribution Cycle
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Day
                </label>
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

          {/* Preview Section */}
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Stokvel</span>
            </button>
          </div>
        </form>
      </div>
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
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  // Mock Stokvels Data
  const [stokvels, setStokvels] = useState<Stokvel[]>([
    {
      id: 1,
      name: 'COLLECTIVE POT',
      type: 'traditional',
      description: 'Traditional Stokvel saving for festive season celebrations',
      targetAmount: 7000,
      maxMembers: 18,
      currentMembers: 15,
      interestRate: 30,
      cycle: 'weekly',
      meetingDay: 'Sunday',
      nextPayout: '06 Dec 2026',
      status: 'active',
      icon: '🌱',
      color: 'primary',
      createdAt: '01 Jan 2026',
      createdBy: 'Admin'
    },
    {
      id: 2,
      name: 'SUMMER SAVERS',
      type: 'flexible',
      description: 'Save for summer holidays and beach trips',
      targetAmount: 5000,
      maxMembers: 15,
      currentMembers: 8,
      interestRate: 30,
      cycle: 'monthly',
      meetingDay: 'Friday',
      nextPayout: '31 Dec 2026',
      status: 'active',
      icon: '💰',
      color: 'secondary',
      createdAt: '05 Feb 2026',
      createdBy: 'Admin'
    },
    {
      id: 3,
      name: 'WINTER WARMTH',
      type: 'traditional',
      description: 'Upcoming Stokvel - Save for winter essentials',
      targetAmount: 3000,
      maxMembers: 12,
      currentMembers: 0,
      interestRate: 30,
      cycle: 'weekly',
      meetingDay: 'Monday',
      nextPayout: '01 Jun 2027',
      status: 'upcoming',
      icon: '❄️',
      color: 'blue',
      createdAt: '10 Feb 2026',
      createdBy: 'Admin'
    }
  ]);

  // Mock Users Data
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Nkulumo Nkuna',
      email: 'nkulumo.nkuna@email.com',
      phone: '082 123 4567',
      status: 'active',
      joinedDate: '21 Jan 2026',
      lastActive: 'Today',
      profiles: [
        {
          id: 'p1',
          stokvelId: 1,
          stokvelName: 'COLLECTIVE POT',
          role: 'member',
          targetAmount: 7000,
          savedAmount: 1070,
          joinedDate: '21 Jan 2026'
        },
        {
          id: 'p2',
          stokvelId: 2,
          stokvelName: 'SUMMER SAVERS',
          role: 'member',
          targetAmount: 5000,
          savedAmount: 850,
          joinedDate: '05 Feb 2026'
        }
      ]
    },
    {
      id: 2,
      name: 'Thabo Mbeki',
      email: 'thabo.mbeki@email.com',
      phone: '083 456 7890',
      status: 'active',
      joinedDate: '15 Jan 2026',
      lastActive: 'Yesterday',
      profiles: [
        {
          id: 'p3',
          stokvelId: 1,
          stokvelName: 'COLLECTIVE POT',
          role: 'member',
          targetAmount: 7000,
          savedAmount: 2000,
          joinedDate: '15 Jan 2026'
        }
      ]
    },
    {
      id: 3,
      name: 'Sarah Jones',
      email: 'sarah.jones@email.com',
      phone: '084 567 8901',
      status: 'active',
      joinedDate: '10 Jan 2026',
      lastActive: '2 days ago',
      profiles: [
        {
          id: 'p4',
          stokvelId: 1,
          stokvelName: 'COLLECTIVE POT',
          role: 'member',
          targetAmount: 7000,
          savedAmount: 850,
          joinedDate: '10 Jan 2026'
        }
      ]
    },
    {
      id: 4,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '085 678 9012',
      status: 'inactive',
      joinedDate: '05 Jan 2026',
      lastActive: '2 weeks ago',
      profiles: [
        {
          id: 'p5',
          stokvelId: 1,
          stokvelName: 'COLLECTIVE POT',
          role: 'member',
          targetAmount: 7000,
          savedAmount: 2000,
          joinedDate: '05 Jan 2026'
        }
      ]
    },
    {
      id: 5,
      name: 'Mary Johnson',
      email: 'mary.johnson@email.com',
      phone: '086 789 0123',
      status: 'pending',
      joinedDate: '18 Feb 2026',
      lastActive: 'Never',
      profiles: []
    },
    {
      id: 6,
      name: 'Peter Williams',
      email: 'peter.williams@email.com',
      phone: '087 890 1234',
      status: 'pending',
      joinedDate: '19 Feb 2026',
      lastActive: 'Never',
      profiles: []
    }
  ]);

  // Mock Contributions Data
  const [contributions] = useState<Contribution[]>([
    {
      id: 1,
      userId: 1,
      userName: 'Nkulumo Nkuna',
      userInitials: 'NN',
      stokvelId: 1,
      stokvelName: 'COLLECTIVE POT',
      amount: 200,
      date: '04 Feb 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '04 Feb 2026 14:30',
      paymentMethod: 'card',
      reference: 'TRX-001'
    },
    {
      id: 2,
      userId: 2,
      userName: 'Thabo Mbeki',
      userInitials: 'TM',
      stokvelId: 1,
      stokvelName: 'COLLECTIVE POT',
      amount: 350,
      date: '22 Jan 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '22 Jan 2026 09:15',
      paymentMethod: 'bank',
      reference: 'TRX-002'
    },
    {
      id: 3,
      userId: 3,
      userName: 'Sarah Jones',
      userInitials: 'SJ',
      stokvelId: 1,
      stokvelName: 'COLLECTIVE POT',
      amount: 250,
      date: '22 Jan 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '22 Jan 2026 10:45',
      paymentMethod: 'cash',
      reference: 'TRX-003'
    },
    {
      id: 4,
      userId: 1,
      userName: 'Nkulumo Nkuna',
      userInitials: 'NN',
      stokvelId: 2,
      stokvelName: 'SUMMER SAVERS',
      amount: 500,
      date: '10 Feb 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '10 Feb 2026 11:20',
      paymentMethod: 'card',
      reference: 'TRX-004'
    },
    {
      id: 5,
      userId: 5,
      userName: 'Mary Johnson',
      userInitials: 'MJ',
      stokvelId: 2,
      stokvelName: 'SUMMER SAVERS',
      amount: 1200,
      date: '05 Feb 2026',
      status: 'pending',
      paymentMethod: 'cash',
      reference: 'TRX-005'
    },
    {
      id: 6,
      userId: 6,
      userName: 'Peter Williams',
      userInitials: 'PW',
      stokvelId: 2,
      stokvelName: 'SUMMER SAVERS',
      amount: 500,
      date: '06 Feb 2026',
      status: 'pending',
      paymentMethod: 'card',
      reference: 'TRX-006'
    }
  ]);

  // Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    totalStokvels: stokvels.length,
    activeStokvels: stokvels.filter(s => s.status === 'active').length,
    upcomingStokvels: stokvels.filter(s => s.status === 'upcoming').length,
    totalContributions: contributions.reduce((sum, c) => sum + c.amount, 0),
    pendingContributions: contributions.filter(c => c.status === 'pending').length,
    pendingAmount: contributions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  };

  // Filter users
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

  const handleConfirmContribution = (contributionId: number) => {
    alert(`Contribution ${contributionId} confirmed! (Demo)`);
  };

  const handleAddUser = (newUser: any) => {
    setUsers([...users, newUser]);
    setShowAddUserModal(false);
    setShowSuccessMessage(`User ${newUser.name} created successfully!`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleAddStokvel = (newStokvel: any) => {
    setStokvels([...stokvels, newStokvel]);
    setShowAddStokvelModal(false);
    setShowSuccessMessage(`Stokvel ${newStokvel.name} created successfully!`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-primary-800 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-primary-200" />
              <div>
                <h1 className="text-2xl font-bold">HENNESSY SOCIAL CLUB</h1>
                <p className="text-sm text-primary-200">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-primary-700 px-3 py-1 rounded-full">
                Admin
              </span>
              <button className="p-2 hover:bg-primary-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <Link
                to="/"
                className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
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
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Contributions</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalContributions)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-yellow-600">{stats.pendingContributions} pending</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Saved</p>
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalContributions)}</p>
                <p className="text-xs text-gray-500 mt-2">Across all stokvels</p>
              </div>
            </div>

            {/* Pending Approvals Section */}
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
                        <button
                          onClick={() => alert(`Approve user: ${user.name} - This will open approval modal`)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Review & Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Contributions */}
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
                        onClick={() => handleConfirmContribution(c.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
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
                onClick={() => alert('Generate Report functionality - Coming soon!')}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 transition-colors text-left"
              >
                <Download className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-800">Generate Report</h3>
                <p className="text-sm text-gray-500 mt-1">Export transaction data</p>
              </button>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Users Header */}
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
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
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

            {/* Users Table */}
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
                    {filteredUsers.filter(u => u.status !== 'pending').map((user) => (
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
                            onClick={() => alert(`Edit user: ${user.name}`)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert(`Delete user: ${user.name}`)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

        {/* STOKVELS TAB */}
        {activeTab === 'stokvels' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Stokvel Management</h3>
                <button
                  onClick={() => setShowAddStokvelModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>New Stokvel</span>
                </button>
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTRIBUTIONS TAB */}
        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Contributions</h3>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contributions.map(c => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-sm">{c.userName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.stokvelName}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(c.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.date}</td>
                        <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{c.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onAdd={handleAddUser}
          stokvels={stokvels}
        />
      )}

      {/* Add Stokvel Modal */}
      {showAddStokvelModal && (
        <AddStokvelModal
          onClose={() => setShowAddStokvelModal(false)}
          onAdd={handleAddStokvel}
        />
      )}
    </div>
  );
}