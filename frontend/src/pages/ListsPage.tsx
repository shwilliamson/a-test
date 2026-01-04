import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Placeholder Lists page - shown after successful login
 * Full implementation will be in a separate issue
 */
function ListsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <CardContent>
          {error && (
            <div
              role="alert"
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4"
            >
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Lists feature coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ListsPage;
