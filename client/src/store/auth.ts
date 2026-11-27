import { create } from 'zustand';
import { api } from '../lib/api';

export type User = { id: string; name: string; email: string; phone?: string; role: 'customer' | 'admin' };

type AuthState = {
  user: User | null;
  ready: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setAuth: (user, token) => { localStorage.setItem('savora_token', token); set({ user }); },
  logout: () => { localStorage.removeItem('savora_token'); set({ user: null }); },
  hydrate: async () => {
    const token = localStorage.getItem('savora_token');
    if (!token) return set({ ready: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, ready: true });
    } catch {
      localStorage.removeItem('savora_token');
      set({ ready: true });
    }
  },
}));
