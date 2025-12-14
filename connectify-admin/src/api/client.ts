import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For multipart form data uploads
export const apiClientMultipart = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor to add Clerk token - for apiClient
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const clerkInstance = (window as any).Clerk;
      if (clerkInstance && clerkInstance.session) {
        const token = await clerkInstance.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor to add Clerk token - for apiClientMultipart
apiClientMultipart.interceptors.request.use(
  async (config) => {
    try {
      const clerkInstance = (window as any).Clerk;
      if (clerkInstance && clerkInstance.session) {
        const token = await clerkInstance.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors - for apiClient
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors - for apiClientMultipart
apiClientMultipart.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
