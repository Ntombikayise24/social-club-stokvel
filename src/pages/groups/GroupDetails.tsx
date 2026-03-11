import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  Target,
  Wallet
} from 'lucide-react';
import { stokvelApi, userApi } from '../../api';
import ErrorState from '../../components/ErrorState';

interface Member {
  id: string;
  name: string;
  initials: string;
  joinedDate: string;
  totalContributed: number;
  targetAmount: number;
  progress: number;
  status: 'active' | 'inactive' | 'pending';
  lastActive?: string;
  avatar?: string;
}

interface GroupLoan {
  id: string;
  memberName: string;
  memberInitials: string;
  amount: number;
  interest: number;
  totalRepayable: number;
  status: 'active' | 'overdue' | 'repaid';
  borrowedDate: string;
  dueDate: string;
  daysRemaining?: number;
}

interface GroupData {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  targetAmount: number;
  totalSaved: number;
  memberCount: number;
  maxMembers: number;
  progress: number;
  cycle: string;
  meetingDay: string;
  nextPayout: string;
  interestRate: number;
  createdAt: string;
  members: Member[];
  activeLoans: GroupLoan[];
}

export default function GroupDetails() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || '1';
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [groupData, setGroupData] = useState<GroupData>({
    id: '',
    name: '',
    icon: '🌱',
    color: 'primary',
    description: '',
    targetAmount: 0,
    totalSaved: 0,
    memberCount: 0,
    maxMembers: 0,
    progress: 0,
    cycle: '',
    nextPayout: '',
    meetingDay: '',
    interestRate: 30,
    createdAt: '',
    members: [],
    activeLoans: []
  });

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError(false);
        // Get the stokvelId from user's profile
        const profilesRes = await userApi.getProfiles();
        const profile = (profilesRes.data || []).find((p: any) => String(p.id) === profileId);
        const stokvelId = profile?.stokvelId;
        
        if (!stokvelId) {
          setLoading(false);
          return;
        }

        const res = await stokvelApi.getDetails(stokvelId);
        const d = res.data;
        const colors = ['primary', 'secondary', 'blue', 'green', 'purple'];
        const icons = ['🌱', '💰', '🎯', '🏦', '💎'];
        const idx = (profilesRes.data || []).findIndex((p: any) => String(p.id) === profileId);
        
        const groupTarget = (d.targetAmount || 0) * (d.currentMembers || 1);
        setGroupData({
          id: String(d.id),
          name: d.name || '',
          icon: d.icon || icons[idx % icons.length] || '🌱',
          color: d.color || colors[idx % colors.length] || 'primary',
          description: d.description || '',
          targetAmount: groupTarget,
          totalSaved: d.totalPool || 0,
          memberCount: d.currentMembers || 0,
          maxMembers: d.maxMembers || 0,
          progress: groupTarget > 0 ? Math.min(100, Math.round(((d.totalPool || 0) / groupTarget) * 100)) : 0,
          cycle: d.cycle || '',
          meetingDay: d.meetingDay || 'Sunday',
          nextPayout: d.nextPayout ? new Date(d.nextPayout).toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'}) : '',
          interestRate: d.interestRate || 30,
          createdAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'}) : '',
          members: (d.members || []).map((m: any) => ({
            id: String(m.id),
            name: m.name || '',
            initials: m.initials || (m.name || 'M').split(' ').map((n: string) => n[0]).join(''),
            joinedDate: m.joinedDate ? new Date(m.joinedDate).toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'}) : '',
            totalContributed: m.savedAmount || 0,
            targetAmount: d.targetAmount || 0,
            progress: d.targetAmount > 0 ? Math.min(100, Math.round(((m.savedAmount || 0) / d.targetAmount) * 100)) : 0,
            status: 'active' as const,
            lastActive: m.lastActive || ''
          })),
          activeLoans: (d.activeLoans || []).map((l: any) => ({
            id: String(l.id),
            memberName: l.borrower || '',
            memberInitials: (l.borrower || 'M').split(' ').map((n: string) => n[0]).join(''),
            amount: l.amount || 0,
            interest: (l.totalRepayable || 0) - (l.amount || 0),
            totalRepayable: l.totalRepayable || 0,
            status: l.status || 'active',
            borrowedDate: l.borrowedDate ? new Date(l.borrowedDate).toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'}) : '',
            dueDate: l.dueDate ? new Date(l.dueDate).toLocaleDateString('en-ZA', {day:'2-digit', month:'short', year:'numeric'}) : '',
            daysRemaining: l.daysRemaining
          }))
        });
      } catch (err) {
        console.error('Failed to load group data', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupData();
  }, [profileId]);

  const displayedMembers = showAllMembers 
    ? groupData.members 
    : groupData.members.slice(0, 6);

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

  const getLoanStatusBadge = (status: string, daysRemaining?: number) => {
    switch(status) {
      case 'repaid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Repaid</span>;
      case 'overdue':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Overdue</span>;
      case 'active':
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${
            daysRemaining && daysRemaining <= 3 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {daysRemaining} days left
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/dashboard?profile=${profileId}`} className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">FUND MATE</h1>
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
          <ErrorState message="Could not load group details. Please try again." onRetry={() => window.location.reload()} />
        ) : (<>
        {/* Group Header */}
        <div className={`bg-gradient-to-r from-${groupData.color}-50 to-white rounded-xl shadow-sm border border-${groupData.color}-200 p-6 mb-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 bg-${groupData.color}-100 rounded-xl flex items-center justify-center text-3xl`}>
                {groupData.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{groupData.name}</h2>
                <p className="text-gray-600 mt-1">{groupData.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="text-sm bg-white px-3 py-1 rounded-full border border-gray-200">
                    👥 {groupData.memberCount}/{groupData.maxMembers} members
                  </span>
                  <span className="text-sm bg-white px-3 py-1 rounded-full border border-gray-200">
                    📅 Created {groupData.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Saved</p>
              <DollarSign className={`w-4 h-4 text-${groupData.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(groupData.totalSaved)}</p>
            <p className="text-xs text-gray-500 mt-1">of {formatCurrency(groupData.targetAmount)} target</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Group Progress</p>
              <Target className={`w-4 h-4 text-${groupData.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{Math.min(100, groupData.progress)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className={`bg-${groupData.color}-600 h-1.5 rounded-full`} 
                style={{ width: `${Math.min(100, groupData.progress)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Active Loans</p>
              <Wallet className={`w-4 h-4 text-${groupData.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{groupData.activeLoans.length}</p>
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatCurrency(groupData.activeLoans.reduce((sum, l) => sum + l.totalRepayable, 0))}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Meeting Day</p>
              <Calendar className={`w-4 h-4 text-${groupData.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{groupData.meetingDay || 'Sunday'}</p>
            <p className="text-xs text-gray-500 mt-1">{groupData.cycle}</p>
          </div>
        </div>

        {/* Members Section — name only, no financial data */}
        {groupData.members.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Members</h3>
              <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium">
                {groupData.members.length} total
              </span>
            </div>
            <div className="space-y-3">
              {displayedMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-${groupData.color}-100 rounded-full flex items-center justify-center`}>
                      <span className={`text-sm font-semibold text-${groupData.color}-700`}>{member.initials}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-400">Joined {member.joinedDate}</p>
                    </div>
                  </div>
                  {getStatusBadge(member.status)}
                </div>
              ))}
            </div>
            {groupData.members.length > 6 && (
              <button
                onClick={() => setShowAllMembers(!showAllMembers)}
                className="mt-4 w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2 bg-primary-50 rounded-lg"
              >
                {showAllMembers ? 'Show Less' : `View All ${groupData.members.length} Members`}
              </button>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6">
          <Link 
            to={`/dashboard?profile=${profileId}`}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
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