import { createContext } from "react";

/**
 * Toast notification data
 */
export interface Toast {
  id: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

/**
 * Toast context value
 */
export interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
