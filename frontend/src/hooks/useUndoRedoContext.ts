import { useContext } from "react";
import { UndoRedoContext } from "@/contexts/UndoRedoTasksContext";
import type { UndoRedoContextValue } from "@/contexts/UndoRedoTasksContext";

/**
 * Hook to access undo/redo context
 * @throws Error if used outside of UndoRedoProvider
 */
export function useUndoRedoContext(): UndoRedoContextValue {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error("useUndoRedoContext must be used within UndoRedoProvider");
  }
  return context;
}
