import { createContext, useCallback, useEffect, type ReactNode } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useUndoRedo, type UndoRedoHandlers } from "@/hooks/useUndoRedo";
import type { Task } from "./TasksContextDef";

/**
 * Context value for undo/redo functionality
 */
export interface UndoRedoContextValue {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  // Wrapped task actions that record to undo/redo
  createTaskWithUndo: (title: string) => Promise<Task>;
  deleteTaskWithUndo: (taskId: string) => Promise<void>;
  toggleCompleteWithUndo: (taskId: string) => Promise<void>;
  updateTitleWithUndo: (taskId: string, newTitle: string) => Promise<void>;
  reorderTasksWithUndo: (orders: Array<{ taskId: string; order: number }>) => Promise<void>;
}

export const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

interface UndoRedoProviderProps {
  children: ReactNode;
}

/**
 * Provider that wraps TasksContext and adds undo/redo functionality
 * Must be used inside TasksProvider
 */
export function UndoRedoProvider({ children }: UndoRedoProviderProps) {
  const {
    tasks,
    createTask,
    deleteTask,
    toggleComplete,
    updateTitle,
    reorderTasks
  } = useTasks();

  // Handlers for undo/redo operations
  const handlers: UndoRedoHandlers = {
    onAddTask: useCallback(async (task: Task) => {
      // For redo, we need to recreate the task with the same title
      // The API will assign a new ID, but we preserve the title
      await createTask(task.title);
    }, [createTask]),

    onDeleteTask: useCallback(async (taskId: string) => {
      await deleteTask(taskId);
    }, [deleteTask]),

    onToggleComplete: useCallback(async (taskId: string) => {
      await toggleComplete(taskId);
    }, [toggleComplete]),

    onUpdateTitle: useCallback(async (taskId: string, newTitle: string) => {
      await updateTitle(taskId, newTitle);
    }, [updateTitle]),

    onReorderTasks: useCallback(async (orders: Array<{ taskId: string; order: number }>) => {
      await reorderTasks(orders);
    }, [reorderTasks]),
  };

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    recordAddTask,
    recordDeleteTask,
    recordCompleteTask,
    recordEditTitle,
    recordReorderTasks,
    clearHistory,
  } = useUndoRedo(handlers);

  // Clear undo/redo history when navigating (component unmount)
  useEffect(() => {
    return () => {
      clearHistory();
    };
  }, [clearHistory]);

  /**
   * Create task and record to undo stack
   */
  const createTaskWithUndo = useCallback(async (title: string): Promise<Task> => {
    const task = await createTask(title);
    recordAddTask(task);
    return task;
  }, [createTask, recordAddTask]);

  /**
   * Delete task and record to undo stack
   */
  const deleteTaskWithUndo = useCallback(async (taskId: string): Promise<void> => {
    // Find the task before deleting
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const result = await deleteTask(taskId);
    recordDeleteTask(result.deletedTask, result.undo);
  }, [tasks, deleteTask, recordDeleteTask]);

  /**
   * Toggle complete and record to undo stack
   */
  const toggleCompleteWithUndo = useCallback(async (taskId: string): Promise<void> => {
    // Find the task to get its current state
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const previousState = task.isCompleted;
    await toggleComplete(taskId);
    recordCompleteTask(taskId, previousState);
  }, [tasks, toggleComplete, recordCompleteTask]);

  /**
   * Update title and record to undo stack
   */
  const updateTitleWithUndo = useCallback(async (taskId: string, newTitle: string): Promise<void> => {
    // Find the task to get its current title
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const previousTitle = task.title;

    // Skip if title hasn't changed
    if (newTitle.trim() === previousTitle) {
      return;
    }

    await updateTitle(taskId, newTitle);
    recordEditTitle(taskId, previousTitle, newTitle.trim());
  }, [tasks, updateTitle, recordEditTitle]);

  /**
   * Reorder tasks and record to undo stack
   */
  const reorderTasksWithUndo = useCallback(async (orders: Array<{ taskId: string; order: number }>): Promise<void> => {
    // Store previous order
    const previousOrders = tasks.map(task => ({
      taskId: task.id,
      order: task.order,
    }));

    await reorderTasks(orders);
    recordReorderTasks(previousOrders, orders);
  }, [tasks, reorderTasks, recordReorderTasks]);

  const value: UndoRedoContextValue = {
    canUndo,
    canRedo,
    undo,
    redo,
    createTaskWithUndo,
    deleteTaskWithUndo,
    toggleCompleteWithUndo,
    updateTitleWithUndo,
    reorderTasksWithUndo,
  };

  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
}
