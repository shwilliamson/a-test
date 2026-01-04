import { useState, useCallback, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/contexts/TasksContextDef";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { useTasks } from "@/hooks/useTasks";
import { useTaskActions } from "@/hooks/useTaskActions";
import { EditableTaskTitle } from "./EditableTaskTitle";
import {
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface TaskItemProps {
  task: Task;
  isDragging?: boolean;  // Used to coordinate dragging state from parent
  prefersReducedMotion?: boolean;
}

/**
 * Single task item display with drag-and-drop support
 * Shows checkbox, editable title, drag handle, and delete button
 * On mobile, includes long-press activation for reordering with up/down buttons
 */
export function TaskItem({
  task,
  isDragging: _isDragging = false,  // Reserved for future parent coordination (unused but part of API)
  prefersReducedMotion = false,
}: TaskItemProps) {
  const { tasks } = useTasks();
  const { toggleComplete, updateTitle, deleteTask, reorderTasks } = useTaskActions();
  const { showToast } = useToast();

  // State for mobile long-press reorder mode
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(
    null
  );

  // States for async operations
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag-and-drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: !prefersReducedMotion ? transition : undefined,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // Check if task is at boundaries
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.order - b.order),
    [tasks]
  );
  const currentIndex = sortedTasks.findIndex((t) => t.id === task.id);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sortedTasks.length - 1;

  // Long-press detection for mobile
  const handleTouchStart = useCallback(() => {
    const timer = setTimeout(() => {
      setIsReorderMode(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long-press

    setLongPressTimer(timer);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Handle moving task up or down (mobile reorder mode or keyboard)
  const handleMoveTask = useCallback(
    async (direction: "up" | "down") => {
      const newIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (newIndex < 0 || newIndex >= sortedTasks.length) {
        return; // Can't move beyond boundaries
      }

      const movedTasks = [...sortedTasks];
      [movedTasks[currentIndex], movedTasks[newIndex]] = [
        movedTasks[newIndex],
        movedTasks[currentIndex],
      ];

      const orders = movedTasks.map((t, index) => ({
        taskId: t.id,
        order: index + 1,
      }));

      try {
        await reorderTasks(orders);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to reorder task"
        );
        setTimeout(() => setError(null), 5000);
      }
    },
    [currentIndex, sortedTasks, reorderTasks]
  );

  // Handle keyboard navigation (Alt+ArrowUp/Down)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === "ArrowUp" && !isFirst) {
          e.preventDefault();
          void handleMoveTask("up");
        } else if (e.key === "ArrowDown" && !isLast) {
          e.preventDefault();
          void handleMoveTask("down");
        }
      }
    },
    [isFirst, isLast, handleMoveTask]
  );

  // Handle checkbox toggle
  const handleCheckedChange = useCallback(async () => {
    setError(null);
    setIsToggling(true);

    try {
      await toggleComplete(task.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task"
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsToggling(false);
    }
  }, [task.id, toggleComplete]);

  // Handle title save
  const handleTitleSave = useCallback(async (newTitle: string) => {
    setError(null);

    try {
      await updateTitle(task.id, newTitle);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task"
      );
      setTimeout(() => setError(null), 5000);
      throw err;
    }
  }, [task.id, updateTitle]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await deleteTask(task.id);

      showToast({
        message: "Task deleted",
        duration: 3000,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete task"
      );
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
    <div
      ref={setNodeRef}
      style={style}
      onKeyDown={handleKeyDown}
      className="relative group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border bg-card transition-all duration-200 ${
          isTempTask ? "animate-in fade-in-0 slide-in-from-top-2 duration-200" : ""
        } ${isToggling || isDeleting ? "opacity-70" : ""} ${
          isReorderMode ? "ring-2 ring-primary bg-primary/5" : ""
        }`}
      >
        {/* Drag handle - visible on hover on desktop */}
        <div
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:hidden transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
          aria-label={`Drag to reorder task: ${task.title}`}
          role="img"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Checkbox */}
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={handleCheckedChange}
          disabled={isToggling || isDeleting || isTempTask}
          aria-label={ariaLabel}
          className="transition-all duration-150 mt-0.5"
        />

        {/* Title */}
        <EditableTaskTitle
          title={task.title}
          onSave={handleTitleSave}
          isDisabled={isTempTask || isDeleting}
          isCompleted={task.isCompleted}
        />

        {/* Mobile reorder buttons (only in reorder mode) */}
        {isReorderMode && (
          <div className="flex gap-1 flex-shrink-0 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void handleMoveTask("up");
              }}
              disabled={isFirst}
              aria-label={`Move ${task.title} up`}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void handleMoveTask("down");
              }}
              disabled={isLast}
              aria-label={`Move ${task.title} down`}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || isTempTask}
          aria-label={`Delete task: ${task.title}`}
          className="h-auto p-1 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="absolute bottom-full left-0 right-0 mb-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md"
        >
          {error}
        </div>
      )}

      {/* Exit reorder mode on Escape or click outside */}
      {isReorderMode && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsReorderMode(false)}
        />
      )}
    </div>
  );
}
