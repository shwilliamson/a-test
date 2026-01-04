import crypto from 'crypto';
import { firestore } from 'firebase-admin';
import { db } from '../config/firebase';

// Session configuration
const SESSION_ID_LENGTH = 32; // 256 bits
const CSRF_TOKEN_LENGTH = 32;
const REMEMBER_ME_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Types
export interface Session {
  userId: string;
  csrfToken: string;
  expiresAt: firestore.Timestamp | null;
  createdAt: firestore.Timestamp;
  rememberMe: boolean;
}

export interface SessionWithId extends Session {
  sessionId: string;
}

/**
 * Generates a cryptographically secure random token
 */
function generateSecureToken(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Creates a new session for a user
 */
export async function createSession(
  userId: string,
  rememberMe: boolean = false
): Promise<SessionWithId> {
  const sessionId = generateSecureToken(SESSION_ID_LENGTH);
  const csrfToken = generateSecureToken(CSRF_TOKEN_LENGTH);
  const now = firestore.Timestamp.now();

  // Calculate expiration
  let expiresAt: firestore.Timestamp | null = null;
  if (rememberMe) {
    const expiryDate = new Date(Date.now() + REMEMBER_ME_EXPIRY_MS);
    expiresAt = firestore.Timestamp.fromDate(expiryDate);
  }

  const sessionData: Session = {
    userId,
    csrfToken,
    expiresAt,
    createdAt: now,
    rememberMe,
  };

  // Store session in Firestore
  await db.collection('sessions').doc(sessionId).set(sessionData);

  return {
    sessionId,
    ...sessionData,
  };
}

/**
 * Retrieves and validates a session by ID
 * Returns null if session doesn't exist or is expired
 */
export async function getSession(sessionId: string): Promise<SessionWithId | null> {
  if (!sessionId) {
    return null;
  }

  const sessionDoc = await db.collection('sessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    return null;
  }

  const sessionData = sessionDoc.data() as Session;

  // Check if session is expired
  if (sessionData.expiresAt) {
    const now = new Date();
    const expiresAt = sessionData.expiresAt.toDate();
    if (now > expiresAt) {
      // Session expired - delete it and return null
      await deleteSession(sessionId);
      return null;
    }
  }

  return {
    sessionId,
    ...sessionData,
  };
}

/**
 * Validates a CSRF token against the session's token
 */
export function validateCsrfToken(session: Session, token: string): boolean {
  if (!session.csrfToken || !token) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    const sessionTokenBuffer = Buffer.from(session.csrfToken, 'hex');
    const providedTokenBuffer = Buffer.from(token, 'hex');

    if (sessionTokenBuffer.length !== providedTokenBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sessionTokenBuffer, providedTokenBuffer);
  } catch {
    return false;
  }
}

/**
 * Deletes a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (sessionId) {
    await db.collection('sessions').doc(sessionId).delete();
  }
}

/**
 * Cleans up expired sessions (can be called periodically or on demand)
 * Returns the number of deleted sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = firestore.Timestamp.now();

  // Query for expired sessions
  const expiredSessions = await db
    .collection('sessions')
    .where('expiresAt', '!=', null)
    .where('expiresAt', '<', now)
    .get();

  // Delete expired sessions
  const batch = db.batch();
  let count = 0;

  expiredSessions.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}

/**
 * Cookie configuration helpers
 */
export function getSessionCookieOptions(rememberMe: boolean) {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };

  if (rememberMe) {
    return {
      ...baseOptions,
      maxAge: REMEMBER_ME_EXPIRY_MS,
    };
  }

  // Session cookie (no maxAge means it expires when browser closes)
  return baseOptions;
}

export function getCsrfCookieOptions(rememberMe: boolean) {
  const baseOptions = {
    httpOnly: false, // CSRF token needs to be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };

  if (rememberMe) {
    return {
      ...baseOptions,
      maxAge: REMEMBER_ME_EXPIRY_MS,
    };
  }

  return baseOptions;
}
