import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLists } from "@/hooks/useLists";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateListForm } from "@/components/lists/CreateListForm";
import { MAX_LISTS_PER_USER } from "@/contexts/ListsContextDef";

/**
 * Lists page - shows user's lists with ability to create new ones
 */
function ListsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lists, canCreateList, listCount } = useLists();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>My Lists</CardTitle>
            <CardDescription>
              Welcome, {user?.username}! Your todo lists will appear here.
            </CardDescription>
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
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
            >
              {error}
            </div>
          )}

          {/* New List Button or Create Form */}
          {isCreating ? (
            <CreateListForm
              onCancel={handleCreateCancel}
              onSuccess={handleCreateSuccess}
            />
          ) : (
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
              className="w-full"
            >
              + New List
            </Button>
          )}

          {/* List Count Info */}
          <p className="text-xs text-muted-foreground text-center">
            {listCount} of {MAX_LISTS_PER_USER} lists
          </p>

          {/* Lists Display */}
          {lists.length > 0 ? (
            <div className="space-y-2">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="p-3 rounded-md border bg-card text-card-foreground"
                >
                  <p className="font-medium">{list.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {isCreating
                ? "Create your first list above!"
                : "No lists yet. Click \"+ New List\" to get started."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ListsPage;
