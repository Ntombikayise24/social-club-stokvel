import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Search, ChevronDown, ChevronUp,
  Book, DollarSign, Users, Target, HelpCircle, Shield
} from 'lucide-react';
import { helpApi } from '../../api';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  category: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const defaultFaqs: FaqCategory[] = [
    {
      category: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      items: [
        { question: 'How do I join a stokvel?', answer: 'Register an account and select a stokvel during registration. An admin will review and approve your application within 24-48 hours.' },
        { question: 'What documents do I need to register?', answer: 'You only need a valid email address and phone number to create an account. Additional verification may be required for large transactions.' },
      ]
    },
    {
      category: 'Contributions',
      icon: <DollarSign className="w-5 h-5" />,
      items: [
        { question: 'What is the minimum contribution amount?', answer: 'The minimum contribution is R100 per transaction. Your stokvel may have specific contribution requirements set by the group.' },
        { question: 'What happens if I miss a contribution?', answer: 'There is a 7-day grace period. After that, a 5% late fee is applied. Consistent missed contributions may affect your membership status.' },
        { question: 'Which payment methods are accepted?', answer: 'We accept Visa, Mastercard, and American Express debit/credit cards. Bank transfers and cash contributions (confirmed by admin) are also supported.' },
      ]
    },
    {
      category: 'Loans',
      icon: <Target className="w-5 h-5" />,
      items: [
        { question: 'How much can I borrow?', answer: 'You can borrow up to 50% of your total savings in a stokvel. The amount depends on your contribution history and standing in the group.' },
        { question: 'What is the interest rate on loans?', answer: 'The standard interest rate is 30% flat on the borrowed amount. Overdue loans incur an additional 30% penalty (60% total).' },
        { question: 'What is the repayment period?', answer: 'All loans must be repaid within 30 days from the date of borrowing. Early repayment is encouraged and welcomed.' },
      ]
    },
    {
      category: 'Account & Security',
      icon: <Shield className="w-5 h-5" />,
      items: [
        { question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the login page. Enter your registered email and you\'ll receive a 6-digit verification code to reset your password.' },
        { question: 'Can I belong to multiple stokvels?', answer: 'Yes! You can be a member of multiple stokvels simultaneously. Use the profile switcher on your dashboard to navigate between them.' },
      ]
    },
    {
      category: 'Leaving a Stokvel',
      icon: <Users className="w-5 h-5" />,
      items: [
        { question: 'What happens if I leave voluntarily?', answer: 'If you leave voluntarily, you will receive a refund of 50% of your total contributions. Any outstanding loans must be repaid first.' },
        { question: 'What if I am removed by an admin?', answer: 'If removed by an admin, all contributions are forfeited. This typically happens due to repeated policy violations.' },
      ]
    },
  ];

  const [faqs, setFaqs] = useState<FaqCategory[]>(defaultFaqs);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await helpApi.getFaqs();
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          const iconMap: Record<string, React.ReactNode> = {
            'Getting Started': <Book className="w-5 h-5" />,
            'Contributions': <DollarSign className="w-5 h-5" />,
            'Loans': <Target className="w-5 h-5" />,
            'Account & Security': <Shield className="w-5 h-5" />,
            'Leaving a Stokvel': <Users className="w-5 h-5" />,
          };
          setFaqs(data.map((cat: any) => ({
            category: cat.category,
            icon: iconMap[cat.category] || <HelpCircle className="w-5 h-5" />,
            items: cat.items || cat.questions || [],
          })));
        }
      } catch {
        // Use defaults
      }
    };
    fetchFaqs();
  }, []);

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link to="/register" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Join Now
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Find answers to common questions about Fund Mate and savings
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No questions match your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredFaqs.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                    {cat.icon}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{cat.category}</h2>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item, i) => {
                    const key = `${cat.category}-${i}`;
                    const isOpen = openItems[key];
                    return (
                      <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-800 pr-4">{item.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-gray-600 border-t border-gray-100 pt-3">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still have questions */}
        <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200 text-center">
          <HelpCircle className="w-10 h-10 text-primary-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">Can't find what you're looking for? Reach out to our support team.</p>
          <a
            href="mailto:info@socialclub.co.za"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span>Contact Support</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© {new Date().getFullYear()} FUND MATE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
