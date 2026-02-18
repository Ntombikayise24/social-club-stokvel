import { Link } from "react-router-dom";
import { Users, Target, Wallet, Shield, ArrowRight } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {/* Logo */}
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary-800">SOCIAL CLUB</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-primary-600 transition-colors">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Save Together,{' '}
                <span className="text-primary-600">Grow Together</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Join a community of savers. Reach your financial goals faster with SOCIAL CLUB - 
                the digital Stokvel management system that brings transparency and trust to group savings.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                  <p className="text-2xl font-bold text-primary-600">R126K+</p>
                  <p className="text-sm text-gray-500">Total Saved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">18</p>
                  <p className="text-sm text-gray-500">Active Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-600">30%</p>
                  <p className="text-sm text-gray-500">Interest Rate</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Column - Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Set Goals</h3>
                <p className="text-sm text-gray-500">R7,000 or R15,000 targets that work for you</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-secondary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Borrow Smart</h3>
                <p className="text-sm text-gray-500">Borrow 50% of your savings at 30% interest</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">18 Members</h3>
                <p className="text-sm text-gray-500">Close-knit groups with shared goals</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">100% Transparent</h3>
                <p className="text-sm text-gray-500">Every transaction timestamped and visible</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2026 SOCIAL CLUB. All rights reserved. Your trusted Stokvel partner.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;