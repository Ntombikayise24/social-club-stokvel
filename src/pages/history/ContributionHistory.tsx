import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  AlertCircle,
  Users,
  CreditCard,
  XCircle,
  Wallet,
} from 'lucide-react';
import { contributionApi, userApi } from '../../api';
import ErrorState from '../../components/ErrorState';
import { downloadBlob, getExtension } from '../../utils/download';

interface Contribution {
  id: number;
  memberName: string;
  memberInitials: string;
  amount: number;
  date: string;
  status: 'confirmed' | 'pending' | 'failed';
  paymentMethod?: string;
  contributionType?: string;
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
  
  const [filter, setFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await userApi.getProfiles();
        setProfiles((res.data || []).map((p: any) => ({
          id: String(p.id),
          name: p.stokvelName || '',
          stokvelName: p.stokvelName || ''
        })));
      } catch (err) {
        console.error('Failed to load profiles', err);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        setLoading(true);
        setError(false);
        // Get stokvelId from profiles
        const profilesRes = await userApi.getProfiles();
        const profile = (profilesRes.data || []).find((p: any) => String(p.id) === profileId);
        const stokvelId = profile?.stokvelId;

        const res = await contributionApi.list({ stokvelId, profileId: Number(profileId) });
        const data = res.data?.data || res.data || [];
        setContributions(data.map((c: any) => ({
          id: c.id,
          memberName: c.memberName || 'Member',
          memberInitials: c.memberInitials || (c.memberName || 'M').split(' ').map((n: string) => n[0]).join(''),
          amount: c.amount || 0,
          date: c.date ? new Date(c.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          status: c.status || 'pending',
          paymentMethod: c.paymentMethod || 'card',
          contributionType: c.contributionType || 'your-target',
          confirmedBy: c.confirmedBy,
          confirmedAt: c.confirmedAt ? new Date(c.confirmedAt).toLocaleString('en-ZA') : undefined
        })));
      } catch (err) {
        console.error('Failed to load contributions', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchContributions();
  }, [profileId]);

  const activeProfile = profiles.find(p => p.id === profileId) || profiles[0] || { id: profileId, name: '', stokvelName: 'Stokvel' };

  // Get unique members for filter dropdown
  const uniqueMembers = Array.from(new Set(contributions.map(c => c.memberName)));

  const handleDownload = async (format: string) => {
    try {
      setIsDownloading(true);
      const res = await contributionApi.download({ profileId: Number(profileId), format });
      const ext = getExtension(format);
      downloadBlob(new Blob([res.data]), `contribution-history.${ext}`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Apply filters
  const filteredContributions = contributions.filter(c => {
    // Status filter
    if (filter !== 'all' && c.status !== filter) return false;
    // Member filter
    if (selectedMember !== 'all' && c.memberName !== selectedMember) return false;
    return true;
  });

  const stats = {
    totalCollected: contributions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + c.amount, 0),
    totalContributions: contributions.length,
    confirmedCount: contributions.filter(c => c.status === 'confirmed').length,
    pendingCount: contributions.filter(c => c.status === 'pending').length,
    failedCount: contributions.filter(c => c.status === 'failed').length,
    uniqueMembers: uniqueMembers.length
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
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
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Declined</span>;
      default:
        return null;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch(method) {
      case 'paystack':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
            <CreditCard className="w-3 h-3" />
            <span>Card</span>
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
            <Wallet className="w-3 h-3" />
            <span>Cash</span>
          </span>
        );
      case 'loan_repayment':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
            <DollarSign className="w-3 h-3" />
            <span>Loan Interest</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200">
            <CreditCard className="w-3 h-3" />
            <span>{method}</span>
          </span>
        );
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
              <h1 className="text-2xl font-bold text-primary-800">FUND MATE</h1>
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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <ErrorState message="Failed to load contribution history." onRetry={() => window.location.reload()} />
        ) : (<>
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
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'failed' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Declined ({stats.failedCount})
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
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isDownloading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export</span>
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Export As</p>
                  <button onClick={() => { setShowDownloadMenu(false); handleDownload('pdf'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <span>📄</span><span>PDF Report</span>
                  </button>
                  <button onClick={() => { setShowDownloadMenu(false); handleDownload('excel'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <span>📊</span><span>Excel Spreadsheet</span>
                  </button>
                  <button onClick={() => { setShowDownloadMenu(false); handleDownload('csv'); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <span>📋</span><span>CSV File</span>
                  </button>
                </div>
              )}
            </div>
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
                      {/* Payment Method + Contribution Type */}
                      <div className="flex items-center space-x-2 mt-1.5">
                        {getPaymentMethodBadge(contribution.paymentMethod || 'card')}
                        {contribution.contributionType === 'madala-side' && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                            🌱 Madala Side
                          </span>
                        )}
                        {contribution.contributionType === 'your-target' && contribution.paymentMethod !== 'loan_repayment' && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                            🎯 Your Target
                          </span>
                        )}
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
        </>)}
      </main>
    </div>
  );
}