import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pin, PinOff } from "lucide-react";
import { useLists } from "@/hooks/useLists";
import type { List } from "@/contexts/ListsContextDef";

interface ListCardProps {
  list: List;
}

/**
 * Card component for displaying a single list
 */
export function ListCard({ list }: ListCardProps) {
  const navigate = useNavigate();
  const { togglePinned } = useLists();
  const [isPinning, setIsPinning] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    navigate(`/lists/${list.id}`);
  }, [navigate, list.id]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate(`/lists/${list.id}`);
      }
    },
    [navigate, list.id]
  );

  const handlePinClick = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      setPinError(null);
      setIsPinning(true);

      try {
        await togglePinned(list.id);
      } catch (err) {
        setPinError(
          err instanceof Error ? err.message : "Failed to update pin status"
        );
        // Auto-clear error after 5 seconds
        setTimeout(() => setPinError(null), 5000);
      } finally {
        setIsPinning(false);
      }
    },
    [list.id, togglePinned]
  );

  const handlePinKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        void handlePinClick(event as unknown as React.MouseEvent);
      }
    },
    [handlePinClick]
  );

  const isEmpty = list.taskCount === 0;
  const statusText = isEmpty
    ? "No tasks"
    : `${list.completedCount}/${list.taskCount} done`;

  const PinIcon = list.isPinned ? PinOff : Pin;
  const pinLabel = list.isPinned ? "Unpin list" : "Pin list";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative p-4 rounded-lg border bg-card hover:shadow-md cursor-pointer transition-shadow ${
        isEmpty ? "border-dashed" : ""
      }`}
      aria-label={`${list.title} - ${statusText}`}
    >
      {/* Pin button */}
      <button
        type="button"
        onClick={handlePinClick}
        onKeyDown={handlePinKeyDown}
        disabled={isPinning}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-colors ${
          list.isPinned
            ? "text-primary hover:text-primary/80"
            : "text-muted-foreground hover:text-primary"
        } ${isPinning ? "opacity-50" : ""}`}
        aria-label={pinLabel}
        aria-pressed={list.isPinned}
        title={pinLabel}
      >
        <PinIcon className="h-4 w-4" />
      </button>

      <h3 className="font-medium truncate pr-8">{list.title}</h3>
      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
        <span>{list.taskCount} {list.taskCount === 1 ? "task" : "tasks"}</span>
        <span>{statusText}</span>
      </div>

      {/* Error toast */}
      {pinError && (
        <div
          role="alert"
          className="absolute bottom-full left-0 right-0 mb-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md"
        >
          {pinError}
        </div>
      )}
    </div>
  );
}
