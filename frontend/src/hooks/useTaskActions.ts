import { useContext } from "react";
import { useTasks } from "./useTasks";

// Import the UndoRedoContext but make it optional
import { UndoRedoContext, type UndoRedoContextValue } from "@/contexts/UndoRedoTasksContext";

/**
 * Hook that provides task actions with undo/redo support if available
 * Falls back to regular task actions if UndoRedoProvider is not present
 */
export function useTaskActions() {
  const regularTasks = useTasks();
  const undoRedoContext = useContext(UndoRedoContext) as UndoRedoContextValue | null;

  // If UndoRedoProvider is available, use undo/redo wrapped actions
  if (undoRedoContext) {
    return {
      createTask: undoRedoContext.createTaskWithUndo,
      deleteTask: undoRedoContext.deleteTaskWithUndo,
      toggleComplete: undoRedoContext.toggleCompleteWithUndo,
      updateTitle: undoRedoContext.updateTitleWithUndo,
      reorderTasks: undoRedoContext.reorderTasksWithUndo,
    };
  }

  // Otherwise, fall back to regular task actions
  return {
    createTask: regularTasks.createTask,
    deleteTask: async (taskId: string) => {
      await regularTasks.deleteTask(taskId);
    },
    toggleComplete: regularTasks.toggleComplete,
    updateTitle: regularTasks.updateTitle,
    reorderTasks: regularTasks.reorderTasks,
  };
}
