import api from './client';

// ══════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post('/auth/login', data),

  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    selectedStokvel?: number;
  }) => api.post('/auth/register', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  verifyCode: (data: { email: string; code: string }) =>
    api.post('/auth/verify-code', data),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),

  getMe: () => api.get('/auth/me'),
};

// ══════════════════════════════════════════
//  USERS / PROFILE
// ══════════════════════════════════════════

export const userApi = {
  getMe: () => api.get('/users/me'),

  updateProfile: (data: { fullName?: string; email?: string; phone?: string }) =>
    api.put('/users/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),

  getProfiles: () => api.get('/users/me/profiles'),

  getDashboard: () => api.get('/users/me/dashboard'),
};

// ══════════════════════════════════════════
//  STOKVELS
// ══════════════════════════════════════════

export const stokvelApi = {
  list: () => api.get('/stokvels'),

  getDetails: (id: number) => api.get(`/stokvels/${id}`),

  joinRequest: (id: number) => api.post(`/stokvels/${id}/join-request`),
};

// ══════════════════════════════════════════
//  CONTRIBUTIONS
// ══════════════════════════════════════════

export const contributionApi = {
  list: (params?: {
    stokvelId?: number;
    status?: string;
    profileId?: number;
    page?: number;
    limit?: number;
  }) => api.get('/contributions', { params }),

  getStats: (params?: { stokvelId?: number; profileId?: number }) =>
    api.get('/contributions/stats', { params }),

  create: (data: {
    amount: number;
    profileId: number;
    cardId?: number;
    paymentMethod?: string;
  }) => api.post('/contributions', data),
};

// ══════════════════════════════════════════
//  LOANS
// ══════════════════════════════════════════

export const loanApi = {
  list: (params?: {
    profileId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/loans', { params }),

  getStats: () => api.get('/loans/stats'),

  request: (data: {
    amount: number;
    profileId: number;
    purpose?: string;
    cardId?: number;
  }) => api.post('/loans/request', data),

  repay: (id: number, cardId?: number) =>
    api.post(`/loans/${id}/repay`, { cardId }),
};

// ══════════════════════════════════════════
//  CARDS
// ══════════════════════════════════════════

export const cardApi = {
  list: () => api.get('/cards'),

  add: (data: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
  }) => api.post('/cards', data),

  setDefault: (id: number) => api.put(`/cards/${id}/default`),

  remove: (id: number) => api.delete(`/cards/${id}`),
};

// ══════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),

  markRead: (id: number) => api.put(`/notifications/${id}/read`),

  markAllRead: () => api.put('/notifications/read-all'),

  deleteRead: () => api.delete('/notifications/read'),
};

// ══════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════

export const settingsApi = {
  get: () => api.get('/settings'),

  update: (data: Record<string, boolean | string>) =>
    api.put('/settings', data),
};

// ══════════════════════════════════════════
//  HELP
// ══════════════════════════════════════════

export const helpApi = {
  getFaqs: () => api.get('/help/faq'),

  submitContact: (data: { name: string; email: string; message: string }) =>
    api.post('/help/contact', data),
};

// ══════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════

export const adminApi = {
  // Stats
  getStats: () => api.get('/admin/stats'),

  // Users
  listUsers: (params?: {
    search?: string;
    stokvelId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/users', { params }),

  createUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    status?: string;
    role?: string;
    stokvelIds?: number[];
  }) => api.post('/admin/users', data),

  updateUser: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/users/${id}`, data),

  approveUser: (id: number, stokvelIds?: number[]) =>
    api.post(`/admin/users/${id}/approve`, { stokvelIds }),

  deleteUser: (id: number, reason?: string) =>
    api.delete(`/admin/users/${id}`, { data: { reason } }),

  restoreUser: (id: number) => api.post(`/admin/users/${id}/restore`),

  permanentDeleteUser: (id: number) =>
    api.delete(`/admin/users/${id}/permanent`),

  listDeletedUsers: () => api.get('/admin/deleted-users'),

  // Stokvels
  listStokvels: () => api.get('/admin/stokvels'),

  createStokvel: (data: Record<string, unknown>) =>
    api.post('/admin/stokvels', data),

  updateStokvel: (id: number, data: Record<string, unknown>) =>
    api.put(`/admin/stokvels/${id}`, data),

  deleteStokvel: (id: number) => api.delete(`/admin/stokvels/${id}`),

  // Contributions
  listContributions: (params?: Record<string, unknown>) =>
    api.get('/admin/contributions', { params }),

  confirmContribution: (id: number) =>
    api.post(`/admin/contributions/${id}/confirm`),

  // Site settings
  getSiteSettings: () => api.get('/admin/settings'),

  updateSiteSettings: (data: Record<string, string>) =>
    api.put('/admin/settings', data),

  // Reports
  generateReport: (data: {
    reportType: string;
    dateRange?: { start: string; end: string };
    format?: string;
  }) => api.post('/admin/reports', data),

  // Join requests
  listJoinRequests: () => api.get('/admin/join-requests'),

  approveJoinRequest: (id: number) =>
    api.post(`/admin/join-requests/${id}/approve`),

  rejectJoinRequest: (id: number) =>
    api.post(`/admin/join-requests/${id}/reject`),
};

// ══════════════════════════════════════════
//  PAYMENTS (Paystack)
// ══════════════════════════════════════════

export const paymentApi = {
  initialize: (data: { amount: number; profileId: number }) =>
    api.post('/payments/initialize', data),

  verify: (reference: string) =>
    api.get(`/payments/verify/${reference}`),
};
