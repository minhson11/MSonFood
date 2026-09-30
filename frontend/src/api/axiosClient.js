import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — đính kèm JWT token vào mọi request
axiosClient.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch {
        // Token bị lỗi format — bỏ qua
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap data, xử lý 401
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosClient;
