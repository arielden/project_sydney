import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import {
  register,
  login,
  getProfile,
  logout,
  verifyAuth
} from '../controllers/authController';

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

// Routes

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', registerValidation, register);

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', loginValidation, login);

/**
 * GET /api/auth/profile
 * Get current user profile (protected)
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', logout);

/**
 * GET /api/auth/verify
 * Verify if current token is valid (protected)
 */
router.get('/verify', authenticateToken, verifyAuth);

export default router;