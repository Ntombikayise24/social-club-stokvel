// Shared authentication utilities

export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('activeProfileId');
  window.location.href = '/login';
};

export const isAuthenticated = (): boolean => {
  const token = sessionStorage.getItem('token');
  return !!token;
};

export const getCurrentUser = () => {
  try {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin' || user?.role === 'superadmin';
};

export const isSuperAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'superadmin';
};
