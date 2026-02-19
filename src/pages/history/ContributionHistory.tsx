import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  AlertCircle,
  Users,
} from 'lucide-react';

interface Contribution {
  id: number;
  memberName: string;
  memberInitials: string;
  amount: number;
  date: string;
  status: 'confirmed' | 'pending';
  confirmedBy?: string;
  confirmedAt?: string;
}

interface Profile {
  id: string;
  name: string;
  stokvelName: string;
}

export default function ContributionHistory() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || '1';
  
  const [filter, setFilter] = useState('all'); // all, confirmed, pending
  const [selectedMember, setSelectedMember] = useState('all'); // filter by member

  // Mock profiles
  const profiles: Profile[] = [
    { id: '1', name: 'Nkulumo Nkuna', stokvelName: 'COLLECTIVE POT' },
    { id: '2', name: 'Nkulumo Nkuna', stokvelName: 'SUMMER SAVERS' }
  ];

  const activeProfile = profiles.find(p => p.id === profileId) || profiles[0];

  // Mock data - ALL members' contributions for the selected stokvel
  const [contributions] = useState<Contribution[]>([
    // COLLECTIVE POT contributions (profileId: 1)
    {
      id: 1,
      memberName: 'Nkulumo Nkuna',
      memberInitials: 'NN',
      amount: 200,
      status: 'confirmed',
      date: '04 Feb 2026',
      confirmedBy: 'Admin',
      confirmedAt: '04 Feb 2026 14:30'
    },
    {
      id: 2,
      memberName: 'Thabo Mbeki',
      memberInitials: 'TM',
      amount: 350,
      status: 'confirmed',
      date: '22 Jan 2026',
      confirmedBy: 'Admin',
      confirmedAt: '22 Jan 2026 09:15'
    },
    {
      id: 3,
      memberName: 'Sarah Jones',
      memberInitials: 'SJ',
      amount: 250,
      status: 'confirmed',
      date: '22 Jan 2026',
      confirmedBy: 'Admin',
      confirmedAt: '22 Jan 2026 10:45'
    },
    {
      id: 4,
      memberName: 'John Doe',
      memberInitials: 'JD',
      amount: 2000,
      status: 'confirmed',
      date: '12 Jan 2025',
      confirmedBy: 'Admin',
      confirmedAt: '12 Jan 2025 16:20'
    },
    {
      id: 5,
      memberName: 'Mary Johnson',
      memberInitials: 'MJ',
      amount: 1200,
      status: 'pending',
      date: '05 Jan 2025',
      confirmedBy: undefined,
      confirmedAt: undefined
    },
    {
      id: 6,
      memberName: 'Peter Williams',
      memberInitials: 'PW',
      amount: 500,
      status: 'confirmed',
      date: '03 Feb 2026',
      confirmedBy: 'Admin',
      confirmedAt: '03 Feb 2026 11:20'
    },
    {
      id: 7,
      memberName: 'Linda Zulu',
      memberInitials: 'LZ',
      amount: 800,
      status: 'confirmed',
      date: '28 Jan 2026',
      confirmedBy: 'Admin',
      confirmedAt: '28 Jan 2026 15:45'
    },
    // SUMMER SAVERS contributions (profileId: 2)
    {
      id: 8,
      memberName: 'Nkulumo Nkuna',
      memberInitials: 'NN',
      amount: 500,
      status: 'confirmed',
      date: '10 Feb 2026',
      confirmedBy: 'Admin',
      confirmedAt: '10 Feb 2026 11:20'
    },
    {
      id: 9,
      memberName: 'Jane Smith',
      memberInitials: 'JS',
      amount: 350,
      status: 'pending',
      date: '15 Feb 2026',
      confirmedBy: undefined,
      confirmedAt: undefined
    },
    {
      id: 10,
      memberName: 'Bob Johnson',
      memberInitials: 'BJ',
      amount: 600,
      status: 'confirmed',
      date: '12 Feb 2026',
      confirmedBy: 'Admin',
      confirmedAt: '12 Feb 2026 09:30'
    }
  ]);

  // Filter contributions by active profile (stokvel)
  const profileContributions = contributions.filter(c => {
    // This is mock logic - in real app, contributions would have stokvelId
    // For now, we'll use a simple rule:
    // IDs 1-7 are COLLECTIVE POT, IDs 8-10 are SUMMER SAVERS
    if (profileId === '1') return c.id <= 7;
    if (profileId === '2') return c.id >= 8;
    return false;
  });

  // Get unique members for filter dropdown
  const uniqueMembers = Array.from(new Set(profileContributions.map(c => c.memberName)));

  // Apply filters
  const filteredContributions = profileContributions.filter(c => {
    // Status filter
    if (filter !== 'all' && c.status !== filter) return false;
    // Member filter
    if (selectedMember !== 'all' && c.memberName !== selectedMember) return false;
    return true;
  });

  const stats = {
    totalCollected: profileContributions.reduce((sum, c) => sum + c.amount, 0),
    totalContributions: profileContributions.length,
    confirmedCount: profileContributions.filter(c => c.status === 'confirmed').length,
    pendingCount: profileContributions.filter(c => c.status === 'pending').length,
    uniqueMembers: uniqueMembers.length
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Confirmed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Pending</span>;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/dashboard?profile=${profileId}`} className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-primary-50 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">{activeProfile.stokvelName}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Group Contributions</h2>
          <p className="text-gray-500">
            All contributions from members of <span className="font-medium text-primary-600">{activeProfile.stokvelName}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-primary-800">{formatCurrency(stats.totalCollected)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Contributions</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalContributions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Active Members</p>
            <p className="text-2xl font-bold text-blue-600">{stats.uniqueMembers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pendingCount}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({stats.totalContributions})
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'confirmed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Confirmed ({stats.confirmedCount})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pendingCount})
              </button>
            </div>

            {/* Member Filter Dropdown */}
            <div className="flex-1 max-w-xs">
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="all">All Members</option>
                {uniqueMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            {/* Download Button */}
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Contributions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredContributions.map((contribution) => (
              <div key={contribution.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {/* Member Avatar */}
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-700">
                        {contribution.memberInitials}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{contribution.memberName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(contribution.status)}
                        <span className="text-lg font-semibold text-gray-800">
                          {formatCurrency(contribution.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(contribution.status)}
                    <p className="text-sm text-gray-500 mt-1">{contribution.date}</p>
                  </div>
                </div>
                
                {/* Confirmation Details */}
                {contribution.confirmedBy && (
                  <div className="mt-2 pl-11 text-xs text-gray-500">
                    Confirmed by {contribution.confirmedBy} • {contribution.confirmedAt}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredContributions.length === 0 && (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No contributions found for {activeProfile.stokvelName}</p>
              {selectedMember !== 'all' && (
                <button
                  onClick={() => setSelectedMember('all')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link 
            to={`/dashboard?profile=${profileId}`}
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}