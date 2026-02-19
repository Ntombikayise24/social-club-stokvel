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
  Phone
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStokvel, setSelectedStokvel] = useState('all');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Mock Stokvels Data - CONSISTENT with our two main stokvels
  const [stokvels] = useState<Stokvel[]>([
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

  // Mock Users Data - CONSISTENT with our member pages
  const [users] = useState<User[]>([
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

  // Mock Contributions Data - CONSISTENT with member pages
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
                to="/"  // ✅ Now goes to Landing Page
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
                          onClick={() => alert(`Approve user: ${user.name}`)}
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
                onClick={() => alert('Add User functionality')}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 transition-colors text-left"
              >
                <UserPlus className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-800">Add New User</h3>
                <p className="text-sm text-gray-500 mt-1">Create a new member account</p>
              </button>
              
              <button
                onClick={() => alert('Create Stokvel functionality')}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 transition-colors text-left"
              >
                <PlusCircle className="w-8 h-8 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-800">Create Stokvel</h3>
                <p className="text-sm text-gray-500 mt-1">Start a new savings group</p>
              </button>
              
              <button
                onClick={() => alert('Generate Report functionality')}
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
                    onClick={() => alert('Add User functionality')}
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
                  onClick={() => alert('Create new stokvel')}
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
    </div>
  );
}