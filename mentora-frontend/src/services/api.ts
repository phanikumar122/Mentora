import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE,
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

export const getApiErrorMessage = (err: any): string => {
  if (!err) return 'An unexpected error occurred.';
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  if (typeof err.response?.data === 'string' && err.response.data.trim()) {
    return err.response.data;
  }
  if (err.message) {
    return err.message;
  }
  return 'Operation failed. Please verify that mentora-backend is running.';
};

export default api;
