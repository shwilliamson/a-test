import { Router, Request, Response, NextFunction } from 'express';
import { firestore } from 'firebase-admin';
import { db } from '../config/firebase';
import { AppError } from '../errors/AppError';
import { protectedRoute } from '../middleware/auth';

const router = Router();

// Validation constants
const TITLE_MAX_LENGTH = 64;
const MAX_LISTS_PER_USER = 10;

// Types
interface CreateListRequest {
  title: string;
}

interface List {
  title: string;
  isPinned: boolean;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

interface ListResponse {
  id: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Async handler wrapper to properly catch errors in async routes
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/lists
 * Create a new list for the authenticated user
 */
router.post('/', protectedRoute, asyncHandler(async (req: Request<object, object, CreateListRequest>, res: Response) => {
  const { title } = req.body;
  const userId = req.user!.id;

  // Validate title
  if (!title || typeof title !== 'string') {
    throw new AppError('Title is required', 400, 'VALIDATION_ERROR');
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length === 0) {
    throw new AppError('Title is required', 400, 'VALIDATION_ERROR');
  }

  if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    throw new AppError(
      `Title must be at most ${TITLE_MAX_LENGTH} characters`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // Check list count for user
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const existingLists = await listsRef.count().get();
  const listCount = existingLists.data().count;

  if (listCount >= MAX_LISTS_PER_USER) {
    throw new AppError(
      `Maximum ${MAX_LISTS_PER_USER} lists allowed per user`,
      400,
      'MAX_LISTS_REACHED'
    );
  }

  // Create list document
  const now = firestore.Timestamp.now();
  const listData: List = {
    title: trimmedTitle,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  };

  const listDoc = await listsRef.add(listData);

  // Return created list
  const responseData: ListResponse = {
    id: listDoc.id,
    title: trimmedTitle,
    isPinned: false,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  };

  res.status(201).json({
    success: true,
    message: 'List created successfully',
    list: responseData,
  });
}));

export default router;
