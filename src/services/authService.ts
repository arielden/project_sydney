import api, { apiHelpers } from './api';
import type { AuthUser, AuthResponse, LoginCredentials, RegisterData } from './api';

/**
 * Authentication service - handles all auth-related API calls
 */
export const authService = {
  /**
   * Login user with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<AuthResponse> - User data and JWT token
   */
  async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      const credentials: LoginCredentials = { email, password };
      const response = await api.post('/auth/login', credentials);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Register new user account
   * @param userData - User registration data
   * @returns Promise<AuthResponse> - User data and JWT token
   */
  async registerUser(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }
      
      return response.data.data;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Get current user profile
   * @returns Promise<AuthUser> - Current user data
   */
  async getUserProfile(): Promise<AuthUser> {
    try {
      const response = await api.get('/auth/profile');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get profile');
      }
      
      return response.data.data.user;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Verify current authentication token
   * @returns Promise<AuthUser> - Current user data if token is valid
   */
  async verifyAuth(): Promise<AuthUser> {
    try {
      const response = await api.get('/auth/verify');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Authentication verification failed');
      }
      
      return response.data.data.user;
    } catch (error: any) {
      const message = apiHelpers.extractErrorMessage(error);
      throw new Error(message);
    }
  },

  /**
   * Logout user (client-side token removal)
   * Note: Server-side logout is optional since JWT tokens are stateless
   * @returns Promise<void>
   */
  async logoutUser(): Promise<void> {
    try {
      // Call server logout endpoint (optional)
      await api.post('/auth/logout');
    } catch (error) {
      // Don't throw error for logout API call failure
      console.warn('Server logout failed (non-critical):', error);
    }
  },
};

export default authService;