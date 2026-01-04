import type { Task } from "@/contexts/TasksContextDef";

interface TaskItemProps {
  task: Task;
}

/**
 * Single task item display
 */
export function TaskItem({ task }: TaskItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${
        task.id.startsWith("temp-") ? "animate-in fade-in-0 slide-in-from-top-2 duration-200" : ""
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
          task.isCompleted
            ? "bg-primary border-primary"
            : "border-muted-foreground"
        }`}
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
