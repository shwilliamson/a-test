import { Router, Request, Response, NextFunction } from 'express';
import { firestore } from 'firebase-admin';
import { db } from '../config/firebase';
import { AppError } from '../errors/AppError';
import { protectedRoute } from '../middleware/auth';

const router = Router();

// Validation constants
const TITLE_MAX_LENGTH = 64;
const MAX_LISTS_PER_USER = 10;
const MAX_TASKS_PER_LIST = 25;

// Types
interface CreateListRequest {
  title: string;
}

interface UpdateListRequest {
  title?: string;
  isPinned?: boolean;
}

interface CreateTaskRequest {
  title: string;
}

interface UpdateTaskRequest {
  isCompleted?: boolean;
  title?: string;
}

interface ReorderTaskRequest {
  orders: Array<{
    taskId: string;
    order: number;
  }>;
}

interface Task {
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}

interface TaskResponse {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
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
  taskCount: number;
  completedCount: number;
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
 * GET /api/lists
 * Get all lists for the authenticated user
 */
router.get('/', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Get all lists for the user, sorted by updatedAt descending
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listsSnapshot = await listsRef.orderBy('updatedAt', 'desc').get();

  const lists: ListResponse[] = [];

  for (const doc of listsSnapshot.docs) {
    const listData = doc.data() as List;

    // Get task counts for this list
    const tasksRef = listsRef.doc(doc.id).collection('tasks');
    const tasksSnapshot = await tasksRef.get();

    let taskCount = 0;
    let completedCount = 0;

    tasksSnapshot.docs.forEach((taskDoc) => {
      taskCount++;
      const taskData = taskDoc.data();
      if (taskData.isCompleted === true) {
        completedCount++;
      }
    });

    lists.push({
      id: doc.id,
      title: listData.title,
      isPinned: listData.isPinned,
      taskCount,
      completedCount,
      createdAt: listData.createdAt.toDate().toISOString(),
      updatedAt: listData.updatedAt.toDate().toISOString(),
    });
  }

  res.json({
    success: true,
    lists,
  });
}));

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
    taskCount: 0,
    completedCount: 0,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  };

  res.status(201).json({
    success: true,
    message: 'List created successfully',
    list: responseData,
  });
}));

/**
 * GET /api/lists/:listId
 * Get a single list by ID for the authenticated user
 */
router.get('/:listId', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;

  // Get the list document
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDoc = await listsRef.doc(listId).get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  const listData = listDoc.data() as List;

  // Get task counts for this list
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const tasksSnapshot = await tasksRef.get();

  let taskCount = 0;
  let completedCount = 0;

  tasksSnapshot.docs.forEach((taskDoc) => {
    taskCount++;
    const taskData = taskDoc.data();
    if (taskData.completed === true) {
      completedCount++;
    }
  });

  const responseData: ListResponse = {
    id: listDoc.id,
    title: listData.title,
    isPinned: listData.isPinned,
    taskCount,
    completedCount,
    createdAt: listData.createdAt.toDate().toISOString(),
    updatedAt: listData.updatedAt.toDate().toISOString(),
  };

  res.json({
    success: true,
    list: responseData,
  });
}));

/**
 * PATCH /api/lists/:listId
 * Update a list's title or isPinned status for the authenticated user
 */
router.patch('/:listId', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;
  const { title, isPinned } = req.body as UpdateListRequest;

  // Must provide at least one field to update
  if (title === undefined && isPinned === undefined) {
    throw new AppError('At least one field (title or isPinned) is required', 400, 'VALIDATION_ERROR');
  }

  // Build update object
  const updateData: { title?: string; isPinned?: boolean; updatedAt: firestore.Timestamp } = {
    updatedAt: firestore.Timestamp.now(),
  };

  // Validate and add title if provided
  if (title !== undefined) {
    if (typeof title !== 'string') {
      throw new AppError('Title must be a string', 400, 'VALIDATION_ERROR');
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

    updateData.title = trimmedTitle;
  }

  // Validate and add isPinned if provided
  if (isPinned !== undefined) {
    if (typeof isPinned !== 'boolean') {
      throw new AppError('isPinned must be a boolean', 400, 'VALIDATION_ERROR');
    }

    updateData.isPinned = isPinned;
  }

  // Get the list document
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDocRef = listsRef.doc(listId);
  const listDoc = await listDocRef.get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Update the list
  await listDocRef.update(updateData);

  // Get updated list data with task counts
  const listData = listDoc.data() as List;
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const tasksSnapshot = await tasksRef.get();

  let taskCount = 0;
  let completedCount = 0;

  tasksSnapshot.docs.forEach((taskDoc) => {
    taskCount++;
    const taskData = taskDoc.data();
    if (taskData.completed === true) {
      completedCount++;
    }
  });

  const responseData: ListResponse = {
    id: listId,
    title: updateData.title ?? listData.title,
    isPinned: updateData.isPinned ?? listData.isPinned,
    taskCount,
    completedCount,
    createdAt: listData.createdAt.toDate().toISOString(),
    updatedAt: updateData.updatedAt.toDate().toISOString(),
  };

  res.json({
    success: true,
    message: 'List updated successfully',
    list: responseData,
  });
}));

