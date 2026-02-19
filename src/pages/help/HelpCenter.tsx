import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  Users,
  DollarSign,
  Target
} from 'lucide-react';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        { q: 'How do I create an account?', a: 'Click on "Register" and fill in your details. Your account will need admin approval before you can log in.' },
        { q: 'How do I join a stokvel?', a: 'During registration, you can select which stokvel to join. Admin will assign you after approval.' },
        { q: 'What is a profile?', a: 'Each stokvel you join creates a separate profile. You can switch between profiles using the profile switcher.' }
      ]
    },
    {
      category: 'Contributions',
      questions: [
        { q: 'How do I make a contribution?', a: 'Click the "Contribute" button on your dashboard and enter the amount.' },
        { q: 'When are contributions confirmed?', a: 'Admin confirms payments once received. You\'ll get a notification when confirmed.' },
        { q: 'What is the minimum contribution?', a: 'Minimum contribution is R100 per transaction.' }
      ]
    },
    {
      category: 'Loans',
      questions: [
        { q: 'How much can I borrow?', a: 'You can borrow up to 50% of your total contributions.' },
        { q: 'What is the interest rate?', a: 'Loans have a 30% interest rate. If overdue, an additional 30% is added.' },
        { q: 'How long do I have to repay?', a: 'Loans must be repaid within 30 days.' }
      ]
    },
    {
      category: 'Groups',
      questions: [
        { q: 'How many members are in a group?', a: 'COLLECTIVE POT has 18 members. SUMMER SAVERS is flexible up to 15 members.' },
        { q: 'When are group meetings?', a: 'COLLECTIVE POT meets weekly on Sundays. SUMMER SAVERS meets monthly.' },
        { q: 'How is interest shared?', a: 'At year end, total interest from loans is shared equally among members.' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">How can we help you?</h2>
          <p className="text-gray-600">Find answers to common questions about HENNESSY SOCIAL CLUB</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Link to="/guide/getting-started" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
            <Book className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Getting Started</span>
          </Link>
          <Link to="/guide/contributions" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
            <DollarSign className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Contributions</span>
          </Link>
          <Link to="/guide/loans" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
            <Target className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Loans</span>
          </Link>
          <Link to="/guide/groups" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Groups</span>
          </Link>
        </div>

        {/* FAQs */}
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-6 mb-12">
          {faqs.map((category, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">{category.category}</h4>
              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => (
                  <div key={qIdx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <p className="font-medium text-gray-800 mb-2">{faq.q}</p>
                    <p className="text-sm text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Still need help?</h3>
          <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              <MessageCircle className="w-5 h-5" />
              <span>Live Chat</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50">
              <Mail className="w-5 h-5" />
              <span>Email Support</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50">
              <Phone className="w-5 h-5" />
              <span>Call Us</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}