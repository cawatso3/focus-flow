import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Profile } from '@/lib/types';
import * as store from '@/lib/store';

interface AuthContextType {
  user: { id: string; profile: Profile } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; profile: Profile } | null>(() => {
    const saved = localStorage.getItem('nc_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Re-hydrate the store
        store.simulateLogin(parsed.email || 'user@example.com');
        const current = store.getCurrentUser();
        if (current && current.profile) {
          return { id: current.id, profile: { ...current.profile, ...parsed.profile } };
        }
      } catch { /* ignore */ }
    }
    return null;
  });
  const [isLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string) => {
    const result = store.simulateLogin(email);
    const userData = { id: result.userId, profile: result.profile };
    setUser(userData);
    localStorage.setItem('nc_auth', JSON.stringify({ email, profile: result.profile }));
  }, []);

  const signup = useCallback(async (email: string, _password: string, name?: string) => {
    const result = store.simulateSignup(email, name);
    const userData = { id: result.userId, profile: result.profile };
    setUser(userData);
    localStorage.setItem('nc_auth', JSON.stringify({ email, profile: result.profile }));
  }, []);

  const logoutFn = useCallback(() => {
    store.logout();
    setUser(null);
    localStorage.removeItem('nc_auth');
  }, []);

  const updateProfileFn = useCallback((updates: Partial<Profile>) => {
    const updated = store.updateProfile(updates);
    if (updated && user) {
      const newUser = { ...user, profile: updated };
      setUser(newUser);
      const saved = localStorage.getItem('nc_auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem('nc_auth', JSON.stringify({ ...parsed, profile: updated }));
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout: logoutFn, updateProfile: updateProfileFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
