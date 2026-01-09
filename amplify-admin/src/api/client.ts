import axios from "axios";
import Config from "../config";
import { supabase } from "../lib/supabase";

const API_BASE_URL = Config.apiUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Supabase token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
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

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401 to support guest mode
    // Individual features can handle auth requirements as needed
    if (error.response?.status === 401) {
      console.warn(
        "Unauthorized request - user may need to sign in for this feature"
      );
    }
    return Promise.reject(error);
  }
);

// Create separate client for multipart uploads
export const apiClientMultipart = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Add same interceptors to multipart client
apiClientMultipart.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
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

apiClientMultipart.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        "Unauthorized request - user may need to sign in for this feature"
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
