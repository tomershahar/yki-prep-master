import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

/**
 * Keyboard shortcuts helper component
 * Displays available shortcuts and handles global keyboard events
 */
export function KeyboardShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="keyboard-shortcuts-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-sm">Navigation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Next question/task</span>
                <Badge variant="outline">→ or Tab</Badge>
              </div>
              <div className="flex justify-between">
                <span>Previous question/task</span>
                <Badge variant="outline">← or Shift+Tab</Badge>
              </div>
              <div className="flex justify-between">
                <span>Submit answer</span>
                <Badge variant="outline">Enter</Badge>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-sm">General</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Show shortcuts</span>
                <Badge variant="outline">?</Badge>
              </div>
              <div className="flex justify-between">
                <span>Close dialog</span>
                <Badge variant="outline">Esc</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts({ onNext, onPrevious, onSubmit, enabled = true }) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious?.();
          break;
        case 'Enter':
          if (!e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            onSubmit?.();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onSubmit, enabled]);
}