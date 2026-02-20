import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically (except login/register)
api.interceptors.request.use((config) => {
  // Don't attach token for login/register endpoints
  if (config.url !== '/auth/login' && config.url !== '/auth/register') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses globally (token expired, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('profiles');
      // Only redirect if not already on login/register page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredGroups: number[];
    message?: string;
  }) => api.post('/auth/register', data),

  getMe: () => api.get('/auth/me'),
};

// ─── Stokvels ───────────────────────────────────────────
export const stokvelAPI = {
  getAll: () => api.get('/stokvels'),
  getPublic: () => api.get('/stokvels/public'),
  getById: (id: number) => api.get(`/stokvels/${id}`),
};

// ─── Contributions ──────────────────────────────────────
export const contributionAPI = {
  getByMembership: (membershipId: number) =>
    api.get(`/contributions/membership/${membershipId}`),
  create: (data: { membershipId: number; amount: number; paymentMethod: string }) =>
    api.post('/contributions', data),
};

// ─── Loans ──────────────────────────────────────────────
export const loanAPI = {
  getByMembership: (membershipId: number) =>
    api.get(`/loans/membership/${membershipId}`),
  request: (data: { membershipId: number; amount: number; reason: string }) =>
    api.post('/loans', data),
};

// ─── Notifications ──────────────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
};

// ─── Profile ────────────────────────────────────────────
export const profileAPI = {
  update: (data: { fullName?: string; phone?: string }) =>
    api.put('/profile', data),
};

// ─── Admin ──────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingUsers: () => api.get('/admin/pending-users'),
  approveUser: (userId: number, stokvelIds: number[]) =>
    api.post(`/admin/approve/${userId}`, { stokvelIds }),
  rejectUser: (userId: number) => api.post(`/admin/reject/${userId}`),
};

// ─── Payments (Paystack) ────────────────────────────────
export const PaymentAPI = {
  initializePayment: (data: { membershipId: number; amount: number; email: string }) =>
    api.post('/payments/initialize', data),
  verifyPayment: (data: { reference: string }) =>
    api.post('/payments/verify', data),
  getPaymentHistory: () =>
    api.get('/payments/history'),
  getTransaction: (transactionId: number) =>
    api.get(`/payments/transaction/${transactionId}`),
  getPaymentStats: (stokvelId: number) =>
    api.get(`/payments/stats/${stokvelId}`),
};

export default api;
