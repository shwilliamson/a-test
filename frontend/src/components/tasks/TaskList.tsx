import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTasks } from "@/hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { CreateTaskInput } from "./CreateTaskInput";

/**
 * Task list component showing all tasks and the create input
 * Includes drag-and-drop reordering with dnd-kit
 */
export function TaskList() {
  const { tasks, isLoading, error, reorderTasks } = useTasks();
  const [isDragging, setIsDragging] = useState(false);

  // Check if prefers-reduced-motion is set
  const prefersReducedMotion = useMemo(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Setup sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8, // Require at least 8px of movement to start drag
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        setIsDragging(false);
        return;
      }

      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        setIsDragging(false);
        return;
      }

      // Calculate new order values
      const movedTasks = arrayMove(tasks, oldIndex, newIndex);
      const orders = movedTasks.map((task, index) => ({
        taskId: task.id,
        order: index + 1,
      }));

      setIsDragging(false);

      try {
        await reorderTasks(orders);
      } catch (err) {
        // Error is handled by the context, UI will rollback automatically
        console.error("Failed to reorder tasks:", err);
      }
    },
    [tasks, reorderTasks]
  );

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

  const taskIds = tasks.map((task) => task.id);

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

      {/* Task items with drag-and-drop */}
      {tasks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={() => setIsDragging(true)}
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
            disabled={prefersReducedMotion}
          >
            <div
              className={`space-y-2 ${
                !prefersReducedMotion && isDragging ? "opacity-75" : ""
              }`}
              style={
                !prefersReducedMotion && isDragging
                  ? { transition: "opacity 0.2s ease" }
                  : {}
              }
            >
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isDragging={isDragging}
                  prefersReducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create task input */}
      <div className="mt-4">
        <CreateTaskInput />
      </div>
    </div>
  );
}
