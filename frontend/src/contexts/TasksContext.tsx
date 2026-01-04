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
  type DeleteTaskResult,
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

  /**
   * Toggle a task's completion status
   */
  const toggleComplete = useCallback(async (taskId: string): Promise<void> => {
    setError(null);

    // Find the task to toggle
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const newIsCompleted = !task.isCompleted;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, isCompleted: newIsCompleted, updatedAt: new Date().toISOString() }
          : t
      )
    );

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ isCompleted: newIsCompleted }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update task");
      }

      const data = await response.json();
      const updatedTask = data.task as Task;

      // Update with server response
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updatedTask : t))
      );
    } catch (err) {
      // Rollback optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, isCompleted: !newIsCompleted }
            : t
        )
      );

      const errorMessage =
        err instanceof Error ? err.message : "Failed to update task";
      setError(errorMessage);
      throw err;
    }
  }, [listId, tasks]);

  /**
   * Update a task's title
   */
  const updateTitle = useCallback(async (taskId: string, newTitle: string): Promise<void> => {
    setError(null);

    // Client-side validation
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      throw new Error("Title is required");
    }

    if (trimmedTitle.length > 64) {
      throw new Error("Title must be at most 64 characters");
    }

    // Find the task to update
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const oldTitle = task.title;

    // Skip if title hasn't changed
    if (trimmedTitle === oldTitle) {
      return;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, title: trimmedTitle, updatedAt: new Date().toISOString() }
          : t
      )
    );

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update task");
      }

      const data = await response.json();
      const updatedTask = data.task as Task;

      // Update with server response
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updatedTask : t))
      );
    } catch (err) {
      // Rollback optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, title: oldTitle }
            : t
        )
      );

      const errorMessage =
        err instanceof Error ? err.message : "Failed to update task";
      setError(errorMessage);
      throw err;
    }
  }, [listId, tasks]);

  /**
   * Reorder tasks in the list
   */
  const reorderTasks = useCallback(
    async (orders: Array<{ taskId: string; order: number }>): Promise<void> => {
      setError(null);

      // Store original task order for potential rollback
      const originalTasks = [...tasks];

      // Optimistic update - reorder tasks immediately
      const reorderedTasks = [...tasks];
      for (const order of orders) {
        const taskIndex = reorderedTasks.findIndex((t) => t.id === order.taskId);
        if (taskIndex !== -1) {
          reorderedTasks[taskIndex] = {
            ...reorderedTasks[taskIndex],
            order: order.order,
            updatedAt: new Date().toISOString(),
          };
        }
      }
      // Sort by order for display
      reorderedTasks.sort((a, b) => a.order - b.order);
      setTasks(reorderedTasks);

      try {
        const csrfToken = getCookie("csrf_token");

        const response = await fetch(
          `${API_URL}/api/lists/${listId}/tasks/reorder`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ orders }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to reorder tasks");
        }

        const data = await response.json();
        const updatedTasks = data.tasks as Task[];

        // Update with server response
        setTasks((prev) => {
          const merged = [...prev];
          for (const updatedTask of updatedTasks) {
            const index = merged.findIndex((t) => t.id === updatedTask.id);
            if (index !== -1) {
              merged[index] = updatedTask;
            }
          }
          return merged.sort((a, b) => a.order - b.order);
        });
      } catch (err) {
        // Rollback optimistic update
        setTasks(originalTasks);

        const errorMessage =
          err instanceof Error ? err.message : "Failed to reorder tasks";
        setError(errorMessage);
        throw err;
      }
    },
    [listId, tasks]
  );

  /**
   * Delete a task and return undo function
   */
  const deleteTask = useCallback(async (taskId: string): Promise<DeleteTaskResult> => {
    setError(null);

    // Find the task to delete
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // Store task data for potential undo
    const deletedTask = { ...task };

    // Optimistic update - remove from UI immediately
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // Create undo function that restores the task
    const undo = async (): Promise<void> => {
      // Re-create the task via API
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ title: deletedTask.title }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to restore task");
      }

      const data = await response.json();
      const restoredTask = data.task as Task;

      // Add restored task back to state
      setTasks((prev) => [...prev, restoredTask]);
    };

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete task");
      }

      return { deletedTask, undo };
    } catch (err) {
      // Rollback optimistic update - restore the task
      setTasks((prev) => {
        // Insert back in original position based on order
        const newTasks = [...prev, deletedTask];
        return newTasks.sort((a, b) => a.order - b.order);
      });

      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete task";
      setError(errorMessage);
      throw err;
    }
  }, [listId, tasks]);

  // Load tasks on mount or when listId changes
  useEffect(() => {
    void refreshTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

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
      toggleComplete,
      updateTitle,
      deleteTask,
      reorderTasks,
      refreshTasks,
    }),
    [tasks, isLoading, error, taskCount, canCreateTask, createTask, toggleComplete, updateTitle, deleteTask, reorderTasks, refreshTasks]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
