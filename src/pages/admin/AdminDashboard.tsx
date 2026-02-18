import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Settings,
  LogOut,
  Edit2,
  Trash2,
  X,
  Search,
  UserPlus,
  Shield,
  PlusCircle,
  ChevronDown,
  ChevronUp,
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
  groups: number[]; // Array of group IDs
}

interface Group {
  id: number;
  name: string;
  type: 'traditional' | 'flexible';
  description: string;
  targetAmount: number;
  maxMembers: number;
  currentMembers: number;
  interestRate: number;
  cycle: 'weekly' | 'monthly' | 'quarterly';
  nextPayout: string;
  status: 'active' | 'inactive';
  icon: string;
  color: string;
  createdAt: string;
}

interface Contribution {
  id: number;
  userId: number;
  userName: string;
  groupId: number;
  groupName: string;
  amount: number;
  date: string;
  status: 'confirmed' | 'pending';
  confirmedBy?: string;
  confirmedAt?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState<any>(null);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Mock Users Data with pending users and group assignments
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Nkulumo Nkuna',
      email: 'nkulumo@email.com',
      phone: '082 123 4567',
      status: 'active',
      joinedDate: '21 Jan 2026',
      lastActive: 'Today',
      groups: [1] // COLLECTIVE POT
    },
    {
      id: 2,
      name: 'Thabo Mbeki',
      email: 'thabo@email.com',
      phone: '083 456 7890',
      status: 'active',
      joinedDate: '15 Jan 2026',
      lastActive: 'Yesterday',
      groups: [1, 2] // Both groups
    },
    {
      id: 3,
      name: 'Sarah Jones',
      email: 'sarah@email.com',
      phone: '084 567 8901',
      status: 'active',
      joinedDate: '10 Jan 2026',
      lastActive: '2 days ago',
      groups: [2] // HENNESSY
    },
    {
      id: 4,
      name: 'John Doe',
      email: 'john@email.com',
      phone: '085 678 9012',
      status: 'inactive',
      joinedDate: '05 Jan 2026',
      lastActive: '2 weeks ago',
      groups: [1]
    },
    {
      id: 5,
      name: 'Mary Johnson',
      email: 'mary@email.com',
      phone: '086 789 0123',
      status: 'pending',
      joinedDate: '01 Jan 2026',
      lastActive: 'Never',
      groups: []
    },
    {
      id: 6,
      name: 'Peter Williams',
      email: 'peter@email.com',
      phone: '087 890 1234',
      status: 'pending',
      joinedDate: 'Today',
      lastActive: 'Never',
      groups: []
    }
  ]);

  // Mock Groups Data - Now with more fields and scalable
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 1,
      name: 'COLLECTIVE POT',
      type: 'traditional',
      description: 'Traditional Stokvel with fixed members and target',
      targetAmount: 7000,
      maxMembers: 18,
      currentMembers: 15,
      interestRate: 30,
      cycle: 'weekly',
      nextPayout: '06 Dec 2026',
      status: 'active',
      icon: '🌱',
      color: 'primary',
      createdAt: '01 Jan 2026'
    },
    {
      id: 2,
      name: 'HENNESSY SOCIAL CLUB',
      type: 'flexible',
      description: 'Flexible Stokvel with personal targets',
      targetAmount: 15000,
      maxMembers: 50,
      currentMembers: 8,
      interestRate: 30,
      cycle: 'monthly',
      nextPayout: '31 Dec 2026',
      status: 'active',
      icon: '🥃',
      color: 'secondary',
      createdAt: '15 Jan 2026'
    },
    {
      id: 3,
      name: 'WINTER WARMTH SAVERS',
      type: 'traditional',
      description: 'Save for winter clothes and blankets',
      targetAmount: 5000,
      maxMembers: 15,
      currentMembers: 0,
      interestRate: 30,
      cycle: 'weekly',
      nextPayout: '01 Jun 2026',
      status: 'inactive',
      icon: '❄️',
      color: 'blue',
      createdAt: 'Not started'
    }
  ]);

  // Mock Contributions Data
  const [contributions, setContributions] = useState<Contribution[]>([
    {
      id: 1,
      userId: 1,
      userName: 'Nkulumo Nkuna',
      groupId: 1,
      groupName: 'COLLECTIVE POT',
      amount: 200,
      date: '04 Feb 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '04 Feb 2026 14:30'
    },
    {
      id: 2,
      userId: 2,
      userName: 'Thabo Mbeki',
      groupId: 1,
      groupName: 'COLLECTIVE POT',
      amount: 350,
      date: '22 Jan 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '22 Jan 2026 09:15'
    },
    {
      id: 3,
      userId: 3,
      userName: 'Sarah Jones',
      groupId: 2,
      groupName: 'HENNESSY SOCIAL CLUB',
      amount: 250,
      date: '22 Jan 2026',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '22 Jan 2026 10:45'
    },
    {
      id: 4,
      userId: 4,
      userName: 'John Doe',
      groupId: 1,
      groupName: 'COLLECTIVE POT',
      amount: 2000,
      date: '12 Jan 2025',
      status: 'confirmed',
      confirmedBy: 'Admin',
      confirmedAt: '12 Jan 2025 16:20'
    },
    {
      id: 5,
      userId: 5,
      userName: 'Mary Johnson',
      groupId: 2,
      groupName: 'HENNESSY SOCIAL CLUB',
      amount: 1200,
      date: '05 Jan 2025',
      status: 'pending',
      confirmedBy: undefined,
      confirmedAt: undefined
    }
  ]);

  // Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    totalGroups: groups.length,
    activeGroups: groups.filter(g => g.status === 'active').length,
    totalContributions: contributions.reduce((sum, c) => sum + c.amount, 0),
    pendingContributions: contributions.filter(c => c.status === 'pending').length,
    pendingAmount: contributions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesGroup = selectedGroup === 'all' || 
                        (selectedGroup === 'pending' ? user.status === 'pending' : 
                        user.groups.includes(parseInt(selectedGroup)));
    return matchesSearch && matchesGroup;
  });

  const pendingUsers = users.filter(u => u.status === 'pending');

  const handleApproveUser = (userId: number, selectedGroups: number[]) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: 'active', groups: selectedGroups, joinedDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) }
        : u
    ));
  };

  const handleRejectUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setShowDeleteConfirm(null);
  };

  const confirmContribution = (contributionId: number) => {
    setContributions(prev =>
      prev.map(c =>
        c.id === contributionId
          ? {
              ...c,
              status: 'confirmed',
              confirmedBy: 'Admin',
              confirmedAt: new Date().toLocaleString('en-ZA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          : c
      )
    );
  };

  const handleAddGroup = (newGroup: any) => {
    setGroups([...groups, { 
      ...newGroup, 
      id: groups.length + 1, 
      currentMembers: 0, 
      createdAt: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
    }]);
    setShowAddGroupModal(false);
  };

  const handleEditGroup = (updatedGroup: any) => {
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    setShowEditGroupModal(null);
  };

  const handleDeleteGroup = (groupId: number) => {
    setGroups(groups.filter(g => g.id !== groupId));
    setShowDeleteGroupConfirm(null);
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
                <h1 className="text-2xl font-bold">SOCIAL CLUB</h1>
                <p className="text-sm text-primary-200">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-primary-700 px-3 py-1 rounded-full">
                Super Admin
              </span>
              <button className="p-2 hover:bg-primary-700 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <Link
                to="/dashboard"
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
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'groups'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Groups
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
                  <p className="text-sm text-gray-500">Total Groups</p>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.totalGroups}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600">{stats.activeGroups} active</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Contributions</p>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats.totalContributions)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-yellow-600">{formatCurrency(stats.pendingAmount)} pending</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Pending Approvals</p>
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingUsers}</p>
                <p className="text-xs text-gray-500 mt-2">Users awaiting group assignment</p>
              </div>
            </div>

            {/* Pending Approvals Section */}
            {pendingUsers.length > 0 && (
              <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Pending Approvals ({pendingUsers.length})
                </h3>
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <PendingUserCard
                      key={user.id}
                      user={user}
                      groups={groups.filter(g => g.status === 'active')}
                      onApprove={handleApproveUser}
                      onReject={handleRejectUser}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Contributions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-orange-500 mr-2" />
                  Pending Confirmations
                </h3>
                <div className="space-y-3">
                  {contributions.filter(c => c.status === 'pending').length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending confirmations</p>
                  ) : (
                    contributions.filter(c => c.status === 'pending').map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{c.userName}</p>
                          <p className="text-sm text-gray-500">{c.groupName} • {formatCurrency(c.amount)} • {c.date}</p>
                        </div>
                        <button
                          onClick={() => confirmContribution(c.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {contributions.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {item.userName} - {item.groupName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.amount)} • {item.date}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add New User</span>
                </button>
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
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Users</option>
                  <option value="pending">Pending Approval</option>
                  {groups.filter(g => g.status === 'active').map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pending Users Section (in Users tab) */}
            {selectedGroup === 'pending' && pendingUsers.length > 0 && (
              <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
                <h3 className="font-semibold text-yellow-800 mb-4">Pending Approvals</h3>
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <PendingUserCard
                      key={user.id}
                      user={user}
                      groups={groups.filter(g => g.status === 'active')}
                      onApprove={handleApproveUser}
                      onReject={handleRejectUser}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groups</th>
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
                          <div className="flex flex-wrap gap-1">
                            {user.groups.map(groupId => {
                              const group = groups.find(g => g.id === groupId);
                              return group ? (
                                <span key={groupId} className={`px-2 py-1 text-xs rounded-full bg-${group.color}-100 text-${group.color}-800`}>
                                  {group.name}
                                </span>
                              ) : null;
                            })}
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
                          <button
                            onClick={() => setShowDeleteConfirm(user.id)}
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

        {/* CONTRIBUTIONS TAB */}
        {activeTab === 'contributions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Contributions</h3>
              <div className="space-y-3">
                {contributions.filter(c => c.status === 'pending').length === 0 ? (
                  <p className="text-gray-500">No pending contributions</p>
                ) : (
                  contributions.filter(c => c.status === 'pending').map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{c.userName}</p>
                        <p className="text-sm text-gray-500">
                          {c.groupName} • {formatCurrency(c.amount)} • {c.date}
                        </p>
                      </div>
                      <button
                        onClick={() => confirmContribution(c.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">All Contributions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Member</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Group</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Confirmed By</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Confirmed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contributions.map(c => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-sm">{c.userName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.groupName}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(c.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            c.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.confirmedBy || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.confirmedAt || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            {/* Groups Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Stokvel Groups</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage all Stokvels - create, edit, or deactivate</p>
                </div>
                <button
                  onClick={() => setShowAddGroupModal(true)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Create New Stokvel</span>
                </button>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map(group => (
                <div 
                  key={group.id} 
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${
                    group.status === 'active' 
                      ? `border-${group.color}-200 hover:border-${group.color}-300` 
                      : 'border-gray-200 opacity-75'
                  }`}
                >
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-${group.color}-100 rounded-xl flex items-center justify-center text-2xl`}>
                        {group.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{group.type} · Created {group.createdAt}</p>
                      </div>
                    </div>
                    {getStatusBadge(group.status)}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{group.description}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Target</p>
                      <p className="font-semibold text-gray-800">R {group.targetAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Members</p>
                      <p className="font-semibold text-gray-800">{group.currentMembers}/{group.maxMembers}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Interest</p>
                      <p className="font-semibold text-secondary-600">{group.interestRate}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Cycle</p>
                      <p className="font-semibold text-gray-800 capitalize">{group.cycle}</p>
                    </div>
                  </div>

                  {/* Next Payout */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-600 mb-1">Next Payout</p>
                    <p className="font-semibold text-blue-800">{group.nextPayout}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowEditGroupModal(group)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    {group.currentMembers === 0 ? (
                      <button
                        onClick={() => setShowDeleteGroupConfirm(group)}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setGroups(groups.map(g => 
                            g.id === group.id 
                              ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } 
                              : g
                          ));
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          group.status === 'active'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {group.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>

                  {/* Warning for groups with members */}
                  {group.currentMembers > 0 && group.status === 'inactive' && (
                    <p className="text-xs text-yellow-600 mt-3 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {group.currentMembers} active members - cannot delete
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddUserModal && (
        <AddUserModal 
          onClose={() => setShowAddUserModal(false)}
          groups={groups.filter(g => g.status === 'active')}
        />
      )}

      {showEditUserModal && (
        <EditUserModal 
          user={showEditUserModal} 
          onClose={() => setShowEditUserModal(null)}
          groups={groups.filter(g => g.status === 'active')}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          userId={showDeleteConfirm}
          onConfirm={handleDeleteUser}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {showAddGroupModal && (
        <AddGroupModal 
          onClose={() => setShowAddGroupModal(false)}
          onAdd={handleAddGroup}
        />
      )}

      {showEditGroupModal && (
        <EditGroupModal 
          group={showEditGroupModal}
          onClose={() => setShowEditGroupModal(null)}
          onEdit={handleEditGroup}
        />
      )}

      {showDeleteGroupConfirm && (
        <DeleteGroupModal
          group={showDeleteGroupConfirm}
          onConfirm={handleDeleteGroup}
          onCancel={() => setShowDeleteGroupConfirm(null)}
        />
      )}
    </div>
  );
}

// Pending User Card Component
function PendingUserCard({ user, groups, onApprove, onReject }: { 
  user: User; 
  groups: Group[]; 
  onApprove: (userId: number, selectedGroups: number[]) => void;
  onReject: (userId: number) => void;
}) {
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-medium text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email} • {user.phone}</p>
          <p className="text-xs text-gray-400 mt-1">Registered: {user.joinedDate}</p>
        </div>
        
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-700 mb-2">Assign to Stokvel(s):</p>
          <div className="flex flex-wrap gap-2">
            {groups.map(group => (
              <label
                key={group.id}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full cursor-pointer transition-colors ${
                  selectedGroups.includes(group.id)
                    ? `bg-${group.color}-100 text-${group.color}-800 border-2 border-${group.color}-300`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => handleGroupToggle(group.id)}
                  className="hidden"
                />
                <span>{group.icon}</span>
                <span className="text-sm">{group.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onApprove(user.id, selectedGroups)}
            disabled={selectedGroups.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(user.id)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// Add User Modal
function AddUserModal({ onClose, groups }: { onClose: () => void; groups: Group[] }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'default123',
    groups: [] as number[]
  });

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter(id => id !== groupId)
        : [...prev.groups, groupId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle add user logic
    alert('User added successfully! (Demo)');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="082 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Groups</label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {groups.map(group => (
                <label key={group.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.groups.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{group.icon} {group.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
            >
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal
function EditUserModal({ user, onClose, groups }: { user: User; onClose: () => void; groups: Group[] }) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    groups: [...user.groups]
  });

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter(id => id !== groupId)
        : [...prev.groups, groupId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`User ${user.name} updated! (Demo)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Groups</label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {groups.map(group => (
                <label key={group.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.groups.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{group.icon} {group.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirm Modal
function DeleteConfirmModal({ userId, onConfirm, onCancel }: { userId: number; onConfirm: (id: number) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete User</h3>
          <p className="text-gray-500">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(userId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Group Modal
function AddGroupModal({ onClose, onAdd }: { onClose: () => void; onAdd: (group: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'traditional',
    description: '',
    targetAmount: 7000,
    maxMembers: 18,
    interestRate: 30,
    cycle: 'weekly',
    icon: '🌱',
    color: 'primary',
    status: 'active'
  });

  const colors = [
    { value: 'primary', label: 'Green' },
    { value: 'secondary', label: 'Orange' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' }
  ];

  const icons = ['🌱', '🥃', '💰', '🏦', '🌟', '🎯', '💎', '🔥'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate next payout based on cycle
    const today = new Date();
    let nextPayout = '';
    if (formData.cycle === 'weekly') {
      const next = new Date(today.setDate(today.getDate() + 7));
      nextPayout = next.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (formData.cycle === 'monthly') {
      const next = new Date(today.setMonth(today.getMonth() + 1));
      nextPayout = next.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
      const next = new Date(today.setMonth(today.getMonth() + 3));
      nextPayout = next.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    onAdd({ ...formData, nextPayout });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Create New Stokvel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stokvel Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., SUMMER SAVERS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="traditional">Traditional (Fixed Target)</option>
                <option value="flexible">Flexible (Personal Targets)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="What is this Stokvel for?"
            />
          </div>

          {/* Financial Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (R) *</label>
              <input
                type="number"
                required
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="1000"
                step="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Members *</label>
              <input
                type="number"
                required
                value={formData.maxMembers}
                onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="1"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%) *</label>
              <input
                type="number"
                required
                value={formData.interestRate}
                onChange={(e) => setFormData({...formData, interestRate: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cycle *</label>
              <select
                required
                value={formData.cycle}
                onChange={(e) => setFormData({...formData, cycle: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          {/* Appearance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {icons.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {colors.map(color => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.status === 'active'}
                onChange={(e) => setFormData({...formData, status: e.target.checked ? 'active' : 'inactive'})}
                className="w-4 h-4 text-primary-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Activate immediately</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Stokvel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Group Modal
function EditGroupModal({ group, onClose, onEdit }: { group: any; onClose: () => void; onEdit: (group: any) => void }) {
  const [formData, setFormData] = useState(group);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Edit Stokvel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Same form fields as Add modal, but populated with group data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stokvel Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="traditional">Traditional</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount (R)</label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Members</label>
              <input
                type="number"
                value={formData.maxMembers}
                onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData({...formData, interestRate: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cycle</label>
              <select
                value={formData.cycle}
                onChange={(e) => setFormData({...formData, cycle: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="🌱">🌱</option>
                <option value="🥃">🥃</option>
                <option value="💰">💰</option>
                <option value="🏦">🏦</option>
                <option value="🌟">🌟</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="primary">Green</option>
                <option value="secondary">Orange</option>
                <option value="blue">Blue</option>
                <option value="purple">Purple</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.status === 'active'}
                onChange={(e) => setFormData({...formData, status: e.target.checked ? 'active' : 'inactive'})}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Group Modal
function DeleteGroupModal({ group, onConfirm, onCancel }: { group: any; onConfirm: (id: number) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Stokvel</h3>
          <p className="text-gray-500">
            Are you sure you want to delete <span className="font-bold">{group.name}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onConfirm(group.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}