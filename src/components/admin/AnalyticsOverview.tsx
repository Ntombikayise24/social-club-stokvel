import { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  DollarSign,
  Target,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Mock data for charts
const contributionData = [
  { month: 'Jan', amount: 4500, contributions: 12 },
  { month: 'Feb', amount: 6200, contributions: 18 },
  { month: 'Mar', amount: 7800, contributions: 24 },
  { month: 'Apr', amount: 5600, contributions: 16 },
  { month: 'May', amount: 8900, contributions: 28 },
  { month: 'Jun', amount: 10300, contributions: 32 },
  { month: 'Jul', amount: 9500, contributions: 30 },
  { month: 'Aug', amount: 11200, contributions: 35 },
  { month: 'Sep', amount: 12800, contributions: 40 },
];

const stokvelPerformance = [
  { name: 'COLLECTIVE POT', contributions: 24500, members: 15, target: 7000 },
  { name: 'SUMMER SAVERS', contributions: 18200, members: 8, target: 5000 },
  { name: 'WINTER WARMTH', contributions: 8900, members: 5, target: 3000 },
  { name: 'FESTIVE FUND', contributions: 15600, members: 12, target: 6000 },
  { name: 'EDUCATION EGG', contributions: 20300, members: 10, target: 8000 },
];

const paymentMethods = [
  { name: 'Card', value: 65 },
  { name: 'Bank Transfer', value: 35 },
];

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

const recentActivities = [
  { id: 1, type: 'payment', user: 'Nkulumo Nkuna', amount: 500, time: '5 min ago', status: 'success' },
  { id: 2, type: 'user', user: 'Mary Johnson', action: 'registered', time: '15 min ago', status: 'pending' },
  { id: 3, type: 'payment', user: 'Thabo Mbeki', amount: 350, time: '1 hour ago', status: 'success' },
  { id: 4, type: 'stokvel', user: 'Admin', action: 'created WINTER WARMTH', time: '2 hours ago', status: 'info' },
  { id: 5, type: 'payment', user: 'Sarah Jones', amount: 250, time: '3 hours ago', status: 'success' },
];

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, change, icon: Icon, color, subtitle }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-12 h-12 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className={`flex items-center space-x-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState('6m');
  const [selectedChart, setSelectedChart] = useState('contributions');

  const stats = {
    totalUsers: { value: 156, change: 12, subtitle: '+18 this month' },
    totalContributions: { value: 'R 458.2k', change: 8, subtitle: 'R 32.4k this month' },
    activeStokvels: { value: 12, change: -2, subtitle: '2 stokvels ending soon' },
    pendingPayments: { value: 'R 23.5k', change: 15, subtitle: '8 payments pending' }
  };

  // Safely format percentage for pie chart labels
  const renderPieLabel = (entry: any) => {
    const percent = entry?.percent;
    if (typeof percent === 'number') {
      return `${entry.name} ${(percent * 100).toFixed(0)}%`;
    }
    return entry.name;
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your stokvels today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="1m">Last 30 days</option>
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Download report">
            <Download className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.value}
          change={stats.totalUsers.change}
          icon={Users}
          color="bg-primary-500"
          subtitle={stats.totalUsers.subtitle}
        />
        <StatCard
          title="Total Contributions"
          value={stats.totalContributions.value}
          change={stats.totalContributions.change}
          icon={DollarSign}
          color="bg-green-500"
          subtitle={stats.totalContributions.subtitle}
        />
        <StatCard
          title="Active Stokvels"
          value={stats.activeStokvels.value}
          change={stats.activeStokvels.change}
          icon={Target}
          color="bg-blue-500"
          subtitle={stats.activeStokvels.subtitle}
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments.value}
          change={stats.pendingPayments.change}
          icon={CreditCard}
          color="bg-yellow-500"
          subtitle={stats.pendingPayments.subtitle}
        />
      </div>

      {/* Chart Type Selector */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedChart('contributions')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            selectedChart === 'contributions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Contributions Trend
        </button>
        <button
          onClick={() => setSelectedChart('stokvels')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            selectedChart === 'stokvels'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Stokvel Performance
        </button>
        <button
          onClick={() => setSelectedChart('payments')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            selectedChart === 'payments'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Payment Methods
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedChart === 'contributions' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Contributions Over Time</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Amount (R)</span>
                  <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={contributionData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {selectedChart === 'stokvels' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Stokvel Performance</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
                    <span className="text-xs text-gray-500">Contributions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-xs text-gray-500">Target</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stokvelPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="contributions" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="target" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {selectedChart === 'payments' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Payment Methods Distribution</h3>
              </div>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                      {paymentMethods.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity - Takes 1 column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.type === 'payment' && `💰 ${activity.user} contributed R ${activity.amount}`}
                    {activity.type === 'user' && `👤 ${activity.user} ${activity.action}`}
                    {activity.type === 'stokvel' && `🏦 ${activity.user} ${activity.action}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium w-full text-center py-2 border-t border-gray-200 pt-4">
            View all activity
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group">
            <Users className="w-6 h-6 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Add User</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group">
            <Target className="w-6 h-6 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">New Stokvel</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group">
            <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Record Payment</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group">
            <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Upcoming Payouts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Upcoming Payouts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">COLLECTIVE POT</p>
              <p className="text-sm text-gray-500">Payout date: 06 Dec 2026</p>
            </div>
            <span className="text-lg font-bold text-primary-600">R 7,000</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">SUMMER SAVERS</p>
              <p className="text-sm text-gray-500">Payout date: 31 Dec 2026</p>
            </div>
            <span className="text-lg font-bold text-primary-600">R 5,000</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">WINTER WARMTH</p>
              <p className="text-sm text-gray-500">Payout date: 01 Jun 2027</p>
            </div>
            <span className="text-lg font-bold text-primary-600">R 3,000</span>
          </div>
        </div>
      </div>
    </div>
  );
}