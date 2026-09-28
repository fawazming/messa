import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/database';
import {
  ApiError,
  apiRequest,
  getApiBaseUrl,
  getApiToken,
  setApiBaseUrl,
  setApiToken,
} from '@/services/api';
import type { AppUser } from '@/types';

const USER_KEY = 'auth_user';

type LoginResponse = { token: string; user: AppUser };

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  token: string;
  phone?: string;
};

type AuthState = {
  ready: boolean;
  token: string | null;
  user: AppUser | null;
  apiBaseUrl: string;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setBaseUrl: (url: string) => Promise<void>;
  clearError: () => void;
};

function parseUser(raw: string | null): AppUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  token: null,
  user: null,
  apiBaseUrl: '',
  loading: false,
  error: null,

  hydrate: async () => {
    const [token, userRaw, baseUrl] = await Promise.all([
      getApiToken(),
      getSetting(USER_KEY),
      getApiBaseUrl(),
    ]);
    set({ token, user: parseUser(userRaw), apiBaseUrl: baseUrl, ready: true });
    if (token) {
      get().refreshUser();
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const result = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });
      await setApiToken(result.token);
      await setSetting(USER_KEY, JSON.stringify(result.user));
      set({ token: result.token, user: result.user, loading: false });
      return true;
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Sign in failed.' });
      return false;
    }
  },

  register: async (input) => {
    set({ loading: true, error: null });
    try {
      const result = await apiRequest<LoginResponse>('/auth/register', {
        method: 'POST',
        auth: false,
        body: input,
      });
      await setApiToken(result.token);
      await setSetting(USER_KEY, JSON.stringify(result.user));
      set({ token: result.token, user: result.user, loading: false });
      return true;
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Registration failed.' });
      return false;
    }
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on sign-out.
    }
    await setApiToken(null);
    await setSetting(USER_KEY, null);
    set({ token: null, user: null });
  },

  refreshUser: async () => {
    try {
      const result = await apiRequest<{ user: AppUser }>('/me');
      await setSetting(USER_KEY, JSON.stringify(result.user));
      set({ user: result.user });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await setApiToken(null);
        await setSetting(USER_KEY, null);
        set({ token: null, user: null });
      }
    }
  },

  setBaseUrl: async (url) => {
    await setApiBaseUrl(url);
    set({ apiBaseUrl: await getApiBaseUrl() });
  },

  clearError: () => set({ error: null }),
}));
