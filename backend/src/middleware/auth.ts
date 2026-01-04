import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { getSession, validateCsrfToken, SessionWithId } from '../services/session';
import { AppError } from '../errors/AppError';

// Extend Express Request to include session and user
declare global {
  namespace Express {
    interface Request {
      session?: SessionWithId;
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

// Session cookie name
export const SESSION_COOKIE_NAME = 'session_id';
export const CSRF_HEADER_NAME = 'x-csrf-token';

// State-changing HTTP methods that require CSRF validation
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Middleware that validates session and adds user to request
 * Returns 401 if no valid session exists
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Get and validate session
    const session = await getSession(sessionId);

    if (!session) {
      throw new AppError('Invalid or expired session', 401, 'SESSION_INVALID');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(session.userId).get();

    if (!userDoc.exists) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    const userData = userDoc.data();

    // Attach session and user to request
    req.session = session;
    req.user = {
      id: session.userId,
      username: userData?.username || '',
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that validates CSRF token for state-changing requests
 * Must be used after requireAuth middleware
 */
export async function validateCsrf(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip CSRF validation for non-state-changing methods
    if (!STATE_CHANGING_METHODS.includes(req.method)) {
      return next();
    }

    // Session must be present (should be set by requireAuth)
    if (!req.session) {
      throw new AppError('Session required for CSRF validation', 401, 'SESSION_REQUIRED');
    }

    // Get CSRF token from header
    const csrfToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!csrfToken) {
      throw new AppError('CSRF token required', 403, 'CSRF_TOKEN_MISSING');
    }

    // Validate CSRF token
    if (!validateCsrfToken(req.session, csrfToken)) {
      throw new AppError('Invalid CSRF token', 403, 'CSRF_TOKEN_INVALID');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Combined middleware for protected routes with CSRF validation
 * Usage: router.post('/protected', protectedRoute, handler)
 */
export const protectedRoute = [requireAuth, validateCsrf];
