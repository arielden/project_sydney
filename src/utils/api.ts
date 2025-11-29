import axios from 'axios';

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

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

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid - remove from storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register new user
  register: async (userData: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: AuthUser }>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Verify current token
  verifyAuth: async (): Promise<ApiResponse<{ user: AuthUser }>> => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// General API helper functions
export const apiHelpers = {
  // Handle API errors and extract meaningful messages
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

  // Extract all error messages as array
  extractErrorMessages: (error: any): string[] => {
    if (error.response?.data?.errors?.length > 0) {
      return error.response.data.errors;
    }
    
    const message = apiHelpers.extractErrorMessage(error);
    return [message];
  },

  // Check if error is network related
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },

  // Check if error is authentication related
  isAuthError: (error: any): boolean => {
    return error.response?.status === 401 || error.response?.status === 403;
  },

  // Check if error is validation related
  isValidationError: (error: any): boolean => {
    return error.response?.status === 400 && error.response?.data?.errors;
  },
};

// Health check API
export const healthAPI = {
  check: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;