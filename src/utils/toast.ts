import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      icon: '✅',
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      icon: '❌',
    });
  },

  warning: (message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      icon: '⚠️',
    });
  },

  info: (message: string) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      icon: 'ℹ️',
    });
  },

  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      success: {
        duration: 3000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
        },
      },
      error: {
        duration: 4000,
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
        },
      },
      loading: {
        duration: Infinity,
        style: {
          background: '#6b7280',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '10px',
        },
      },
    });
  },

  custom: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: colors[type],
        color: '#fff',
        padding: '16px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }
};