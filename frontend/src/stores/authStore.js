import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,   // start true so ProtectedRoute waits for init()
  error: null,

  // Initialize from localStorage
  init: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      set({ loading: true });
      const res = await api.get('/auth/me');
      set({ user: res.data.user, loading: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      set({ user: res.data.user, loading: false });
      return { success: true, role: res.data.user.role };
    } catch (err) {
      const errorData = err.response?.data;
      set({ error: errorData?.error || 'Login failed', loading: false });
      return { success: false, error: errorData?.error, code: errorData?.code, user_id: errorData?.user_id };
    }
  },

  logout: async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    try { await api.post('/auth/logout', { refresh_token }); } catch {}
    localStorage.clear();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
