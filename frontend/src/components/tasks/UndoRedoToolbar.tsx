import { useMemo } from "react";
import { Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => Promise<void>;
  onRedo: () => Promise<void>;
}

/**
 * Floating toolbar for undo/redo operations
 * - Fixed position on mobile (< md breakpoint)
 * - Sticky position on desktop (>= md breakpoint)
 * - Centered horizontally at bottom of viewport
 */
export function UndoRedoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoToolbarProps) {
  // Detect macOS for keyboard shortcut display
  const isMac = useMemo(() => {
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  }, []);

  // Keyboard shortcut text
  const undoShortcut = isMac ? "⌘Z" : "Ctrl+Z";
  const redoShortcut = isMac ? "⌘Y" : "Ctrl+Y";

  return (
    <div
      role="toolbar"
      aria-label="Undo and redo actions"
      className="fixed md:sticky bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card shadow-lg">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onUndo}
          disabled={!canUndo}
          title={`Undo (${undoShortcut})`}
          aria-label={`Undo (${undoShortcut})`}
          className="active:scale-95 transition-transform"
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={onRedo}
          disabled={!canRedo}
          title={`Redo (${redoShortcut})`}
          aria-label={`Redo (${redoShortcut})`}
          className="active:scale-95 transition-transform"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
