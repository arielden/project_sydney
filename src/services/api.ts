import axios from 'axios';

/**
 * API response interface for all backend responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

/**
 * Authenticated user interface
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  current_elo?: number;
  peak_elo?: number;
}

/**
 * Authentication response interface
 */
export interface AuthResponse {
  user: AuthUser;
  token: string;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User registration data interface
 */
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Configured axios instance with interceptors
 * Handles authentication tokens and error responses
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for global error handling
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      // Redirect to login if not already on auth pages
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // Use setTimeout to prevent navigation conflicts
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API helper functions for error handling and message extraction
 */
export const apiHelpers = {
  /**
   * Extract user-friendly error message from API error response
   * @param error - Axios error object
   * @returns string - User-friendly error message
   */
  extractErrorMessage: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.response?.data?.errors?.length > 0) {
      return error.response.data.errors[0];
    }

    if (error.message) {
      return error.message;
    }

    return 'An unexpected error occurred';
  },

  /**
   * Extract all error messages as array
   * @param error - Axios error object
   * @returns string[] - Array of error messages
   */
  extractErrorMessages: (error: any): string[] => {
    if (error.response?.data?.errors?.length > 0) {
      return error.response.data.errors;
    }

    const message = apiHelpers.extractErrorMessage(error);
    return [message];
  },

  /**
   * Check if error is network-related
   * @param error - Axios error object
   * @returns boolean - True if network error
   */
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },

  /**
   * Check if error is authentication-related
   * @param error - Axios error object
   * @returns boolean - True if auth error
   */
  isAuthError: (error: any): boolean => {
    return error.response?.status === 401 || error.response?.status === 403;
  },

  /**
   * Check if error is validation-related
   * @param error - Axios error object
   * @returns boolean - True if validation error
   */
  isValidationError: (error: any): boolean => {
    return error.response?.status === 400 && error.response?.data?.errors;
  },
};

export default api;