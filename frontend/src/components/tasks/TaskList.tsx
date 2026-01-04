import { useTasks } from "@/hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { CreateTaskInput } from "./CreateTaskInput";

/**
 * Task list component showing all tasks and the create input
 */
export function TaskList() {
  const { tasks, isLoading, error } = useTasks();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tasks yet. Type below to add your first task.
          </p>
        </div>
      )}

      {/* Task items */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Create task input */}
      <div className="mt-4">
        <CreateTaskInput />
      </div>
    </div>
  );
}
