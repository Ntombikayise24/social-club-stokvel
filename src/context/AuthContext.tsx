import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../services/api';

// ─── Types ──────────────────────────────────────────────
export interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'member';
  status: string;
  memberSince: string;
}

export interface ProfileData {
  id: number;
  stokvelName: string;
  stokvelId: number;
  stokvelIcon: string;
  stokvelColor: string;
  role: string;
  targetAmount: number;
  savedAmount: number;
  progress: number;
  joinedDate?: string;
}

interface AuthContextType {
  user: UserData | null;
  profiles: ProfileData[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredGroups: number[];
    message?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [profiles, setProfiles] = useState<ProfileData[]>(() => {
    const stored = localStorage.getItem('profiles');
    return stored ? JSON.parse(stored) : [];
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!token && !!user;

  // On mount, if we have a token, verify it's still valid
  useEffect(() => {
    if (token && !user) {
      refreshUser().catch(() => {
        logout();
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authAPI.login(email, password);
      const { token: newToken, user: userData, profiles: profileData } = res.data.data;

      // Save to state
      setToken(newToken);
      setUser(userData);
      setProfiles(profileData);

      // Persist
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('profiles', JSON.stringify(profileData));

      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredGroups: number[];
    message?: string;
  }) => {
    try {
      const res = await authAPI.register(data);
      return { success: true, message: res.data.message };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setProfiles([]);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profiles');
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const res = await authAPI.getMe();
      const { user: userData, profiles: profileData } = res.data.data;

      setUser(userData);
      setProfiles(profileData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('profiles', JSON.stringify(profileData));
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
