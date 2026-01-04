import { createContext } from "react";

/**
 * List type from the API
 */
export interface List {
  id: string;
  title: string;
  isPinned: boolean;
  taskCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lists context state
 */
export interface ListsState {
  lists: List[];
  isLoading: boolean;
  error: string | null;
  listCount: number;
  canCreateList: boolean;
}

/**
 * Lists context value including actions
 */
export interface ListsContextValue extends ListsState {
  createList: (title: string) => Promise<List>;
  updateListTitle: (listId: string, title: string) => Promise<List>;
  deleteList: (listId: string) => Promise<void>;
  getList: (listId: string) => Promise<List>;
  refreshLists: () => Promise<void>;
}

export const MAX_LISTS_PER_USER = 10;

export const ListsContext = createContext<ListsContextValue | null>(null);
