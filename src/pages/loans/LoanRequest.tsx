import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Info,
  Users,
  Calendar,
  Percent,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function LoanRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || '1';
  
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Mock profile data
  const profiles = {
    '1': {
      id: '1',
      name: 'Nkulumo Nkuna',
      stokvelName: 'COLLECTIVE POT',
      stokvelId: 'collective-pot',
      icon: '🌱',
      savedAmount: 1070,
      totalContributions: 3000,
      memberSince: '21 Jan 2026',
      color: 'primary',
      targetAmount: 7000
    },
    '2': {
      id: '2',
      name: 'Nkulumo Nkuna',
      stokvelName: 'SUMMER SAVERS',
      stokvelId: 'summer-savers',
      icon: '💰',
      savedAmount: 850,
      totalContributions: 1500,
      memberSince: '05 Feb 2026',
      color: 'secondary',
      targetAmount: 5000
    }
  };

  const currentProfile = profiles[profileId as keyof typeof profiles] || profiles['1'];
  
  // Calculate loan amounts
  const maxLoanAmount = Math.floor(currentProfile.savedAmount * 0.5);
  const previouslyBorrowed = Math.floor(currentProfile.savedAmount * 0.3);
  const remainingToBorrow = maxLoanAmount - previouslyBorrowed;
  
  const requestedAmount = parseFloat(loanAmount) || 0;
  const interestAmount = requestedAmount * 0.3;
  const totalRepayable = requestedAmount + interestAmount;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const formattedDueDate = dueDate.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  const isValidAmount = requestedAmount >= 100 && requestedAmount <= remainingToBorrow;
  const isFormValid = isValidAmount && acceptTerms;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setShowConfirmation(true);
  };

  const confirmLoanRequest = () => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(false);
      navigate(`/loans?profile=${profileId}`, { 
        state: { 
          success: true, 
          message: `Loan of R ${requestedAmount} from ${currentProfile.stokvelName} successfully processed!` 
        } 
      });
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  const overdueAmount = requestedAmount * 0.6;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back button preserves profile */}
              <Link to={`/dashboard?profile=${profileId}`} className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Instant Loan Request</h2>
          <p className="text-gray-500">
            Borrowing from <span className="font-medium text-primary-600">{currentProfile.stokvelName}</span>
          </p>
        </div>

        {/* Instant Approval Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Instant Approval - No Waiting!</p>
            <p className="text-xs text-green-600 mt-1">
              As long as you have savings in {currentProfile.stokvelName}, you can borrow immediately.
            </p>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className={`bg-gradient-to-r from-${currentProfile.color}-50 to-${currentProfile.color}-100 rounded-xl p-6 mb-6 border border-${currentProfile.color}-200`}>
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 bg-${currentProfile.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className="text-2xl">{currentProfile.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-${currentProfile.color}-800 mb-2`}>
                Your {currentProfile.stokvelName} Savings
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                You can borrow up to <span className={`font-bold text-${currentProfile.color}-700`}>50%</span> of your savings
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Current Savings</p>
                  <p className="font-bold text-gray-800">{formatCurrency(currentProfile.savedAmount)}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Max Available (50%)</p>
                  <p className="font-bold text-green-600">{formatCurrency(maxLoanAmount)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Previously Borrowed</p>
                  <p className="font-bold text-primary-700">{formatCurrency(previouslyBorrowed)}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Remaining to Borrow</p>
                  <p className="font-bold text-blue-600">{formatCurrency(remainingToBorrow)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Request Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Info */}
            <div className={`bg-${currentProfile.color}-50 rounded-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                <Users className={`w-5 h-5 text-${currentProfile.color}-600`} />
                <div>
                  <p className="text-sm text-gray-500">Borrowing from</p>
                  <p className="font-medium text-gray-800">{currentProfile.icon} {currentProfile.stokvelName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className={`w-5 h-5 text-${currentProfile.color}-600`} />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-800">{currentProfile.memberSince}</p>
                </div>
              </div>
            </div>

            {/* Loan Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (R)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    loanAmount && !isValidAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter amount"
                  min="100"
                  max={remainingToBorrow}
                  step="100"
                />
              </div>
              {loanAmount && !isValidAmount && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {requestedAmount > remainingToBorrow 
                    ? `You can only borrow up to ${formatCurrency(remainingToBorrow)}` 
                    : 'Minimum loan amount is R 100'}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Min: R100 | Max available: {formatCurrency(remainingToBorrow)}
              </p>
            </div>

            {/* Purpose of Loan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose of Loan (Optional)
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Briefly explain why you need this loan (optional)"
              />
            </div>

            {/* Loan Summary */}
            {isValidAmount && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-primary-600" />
                  Loan Summary
                </h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Principal Amount:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(requestedAmount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Interest (30%):</span>
                  <span className="font-medium text-secondary-600">+ {formatCurrency(interestAmount)}</span>
                </div>
                
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Total to Repay:</span>
                  <span className="font-bold text-primary-700">{formatCurrency(totalRepayable)}</span>
                </div>

                <div className="flex justify-between text-sm bg-blue-50 p-2 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-600" />
                    Due Date:
                  </span>
                  <span className="font-bold text-blue-700">{formattedDueDate}</span>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3 mt-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800">Overdue Penalty</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        If not repaid by {formattedDueDate}, an additional 30% interest will be added.
                        Total interest becomes 60% ({formatCurrency(overdueAmount)}).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Terms Acceptance */}
            <div className="flex items-start">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                I understand that I have <span className="font-bold">30 days</span> to repay this loan with{' '}
                <span className="font-bold">30% interest</span>. If I fail to repay on time, an additional{' '}
                <span className="font-bold">30% interest</span> will be charged (total 60%).
              </span>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Request Loan from {currentProfile.stokvelName}
            </button>
          </form>
        </div>

        {/* Loan Rules Card */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2 text-gray-400" />
            Instant Loan Rules
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <span><span className="font-bold">No approval needed</span> - Instant access to funds</span>
            </li>
            <li className="flex items-start">
              <Percent className="w-4 h-4 text-secondary-600 mr-2 flex-shrink-0 mt-0.5" />
              <span><span className="font-bold">30% interest</span> charged upfront</span>
            </li>
            <li className="flex items-start">
              <Clock className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span><span className="font-bold">30 days</span> to repay</span>
            </li>
            <li className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <span><span className="font-bold">Overdue penalty:</span> Additional 30% (total 60% interest)</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirm Instant Loan</h3>
              <p className="text-gray-500 text-sm">
                You are about to borrow from {currentProfile.stokvelName}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Stokvel:</span>
                <span className="font-bold text-gray-800">{currentProfile.icon} {currentProfile.stokvelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loan Amount:</span>
                <span className="font-bold text-gray-800">{formatCurrency(requestedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest (30%):</span>
                <span className="font-bold text-secondary-600">{formatCurrency(interestAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium">Total to Repay:</span>
                <span className="font-bold text-primary-700">{formatCurrency(totalRepayable)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-bold text-blue-600">{formattedDueDate}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLoanRequest}
                disabled={isSubmitting}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm & Get Loan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}