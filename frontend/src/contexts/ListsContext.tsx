import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import {
  ListsContext,
  type ListsContextValue,
  type List,
  MAX_LISTS_PER_USER,
} from "./ListsContextDef";

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

interface ListsProviderProps {
  children: ReactNode;
}

/**
 * ListsProvider component that wraps the app and provides lists state
 */
export function ListsProvider({ children }: ListsProviderProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh lists from the backend
   */
  const refreshLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/lists`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch lists");
      }

      const data = await response.json();
      setLists(data.lists as List[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch lists";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new list
   */
  const createList = useCallback(async (title: string): Promise<List> => {
    setError(null);

    // Client-side validation
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    if (title.trim().length > 64) {
      throw new Error("Title must be at most 64 characters");
    }

    if (lists.length >= MAX_LISTS_PER_USER) {
      throw new Error(`Maximum ${MAX_LISTS_PER_USER} lists allowed`);
    }

    // Create optimistic list
    const tempId = `temp-${Date.now()}`;
    const optimisticList: List = {
      id: tempId,
      title: title.trim(),
      isPinned: false,
      taskCount: 0,
      completedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setLists((prev) => [...prev, optimisticList]);

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists`, {
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
        throw new Error(data.message || "Failed to create list");
      }

      const data = await response.json();
      const createdList = data.list as List;

      // Replace optimistic list with real one
      setLists((prev) =>
        prev.map((list) => (list.id === tempId ? createdList : list))
      );

      return createdList;
    } catch (err) {
      // Rollback optimistic update
      setLists((prev) => prev.filter((list) => list.id !== tempId));

      const errorMessage =
        err instanceof Error ? err.message : "Failed to create list";
      setError(errorMessage);
      throw err;
    }
  }, [lists.length]);

  // Load lists on mount
  useEffect(() => {
    void refreshLists();
  }, [refreshLists]);

  const listCount = lists.length;
  const canCreateList = listCount < MAX_LISTS_PER_USER;

  const value = useMemo(
    (): ListsContextValue => ({
      lists,
      isLoading,
      error,
      listCount,
      canCreateList,
      createList,
      refreshLists,
    }),
    [lists, isLoading, error, listCount, canCreateList, createList, refreshLists]
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}
