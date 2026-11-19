import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization Bearer token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('omnisync_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and we're not on the auth page, clear stored credentials
      if (!window.location.pathname.startsWith('/auth')) {
        localStorage.removeItem('omnisync_token');
        localStorage.removeItem('omnisync_user');
      }
    }
    return Promise.reject(error);
  }
);

