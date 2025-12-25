import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
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
  validateUsername,
  formatErrorResponse,
  formatSuccessResponse
} from '../utils/helpers';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters, letters, numbers, underscore, hyphen only'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('first_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('First name must be 1-100 characters'),
  body('last_name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Last name must be 1-100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Auth response interface
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
 * Register new user account handler
 */
async function handleRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Log registration attempt for debugging
    console.log('📝 Registration attempt:', {
      email: req.body.email,
      username: req.body.username,
      hasPassword: !!req.body.password,
      bodyKeys: Object.keys(req.body)
    });

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
      return;
    }

    const { email, username, password, first_name, last_name } = req.body;

    // Additional validation
    const emailValid = validateEmail(email);
    if (!emailValid) {
      res.status(400).json(formatErrorResponse(
        'Invalid email format',
        ['Please provide a valid email address']
      ));
      return;
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      res.status(400).json(formatErrorResponse(
        'Invalid username',
        usernameValidation.errors
      ));
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('❌ Password validation failed:', passwordValidation.errors);
      res.status(400).json(formatErrorResponse(
        'Password does not meet requirements',
        passwordValidation.errors
      ));
      return;
    }

    // Check if email already exists
    const emailExistsCheck = await emailExists(email);
    if (emailExistsCheck) {
      res.status(409).json(formatErrorResponse(
        'Email already registered',
        ['An account with this email already exists']
      ));
      return;
    }

    // Check if username already exists
    const usernameExistsCheck = await usernameExists(username);
    if (usernameExistsCheck) {
      res.status(409).json(formatErrorResponse(
        'Username already taken',
        ['This username is already taken']
      ));
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

    res.status(201).json(formatSuccessResponse(
      'Account created successfully',
      { user, token }
    ));
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.message.includes('Email already exists')) {
      res.status(409).json(formatErrorResponse(
        'Email already registered',
        ['An account with this email already exists']
      ));
      return;
    }
    
    if (error.message.includes('Username already taken')) {
      res.status(409).json(formatErrorResponse(
        'Username already taken',
        ['This username is already taken']
      ));
      return;
    }

    res.status(500).json(formatErrorResponse(
      'Failed to create account. Please try again.',
      ['Internal server error']
    ));
  }
}

/**
 * Login user and return JWT token handler
 */
async function handleLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json(formatErrorResponse(
        'Validation errors',
        errors.array().map(err => err.msg)
      ));
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json(formatErrorResponse(
        'Invalid credentials',
        ['Email or password is incorrect']
      ));
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      res.status(403).json(formatErrorResponse(
        'Account deactivated',
        ['Your account has been deactivated. Please contact support.']
      ));
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash!);
    if (!isPasswordValid) {
      res.status(401).json(formatErrorResponse(
        'Invalid credentials',
        ['Email or password is incorrect']
      ));
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Update last login
    await updateLastLogin(user.id);

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.status(200).json(formatSuccessResponse(
      'Login successful',
      { user: userResponse, token }
    ));
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json(formatErrorResponse(
      'Login failed. Please try again.',
      ['Internal server error']
    ));
  }
}

/**
 * Get current user profile handler (protected route)
 */
async function handleGetProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json(formatErrorResponse(
        'Authentication required',
        ['Please log in to access this resource']
      ));
      return;
    }

    res.status(200).json(formatSuccessResponse(
      'Profile retrieved successfully',
      { user: req.user }
    ));
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json(formatErrorResponse(
      'Failed to retrieve profile',
      ['Internal server error']
    ));
  }
}

/**
 * Update current user profile handler (protected route)
 */
async function handleUpdateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json(formatErrorResponse(
        'Authentication required',
        ['Please log in to access this resource']
      ));
      return;
    }

    // Only allow updating editable fields
    const {
      first_name, last_name, age, gender, address, city, state, country, zip_code, phone
    } = req.body;

    // Basic validation (can be extended)
    if (age && (isNaN(Number(age)) || Number(age) < 0)) {
      res.status(400).json(formatErrorResponse('Invalid age', ['Age must be a positive number']));
      return;
    }

    // Build update query
    const fields = [
      { key: 'first_name', value: first_name },
      { key: 'last_name', value: last_name },
      { key: 'age', value: age },
      { key: 'gender', value: gender },
      { key: 'address', value: address },
      { key: 'city', value: city },
      { key: 'state', value: state },
      { key: 'country', value: country },
      { key: 'zip_code', value: zip_code },
      { key: 'phone', value: phone },
    ];
    const setClauses = fields
      .filter(f => typeof f.value !== 'undefined')
      .map((f, i) => `${f.key} = $${i + 1}`);
    const values = fields.filter(f => typeof f.value !== 'undefined').map(f => f.value);

    if (setClauses.length === 0) {
      res.status(400).json(formatErrorResponse('No fields to update', ['No profile fields provided']));
      return;
    }

    // Update user in DB
    const query = `UPDATE users SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${setClauses.length + 1} RETURNING *`;
    const { rows } = await (await import('../config/database')).default.query(query, [...values, req.user.id]);
    const updatedUser = rows[0];

    res.status(200).json(formatSuccessResponse('Profile updated successfully', { user: updatedUser }));
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json(formatErrorResponse('Failed to update profile', ['Internal server error']));
  }
}

/**
 * Logout user handler (client-side token removal)
 */
async function handleLogout(req: AuthenticatedRequest, res: Response): Promise<void> {
  // Since JWT tokens are stateless, logout is handled client-side
  // This endpoint exists for consistency and future features (like token blacklisting)
  res.status(200).json(formatSuccessResponse('Logout successful'));
}

/**
 * Verify if current token is valid handler
 */
async function handleVerifyAuth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json(formatErrorResponse(
        'Invalid or expired token',
        ['Authentication failed']
      ));
      return;
    }

    res.status(200).json(formatSuccessResponse(
      'Authentication valid',
      { user: req.user }
    ));
  } catch (error: any) {
    console.error('Verify auth error:', error);
    res.status(500).json(formatErrorResponse(
      'Authentication verification failed',
      ['Internal server error']
    ));
  }
}

// Routes

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', registerValidation, handleRegister);

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', loginValidation, handleLogin);

/**
 * GET /api/auth/profile
 * Get current user profile (protected)
 */
router.get('/profile', authenticateToken, handleGetProfile);
router.put('/profile', authenticateToken, handleUpdateProfile);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', handleLogout);

/**
 * GET /api/auth/verify
 * Verify if current token is valid (protected)
 */
router.get('/verify', authenticateToken, handleVerifyAuth);

export default router;