'use client';

import { create } from 'zustand';
import { authApi } from '@/services/api';
import { setToken, getToken } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  acceptSession: (token: string, user: AuthUser) => AuthUser;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
  bootstrap: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
    }),

  acceptSession: (token, user) => {
    setToken(token);
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    return user;
  },

  login: async (email, password) => {
    const result = await authApi.login(email, password);
    setToken(result.token);
    set({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
    });
    return result.user;
  },

  refreshUser: async () => {
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch {
      return null;
    }
  },

  logout: () => {
    setToken(null);
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  bootstrap: async () => {
    const token = getToken();

    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
