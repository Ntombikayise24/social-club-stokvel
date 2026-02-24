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
        
        setGroupData({
          id: String(d.id),
          name: d.name || '',
          icon: d.icon || icons[idx % icons.length] || '🌱',
          color: d.color || colors[idx % colors.length] || 'primary',
          description: d.description || '',
          targetAmount: d.targetAmount || 0,
          totalSaved: d.totalPool || 0,
          memberCount: d.currentMembers || 0,
          maxMembers: d.maxMembers || 0,
          progress: d.targetAmount > 0 ? Math.round(((d.totalPool || 0) / d.targetAmount) * 100) : 0,
          cycle: d.cycle || '',
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
            progress: d.targetAmount > 0 ? Math.round(((m.savedAmount || 0) / d.targetAmount) * 100) : 0,
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
              <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
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
            <p className="text-2xl font-bold text-gray-800">{groupData.progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className={`bg-${groupData.color}-600 h-1.5 rounded-full`} 
                style={{ width: `${groupData.progress}%` }}
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
              <p className="text-sm text-gray-500">Next Payout</p>
              <Calendar className={`w-4 h-4 text-${groupData.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{groupData.nextPayout}</p>
            <p className="text-xs text-gray-500 mt-1">{groupData.cycle}</p>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Members</h3>
            <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
              {groupData.memberCount} total
            </span>
          </div>

          <div className="space-y-3">
            {displayedMembers.map((member) => (
              <div key={member.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">{member.initials}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-800">{member.name}</p>
                        {getStatusBadge(member.status)}
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        <span>Joined {member.joinedDate}</span>
                        <span>•</span>
                        <span>Last active {member.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatCurrency(member.totalContributed)}</p>
                    <p className="text-xs text-gray-500">of {formatCurrency(member.targetAmount)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className={`font-medium text-${groupData.color}-600`}>{member.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`bg-${groupData.color}-600 h-1.5 rounded-full`} 
                      style={{ width: `${member.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {groupData.members.length > 6 && (
            <button
              onClick={() => setShowAllMembers(!showAllMembers)}
              className="w-full mt-4 text-center text-primary-600 hover:text-primary-700 text-sm font-medium py-2"
            >
              {showAllMembers ? 'Show Less' : `View All ${groupData.members.length} Members`}
            </button>
          )}
        </div>

        {/* Active Loans Section */}
        {groupData.activeLoans.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Active Loans</h3>
            
            <div className="space-y-4">
              {groupData.activeLoans.map((loan) => (
                <div key={loan.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">{loan.memberInitials}</span>
                      </div>
                      <span className="font-medium text-gray-800">{loan.memberName}</span>
                    </div>
                    {getLoanStatusBadge(loan.status, loan.daysRemaining)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Principal</p>
                      <p className="font-semibold text-gray-800">{formatCurrency(loan.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Interest (30%)</p>
                      <p className="font-semibold text-secondary-600">{formatCurrency(loan.interest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="font-semibold text-primary-700">{formatCurrency(loan.totalRepayable)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Borrowed: {loan.borrowedDate}</span>
                    <span>Due: {loan.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
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