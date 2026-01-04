import axios from "axios";
import Config from "../config";

const API_BASE_URL = Config.apiUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Clerk token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get Clerk instance from window
      const clerkInstance = (window as any).Clerk;
      if (clerkInstance && clerkInstance.session) {
        const token = await clerkInstance.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Failed to get auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
