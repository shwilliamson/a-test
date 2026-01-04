import { useState, useCallback } from "react";
import type { Task } from "@/contexts/TasksContextDef";

/**
 * Action types that can be undone/redone
 */
export type UndoableActionType =
  | "ADD_TASK"
  | "DELETE_TASK"
  | "COMPLETE_TASK"
  | "EDIT_TITLE"
  | "REORDER_TASKS";

/**
 * Base action interface
 */
interface BaseAction {
  type: UndoableActionType;
  timestamp: number;
}

/**
 * Add task action
 */
interface AddTaskAction extends BaseAction {
  type: "ADD_TASK";
  task: Task;
}

/**
 * Delete task action
 */
interface DeleteTaskAction extends BaseAction {
  type: "DELETE_TASK";
  task: Task;
  undoFunction: () => Promise<void>;
}

/**
 * Complete/uncomplete task action
 */
interface CompleteTaskAction extends BaseAction {
  type: "COMPLETE_TASK";
  taskId: string;
  previousState: boolean;
}

/**
 * Edit title action
 */
interface EditTitleAction extends BaseAction {
  type: "EDIT_TITLE";
  taskId: string;
  previousTitle: string;
  newTitle: string;
}

/**
 * Reorder tasks action
 */
interface ReorderTasksAction extends BaseAction {
  type: "REORDER_TASKS";
  previousOrders: Array<{ taskId: string; order: number }>;
  newOrders: Array<{ taskId: string; order: number }>;
}

/**
 * Union type of all action types
 */
export type UndoableAction =
  | AddTaskAction
  | DeleteTaskAction
  | CompleteTaskAction
  | EditTitleAction
  | ReorderTasksAction;

/**
 * Handlers for performing undo/redo operations
 */
export interface UndoRedoHandlers {
  onAddTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onToggleComplete: (taskId: string) => Promise<void>;
  onUpdateTitle: (taskId: string, newTitle: string) => Promise<void>;
  onReorderTasks: (orders: Array<{ taskId: string; order: number }>) => Promise<void>;
}

/**
 * Return type of useUndoRedo hook
 */
export interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  recordAddTask: (task: Task) => void;
  recordDeleteTask: (task: Task, undoFunction: () => Promise<void>) => void;
  recordCompleteTask: (taskId: string, previousState: boolean) => void;
  recordEditTitle: (taskId: string, previousTitle: string, newTitle: string) => void;
  recordReorderTasks: (
    previousOrders: Array<{ taskId: string; order: number }>,
    newOrders: Array<{ taskId: string; order: number }>
  ) => void;
  clearHistory: () => void;
}

/**
 * Custom hook for managing undo/redo functionality
 */
export function useUndoRedo(handlers: UndoRedoHandlers): UseUndoRedoReturn {
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);

  /**
   * Record an action to the undo stack and clear redo stack
   */
  const recordAction = useCallback((action: UndoableAction) => {
    setUndoStack((prev) => [...prev, action]);
    setRedoStack([]); // Clear redo stack when new action is performed
  }, []);

  /**
   * Record add task action
   */
  const recordAddTask = useCallback(
    (task: Task) => {
      recordAction({
        type: "ADD_TASK",
        task,
        timestamp: Date.now(),
      });
    },
    [recordAction]
  );

  /**
   * Record delete task action
   */
  const recordDeleteTask = useCallback(
    (task: Task, undoFunction: () => Promise<void>) => {
      recordAction({
        type: "DELETE_TASK",
        task,
        undoFunction,
        timestamp: Date.now(),
      });
    },
    [recordAction]
  );

  /**
   * Record complete/uncomplete task action
   */
  const recordCompleteTask = useCallback(
    (taskId: string, previousState: boolean) => {
      recordAction({
        type: "COMPLETE_TASK",
        taskId,
        previousState,
        timestamp: Date.now(),
      });
    },
    [recordAction]
  );

  /**
   * Record edit title action
   */
  const recordEditTitle = useCallback(
    (taskId: string, previousTitle: string, newTitle: string) => {
      recordAction({
        type: "EDIT_TITLE",
        taskId,
        previousTitle,
        newTitle,
        timestamp: Date.now(),
      });
    },
    [recordAction]
  );

  /**
   * Record reorder tasks action
   */
  const recordReorderTasks = useCallback(
    (
      previousOrders: Array<{ taskId: string; order: number }>,
      newOrders: Array<{ taskId: string; order: number }>
    ) => {
      recordAction({
        type: "REORDER_TASKS",
        previousOrders,
        newOrders,
        timestamp: Date.now(),
      });
    },
    [recordAction]
  );

  /**
   * Undo the last action
   */
  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    try {
      switch (action.type) {
        case "ADD_TASK":
          // Undo add = delete the task
          await handlers.onDeleteTask(action.task.id);
          break;

        case "DELETE_TASK":
          // Undo delete = restore the task using the undo function
          await action.undoFunction();
          break;

        case "COMPLETE_TASK":
          // Undo complete/uncomplete = toggle back to previous state
          await handlers.onToggleComplete(action.taskId);
          break;

        case "EDIT_TITLE":
          // Undo edit = restore previous title
          await handlers.onUpdateTitle(action.taskId, action.previousTitle);
          break;

        case "REORDER_TASKS":
          // Undo reorder = restore previous order
          await handlers.onReorderTasks(action.previousOrders);
          break;
      }

      // Move action to redo stack
      setUndoStack(newUndoStack);
      setRedoStack((prev) => [...prev, action]);
    } catch (error) {
      console.error("Undo failed:", error);
      // If undo fails, don't modify stacks
      throw error;
    }
  }, [undoStack, handlers]);

  /**
   * Redo the last undone action
   */
  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    try {
      switch (action.type) {
        case "ADD_TASK":
          // Redo add = add the task back (restore with same data)
          await handlers.onAddTask(action.task);
          break;

        case "DELETE_TASK":
          // Redo delete = delete the task again
          await handlers.onDeleteTask(action.task.id);
          break;

        case "COMPLETE_TASK":
          // Redo complete/uncomplete = toggle again
          await handlers.onToggleComplete(action.taskId);
          break;

        case "EDIT_TITLE":
          // Redo edit = apply new title
          await handlers.onUpdateTitle(action.taskId, action.newTitle);
          break;

        case "REORDER_TASKS":
          // Redo reorder = apply new order
          await handlers.onReorderTasks(action.newOrders);
          break;
      }

      // Move action back to undo stack
      setRedoStack(newRedoStack);
      setUndoStack((prev) => [...prev, action]);
    } catch (error) {
      console.error("Redo failed:", error);
      // If redo fails, don't modify stacks
      throw error;
    }
  }, [redoStack, handlers]);

  /**
   * Clear undo/redo history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undo,
    redo,
    recordAddTask,
    recordDeleteTask,
    recordCompleteTask,
    recordEditTitle,
    recordReorderTasks,
    clearHistory,
  };
}
