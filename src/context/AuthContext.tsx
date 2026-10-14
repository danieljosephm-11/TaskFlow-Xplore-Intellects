import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';
import { User, UserRole } from '../types/client.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, requiredRole?: UserRole) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('taskflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('taskflow_token') || null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('taskflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('taskflow_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token invalid or expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('taskflow_token');
          localStorage.removeItem('taskflow_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, requiredRole?: UserRole) => {
    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
        requiredRole,
      });

      if (res.data.success) {
        const receivedUser = res.data.user;
        const receivedToken = res.data.token;

        setUser(receivedUser);
        setToken(receivedToken);
        localStorage.setItem('taskflow_user', JSON.stringify(receivedUser));
        localStorage.setItem('taskflow_token', receivedToken);

        return {
          success: true,
          message: res.data.message || 'Login successful',
          user: receivedUser,
        };
      }

      return {
        success: false,
        message: res.data.message || 'Login failed',
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unable to connect to server';
      return {
        success: false,
        message: msg,
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('taskflow_user');
      localStorage.removeItem('taskflow_token');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('taskflow_user', JSON.stringify(res.data.user));
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isEmployee: user?.role === 'EMPLOYEE',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
