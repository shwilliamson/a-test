import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Loading spinner component for auth check
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * PublicRoute wrapper that redirects to /lists if already authenticated
 *
 * Use for login and register pages that should redirect authenticated users
 *
 * Usage:
 * <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to lists if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/lists" replace />;
  }

  return <>{children}</>;
}
