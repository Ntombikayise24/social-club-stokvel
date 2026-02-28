import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, Target, Wallet, Shield, ArrowRight, ArrowLeft, Settings, X, Mail, Lock, 
  AlertCircle, Eye, EyeOff, TrendingUp, CheckCircle, Clock, Award,
  ChevronRight, Star, Facebook, Twitter, Instagram, Linkedin,
  Menu, Phone, MapPin, DollarSign, Bell
} from 'lucide-react';
import { authApi } from './api';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function App() {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [liveStats, setLiveStats] = useState({ totalSaved: 'R0', activeMembers: 0, activeStokvels: 0 });

  // Fetch live stats from database
  useEffect(() => {
    axios.get(`${API_BASE.replace('/api', '')}/api/public/stats`)
      .then(res => setLiveStats(res.data))
      .catch(() => {});
  }, []);

  // Admin credentials handled by backend API

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAdminClick = () => {
    setShowAdminModal(true);
    setLoginError('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const res = await authApi.login({ email: adminEmail, password: adminPassword });
      const { token, user } = res.data;

      if (user.role !== 'admin') {
        setLoginError('This account does not have admin access');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      setShowAdminModal(false);
      navigate('/admin');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Invalid email or password';
      setLoginError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowAdminModal(false);
    setLoginError('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false);
  };

  const testimonials = [
    {
      name: "Nkulumo Nkuna",
      role: "Member since 2025",
      content: "This stokvel has changed my life. I've saved R15,000 in just 8 months!",
      rating: 5,
      image: "👨🏾"
    },
    {
      name: "Sarah Jones",
      role: "Treasurer",
      content: "The transparency and trust in this group is amazing. Highly recommend!",
      rating: 5,
      image: "👩🏼"
    },
    {
      name: "Mandla Zulu",
      role: "Member since 2024",
      content: "Borrowed against my savings for my business. Best decision ever!",
      rating: 5,
      image: "👨🏿"
    }
  ];

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Smart Goals",
      description: "Set and track savings targets",
      color: "primary",
      stats: "R7k - R15k"
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Easy Loans",
      description: "Borrow up to 50% of savings",
      color: "secondary",
      stats: "30% interest"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "High Returns",
      description: "Watch your money grow",
      color: "green",
      stats: "+30% annually"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Safe",
      description: "Bank-level security",
      color: "blue",
      stats: "100% protected"
    }
  ];

  const stats = [
    { value: liveStats.totalSaved, label: "Total Saved", icon: <DollarSign className="w-4 h-4" />, trend: "live" },
    { value: String(liveStats.activeMembers), label: "Active Members", icon: <Users className="w-4 h-4" />, trend: "live" },
    { value: "30%", label: "Interest Rate", icon: <TrendingUp className="w-4 h-4" />, trend: "fixed" },
    { value: "24/7", label: "Support", icon: <Clock className="w-4 h-4" />, trend: "always" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative animate-modalIn" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all z-10">
              <X className="w-5 h-5" />
            </button>
            <button onClick={closeModal} className="absolute left-4 top-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all z-10 flex items-center gap-1">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400 rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full"></div>
              <Shield className="absolute left-6 bottom-6 w-10 h-10 text-white/90" />
            </div>

            <div className="px-8 pb-8">
              <div className="text-center -mt-12 mb-6 relative">
                <div className="w-20 h-20 bg-primary-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 transform rotate-3 hover:rotate-0 transition-transform">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Admin Access</h3>
                <p className="text-sm text-gray-500 mt-1">Secure portal for administrators only</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Authentication Failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{loginError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3.5 rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all disabled:opacity-50 font-semibold flex items-center justify-center shadow-lg shadow-primary-200"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Access Dashboard'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  ⚡ Two-factor authentication enabled • IP logging active
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-110">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-800 to-primary-600 bg-clip-text text-transparent">
                HENNESSY SOCIAL CLUB
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={handleAdminClick}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-all border-2 border-primary-200 hover:border-primary-300"
              >
                <Settings className="w-4 h-4" />
                <span className="font-medium">Admin</span>
              </button>

              <Link 
                to="/login" 
                className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-2.5 rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-200 font-semibold"
              >
                Sign In
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t mt-3 py-4 px-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleAdminClick}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </button>
              <Link 
                to="/login" 
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="pt-24 md:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full border border-primary-200">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">Trusted by 100+ members</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="text-gray-900">Save Together,</span>
                <br />
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  Grow Together
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Join a community of smart savers. Reach your financial goals faster with 
                <span className="font-semibold text-primary-600"> SOCIAL CLUB </span> 
                — the digital Stokvel management system that brings transparency and trust to group savings.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-primary-600">{stat.icon}</div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link 
                  to="/register" 
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-200 font-semibold text-lg"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>100% Transparent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group bg-white p-6 rounded-2xl shadow-lg border-2 border-transparent hover:border-primary-200 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-${feature.color}-600`}>{feature.icon}</div>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{feature.description}</p>
                  <p className={`text-xs font-semibold text-${feature.color}-600 bg-${feature.color}-50 px-2 py-1 rounded-full inline-block`}>
                    {feature.stats}
                  </p>
                </div>
              ))}

              <div className="col-span-2 bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span className="font-semibold">Current Cycle</span>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Active</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Total Pool:</span>
                    <span className="font-bold">R 45,600</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Next Payout:</span>
                    <span className="font-bold">06 Dec 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Members:</span>
                    <span className="font-bold">15/18</span>
                  </div>
                </div>
                <button className="w-full mt-4 bg-white/20 hover:bg-white/30 rounded-xl py-2 transition-colors flex items-center justify-center space-x-2">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 mt-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It <span className="text-primary-600">Works</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Simple, transparent, and effective - join thousands of successful savers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg relative z-10">
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                    <span className="text-2xl font-bold text-primary-600">{step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {step === 1 && "Join a Stokvel"}
                    {step === 2 && "Save Together"}
                    {step === 3 && "Grow & Withdraw"}
                  </h3>
                  <p className="text-gray-600">
                    {step === 1 && "Choose a stokvel that matches your savings goals and contribute regularly."}
                    {step === 2 && "Watch your savings grow with 30% annual interest. Borrow against your savings when needed."}
                    {step === 3 && "Receive your payout with interest at the end of the cycle. Withdraw anytime."}
                  </p>
                </div>
                {step < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-primary-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our <span className="text-primary-600">Members Say</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Real stories from real people who achieved their financial goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Saving?</h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">Join SOCIAL CLUB today and take control of your financial future with our trusted community</p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl font-bold text-lg"
          >
            <span>Join Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">SOCIAL CLUB</span>
              </div>
              <p className="text-sm">Building wealth together through trusted community savings.</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2"><Phone className="w-4 h-4" /><span>+27 (0) 82 123 4567</span></li>
                <li className="flex items-center space-x-2"><Mail className="w-4 h-4" /><span>info@socialclub.co.za</span></li>
                <li className="flex items-center space-x-2"><MapPin className="w-4 h-4" /><span>Johannesburg, SA</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Newsletter</h4>
              <p className="text-sm mb-3">Get updates on new features and financial tips</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-primary-500 text-white" />
                <button className="px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 transition-colors">Subscribe</button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>© 2026 SOCIAL CLUB. All rights reserved. Your trusted Stokvel partner.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-modalIn { animation: modalIn 0.3s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}

export default App;