import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Use VITE_API_URL for deployed environments (e.g., Render backend), fallback to '/api' for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Crucial for sending HttpOnly cookies (refreshToken)
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config) => {
    // Read current state of token from Zustand store
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Auto Refresh Token on 401 Expiry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token call itself fails (401)
    if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        
        // Call refresh endpoint
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken }, { withCredentials: true });
        
        if (res.data && res.data.accessToken) {
          const newAccess = res.data.accessToken;
          const newRefresh = res.data.refreshToken;
          
          // Update Zustand store
          useAuthStore.getState().setSession(newAccess, newRefresh, res.data.user);
          
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          processQueue(null, newAccess);
          
          isRefreshing = false;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Log out user if session cannot be refreshed
        useAuthStore.getState().clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
