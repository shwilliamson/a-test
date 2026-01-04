import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Button } from "./button";
import { X } from "lucide-react";
import { ToastContext, type Toast } from "@/contexts/ToastContextDef";

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider component that manages toast notifications
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/**
 * Container that renders all active toasts
 */
function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification item
 */
function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 150);
  }, [onDismiss, toast.id]);

  const handleAction = useCallback(() => {
    if (toast.action) {
      toast.action.onClick();
      handleDismiss();
    }
  }, [toast.action, handleDismiss]);

  // Auto-dismiss after duration
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [toast.duration, handleDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        bg-card border text-card-foreground
        transition-all duration-150
        ${isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
        animate-in fade-in-0 slide-in-from-bottom-4
      `}
    >
      <span className="text-sm">{toast.message}</span>

      {toast.action && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAction}
          className="text-primary hover:text-primary/80 font-medium h-auto py-1 px-2"
        >
          {toast.action.label}
        </Button>
      )}

      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors ml-1"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
