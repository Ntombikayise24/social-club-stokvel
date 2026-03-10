import { useState, useEffect } from 'react';
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
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { helpApi } from '../../api';
import { showToast } from '../../utils/toast';
import { getCurrentUser } from '../../utils/auth';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState(() => {
    const user = getCurrentUser();
    return {
      name: user?.name || '',
      email: user?.email || '',
      message: ''
    };
  });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultFaqs = [
    {
      category: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      questions: [
        { q: 'How do I create an account?', a: 'Click on "Register" and fill in your details. Your account will need admin approval before you can log in.' },
        { q: 'How do I join a stokvel?', a: 'During registration, you can select which stokvel to join. Admin will assign you after approval.' },
        { q: 'What is a profile?', a: 'Each stokvel you join creates a separate profile. You can switch between profiles using the profile switcher.' }
      ]
    },
    {
      category: 'Contributions',
      icon: <DollarSign className="w-5 h-5" />,
      questions: [
        { q: 'How do I make a contribution?', a: 'Click the "Contribute" button on your dashboard and enter the amount.' },
        { q: 'When are contributions confirmed?', a: 'Admin confirms payments once received. You\'ll get a notification when confirmed.' },
        { q: 'What is the minimum contribution?', a: 'Minimum contribution is R100 per transaction.' }
      ]
    },
    {
      category: 'Loans',
      icon: <Target className="w-5 h-5" />,
      questions: [
        { q: 'How much can I borrow?', a: 'You can borrow up to 50% of your total contributions.' },
        { q: 'What is the interest rate?', a: 'Loans have a 30% interest rate. If overdue, an additional 30% is added.' },
        { q: 'How long do I have to repay?', a: 'Loans must be repaid within 30 days.' }
      ]
    },
    {
      category: 'Groups',
      icon: <Users className="w-5 h-5" />,
      questions: [
        { q: 'How many members are in a group?', a: 'Group sizes vary. Check the group details page for specific member counts.' },
        { q: 'When are group meetings?', a: 'Meeting schedules are set per group. Check the group details page.' },
        { q: 'How is interest shared?', a: 'At year end, total interest from loans is shared equally among members.' }
      ]
    }
  ];

  const [faqs, setFaqs] = useState(defaultFaqs);

  const iconMap: Record<string, JSX.Element> = {
    'Getting Started': <Book className="w-5 h-5" />,
    'Contributions': <DollarSign className="w-5 h-5" />,
    'Loans': <Target className="w-5 h-5" />,
    'Groups': <Users className="w-5 h-5" />,
  };

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const res = await helpApi.getFaqs();
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data.map((cat: any) => ({
            category: cat.category || 'General',
            icon: iconMap[cat.category] || <HelpCircle className="w-5 h-5" />,
            questions: (cat.questions || []).map((q: any) => ({
              q: q.question || q.q || '',
              a: q.answer || q.a || ''
            }))
          })));
        }
      } catch (err) {
        console.error('Failed to load FAQs, using defaults', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  // Filter FAQs based on search
  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await helpApi.submitContact(contactForm);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => {
        setContactSuccess(false);
        setShowContactForm(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit contact form', err);
      showToast.error('Failed to send message. Please try again.');
    }
  };

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
              <h1 className="text-2xl font-bold text-primary-800">FUND MATE</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">How can we help you?</h2>
          <p className="text-gray-600">Find answers to common questions about FUND MATE</p>
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

        {/* Quick Links - Now scroll to sections instead of 404 pages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {faqs.map((category, index) => (
            <button
              key={index}
              onClick={() => {
                const element = document.getElementById(`category-${index}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
                setSelectedCategory(category.category);
              }}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center group"
            >
              <div className="text-primary-600 mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              <span className="text-sm font-medium">{category.category}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
        </h3>
        
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mb-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No results found</h4>
            <p className="text-gray-500 mb-4">Try different keywords or browse categories above</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-6 mb-12">
            {filteredFaqs.map((category, idx) => (
              <div 
                key={idx} 
                id={`category-${idx}`}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-24 ${
                  selectedCategory === category.category ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-center space-x-2 mb-4">
                  <div className="text-primary-600">
                    {category.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">{category.category}</h4>
                </div>
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
        )}

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-8 text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Still need help?</h3>
          <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
          
          {!showContactForm ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowContactForm(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contact Support</span>
              </button>
              <a 
                href="mailto:support@hennessyclub.co.za"
                className="flex items-center space-x-2 px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
              >
                <Mail className="w-5 h-5" />
                <span>support@hennessyclub.co.za</span>
              </a>
              <a 
                href="tel:+27123456789"
                className="flex items-center space-x-2 px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
              >
                <Phone className="w-5 h-5" />
                <span>+27 (0) 12 345 6789</span>
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto">
              {contactSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Message Sent!</h4>
                  <p className="text-gray-600">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Message
                    </label>
                    <textarea
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Email</p>
                <a href="mailto:support@hennessyclub.co.za" className="text-sm text-primary-600 hover:text-primary-700">
                  support@hennessyclub.co.za
                </a>
                <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Phone</p>
                <a href="tel:+27123456789" className="text-sm text-primary-600 hover:text-primary-700">
                  +27 (0) 12 345 6789
                </a>
                <p className="text-xs text-gray-500 mt-1">Mon-Fri, 8am-5pm</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Office Hours</p>
                <p className="text-sm text-gray-600">Monday - Friday</p>
                <p className="text-sm text-gray-600">8:00 AM - 5:00 PM SAST</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}