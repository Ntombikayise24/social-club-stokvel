import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function LoanHistory() {
  const [expandedLoan, setExpandedLoan] = useState<number | null>(null);
  const [filter, setFilter] = useState('all'); // all, active, repaid, overdue

  // Mock data - matches the prototype
  const loans = [
    {
      id: 1,
      amount: 230,
      interest: 69,
      interestRate: 30,
      totalRepayable: 299,
      status: 'overdue',
      borrowedDate: '26 Jan 2026',
      dueDate: '23 Mar 2026',
      purpose: 'Emergency expenses'
    },
    {
      id: 2,
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
      amount: 1610,
      interest: 483,
      interestRate: 30,
      totalRepayable: 2093,
      status: 'repaid',
      borrowedDate: '26 Jan 2026',
      dueDate: '23 Mar 2026',
      repaidDate: '15 Mar 2026',
      purpose: 'Business startup'
    }
  ];

  const stats = {
    totalInterestPaid: 1068,
    activeLoans: 0,
    totalBorrowed: loans.reduce((sum, loan) => sum + loan.amount, 0),
    totalRepaid: loans.filter(l => l.status === 'repaid').reduce((sum, loan) => sum + loan.totalRepayable, 0)
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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'repaid':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Repaid</span>;
      case 'overdue':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Overdue</span>;
      case 'active':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Active</span>;
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

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true;
    return loan.status === filter;
  });

  const toggleExpand = (id: number) => {
    setExpandedLoan(expandedLoan === id ? null : id);
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Loan History</h2>
          <p className="text-gray-500">View your loan borrowing history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Interest Paid</p>
            <p className="text-2xl font-bold text-primary-800">R {stats.totalInterestPaid.toLocaleString()}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Lifetime interest</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Active Loans</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeLoans}</p>
            <p className="text-xs text-gray-500 mt-2">No active loans</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Borrowed</p>
            <p className="text-2xl font-bold text-gray-800">R {stats.totalBorrowed.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">R {stats.totalRepaid.toLocaleString()} repaid</p>
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
            All Loans
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('repaid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'repaid' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Repaid
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Overdue
          </button>
        </div>

        {/* Loans List */}
        <div className="space-y-4">
          {filteredLoans.map((loan) => (
            <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Loan Header - Always Visible */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(loan.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(loan.status)}
                    <span className="text-lg font-semibold text-gray-800">
                      R {loan.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(loan.status)}
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
                    <span>+ R {loan.interest} interest</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium text-gray-700">
                    = R {loan.totalRepayable} total
                  </span>
                  {getInterestBadge(loan.interestRate)}
                </div>
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
                        <span className="text-sm text-gray-800">{loan.dueDate}</span>
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

                  <div className="flex space-x-2 mt-4">
                    <button className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                      View Receipt
                    </button>
                    {loan.status === 'overdue' && (
                      <button className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">
                        Pay Now
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
              <p className="text-gray-500 mb-2">No loans found</p>
              <Link 
                to="/dashboard" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link 
            to="/dashboard" 
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