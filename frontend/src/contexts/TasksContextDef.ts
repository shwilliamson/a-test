import { createContext } from "react";

/**
 * Task type from the API
 */
export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tasks context state for a specific list
 */
export interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  taskCount: number;
  canCreateTask: boolean;
}

/**
 * Result of deleting a task, includes data needed for undo
 */
export interface DeleteTaskResult {
  deletedTask: Task;
  undo: () => Promise<void>;
}

/**
 * Tasks context value including actions
 */
export interface TasksContextValue extends TasksState {
  createTask: (title: string) => Promise<Task>;
  toggleComplete: (taskId: string) => Promise<void>;
  updateTitle: (taskId: string, newTitle: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<DeleteTaskResult>;
  reorderTasks: (orders: Array<{ taskId: string; order: number }>) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export const MAX_TASKS_PER_LIST = 25;

export const TasksContext = createContext<TasksContextValue | null>(null);
