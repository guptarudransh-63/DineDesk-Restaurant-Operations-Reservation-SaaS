import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('dinedesk_user') || 'null'),
  token: localStorage.getItem('dinedesk_token') || null,
  isAuthenticated: !!localStorage.getItem('dinedesk_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('dinedesk_token', token);
      localStorage.setItem('dinedesk_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  demoLogin: async (targetRole) => {
    const roleEmailMap = {
      admin: 'admin@dinedesk.com',
      manager: 'manager@dinedesk.com',
      waiter: 'waiter@dinedesk.com',
      kitchen: 'chef@dinedesk.com',
      cashier: 'cashier@dinedesk.com',
      customer: 'customer@dinedesk.com',
    };
    const email = roleEmailMap[targetRole] || 'customer@dinedesk.com';
    return await get().login(email, 'password123');
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data;
      localStorage.setItem('dinedesk_token', token);
      localStorage.setItem('dinedesk_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('dinedesk_token');
    localStorage.removeItem('dinedesk_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('dinedesk_token');
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.user, isAuthenticated: true });
      localStorage.setItem('dinedesk_user', JSON.stringify(response.data.user));
    } catch (err) {
      get().logout();
    }
  },
}));