/**
 * DELETE /api/lists/:listId
 * Delete a list and all its tasks for the authenticated user
 */
router.delete('/:listId', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;

  // Get the list document to verify it exists
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDocRef = listsRef.doc(listId);
  const listDoc = await listDocRef.get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Delete all tasks in the subcollection first
  const tasksRef = listDocRef.collection('tasks');
  const tasksSnapshot = await tasksRef.get();

  // Use batched writes for efficiency (max 500 operations per batch)
  const batch = db.batch();
  tasksSnapshot.docs.forEach((taskDoc) => {
    batch.delete(taskDoc.ref);
  });

  // Delete the list document itself
  batch.delete(listDocRef);

  // Commit the batch
  await batch.commit();

  res.json({
    success: true,
    message: 'List deleted successfully',
  });
}));

/**
 * GET /api/lists/:listId/tasks
 * Get all tasks for a list
 */
router.get('/:listId/tasks', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;

  // Verify the list exists
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDoc = await listsRef.doc(listId).get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Get all tasks for the list, sorted by order
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const tasksSnapshot = await tasksRef.orderBy('order', 'asc').get();

  const tasks: TaskResponse[] = tasksSnapshot.docs.map((doc) => {
    const taskData = doc.data() as Task;
    return {
      id: doc.id,
      title: taskData.title,
      isCompleted: taskData.isCompleted,
      order: taskData.order,
      createdAt: taskData.createdAt.toDate().toISOString(),
      updatedAt: taskData.updatedAt.toDate().toISOString(),
    };
  });

  res.json({
    success: true,
    tasks,
  });
}));

/**
 * POST /api/lists/:listId/tasks
 * Create a new task for a list
 */
router.post('/:listId/tasks', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;
  const { title } = req.body as CreateTaskRequest;

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

  // Verify the list exists
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDoc = await listsRef.doc(listId).get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Check task count for list
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const existingTasks = await tasksRef.count().get();
  const taskCount = existingTasks.data().count;

  if (taskCount >= MAX_TASKS_PER_LIST) {
    throw new AppError(
      `Maximum ${MAX_TASKS_PER_LIST} tasks allowed per list`,
      400,
      'MAX_TASKS_REACHED'
    );
  }

  // Get max order for existing tasks
  const lastTaskSnapshot = await tasksRef.orderBy('order', 'desc').limit(1).get();
  let maxOrder = 0;
  if (!lastTaskSnapshot.empty) {
    const lastTask = lastTaskSnapshot.docs[0].data() as Task;
    maxOrder = lastTask.order;
  }

  // Create task document
  const now = firestore.Timestamp.now();
  const taskData: Task = {
    title: trimmedTitle,
    isCompleted: false,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  const taskDoc = await tasksRef.add(taskData);

  // Update the list's updatedAt timestamp
  await listsRef.doc(listId).update({
    updatedAt: now,
  });

  // Return created task
  const responseData: TaskResponse = {
    id: taskDoc.id,
    title: trimmedTitle,
    isCompleted: false,
    order: maxOrder + 1,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  };

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task: responseData,
  });
}));

/**
 * PATCH /api/lists/:listId/tasks/reorder
 * Reorder multiple tasks in a list (batch update)
 */
