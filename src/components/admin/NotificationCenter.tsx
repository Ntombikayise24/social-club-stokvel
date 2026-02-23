import { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'New User Registration',
      message: 'Mary Johnson has registered and is pending approval',
      time: '5 min ago',
      read: false
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Confirmed',
      message: 'R 1,200 contribution from Peter Williams confirmed',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Stokvel Target Alert',
      message: 'COLLECTIVE POT is 85% towards target',
      time: '2 hours ago',
      read: true
    },
    {
      id: '4',
      type: 'success',
      title: 'New Stokvel Created',
      message: 'WINTER WARMTH stokvel has been created successfully',
      time: '3 hours ago',
      read: true
    },
    {
      id: '5',
      type: 'error',
      title: 'Payment Failed',
      message: 'Payment from John Doe failed. Please check payment details.',
      time: '5 hours ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'hover:bg-gray-50';
    switch(type) {
      case 'success': return 'bg-green-50 hover:bg-green-100';
      case 'error': return 'bg-red-50 hover:bg-red-100';
      case 'warning': return 'bg-yellow-50 hover:bg-yellow-100';
      default: return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${getBgColor(notification.type, notification.read)}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getIcon(notification.type)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-200">
              <button className="text-sm text-primary-600 hover:text-primary-700 w-full text-center font-medium">
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}