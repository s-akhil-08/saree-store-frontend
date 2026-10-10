import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useToast } from './ToastContext';
import { fetchApi } from '../api';

interface User {
  name: string;
  email: string;
  mobile?: string;
  is_demo?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string, mobile?: string, is_demo?: boolean) => void;
  logout: () => void;
  signup: (email: string, name: string, mobile?: string) => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  authPromptMessage: string | null;
  showAuthPrompt: (msg: string) => void;
  hideAuthPrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const refreshUser = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await fetchApi('/api/auth/me/');
      if (data && data.email) {
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.name || data.email;
        const currentUser: User = { 
          email: data.email, 
          name: fullName,
          mobile: data.mobile || data.phone || '',
          is_demo: !!data.is_demo
        };
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (e) {
      // Token invalid or expired
      setUser(null);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, name: string, mobile?: string, is_demo?: boolean) => {
    const formattedUser: User = { 
      email, 
      name: name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      mobile: mobile || '',
      is_demo: !!is_demo
    };
    setUser(formattedUser);
    refreshUser();
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      if (refresh) {
        await fetchApi('/api/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh })
        });
      }
    } catch (e) {
      console.error('Logout API error', e);
    } finally {
      setUser(null);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
  };

  const signup = (email: string, name: string, mobile?: string) => {
    const formattedUser = { 
      email, 
      name: name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      mobile: mobile || '' 
    };
    setUser(formattedUser);
    refreshUser();
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...updates } : (updates as User);
      return updated;
    });
  };

  const showAuthPrompt = (msg: string) => {
    addToast(msg, 'info');
  };

  const hideAuthPrompt = () => {};

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup, updateUser, refreshUser, authPromptMessage: null, showAuthPrompt, hideAuthPrompt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