router.patch('/:listId/tasks/reorder', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;
  const { orders } = req.body as ReorderTaskRequest;

  // Validate orders array
  if (!Array.isArray(orders)) {
    throw new AppError('orders must be an array', 400, 'VALIDATION_ERROR');
  }

  if (orders.length === 0) {
    throw new AppError('orders array cannot be empty', 400, 'VALIDATION_ERROR');
  }

  // Validate each order item
  for (const item of orders) {
    if (!item.taskId || typeof item.taskId !== 'string') {
      throw new AppError('Each order item must have a valid taskId', 400, 'VALIDATION_ERROR');
    }
    if (typeof item.order !== 'number' || item.order < 1) {
      throw new AppError('Each order item must have a valid order number (>= 1)', 400, 'VALIDATION_ERROR');
    }
  }

  // Verify the list exists
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDoc = await listsRef.doc(listId).get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Verify all tasks exist and prepare batch updates
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const now = firestore.Timestamp.now();
  const batch = db.batch();

  const updatedTasks: TaskResponse[] = [];

  for (const orderItem of orders) {
    const taskDocRef = tasksRef.doc(orderItem.taskId);
    const taskDoc = await taskDocRef.get();

    if (!taskDoc.exists) {
      throw new AppError(`Task ${orderItem.taskId} not found`, 404, 'NOT_FOUND');
    }

    const taskData = taskDoc.data() as Task;

    // Add to batch update
    batch.update(taskDocRef, {
      order: orderItem.order,
      updatedAt: now,
    });

    // Prepare response data
    updatedTasks.push({
      id: orderItem.taskId,
      title: taskData.title,
      isCompleted: taskData.isCompleted,
      order: orderItem.order,
      createdAt: taskData.createdAt.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    });
  }

  // Update list's updatedAt timestamp
  batch.update(listsRef.doc(listId), {
    updatedAt: now,
  });

  // Commit all updates in a single transaction
  await batch.commit();

  res.json({
    success: true,
    message: 'Tasks reordered successfully',
    tasks: updatedTasks,
  });
}));

/**
 * PATCH /api/lists/:listId/tasks/:taskId
 * Update a task's isCompleted status or title
 */
router.patch('/:listId/tasks/:taskId', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;
  const taskId = req.params.taskId as string;
  const { isCompleted, title } = req.body as UpdateTaskRequest;

  // Must provide at least one field to update
  if (isCompleted === undefined && title === undefined) {
    throw new AppError('At least one field (isCompleted or title) is required', 400, 'VALIDATION_ERROR');
  }

  // Build update object
  const now = firestore.Timestamp.now();
  const updateData: { isCompleted?: boolean; title?: string; updatedAt: firestore.Timestamp } = {
    updatedAt: now,
  };

  // Validate and add isCompleted if provided
  if (isCompleted !== undefined) {
    if (typeof isCompleted !== 'boolean') {
      throw new AppError('isCompleted must be a boolean', 400, 'VALIDATION_ERROR');
    }
    updateData.isCompleted = isCompleted;
  }

  // Validate and add title if provided
  if (title !== undefined) {
    if (typeof title !== 'string') {
      throw new AppError('Title must be a string', 400, 'VALIDATION_ERROR');
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

    updateData.title = trimmedTitle;
  }

  // Verify the list exists
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDoc = await listsRef.doc(listId).get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Verify the task exists
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const taskDocRef = tasksRef.doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  // Update the task
  await taskDocRef.update(updateData);

  // Update the list's updatedAt timestamp
  await listsRef.doc(listId).update({
    updatedAt: now,
  });

  // Get task data for response
  const taskData = taskDoc.data() as Task;

  const responseData: TaskResponse = {
    id: taskId,
    title: updateData.title ?? taskData.title,
    isCompleted: updateData.isCompleted ?? taskData.isCompleted,
    order: taskData.order,
    createdAt: taskData.createdAt.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  };

  res.json({
    success: true,
    message: 'Task updated successfully',
    task: responseData,
  });
}));

/**
 * DELETE /api/lists/:listId/tasks/:taskId
 * Delete a task from a list
 */
router.delete('/:listId/tasks/:taskId', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const listId = req.params.listId as string;
  const taskId = req.params.taskId as string;

  // Verify the list exists
  const listsRef = db.collection('users').doc(userId).collection('lists');
  const listDoc = await listsRef.doc(listId).get();

  if (!listDoc.exists) {
    throw new AppError('List not found', 404, 'NOT_FOUND');
  }

  // Verify the task exists
  const tasksRef = listsRef.doc(listId).collection('tasks');
  const taskDocRef = tasksRef.doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError('Task not found', 404, 'NOT_FOUND');
  }

  // Delete the task
  await taskDocRef.delete();

  // Update the list's updatedAt timestamp
  const now = firestore.Timestamp.now();
  await listsRef.doc(listId).update({
    updatedAt: now,
  });

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
}));

export default router;
