import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Clock, ArrowRight,
  TrendingUp, Shield, Users, BookOpen
} from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  icon: React.ReactNode;
}

export default function Blog() {
  const posts: BlogPost[] = [
    {
      id: 1,
      title: "Understanding Savings Groups: A Guide for Beginners",
      excerpt: "Savings groups are one of South Africa's oldest and most trusted forms of community savings. Learn how they work, why they matter, and how to get started with your first group.",
      category: "Getting Started",
      author: "Fund Mate Team",
      date: "15 Feb 2026",
      readTime: "5 min read",
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 2,
      title: "5 Tips to Maximize Your Group Savings",
      excerpt: "Small habits lead to big results. Discover practical strategies to boost your contributions, avoid late fees, and make the most of your group membership.",
      category: "Savings Tips",
      author: "Fund Mate Team",
      date: "28 Jan 2026",
      readTime: "4 min read",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 3,
      title: "How Group Loans Work: Borrowing Against Your Savings",
      excerpt: "Need cash in a pinch? Learn how group loans work, what the interest rates are, and how to borrow responsibly against your saved contributions.",
      category: "Loans",
      author: "Fund Mate Team",
      date: "10 Jan 2026",
      readTime: "6 min read",
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 4,
      title: "The Power of Community Saving in South Africa",
      excerpt: "From burial societies to investment clubs, savings groups have evolved over centuries. Explore the rich history and modern resurgence of community-based savings.",
      category: "Community",
      author: "Fund Mate Team",
      date: "20 Dec 2025",
      readTime: "7 min read",
      icon: <Users className="w-5 h-5" />
    },
    {
      id: 5,
      title: "Digital vs Traditional Savings Groups: What's Changed?",
      excerpt: "Technology is transforming how savings groups operate. Compare traditional paper-based methods with modern digital platforms and see why members are making the switch.",
      category: "Technology",
      author: "Fund Mate Team",
      date: "05 Dec 2025",
      readTime: "5 min read",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 6,
      title: "Setting Financial Goals with Your Savings Group",
      excerpt: "A savings group is more than just saving — it's about reaching goals together. Learn how to set realistic targets and hold each other accountable.",
      category: "Planning",
      author: "Fund Mate Team",
      date: "18 Nov 2025",
      readTime: "4 min read",
      icon: <BookOpen className="w-5 h-5" />
    }
  ];

  const categories = [...new Set(posts.map(p => p.category))];

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Insights</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Tips, guides, and stories about community savings and financial growth
          </p>
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium">All Posts</span>
          {categories.map((cat) => (
            <span key={cat} className="bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 hover:border-primary-300 hover:text-primary-600 cursor-pointer transition-colors">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white">
                  {post.icon}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="flex items-center text-xs text-gray-400 space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime}</span>
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{post.date}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start Your Savings Journey</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Ready to put these tips into action? Join Fund Mate today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl font-bold text-lg"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
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
