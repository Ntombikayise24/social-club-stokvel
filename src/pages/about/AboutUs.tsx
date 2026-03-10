import { Link } from 'react-router-dom';
import {
  Users, Target, Shield, Heart, ArrowLeft, CheckCircle,
  TrendingUp, Award, Globe, Handshake
} from 'lucide-react';

export default function AboutUs() {
  const values = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Trust & Transparency",
      description: "Every transaction is tracked and visible. No hidden fees, no surprises — just honest community savings."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Ubuntu Spirit",
      description: "We believe in the power of community. Together, we achieve more than we ever could alone."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Financial Growth",
      description: "Our platform helps members grow their savings with competitive interest rates and smart tools."
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "Accountability",
      description: "Every member is accountable. Our system ensures fairness and timely contributions for everyone."
    }
  ];

  const milestones = [
    { year: "2024", event: "Fund Mate founded with a vision to digitize savings groups" },
    { year: "2024", event: "First 50 members joined the platform" },
    { year: "2025", event: "Launched loan management and card payment features" },
    { year: "2025", event: "Reached 100+ active members across multiple stokvels" },
    { year: "2026", event: "Expanded with advanced analytics and multi-stokvel support" },
  ];

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
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">About Fund Mate</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Building Wealth Together</h1>
          <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
            Fund Mate is a modern digital platform that brings the traditional South African savings group 
            into the digital age. We help communities save, grow, and achieve their financial goals together.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our <span className="text-primary-600">Mission</span></h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Stokvels have been a cornerstone of South African communities for generations — a trusted way 
                for people to pool money together, support each other, and build financial stability.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our mission is to preserve this tradition while making it more accessible, transparent, and 
                efficient through technology. We provide the tools for communities to manage their savings 
                groups with confidence, from contribution tracking to loan management.
              </p>
              <div className="space-y-3">
                {["Digitize traditional stokvel management", "Provide full transparency on all transactions", "Enable easy loan access against savings", "Build stronger financial communities"].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Users className="w-8 h-8" />, stat: "100+", label: "Active Members" },
                { icon: <Target className="w-8 h-8" />, stat: "R500K+", label: "Total Saved" },
                { icon: <Award className="w-8 h-8" />, stat: "3+", label: "Active Stokvels" },
                { icon: <TrendingUp className="w-8 h-8" />, stat: "30%", label: "Annual Interest" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary-600">
                    {item.icon}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
                  <p className="text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our <span className="text-primary-600">Values</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 text-primary-600">
                  {value.icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our <span className="text-primary-600">Journey</span></h2>
            <p className="text-gray-600">Key milestones in our growth</p>
          </div>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="text-sm font-bold text-primary-600">{m.year}</span>
                </div>
                <div className="flex-shrink-0 w-3 h-3 bg-primary-600 rounded-full mt-1.5 relative">
                  {i < milestones.length - 1 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-primary-200" />
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-1">
                  <p className="text-gray-700">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Join the Community?</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Start saving smarter today. Join Fund Mate and be part of a trusted community of savers.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl font-bold text-lg"
          >
            <span>Get Started</span>
          </Link>
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
