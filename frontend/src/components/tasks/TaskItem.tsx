import { useState, useCallback } from "react";
import type { Task } from "@/contexts/TasksContextDef";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { useTasks } from "@/hooks/useTasks";
import { EditableTaskTitle } from "./EditableTaskTitle";
import { Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
}

/**
 * Single task item display
 * Shows checkbox and editable title with toggle completion functionality
 */
export function TaskItem({ task }: TaskItemProps) {
  const { toggleComplete, updateTitle, deleteTask } = useTasks();
  const { showToast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDelete = useCallback(async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const { undo } = await deleteTask(task.id);

      // Show toast with undo option
      showToast({
        message: "Task deleted",
        action: {
          label: "Undo",
          onClick: () => {
            void undo().catch((err) => {
              setError(
                err instanceof Error ? err.message : "Failed to restore task"
              );
              setTimeout(() => setError(null), 5000);
            });
          },
        },
        duration: 5000,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete task"
      );
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  }, [task.id, deleteTask, showToast]);

  const ariaLabel = task.isCompleted
    ? `Mark task as incomplete: ${task.title}`
    : `Mark task as complete: ${task.title}`;

  const isTempTask = task.id.startsWith("temp-");

  return (
    <div className="relative group">
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border bg-card transition-opacity duration-200 ${
          isTempTask ? "animate-in fade-in-0 slide-in-from-top-2 duration-200" : ""
        } ${isToggling || isDeleting ? "opacity-70" : ""}`}
      >
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isToggling || isDeleting || isTempTask}
          aria-label={ariaLabel}
          className="transition-all duration-150 mt-0.5"
        />
        <EditableTaskTitle
          title={task.title}
          onSave={handleTitleSave}
          isDisabled={isTempTask || isDeleting}
          isCompleted={task.isCompleted}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || isTempTask}
          aria-label={`Delete task: ${task.title}`}
          className="h-auto p-1 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
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
