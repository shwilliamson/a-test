import { useContext } from "react";
import { ListsContext, type ListsContextValue } from "@/contexts/ListsContextDef";

/**
 * Hook to access lists context
 * @throws Error if used outside of ListsProvider
 */
export function useLists(): ListsContextValue {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error("useLists must be used within a ListsProvider");
  }
  return context;
}
