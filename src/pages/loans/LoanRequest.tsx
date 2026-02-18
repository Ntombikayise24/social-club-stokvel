import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Info,
  Users,
  Calendar,
  Percent,
  Clock,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export default function LoanRequest() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('1');
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Mock user data - user belongs to multiple groups
  const userGroups = [
    {
      id: '1',
      name: 'COLLECTIVE POT',
      icon: '🌱',
      totalContributions: 3000,
      availableBalance: 3000,
      memberSince: '21 Jan 2026',
      color: 'primary'
    },
    {
      id: '2',
      name: 'HENNESSY SOCIAL CLUB',
      icon: '🥃',
      totalContributions: 1500,
      availableBalance: 1500,
      memberSince: '05 Feb 2026',
      color: 'secondary'
    }
  ];

  // Get current group data
  const currentGroup = userGroups.find(g => g.id === selectedGroup) || userGroups[0];
  
  // Calculate maximum loan amount (50% of contributions for selected group)
  const maxLoanAmount = currentGroup.totalContributions * 0.5;
  
  // Calculate loan details
  const requestedAmount = parseFloat(loanAmount) || 0;
  const interestAmount = requestedAmount * 0.3;
  const totalRepayable = requestedAmount + interestAmount;
  
  // Calculate due date (30 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const formattedDueDate = dueDate.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  // Validation
  const isValidAmount = requestedAmount >= 100 && requestedAmount <= maxLoanAmount;
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
      navigate('/loans', { state: { 
        success: true, 
        message: `Loan of R ${requestedAmount} from ${currentGroup.name} successfully processed! Amount will reflect in your account within 24 hours.` 
      } });
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  const overdueAmount = requestedAmount * 0.6;
  const totalOverdueRepayable = requestedAmount + overdueAmount;

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
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Instant Loan Request</h2>
          <p className="text-gray-500">No approval needed - Get your money instantly</p>
        </div>

        {/* Instant Approval Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Instant Approval - No Waiting!</p>
            <p className="text-xs text-green-600 mt-1">
              As long as you have contributions, you can take a loan immediately. No group voting required.
            </p>
          </div>
        </div>

        {/* Stokvel Selection Dropdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Stokvel to Borrow From *
          </label>
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setLoanAmount(''); // Reset amount when group changes
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {userGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.icon} {group.name} - Available: {formatCurrency(group.totalContributions)} (50% max: {formatCurrency(group.totalContributions * 0.5)})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Eligibility Card - Now shows selected group's info */}
        <div className={`bg-gradient-to-r from-${currentGroup.color}-50 to-${currentGroup.color}-100 rounded-xl p-6 mb-6 border border-${currentGroup.color}-200`}>
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 bg-${currentGroup.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className="text-2xl">{currentGroup.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-${currentGroup.color}-800 mb-2`}>
                Your Loan Eligibility for {currentGroup.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                You can borrow up to <span className={`font-bold text-${currentGroup.color}-700`}>50%</span> of your contributions in this Stokvel
              </p>
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Available Balance in {currentGroup.name}:</span>
                  <span className="font-bold text-gray-800">{formatCurrency(currentGroup.availableBalance)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Maximum Loan (50%):</span>
                  <span className={`font-bold text-lg text-${currentGroup.color}-700`}>{formatCurrency(maxLoanAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Request Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Info - Shows selected group */}
            <div className={`bg-${currentGroup.color}-50 rounded-lg p-4 flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                <Users className={`w-5 h-5 text-${currentGroup.color}-600`} />
                <div>
                  <p className="text-sm text-gray-500">Selected Stokvel</p>
                  <p className="font-medium text-gray-800">{currentGroup.icon} {currentGroup.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className={`w-5 h-5 text-${currentGroup.color}-600`} />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-800">{currentGroup.memberSince}</p>
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
                  max={maxLoanAmount}
                  step="100"
                />
              </div>
              {loanAmount && !isValidAmount && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {requestedAmount > maxLoanAmount 
                    ? `Maximum loan amount for ${currentGroup.name} is ${formatCurrency(maxLoanAmount)}` 
                    : 'Minimum loan amount is R 100'}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum: R100 | Maximum for {currentGroup.name}: {formatCurrency(maxLoanAmount)}
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
                  Loan Summary for {currentGroup.name}
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

                {/* Due Date */}
                <div className="flex justify-between text-sm bg-blue-50 p-2 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-600" />
                    Due Date:
                  </span>
                  <span className="font-bold text-blue-700">{formattedDueDate}</span>
                </div>

                {/* Overdue Warning */}
                <div className="bg-yellow-50 rounded-lg p-3 mt-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800">Overdue Penalty</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        If not repaid by {formattedDueDate}, an additional 30% interest will be added.
                        Total interest becomes 60% ({formatCurrency(overdueAmount)}).
                      </p>
                      <p className="text-xs text-yellow-800 font-medium mt-1">
                        Total would become: {formatCurrency(totalOverdueRepayable)}
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
                I understand that I have <span className="font-bold">30 days</span> to repay this loan from {currentGroup.name} with{' '}
                <span className="font-bold">30% interest</span>. If I fail to repay on time, an additional{' '}
                <span className="font-bold">30% interest</span> will be charged (total 60%).
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Request Instant Loan from {currentGroup.name}
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
                You are about to borrow from {currentGroup.name}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Stokvel:</span>
                <span className="font-bold text-gray-800">{currentGroup.icon} {currentGroup.name}</span>
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