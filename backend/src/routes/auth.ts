import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { firestore } from 'firebase-admin';
import { db } from '../config/firebase';
import { AppError } from '../errors/AppError';

const router = Router();

// Types
interface RegisterRequest {
  username: string;
  password: string;
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

export default router;
