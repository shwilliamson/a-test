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

  /**
   * Get a single list by ID
   */
  const getList = useCallback(async (listId: string): Promise<List> => {
    // First, check if we already have it in state
    const existingList = lists.find((list) => list.id === listId);
    if (existingList) {
      return existingList;
    }

    // Fetch from API
    const response = await fetch(`${API_URL}/api/lists/${listId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to fetch list");
    }

    const data = await response.json();
    return data.list as List;
  }, [lists]);

  /**
   * Update a list's title with optimistic update
   */
  const updateListTitle = useCallback(async (listId: string, title: string): Promise<List> => {
    setError(null);

    // Client-side validation
    if (!title.trim()) {
      throw new Error("Title is required");
    }

    if (title.trim().length > 64) {
      throw new Error("Title must be at most 64 characters");
    }

    // Find the existing list to get previous state
    const existingList = lists.find((list) => list.id === listId);
    if (!existingList) {
      throw new Error("List not found");
    }

    const previousTitle = existingList.title;
    const trimmedTitle = title.trim();

    // Optimistic update
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, title: trimmedTitle, updatedAt: new Date().toISOString() }
          : list
      )
    );

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}`, {
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
        throw new Error(data.message || "Failed to update list");
      }

      const data = await response.json();
      const updatedList = data.list as List;

      // Update with server response
      setLists((prev) =>
        prev.map((list) => (list.id === listId ? updatedList : list))
      );

      return updatedList;
    } catch (err) {
      // Rollback optimistic update
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId ? { ...list, title: previousTitle } : list
        )
      );

      const errorMessage =
        err instanceof Error ? err.message : "Failed to update list";
      setError(errorMessage);
      throw err;
    }
  }, [lists]);

  /**
   * Delete a list and all its tasks
   */
  const deleteList = useCallback(async (listId: string): Promise<void> => {
    setError(null);

    // Find the existing list to save for rollback
    const existingList = lists.find((list) => list.id === listId);
    if (!existingList) {
      throw new Error("List not found");
    }

    // Optimistic update - remove from state
    setLists((prev) => prev.filter((list) => list.id !== listId));

    try {
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/lists/${listId}`, {
        method: "DELETE",
        headers: {
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete list");
      }

      // Success - list is already removed from state
    } catch (err) {
      // Rollback optimistic update
      setLists((prev) => [...prev, existingList]);

      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete list";
      setError(errorMessage);
      throw err;
    }
  }, [lists]);

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
      updateListTitle,
      deleteList,
      getList,
      refreshLists,
    }),
    [lists, isLoading, error, listCount, canCreateList, createList, updateListTitle, deleteList, getList, refreshLists]
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}
