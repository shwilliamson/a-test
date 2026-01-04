import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { firestore } from 'firebase-admin';
import rateLimit from 'express-rate-limit';
import { db } from '../config/firebase';
import { AppError } from '../errors/AppError';

const router = Router();

// Rate limiter for login endpoint - 5 attempts per minute
const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per window
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts. Please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Types
interface RegisterRequest {
  username: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

interface User {
  username: string;
  passwordHash: string;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

// Validation constants
const USERNAME_MIN_LENGTH = 6;
const USERNAME_MAX_LENGTH = 12;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;
const BCRYPT_ROUNDS = 10;

/**
 * Async handler wrapper to properly catch errors in async routes
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/auth/register
 * Register a new user with username and password
 */
router.post('/register', asyncHandler(async (req: Request<object, object, RegisterRequest>, res: Response) => {
  const { username, password } = req.body;

  // Validate username
  if (!username || typeof username !== 'string') {
    throw new AppError('Username is required', 400, 'VALIDATION_ERROR');
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < USERNAME_MIN_LENGTH) {
    throw new AppError(
      `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
    throw new AppError(
      `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // Validate password
  if (!password || typeof password !== 'string') {
    throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new AppError(
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // Check if username already exists
  const usersRef = db.collection('users');
  const existingUser = await usersRef
    .where('username', '==', trimmedUsername)
    .limit(1)
    .get();

  if (!existingUser.empty) {
    throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
  }

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user document
  const now = firestore.Timestamp.now();
  const userData: User = {
    username: trimmedUsername,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const userDoc = await usersRef.add(userData);

  // TODO: Create session (will be implemented in login issue)
  // For now, return success with user info

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: userDoc.id,
      username: trimmedUsername,
    },
  });
}));

/**
 * POST /api/auth/login
 * Authenticate a user with username and password
 */
router.post('/login', loginRateLimiter, asyncHandler(async (req: Request<object, object, LoginRequest>, res: Response) => {
  const { username, password, rememberMe } = req.body;

  // Generic error message for security - don't reveal if user exists
  const invalidCredentialsError = new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');

  // Validate username presence
  if (!username || typeof username !== 'string') {
    throw invalidCredentialsError;
  }

  // Validate password presence
  if (!password || typeof password !== 'string') {
    throw invalidCredentialsError;
  }

  const trimmedUsername = username.trim();

  // Look up user by username
  const usersRef = db.collection('users');
  const userQuery = await usersRef
    .where('username', '==', trimmedUsername)
    .limit(1)
    .get();

  if (userQuery.empty) {
    // User doesn't exist - return generic error
    // Add artificial delay to prevent timing attacks
    await bcrypt.compare(password, '$2b$10$fakehashtopreventtimingattacks');
    throw invalidCredentialsError;
  }

  const userDoc = userQuery.docs[0];
  const userData = userDoc.data() as User;

  // Compare password with stored hash
  const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);

  if (!isPasswordValid) {
    throw invalidCredentialsError;
  }

  // TODO: Create session (will be implemented in session management issue)
  // For now, return success with user info and rememberMe flag
  // The session management issue will handle actual session creation

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: userDoc.id,
      username: userData.username,
    },
    rememberMe: rememberMe ?? false,
  });
}));

export default router;
