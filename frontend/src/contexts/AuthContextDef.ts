import { createContext } from "react";

/**
 * User type from the API
 */
export interface User {
  id: string;
  username: string;
}

/**
 * Auth context state
 */
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Auth context value including actions
 */
export interface AuthContextValue extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
