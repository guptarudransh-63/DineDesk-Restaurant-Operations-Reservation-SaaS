import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dinedesk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Don't auto-redirect abruptly if checking optional auth, but clear invalid token if corrupted
      if (error.response?.data?.message?.includes('Invalid')) {
        localStorage.removeItem('dinedesk_token');
        localStorage.removeItem('dinedesk_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
