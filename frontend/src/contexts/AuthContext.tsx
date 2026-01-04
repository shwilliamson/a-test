import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  AuthContext,
  type AuthContextValue,
  type User,
} from "./AuthContextDef";

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

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the app and provides auth state
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check session with the backend
   */
  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Session invalid or expired
        setUser(null);
      }
    } catch {
      // Network error - assume not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login action - called after successful login/register
   */
  const login = useCallback((newUser: User) => {
    setUser(newUser);
  }, []);

  /**
   * Logout action - calls backend and clears state
   */
  const logout = useCallback(async () => {
    try {
      const csrfToken = getCookie("csrf_token");

      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        credentials: "include",
      });
    } catch {
      // Even if logout fails, clear local state
    }
    setUser(null);
  }, []);

  // Check session on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshAuth,
    }),
    [user, isLoading, login, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
