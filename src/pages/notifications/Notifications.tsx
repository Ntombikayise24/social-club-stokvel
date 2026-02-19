import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Calendar,
  CheckCheck,
  X
} from 'lucide-react';

// Remove "export default" from here - just "interface"
interface Notification {
  id: number;
  type: 'contribution' | 'loan' | 'approval' | 'payment' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionable?: boolean;
  actionLink?: string;
  actionText?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'contribution',
      title: 'Contribution Confirmed',
      message: 'Your contribution of R200 to COLLECTIVE POT has been confirmed.',
      time: '2 hours ago',
      read: false,
      actionable: true,
      actionLink: '/contributions?profile=1',
      actionText: 'View History'
    },
    {
      id: 2,
      type: 'loan',
      title: 'Loan Repayment Due',
      message: 'Your loan repayment of R299 is due in 3 days.',
      time: '1 day ago',
      read: false,
      actionable: true,
      actionLink: '/loans?profile=1',
      actionText: 'View Loan'
    },
    {
      id: 3,
      type: 'approval',
      title: 'Welcome to HENNESSY SOCIAL CLUB!',
      message: 'Your account has been approved. Start your savings journey today!',
      time: '2 days ago',
      read: true,
      actionable: true,
      actionLink: '/dashboard',
      actionText: 'Go to Dashboard'
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Received',
      message: 'R350 contribution from Thabo Mbeki has been confirmed.',
      time: '3 days ago',
      read: true,
      actionable: false
    },
    {
      id: 5,
      type: 'reminder',
      title: 'Weekly Meeting Reminder',
      message: 'COLLECTIVE POT meeting this Sunday at 10:00 AM.',
      time: '4 days ago',
      read: true,
      actionable: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'contribution':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'loan':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'payment':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'reminder':
        return <Calendar className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'contribution':
        return 'bg-green-50 border-green-200';
      case 'loan':
        return 'bg-orange-50 border-orange-200';
      case 'approval':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-purple-50 border-purple-200';
      case 'reminder':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
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
              <h1 className="text-2xl font-bold text-primary-800">HENNESSY SOCIAL CLUB</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
            <p className="text-gray-500 text-sm mt-1">Stay updated with your stokvel activities</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-xl p-4 transition-all ${
                notification.read ? 'bg-white border-gray-200' : `${getTypeColor(notification.type)} border-2`
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.read ? 'bg-gray-100' : 'bg-white'
                  }`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold ${
                        notification.read ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${
                      notification.read ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{notification.time}</span>
                      {notification.actionable && (
                        <Link
                          to={notification.actionLink || '#'}
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {notification.actionText || 'View Details'} →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close button for read notifications */}
                {notification.read && (
                  <button
                    onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {notifications.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
// Only one default export at the end