import type { Task } from "@/contexts/TasksContextDef";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskItemProps {
  task: Task;
}

/**
 * Single task item display
 * Shows checkbox (disabled - completing tasks is a separate feature) and title
 */
export function TaskItem({ task }: TaskItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${
        task.id.startsWith("temp-") ? "animate-in fade-in-0 slide-in-from-top-2 duration-200" : ""
      }`}
    >
      <Checkbox
        checked={task.isCompleted}
        disabled
        readOnly
        aria-label={`Task: ${task.title}${task.isCompleted ? " (completed)" : ""}`}
      />
      <span
        className={`flex-1 ${
          task.isCompleted ? "line-through text-muted-foreground" : ""
        }`}
      >
        {task.title}
      </span>
    </div>
  );
}
