import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Gets a cookie value by name
 */
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift();
  }
  return undefined;
}

/**
 * Placeholder Lists page - shown after successful login
 * Full implementation will be in a separate issue
 */
function ListsPage() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      // Get CSRF token from cookie
      const csrfToken = getCookie("csrf_token");

      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        // If session is already invalid/expired, still redirect to login
        if (data.error === "SESSION_INVALID" || data.error === "UNAUTHORIZED") {
          navigate("/login");
          return;
        }
        throw new Error(data.message || "Failed to logout");
      }

      // Success - redirect to login page
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoggingOut(false);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1.5">
            <CardTitle>My Lists</CardTitle>
            <CardDescription>
              Your todo lists will appear here
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
            Registration successful! Lists feature coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ListsPage;
