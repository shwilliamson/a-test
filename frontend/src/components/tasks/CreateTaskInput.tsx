import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";
import { MAX_TASKS_PER_LIST } from "@/contexts/TasksContextDef";

const MAX_TITLE_LENGTH = 64;

interface CreateTaskInputProps {
  onTaskCreated?: () => void;
}

/**
 * Input component for creating new tasks
 */
export function CreateTaskInput({ onTaskCreated }: CreateTaskInputProps) {
  const { createTask, taskCount, canCreateTask } = useTasks();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when it becomes enabled after being disabled
  useEffect(() => {
    if (canCreateTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canCreateTask]);

  const charCount = title.length;
  const isNearLimit = charCount >= MAX_TITLE_LENGTH - 4;
  const isOverLimit = charCount > MAX_TITLE_LENGTH;
  const isAtTaskLimit = taskCount >= MAX_TASKS_PER_LIST;
  const isValid = title.trim().length > 0 && !isOverLimit;

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting || isAtTaskLimit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTask(title.trim());
      setTitle("");
      onTaskCreated?.();
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, isAtTaskLimit, createTask, title, onTaskCreated]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isValid && !isSubmitting && !isAtTaskLimit) {
        e.preventDefault();
        void handleSubmit();
      } else if (e.key === "Escape") {
        setTitle("");
        setError(null);
      }
    },
    [isValid, isSubmitting, isAtTaskLimit, handleSubmit]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      // Clear error when user starts typing
      if (error) {
        setError(null);
      }
    },
    [error]
  );

  const isDisabled = isSubmitting || isAtTaskLimit;
  const placeholder = isAtTaskLimit
    ? "Maximum tasks reached"
    : "Add a task...";

  return (
    <div className="space-y-2">
      {/* Task limit warning */}
      {isAtTaskLimit && (
        <p className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded-md">
          This list has reached the maximum of {MAX_TASKS_PER_LIST} tasks.
        </p>
      )}

      <Input
        ref={inputRef}
        type="text"
        value={title}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        aria-label="Add a new task"
        aria-describedby="task-char-count task-error"
        aria-invalid={isOverLimit || !!error}
        className={isSubmitting ? "opacity-50" : ""}
      />

      <div className="flex justify-between items-center text-xs">
        {error ? (
          <span id="task-error" className="text-destructive" role="alert">
            {error}
          </span>
        ) : (
          <span className="text-transparent">Placeholder</span>
        )}
        <span
          id="task-char-count"
          className={
            isOverLimit
              ? "text-destructive"
              : isNearLimit
                ? "text-amber-500"
                : "text-muted-foreground"
          }
          aria-live="polite"
        >
          {charCount}/{MAX_TITLE_LENGTH}
        </span>
      </div>
    </div>
  );
}
