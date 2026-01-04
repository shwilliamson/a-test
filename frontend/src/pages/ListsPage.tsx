import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import { Button } from "@/components/ui/button";
import { CreateListForm } from "@/components/lists/CreateListForm";
import { ListSection } from "@/components/lists/ListSection";
import { MAX_LISTS_PER_USER } from "@/contexts/ListsContextDef";
import type { List } from "@/contexts/ListsContextDef";

/**
 * Determines if a list is completed (all tasks done and has at least one task)
 */
function isListCompleted(list: List): boolean {
  return list.taskCount > 0 && list.completedCount === list.taskCount;
}

/**
 * Sorts lists by updatedAt descending
 */
function sortByUpdatedAt(lists: List[]): List[] {
  return [...lists].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Lists page - shows user's lists organized by sections
 */
function ListsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lists, canCreateList, listCount, isLoading, refreshLists } = useLists();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const lastPathRef = useRef<string>("");

  // Refresh lists when navigating to this page (including from detail pages)
  useEffect(() => {
    // If we're navigating from a different path to /lists, refresh
    if (location.pathname === "/lists" && lastPathRef.current !== "/lists") {
      void refreshLists();
    }
    lastPathRef.current = location.pathname;
  }, [location.pathname, refreshLists]);

  // Organize lists into sections
  const { pinnedLists, activeLists, completedLists } = useMemo(() => {
    const pinned: List[] = [];
    const active: List[] = [];
    const completed: List[] = [];

    lists.forEach((list) => {
      if (list.isPinned) {
        pinned.push(list);
      } else if (isListCompleted(list)) {
        completed.push(list);
      } else {
        active.push(list);
      }
    });

    return {
      pinnedLists: sortByUpdatedAt(pinned),
      activeLists: sortByUpdatedAt(active),
      completedLists: sortByUpdatedAt(completed),
    };
  }, [lists]);

  const hasLists = lists.length > 0;
  const hasSections =
    pinnedLists.length > 0 ||
    activeLists.length > 0 ||
    completedLists.length > 0;

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  const handleNewListClick = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleCreateCancel = useCallback(() => {
    setIsCreating(false);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setIsCreating(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Lists</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {user?.username}!
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sign out of your account"
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
          >
            {error}
          </div>
        )}

        {/* New List Button or Create Form */}
        <div className="mb-6">
          {isCreating ? (
            <div className="max-w-md">
              <CreateListForm
                onCancel={handleCreateCancel}
                onSuccess={handleCreateSuccess}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Button
                onClick={handleNewListClick}
                disabled={!canCreateList}
                aria-label={
                  canCreateList
                    ? "Create new list"
                    : `Maximum ${MAX_LISTS_PER_USER} lists reached`
                }
                title={
                  !canCreateList
                    ? `Maximum ${MAX_LISTS_PER_USER} lists reached`
                    : undefined
                }
              >
                + New List
              </Button>
              <p className="text-xs text-muted-foreground">
                {listCount} of {MAX_LISTS_PER_USER} lists
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && !hasLists && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading lists...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasLists && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No lists yet</p>
            {!isCreating && (
              <Button onClick={handleNewListClick} disabled={!canCreateList}>
                Create your first list
              </Button>
            )}
          </div>
        )}

        {/* Lists Sections */}
        {hasSections && (
          <div className="space-y-8">
            <ListSection type="pinned" lists={pinnedLists} />
            <ListSection type="active" lists={activeLists} />
            <ListSection type="completed" lists={completedLists} />
          </div>
        )}
      </main>
    </div>
  );
}

export default ListsPage;
