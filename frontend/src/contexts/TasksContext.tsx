import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import {
  TasksContext,
  type TasksContextValue,
  type Task,
  MAX_TASKS_PER_LIST,
} from "./TasksContextDef";

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Gets a cookie value by name
 */
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }
  return undefined;
}

interface TasksProviderProps {
  listId: string;
  children: ReactNode;
}

/**
 * TasksProvider component that provides tasks state for a specific list
 */
export function TasksProvider({ listId, children }: TasksProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh tasks from the backend
   */
  const refreshTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/lists/${listId}/tasks`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data.tasks as Task[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  /**
   * Create a new task
   */
  const createTask = useCallback(async (title: string): Promise<Task> => {
    setError(null);

    // Client-side validation
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    if (title.trim().length > 64) {
      throw new Error("Title must be at most 64 characters");
    }

    if (tasks.length >= MAX_TASKS_PER_LIST) {
      throw new Error(`Maximum ${MAX_TASKS_PER_LIST} tasks allowed per list`);
    }

    // Create optimistic task
    const tempId = `temp-${Date.now()}`;
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) : 0;
    const optimisticTask: Task = {
      id: tempId,
      title: title.trim(),
      isCompleted: false,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setTasks((prev) => [...prev, optimisticTask]);

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create task");
      }

      const data = await response.json();
      const createdTask = data.task as Task;

      // Replace optimistic task with real one
      setTasks((prev) =>
        prev.map((task) => (task.id === tempId ? createdTask : task))
      );

      return createdTask;
    } catch (err) {
      // Rollback optimistic update
      setTasks((prev) => prev.filter((task) => task.id !== tempId));

      const errorMessage =
        err instanceof Error ? err.message : "Failed to create task";
      setError(errorMessage);
      throw err;
    }
  }, [listId, tasks]);

  // Load tasks on mount or when listId changes
  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  const taskCount = tasks.length;
  const canCreateTask = taskCount < MAX_TASKS_PER_LIST;

  const value = useMemo(
    (): TasksContextValue => ({
      tasks,
      isLoading,
      error,
      taskCount,
      canCreateTask,
      createTask,
      refreshTasks,
    }),
    [tasks, isLoading, error, taskCount, canCreateTask, createTask, refreshTasks]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
