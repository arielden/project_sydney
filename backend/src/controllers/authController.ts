import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  createUser, 
  findUserByEmail, 
  updateLastLogin,
  emailExists,
  usernameExists,
  UserResponse
} from '../models/User';
import { 
  hashPassword, 
  comparePassword, 
  generateToken,
  validatePassword,
  validateEmail,
  validateUsername
} from '../utils/auth';

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserResponse;
    token: string;
  };
  errors?: string[];
}

/**
 * Register new user account
 */
export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map(err => err.msg)
      });
      return;
    }

    const { email, username, password, first_name, last_name } = req.body;

    // Additional validation
    const emailValid = validateEmail(email);
    if (!emailValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: ['Please provide a valid email address']
      });
      return;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid username',
        errors: usernameValidation.errors
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
      return;
    }

    // Check if email already exists
    const emailExistsCheck = await emailExists(email);
    if (emailExistsCheck) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
        errors: ['An account with this email already exists']
      });
      return;
    }

    // Check if username already exists
    const usernameExistsCheck = await usernameExists(username);
    if (usernameExistsCheck) {
      res.status(409).json({
        success: false,
        message: 'Username already taken',
        errors: ['This username is already taken']
      });
      return;
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await createUser({
      email,
      username,
      password_hash,
      first_name: first_name?.trim() || undefined,
      last_name: last_name?.trim() || undefined
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Update last login
    await updateLastLogin(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
        token
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.message.includes('Email already exists')) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
        errors: ['An account with this email already exists']
      });
      return;
    }
    
    if (error.message.includes('Username already taken')) {
      res.status(409).json({
        success: false,
        message: 'Username already taken',
        errors: ['This username is already taken']
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.',
      errors: ['Internal server error']
    });
  }
}

/**
 * Login user and return JWT token
 */
export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map(err => err.msg)
      });
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect']
      });
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Account deactivated',
        errors: ['Your account has been deactivated. Please contact support.']
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash!);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: ['Email or password is incorrect']
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Update last login
    await updateLastLogin(user.id);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      errors: ['Internal server error']
    });
  }
}

/**
 * Get current user profile (protected route)
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: ['Please log in to access this resource']
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      errors: ['Internal server error']
    });
  }
}

/**
 * Logout user (client-side token removal)
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Since JWT tokens are stateless, logout is handled client-side
  // This endpoint exists for consistency and future features (like token blacklisting)
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}

/**
 * Verify if current token is valid
 */
export async function verifyAuth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        errors: ['Authentication failed']
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Authentication valid',
      data: {
        user: req.user
      }
    });
  } catch (error: any) {
    console.error('Verify auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication verification failed',
      errors: ['Internal server error']
    });
  }
}