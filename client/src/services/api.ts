import axios from 'axios';

// Get base server URL from VITE_API_URL or fallback to cloud backend
const rawUrl = (import.meta.env.VITE_API_URL as string) || 'https://sameeraas.alwaysdata.net';
// Strip trailing slashes
const cleanUrl = rawUrl.replace(/\/+$/, '');
// Ensure it points to the /api base path
export const API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
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
