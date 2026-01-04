import { useContext } from "react";
import { TasksContext, type TasksContextValue } from "@/contexts/TasksContextDef";

/**
 * Hook to access tasks context
 * @throws Error if used outside of TasksProvider
 */
export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
