import { useState, useCallback } from "react";
import type { Task } from "@/contexts/TasksContextDef";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasks } from "@/hooks/useTasks";
import { EditableTaskTitle } from "./EditableTaskTitle";

interface TaskItemProps {
  task: Task;
}

/**
 * Single task item display
 * Shows checkbox and editable title with toggle completion functionality
 */
export function TaskItem({ task }: TaskItemProps) {
  const { toggleComplete, updateTitle } = useTasks();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckedChange = useCallback(async () => {
    setError(null);
    setIsToggling(true);

    try {
      await toggleComplete(task.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task"
      );
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsToggling(false);
    }
  }, [task.id, toggleComplete]);

  const handleTitleSave = useCallback(async (newTitle: string) => {
    setError(null);

    try {
      await updateTitle(task.id, newTitle);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task"
      );
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
      throw err; // Re-throw so EditableTaskTitle stays in edit mode
    }
  }, [task.id, updateTitle]);

  const ariaLabel = task.isCompleted
    ? `Mark task as incomplete: ${task.title}`
    : `Mark task as complete: ${task.title}`;

  const isTempTask = task.id.startsWith("temp-");

  return (
    <div className="relative">
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border bg-card transition-opacity duration-200 ${
          isTempTask ? "animate-in fade-in-0 slide-in-from-top-2 duration-200" : ""
        } ${isToggling ? "opacity-70" : ""}`}
      >
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isToggling || isTempTask}
          aria-label={ariaLabel}
          className="transition-all duration-150 mt-0.5"
        />
        <EditableTaskTitle
          title={task.title}
          onSave={handleTitleSave}
          isDisabled={isTempTask}
          isCompleted={task.isCompleted}
        />
      </div>

      {/* Error toast */}
      {error && (
        <div
          role="alert"
          className="absolute bottom-full left-0 right-0 mb-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md"
        >
          {error}
        </div>
      )}
    </div>
  );
}
