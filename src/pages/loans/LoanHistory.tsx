import { useState, useEffect } from 'react';
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
  Users,
} from 'lucide-react';
import { loanApi, cardApi, userApi } from '../../api';
import { downloadBlob, getExtension } from '../../utils/download';

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

interface Card {
  id: string;
  type: 'visa' | 'mastercard';
  last4: string;
  label: string;
  isDefault: boolean;
}

export default function LoanHistory() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || '1';
  
  const [expandedLoan, setExpandedLoan] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [showRepayModal, setShowRepayModal] = useState<Loan | null>(null);
  const [selectedCard, setSelectedCard] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [repaymentSuccess, setRepaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profilesRes, cardsRes, loansRes] = await Promise.all([
          userApi.getProfiles(),
          cardApi.list(),
          loanApi.list({ profileId: Number(profileId) })
        ]);

        setProfiles((profilesRes.data || []).map((p: any) => ({
          id: String(p.id),
          name: p.stokvelName || '',
          stokvelName: p.stokvelName || ''
        })));

        const cardsList = (cardsRes.data || []).map((c: any) => ({
          id: String(c.id),
          type: c.cardType || 'visa',
          last4: c.last4 || '****',
          label: `${c.cardType === 'visa' ? 'Visa' : c.cardType === 'mastercard' ? 'Mastercard' : c.cardType} •••• ${c.last4}`,
          isDefault: c.isDefault
        }));
        setCards(cardsList);
        const defaultCard = cardsList.find((c: any) => c.isDefault) || cardsList[0];
        if (defaultCard) setSelectedCard(defaultCard.id);

        const loansData = loansRes.data?.data || loansRes.data || [];
        setLoans(loansData.map((l: any) => ({
          id: l.id,
          profileId: String(l.profileId || profileId),
          profileName: l.stokvelName || '',
          stokvelName: l.stokvelName || '',
          amount: l.amount || 0,
          interest: l.interest || 0,
          interestRate: l.interestRate || 30,
          totalRepayable: l.totalRepayable || 0,
          status: l.status || 'active',
          borrowedDate: l.borrowedDate ? new Date(l.borrowedDate).toLocaleDateString('en-ZA', {day:'numeric', month:'short', year:'numeric'}) : '',
          dueDate: l.dueDate ? new Date(l.dueDate).toLocaleDateString('en-ZA', {day:'numeric', month:'short', year:'numeric'}) : '',
          repaidDate: l.repaidDate ? new Date(l.repaidDate).toLocaleDateString('en-ZA', {day:'numeric', month:'short', year:'numeric'}) : undefined,
          purpose: l.purpose,
          daysRemaining: l.daysRemaining
        })));
      } catch (err) {
        console.error('Failed to load loan data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profileId]);

  const activeProfile = profiles.find(p => p.id === profileId) || profiles[0] || { id: profileId, name: '', stokvelName: 'Stokvel' };

  // All loans are already filtered by API
  const profileLoans = loans;

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
    const defaultCard = cards.find(c => c.isDefault) || cards[0];
    if (defaultCard) setSelectedCard(defaultCard.id);
    setRepaymentSuccess(false);
  };

  const confirmRepayment = async () => {
    if (!showRepayModal) return;
    
    setIsProcessing(true);
    
    try {
      await loanApi.repay(showRepayModal.id, selectedCard ? Number(selectedCard) : undefined);
      
      // Update loan status locally
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === showRepayModal.id 
            ? { 
                ...loan, 
                status: 'repaid' as const, 
                repaidDate: new Date().toLocaleDateString('en-ZA', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })
              } 
            : loan
        )
      );
      
      setRepaymentSuccess(true);
      
      setTimeout(() => {
        setShowRepayModal(null);
        setRepaymentSuccess(false);
      }, 1500);
    } catch (err: any) {
      showToast.error(err.response?.data?.error || 'Failed to process repayment');
    } finally {
      setIsProcessing(false);
    }
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

  const handleDownload = async (format: string) => {
    try {
      setIsDownloading(true);
      setShowDownloadMenu(false);
      const res = await loanApi.download({ profileId: Number(profileId), format });
      const ext = getExtension(format);
      downloadBlob(new Blob([res.data]), `loan-history.${ext}`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
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
              <div className="relative">
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isDownloading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isDownloading ? (
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Download Report</p>
                    <button onClick={() => handleDownload('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <span className="text-red-500">📄</span><span>PDF Report</span>
                    </button>
                    <button onClick={() => handleDownload('excel')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <span className="text-green-500">📊</span><span>Excel Spreadsheet</span>
                    </button>
                    <button onClick={() => handleDownload('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <span className="text-blue-500">📋</span><span>CSV File</span>
                    </button>
                  </div>
                )}
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
        ) : (<>
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
        </>)}
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

            {/* Card Selection - Where to take money from */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay From
              </label>
              <select 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedCard}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'new') {
                    window.location.href = '/cards';
                  } else {
                    setSelectedCard(value);
                  }
                }}
              >
                {cards.map(card => (
                  <option key={card.id} value={card.id}>
                    💳 {card.label} {card.isDefault ? '(Default)' : ''}
                  </option>
                ))}
                <option value="new">➕ Add New Card</option>
              </select>
              
              <div className="flex justify-between items-center mt-2">
                <Link to="/cards" className="text-xs text-primary-600 hover:text-primary-700">
                  Manage Cards →
                </Link>
                <span className="text-xs text-gray-400">🔒 Secured payment</span>
              </div>
            </div>

            {/* Success State */}
            {repaymentSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Payment Successful!</p>
                <p className="text-xs text-green-600 mt-1">Your loan has been repaid</p>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRepayModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRepayment}
                  disabled={isProcessing}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}