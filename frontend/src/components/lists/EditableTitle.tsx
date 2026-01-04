import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => Promise<void>;
  maxLength?: number;
}

/**
 * Editable title component with inline editing
 */
export function EditableTitle({
  title,
  onSave,
  maxLength = 64,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setValidationError(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(title);
    setValidationError(null);
    // Return focus to edit button after cancel
    setTimeout(() => editButtonRef.current?.focus(), 0);
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
      // Return focus to edit button after save
      setTimeout(() => editButtonRef.current?.focus(), 0);
    } catch {
      // Error is handled by parent component (toast)
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            aria-label="List title"
            aria-describedby="title-char-count"
            aria-invalid={!!validationError || isOverLimit}
            className="text-2xl font-bold h-auto py-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <p
            id="title-char-count"
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
    <div className="group flex items-center gap-2">
      <h1 className="text-2xl font-bold truncate">{title}</h1>
      <button
        ref={editButtonRef}
        type="button"
        onClick={handleEditClick}
        aria-label="Edit list title"
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>
    </div>
  );
}
