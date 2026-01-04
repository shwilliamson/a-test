import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLists } from "@/hooks/useLists";

const MAX_TITLE_LENGTH = 64;

interface CreateListFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Inline form for creating a new list
 */
export function CreateListForm({ onCancel, onSuccess }: CreateListFormProps) {
  const { createList } = useLists();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmedTitle = title.trim();
  const charCount = trimmedTitle.length;
  const isOverLimit = charCount > MAX_TITLE_LENGTH;
  const isEmpty = charCount === 0;
  const isValid = !isEmpty && !isOverLimit;

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!isValid || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        await createList(trimmedTitle);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create list");
        setIsSubmitting(false);
      }
    },
    [isValid, isSubmitting, createList, trimmedTitle, onSuccess]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter" && isValid) {
        handleSubmit();
      }
    },
    [onCancel, isValid, handleSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter list name"
            disabled={isSubmitting}
            aria-label="List title"
            aria-describedby={error ? "create-list-error" : undefined}
            aria-invalid={isOverLimit || !!error}
            maxLength={MAX_TITLE_LENGTH + 10} // Allow some overflow for UX
          />
        </div>
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          size="default"
        >
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>

      <div className="flex justify-between items-center text-xs">
        {error ? (
          <span id="create-list-error" className="text-destructive" role="alert">
            {error}
          </span>
        ) : (
          <span className="text-transparent">Placeholder</span>
        )}
        <span
          className={isOverLimit ? "text-destructive" : "text-muted-foreground"}
          aria-live="polite"
        >
          {charCount}/{MAX_TITLE_LENGTH}
        </span>
      </div>
    </form>
  );
}
