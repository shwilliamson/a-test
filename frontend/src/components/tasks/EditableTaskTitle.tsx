import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditableTaskTitleProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  isDisabled?: boolean;
  maxLength?: number;
  isCompleted?: boolean;
}

/**
 * Editable task title component with inline editing
 * Click on title to enter edit mode, Enter to save, Escape to cancel
 */
export function EditableTaskTitle({
  title,
  onSave,
  isDisabled = false,
  maxLength = 64,
  isCompleted = false,
}: EditableTaskTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);

  // Sync editValue with title prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = useCallback(() => {
    if (!isDisabled) {
      setIsEditing(true);
      setValidationError(null);
    }
  }, [isDisabled]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(title);
    setValidationError(null);
    // Return focus to title after cancel
    setTimeout(() => titleRef.current?.focus(), 0);
  }, [title]);

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim();

    // Validate
    if (!trimmedValue) {
      setValidationError("Title is required");
      return;
    }

    if (trimmedValue.length > maxLength) {
      setValidationError(`Title must be at most ${maxLength} characters`);
      return;
    }

    // If value hasn't changed, just exit edit mode
    if (trimmedValue === title) {
      setIsEditing(false);
      setValidationError(null);
      return;
    }

    setIsSaving(true);
    setValidationError(null);

    try {
      await onSave(trimmedValue);
      setIsEditing(false);
      // Return focus to title after save
      setTimeout(() => titleRef.current?.focus(), 0);
    } catch {
      // Error is handled by parent component
      // Stay in edit mode so user can retry
    } finally {
      setIsSaving(false);
    }
  }, [editValue, maxLength, onSave, title]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !isSaving) {
        event.preventDefault();
        void handleSave();
      } else if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel, isSaving]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(event.target.value);
      // Clear validation error when user starts typing
      if (validationError) {
        setValidationError(null);
      }
    },
    [validationError]
  );

  const charCount = editValue.length;
  const isNearLimit = charCount >= maxLength - 4;
  const isOverLimit = charCount > maxLength;

  if (isEditing) {
    return (
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            aria-label="Edit task title"
            aria-describedby="task-title-char-count"
            aria-invalid={!!validationError || isOverLimit}
            className="h-auto py-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <p
            id="task-title-char-count"
            className={`text-xs ${
              isOverLimit
                ? "text-destructive"
                : isNearLimit
                  ? "text-amber-500"
                  : "text-muted-foreground"
            }`}
          >
            {charCount}/{maxLength} characters
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || isOverLimit || !editValue.trim()}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {validationError && (
          <p className="text-xs text-destructive" role="alert">
            {validationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <span
      ref={titleRef}
      tabIndex={isDisabled ? -1 : 0}
      role="button"
      onClick={handleTitleClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
          e.preventDefault();
          setIsEditing(true);
          setValidationError(null);
        }
      }}
      className={`flex-1 transition-colors duration-200 cursor-text hover:bg-muted/50 rounded px-1 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isCompleted ? "line-through text-muted-foreground" : ""
      } ${isDisabled ? "cursor-default" : ""}`}
      aria-label={`Task: ${title}. ${isDisabled ? "" : "Click to edit"}`}
    >
      {title}
    </span>
  );
}
