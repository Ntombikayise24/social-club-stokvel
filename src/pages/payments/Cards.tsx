import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  PlusCircle, 
  Trash2, 
  CreditCard,
  CheckCircle,
  Lock,
  AlertCircle
} from 'lucide-react';

interface Card {
  id: string;
  cardType: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
}

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([
    {
      id: '1',
      cardType: 'visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '25',
      cardholderName: 'Nkulumo Nkuna',
      isDefault: true
    },
    {
      id: '2',
      cardType: 'mastercard',
      last4: '8888',
      expiryMonth: '08',
      expiryYear: '26',
      cardholderName: 'Nkulumo Nkuna',
      isDefault: false
    }
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  const handleSetDefault = (id: string) => {
    setCards(cards.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
    setShowSuccessMessage('Default card updated successfully');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleDeleteCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
    setShowDeleteConfirm(null);
    setShowSuccessMessage('Card removed successfully');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleAddCard = (newCard: Card) => {
    setCards([...cards, newCard]);
    setShowAddCard(false);
    setShowSuccessMessage('Card added successfully');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const getCardIcon = (type: string) => {
    switch(type) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      default:
        return '💳 Card';
    }
  };

  const getCardColor = (type: string) => {
    switch(type) {
      case 'visa':
        return 'from-blue-500 to-blue-600';
      case 'mastercard':
        return 'from-orange-500 to-red-500';
      case 'amex':
        return 'from-blue-400 to-indigo-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Your Cards</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your payment methods</p>
          </div>
          <button
            onClick={() => setShowAddCard(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add New Card</span>
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">🔒 PCI Compliant</p>
            <p className="text-xs text-blue-600 mt-1">
              Your card information is encrypted and stored securely. We never store CVV numbers.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          {cards.map(card => (
            <div
              key={card.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                card.isDefault ? 'border-primary-500' : 'border-gray-200'
              }`}
            >
              {/* Card Preview */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Card Art */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getCardColor(card.cardType)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {card.cardType === 'visa' ? 'V' : card.cardType === 'mastercard' ? 'MC' : 'AMEX'}
                    </div>

                    {/* Card Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800">
                          {getCardIcon(card.cardType)} •••• {card.last4}
                        </h3>
                        {card.isDefault && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-sm text-gray-600">
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                        <span className="text-gray-300">|</span>
                        <p className="text-sm text-gray-600">
                          {card.cardholderName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        className="text-sm bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(card.id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Meta Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Added on {new Date().toLocaleDateString()}</span>
                  <span>Last used: Today</span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {cards.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No cards saved</h3>
              <p className="text-gray-500 mb-6">Add a card to start making contributions</p>
              <button
                onClick={() => setShowAddCard(true)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Your First Card
              </button>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">💳 Card Security</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-green-600 mt-0.5" />
              <span>All card information is encrypted using industry-standard SSL</span>
            </div>
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-green-600 mt-0.5" />
              <span>We never store your CVV number after transaction</span>
            </div>
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Your card details are never shared with third parties</span>
            </div>
          </div>
        </div>
      </main>

      {/* Add Card Modal */}
      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onAdd={handleAddCard}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Remove Card</h3>
              <p className="text-gray-500">
                Are you sure you want to remove this card? This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCard(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Card Modal Component
function AddCardModal({ onClose, onAdd }: { onClose: () => void; onAdd: (card: Card) => void }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const detectCardType = (number: string): 'visa' | 'mastercard' | 'amex' => {
    const firstDigit = number.charAt(0);
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    return 'visa';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const cleanNumber = formData.cardNumber.replace(/\s/g, '');

    if (!cleanNumber.match(/^\d{16}$/)) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    if (!formData.expiryMonth || !formData.expiryYear) {
      newErrors.expiry = 'Expiry date is required';
    } else {
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      const expYear = parseInt(formData.expiryYear);
      const expMonth = parseInt(formData.expiryMonth);

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiry = 'Card has expired';
      }
    }

    if (!formData.cvv.match(/^\d{3}$/)) {
      newErrors.cvv = 'CVV must be 3 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      const cleanNumber = formData.cardNumber.replace(/\s/g, '');
      const cardType = detectCardType(cleanNumber);

      const newCard: Card = {
        id: Date.now().toString(),
        cardType,
        last4: cleanNumber.slice(-4),
        expiryMonth: formData.expiryMonth,
        expiryYear: formData.expiryYear,
        cardholderName: formData.cardholderName,
        isDefault: false
      };

      onAdd(newCard);
      setIsProcessing(false);
    }, 1500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Card</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: formatCardNumber(e.target.value)})}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={formData.cardholderName}
                onChange={(e) => setFormData({...formData, cardholderName: e.target.value})}
                placeholder="As shown on card"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardholderName && (
                <p className="mt-1 text-xs text-red-600">{errors.cardholderName}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formData.expiryMonth}
                    onChange={(e) => setFormData({...formData, expiryMonth: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0');
                      return <option key={month} value={month}>{month}</option>;
                    })}
                  </select>
                  <select
                    value={formData.expiryYear}
                    onChange={(e) => setFormData({...formData, expiryYear: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">YY</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = (new Date().getFullYear() + i).toString().slice(-2);
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
                {errors.expiry && (
                  <p className="mt-1 text-xs text-red-600">{errors.expiry}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="password"
                  value={formData.cvv}
                  onChange={(e) => setFormData({...formData, cvv: e.target.value.replace(/[^0-9]/g, '').slice(0, 3)})}
                  placeholder="123"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength={3}
                />
                {errors.cvv && (
                  <p className="mt-1 text-xs text-red-600">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 rounded-lg p-3 flex items-start space-x-2">
              <Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Your CVV is not stored and will be requested for each transaction
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Card'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}