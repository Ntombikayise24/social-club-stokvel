import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';

export default function ContributionHistory() {
  const [filter, setFilter] = useState('all'); // all, confirmed, pending

  // Mock data - matches the prototype
  const contributions = [
    {
      id: 1,
      amount: 200,
      status: 'confirmed',
      date: '04 Feb 2026',
      confirmedBy: 'Admin'
    },
    {
      id: 2,
      amount: 350,
      status: 'confirmed',
      date: '22 Jan 2026',
      confirmedBy: 'Admin'
    },
    {
      id: 3,
      amount: 250,
      status: 'confirmed',
      date: '22 Jan 2026',
      confirmedBy: 'Admin'
    },
    {
      id: 4,
      amount: 2000,
      status: 'confirmed',
      date: '12 Jan 2025',
      confirmedBy: 'Admin'
    },
    {
      id: 5,
      amount: 1200,
      status: 'pending',
      date: '05 Jan 2025',
      confirmedBy: null
    }
  ];

  const stats = {
    totalCollected: 9800,
    totalContributions: 8,
    confirmedCount: 7,
    pendingCount: 1
  };

  const filteredContributions = contributions.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">SOCIAL CLUB</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Collective Contributions</h2>
          <p className="text-gray-500">Group contribution history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Collected</p>
            <p className="text-2xl font-bold text-primary-800">R {stats.totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Contributions</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalContributions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmedCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pendingCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'confirmed' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Contributions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredContributions.map((contribution) => (
              <div key={contribution.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(contribution.status)}
                    <span className="text-lg font-semibold text-gray-800">
                      R {contribution.amount.toLocaleString()}
                    </span>
                  </div>
                  {getStatusBadge(contribution.status)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">{contribution.date}</span>
                    {contribution.confirmedBy && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-green-600">Confirmed by {contribution.confirmedBy}</span>
                      </>
                    )}
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredContributions.length === 0 && (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No contributions found</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex justify-between items-center">
          <Link 
            to="/dashboard" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Download Report
          </button>
        </div>
      </main>
    </div>
  );
}