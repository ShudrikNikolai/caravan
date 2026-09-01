import { create } from 'zustand';

import { api, ApiError, PublicUser, RegisterPayload } from '@/lib/api';

interface AuthState {
  user: PublicUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  login: async (email, password) => {
    set({
      status: 'loading',
      error: null,
    });

    try {
      const { user } = await api.login({
        email,
        password,
      });

      set({
        user,
        status: 'authenticated',
        error: null,
      });
    } catch (error) {
      set({
        status: 'unauthenticated',
        error: error instanceof ApiError ? error.message : 'Ошибка входа',
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({
      status: 'loading',
      error: null,
    });

    try {
      const { user } = await api.register(payload);

      set({
        user,
        status: 'authenticated',
        error: null,
      });
    } catch (error) {
      set({
        status: 'unauthenticated',
        error: error instanceof ApiError ? error.message : 'Ошибка регистрации',
      });

      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } finally {
      set({
        user: null,
        status: 'unauthenticated',
        error: null,
      });
    }
  },

  fetchMe: async () => {
    set({
      status: 'loading',
      error: null,
    });

    try {
      const user = await api.me();

      set({
        user,
        status: 'authenticated',
      });
    } catch {
      set({
        user: null,
        status: 'unauthenticated',
      });
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
