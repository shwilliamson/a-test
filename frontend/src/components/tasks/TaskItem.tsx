import { useState, useCallback } from "react";
import type { Task } from "@/contexts/TasksContextDef";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasks } from "@/hooks/useTasks";

interface TaskItemProps {
  task: Task;
}

/**
 * Single task item display
 * Shows checkbox and title with toggle completion functionality
 */
export function TaskItem({ task }: TaskItemProps) {
  const { toggleComplete } = useTasks();
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleCheckedChange = useCallback(async () => {
    setToggleError(null);
    setIsToggling(true);

    try {
      await toggleComplete(task.id);
    } catch (err) {
      setToggleError(
        err instanceof Error ? err.message : "Failed to update task"
      );
      // Auto-clear error after 5 seconds
      setTimeout(() => setToggleError(null), 5000);
    } finally {
      setIsToggling(false);
    }
  }, [task.id, toggleComplete]);

  const ariaLabel = task.isCompleted
    ? `Mark task as incomplete: ${task.title}`
    : `Mark task as complete: ${task.title}`;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border bg-card transition-opacity duration-200 ${
          task.id.startsWith("temp-") ? "animate-in fade-in-0 slide-in-from-top-2 duration-200" : ""
        } ${isToggling ? "opacity-70" : ""}`}
      >
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isToggling || task.id.startsWith("temp-")}
          aria-label={ariaLabel}
          className="transition-all duration-150"
        />
        <span
          className={`flex-1 transition-colors duration-200 ${
            task.isCompleted ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.title}
        </span>
      </div>

      {/* Error toast */}
      {toggleError && (
        <div
          role="alert"
          className="absolute bottom-full left-0 right-0 mb-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md"
        >
          {toggleError}
        </div>
      )}
    </div>
  );
}
