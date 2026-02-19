import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Percent,
  AlertTriangle,
  CreditCard,
  Download,
  Users
} from 'lucide-react';

interface Loan {
  id: number;
  profileId: string;
  profileName: string;
  stokvelName: string;
  amount: number;
  interest: number;
  interestRate: number;
  totalRepayable: number;
  status: 'active' | 'repaid' | 'overdue';
  borrowedDate: string;
  dueDate: string;
  repaidDate?: string;
  purpose?: string;
  daysRemaining?: number;
}

export default function LoanHistory() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || '1';
  
  const [expandedLoan, setExpandedLoan] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [showRepayModal, setShowRepayModal] = useState<Loan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock profiles
  const profiles = [
    { id: '1', name: 'Nkulumo Nkuna', stokvelName: 'COLLECTIVE POT' },
    { id: '2', name: 'Nkulumo Nkuna', stokvelName: 'SUMMER SAVERS' }
  ];

  const activeProfile = profiles.find(p => p.id === profileId) || profiles[0];

  // Mock data with profile-specific loans
  const [loans, setLoans] = useState<Loan[]>([
    // Profile 1 (COLLECTIVE POT) loans
    {
      id: 1,
      profileId: '1',
      profileName: 'Nkulumo Nkuna',
      stokvelName: 'COLLECTIVE POT',
      amount: 230,
      interest: 69,
      interestRate: 30,
      totalRepayable: 299,
      status: 'overdue',
      borrowedDate: '26 Jan 2026',
      dueDate: '23 Mar 2026',
      purpose: 'Emergency expenses',
      daysRemaining: -5
    },
    {
      id: 2,
      profileId: '1',
      profileName: 'Nkulumo Nkuna',
      stokvelName: 'COLLECTIVE POT',
      amount: 175,
      interest: 105,
      interestRate: 60,
      totalRepayable: 280,
      status: 'repaid',
      borrowedDate: '26 Jan 2026',
      dueDate: '23 Feb 2026',
      repaidDate: '20 Feb 2026',
      purpose: 'School fees'
    },
    {
      id: 3,
      profileId: '1',
      profileName: 'Nkulumo Nkuna',
      stokvelName: 'COLLECTIVE POT',
      amount: 500,
      interest: 150,
      interestRate: 30,
      totalRepayable: 650,
      status: 'active',
      borrowedDate: '10 Feb 2026',
      dueDate: '12 Mar 2026',
      purpose: 'Business supplies',
      daysRemaining: 12
    },
    // Profile 2 (SUMMER SAVERS) loans
    {
      id: 4,
      profileId: '2',
      profileName: 'Nkulumo Nkuna',
      stokvelName: 'SUMMER SAVERS',
      amount: 800,
      interest: 240,
      interestRate: 30,
      totalRepayable: 1040,
      status: 'active',
      borrowedDate: '05 Feb 2026',
      dueDate: '07 Mar 2026',
      purpose: 'Car repair',
      daysRemaining: 7
    },
    {
      id: 5,
      profileId: '2',
      profileName: 'Nkulumo Nkuna',
      stokvelName: 'SUMMER SAVERS',
      amount: 1200,
      interest: 360,
      interestRate: 30,
      totalRepayable: 1560,
      status: 'active',
      borrowedDate: '01 Feb 2026',
      dueDate: '03 Mar 2026',
      purpose: 'Rent assistance',
      daysRemaining: 3
    }
  ]);

  // Filter loans by active profile
  const profileLoans = loans.filter(loan => loan.profileId === profileId);

  const stats = {
    totalInterestPaid: profileLoans
      .filter(l => l.status === 'repaid')
      .reduce((sum, loan) => sum + loan.interest, 0),
    activeLoans: profileLoans.filter(l => l.status === 'active').length,
    totalBorrowed: profileLoans.reduce((sum, loan) => sum + loan.amount, 0),
    totalRepaid: profileLoans.filter(l => l.status === 'repaid').reduce((sum, loan) => sum + loan.totalRepayable, 0),
    overdueLoans: profileLoans.filter(l => l.status === 'overdue').length,
    activeLoanTotal: profileLoans
      .filter(l => l.status === 'active')
      .reduce((sum, loan) => sum + loan.totalRepayable, 0)
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'repaid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'active':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, daysRemaining?: number) => {
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

  const getInterestBadge = (rate: number) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        rate === 60 
          ? 'bg-red-100 text-red-700' 
          : 'bg-orange-100 text-orange-700'
      }`}>
        {rate}% interest
      </span>
    );
  };

  const handleRepay = (loan: Loan) => {
    setShowRepayModal(loan);
  };

  const confirmRepayment = () => {
    if (!showRepayModal) return;
    
    setIsProcessing(true);
    
    setTimeout(() => {
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === showRepayModal.id 
            ? { 
                ...loan, 
                status: 'repaid', 
                repaidDate: new Date().toLocaleDateString('en-ZA', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })
              } 
            : loan
        )
      );
      
      setIsProcessing(false);
      setShowRepayModal(null);
    }, 2000);
  };

  const filteredLoans = profileLoans.filter(loan => {
    if (filter === 'all') return true;
    return loan.status === filter;
  });

  const toggleExpand = (id: number) => {
    setExpandedLoan(expandedLoan === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back button preserves profile */}
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
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Loan History</h2>
          <p className="text-gray-500">
            Showing loans for <span className="font-medium text-primary-600">{activeProfile.stokvelName}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Interest Paid</p>
              <Percent className="w-4 h-4 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-primary-800">R {stats.totalInterestPaid.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Lifetime interest</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Active Loans</p>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.activeLoans}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.activeLoanTotal)} total</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Overdue Loans</p>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
            <p className="text-xs text-gray-500 mt-1">Action required</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Borrowed</p>
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">R {stats.totalBorrowed.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">R {stats.totalRepaid.toLocaleString()} repaid</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All Loans ({profileLoans.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Active ({stats.activeLoans})
          </button>
          <button
            onClick={() => setFilter('repaid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'repaid' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Repaid ({profileLoans.filter(l => l.status === 'repaid').length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'overdue' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Overdue ({stats.overdueLoans})
          </button>
        </div>

        {/* Loans List */}
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Loan Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(loan.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(loan.status)}
                    <span className="text-lg font-semibold text-gray-800">
                      {formatCurrency(loan.amount)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(loan.status, loan.daysRemaining)}
                    {expandedLoan === loan.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-gray-500">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>+ {formatCurrency(loan.interest)} interest</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium text-gray-700">
                    = {formatCurrency(loan.totalRepayable)} total
                  </span>
                  {getInterestBadge(loan.interestRate)}
                </div>

                {/* Quick action for active loans */}
                {loan.status === 'active' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepay(loan);
                      }}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Repay Now</span>
                    </button>
                  </div>
                )}

                {/* Urgent warning for soon due loans */}
                {loan.status === 'active' && loan.daysRemaining && loan.daysRemaining <= 3 && (
                  <div className="mt-2 flex items-center text-orange-600 text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Due in {loan.daysRemaining} days - repay soon to avoid penalties</span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {expandedLoan === loan.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Borrowed Date</p>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-800">{loan.borrowedDate}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Due Date</p>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className={`text-sm ${
                          loan.status === 'overdue' 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-800'
                        }`}>
                          {loan.dueDate}
                          {loan.status === 'overdue' && ' (Overdue)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {loan.purpose && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Purpose</p>
                      <p className="text-sm text-gray-800">{loan.purpose}</p>
                    </div>
                  )}

                  {loan.repaidDate && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Repaid Date</p>
                      <p className="text-sm text-green-600">{loan.repaidDate}</p>
                    </div>
                  )}

                  {/* Payment breakdown */}
                  <div className="bg-white rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Payment Breakdown</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Principal:</span>
                        <span className="font-medium">{formatCurrency(loan.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest ({loan.interestRate}%):</span>
                        <span className="font-medium text-secondary-600">{formatCurrency(loan.interest)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-100">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-primary-700">{formatCurrency(loan.totalRepayable)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                      View Receipt
                    </button>
                    {loan.status === 'active' && (
                      <button
                        onClick={() => handleRepay(loan)}
                        className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors"
                      >
                        Repay Now
                      </button>
                    )}
                    {loan.status === 'overdue' && (
                      <button
                        onClick={() => handleRepay(loan)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Pay Overdue Now
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {filteredLoans.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No loans found for {activeProfile.stokvelName}</p>
              <Link 
                to={`/loans/request?profile=${profileId}`}
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Request a Loan
              </Link>
            </div>
          )}
        </div>

        {/* Back Link - PRESERVES PROFILE */}
        <div className="mt-6 flex justify-between items-center">
          <Link 
            to={`/dashboard?profile=${profileId}`}
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <Link
            to={`/loans/request?profile=${profileId}`}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Request New Loan
          </Link>
        </div>
      </main>

      {/* Repayment Confirmation Modal */}
      {showRepayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirm Repayment</h3>
              <p className="text-gray-500 text-sm">
                You are about to repay this loan
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Loan Amount:</span>
                <span className="font-bold text-gray-800">{formatCurrency(showRepayModal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest ({showRepayModal.interestRate}%):</span>
                <span className="font-bold text-secondary-600">{formatCurrency(showRepayModal.interest)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium">Total to Pay:</span>
                <span className="font-bold text-primary-700">{formatCurrency(showRepayModal.totalRepayable)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRepayModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRepayment}
                disabled={isProcessing}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}