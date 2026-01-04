import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { List } from "@/contexts/ListsContextDef";

interface ListCardProps {
  list: List;
}

/**
 * Card component for displaying a single list
 */
export function ListCard({ list }: ListCardProps) {
  const navigate = useNavigate();

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

  const isEmpty = list.taskCount === 0;
  const statusText = isEmpty
    ? "No tasks"
    : `${list.completedCount}/${list.taskCount} done`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`p-4 rounded-lg border bg-card hover:shadow-md cursor-pointer transition-shadow ${
        isEmpty ? "border-dashed" : ""
      }`}
      aria-label={`${list.title} - ${statusText}`}
    >
      <h3 className="font-medium truncate">{list.title}</h3>
      <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
        <span>{list.taskCount} {list.taskCount === 1 ? "task" : "tasks"}</span>
        <span>{statusText}</span>
      </div>
    </div>
  );
}
