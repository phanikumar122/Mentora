import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mentora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401 Unauthorized (expired/invalid token detected server-side)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mentora_token');
      localStorage.removeItem('mentora_user');
      // Redirect to login without triggering a full React re-render cycle
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (err: unknown): string => {
  if (!err) return 'An unexpected error occurred.';
  const axiosErr = err as {
    response?: { data?: { message?: string } | string; status?: number };
    message?: string;
    code?: string;
  };

  if (axiosErr.response?.data && typeof axiosErr.response.data === 'object' && axiosErr.response.data.message) {
    return axiosErr.response.data.message;
  }
  if (typeof axiosErr.response?.data === 'string' && axiosErr.response.data.trim()) {
    return axiosErr.response.data;
  }
  if (axiosErr.response?.status === 401) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (axiosErr.response?.status === 403) {
    return 'Access forbidden. Please verify your account role or permissions.';
  }
  if (axiosErr.code === 'ERR_NETWORK' || !axiosErr.response) {
    return `Unable to connect to the backend server (${API_BASE}). Please verify the backend API is online and CORS is configured.`;
  }
  if (axiosErr.message) {
    return axiosErr.message;
  }
  return 'Operation failed. Please verify that mentora-backend is running.';
};

export default api;
