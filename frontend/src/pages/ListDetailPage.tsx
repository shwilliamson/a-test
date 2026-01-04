import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Pin, PinOff } from "lucide-react";
import { useLists } from "@/hooks/useLists";
import { useTasks } from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { EditableTitle } from "@/components/lists/EditableTitle";
import { DeleteListDialog } from "@/components/lists/DeleteListDialog";
import { TaskList } from "@/components/tasks";
import { TasksProvider } from "@/contexts/TasksContext";
import type { List } from "@/contexts/ListsContextDef";

/**
 * List detail page - shows a single list with edit capabilities
 */
function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { getList, updateListTitle, togglePinned, deleteList, lists } = useLists();

  const [list, setList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load list data
  useEffect(() => {
    async function loadList() {
      if (!listId) {
        setError("Invalid list ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const listData = await getList(listId);
        setList(listData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load list");
      } finally {
        setIsLoading(false);
      }
    }

    void loadList();
  }, [listId, getList]);

  // Sync with context state (for optimistic updates)
  useEffect(() => {
    if (listId) {
      const updatedList = lists.find((l) => l.id === listId);
      if (updatedList) {
        setList(updatedList);
      }
    }
  }, [lists, listId]);

  const handleTitleSave = useCallback(
    async (newTitle: string) => {
      if (!listId) return;

      setUpdateError(null);
      try {
        const updatedList = await updateListTitle(listId, newTitle);
        setList(updatedList);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update title";
        setUpdateError(errorMessage);
        throw err; // Re-throw to let EditableTitle handle the error state
      }
    },
    [listId, updateListTitle]
  );

  const handlePinToggle = useCallback(async () => {
    if (!listId) return;

    setUpdateError(null);
    setIsPinning(true);

    try {
      const updatedList = await togglePinned(listId);
      setList(updatedList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update pin status";
      setUpdateError(errorMessage);
    } finally {
      setIsPinning(false);
    }
  }, [listId, togglePinned]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!listId) return;

    await deleteList(listId);
    navigate("/lists");
  }, [listId, deleteList, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading list...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !list) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error || "List not found"}</p>
            <Button onClick={() => navigate("/lists")} variant="outline">
              Back to Lists
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(list.updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <Link
              to="/lists"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to Lists
            </Link>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <EditableTitle
                title={list.title}
                onSave={handleTitleSave}
                maxLength={64}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Updated: {formattedDate}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePinToggle}
                disabled={isPinning}
                aria-label={list.isPinned ? "Unpin list" : "Pin list"}
                className={list.isPinned ? "text-primary" : ""}
              >
                {list.isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-1" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-1" />
                    Pin
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                aria-label="Delete list"
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Delete confirmation dialog */}
          <DeleteListDialog
            list={list}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
          />

          {/* Update error toast */}
          {updateError && (
            <div
              role="alert"
              className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
            >
              {updateError}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <TasksProvider listId={listId!}>
          <TaskStatsAndList />
        </TasksProvider>
      </main>
    </div>
  );
}

/**
 * Component to display task stats and list, must be inside TasksProvider
 */
function TaskStatsAndList() {
  const { tasks } = useTasks();
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const taskCount = tasks.length;

  return (
    <>
      {/* Stats */}
      <div className="mb-6 text-sm text-muted-foreground">
        {taskCount === 0 ? (
          <span>No tasks yet</span>
        ) : (
          <span>
            {completedCount} of {taskCount} tasks completed
          </span>
        )}
      </div>

      {/* Task list */}
      <TaskList />
    </>
  );
}

export default ListDetailPage;
