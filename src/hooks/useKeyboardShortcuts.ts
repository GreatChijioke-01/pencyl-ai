import { useEffect, useRef } from "react";

interface ShortcutHandlers {
  onSave: () => void;
  onToggleAgent: () => void;
}

export function useKeyboardShortcuts({ onSave, onToggleAgent }: ShortcutHandlers) {
  const onSaveRef = useRef(onSave);
  const onToggleAgentRef = useRef(onToggleAgent);

  // Keep refs up to date so the event handler always calls the latest callbacks.
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onToggleAgentRef.current = onToggleAgent;
  }, [onToggleAgent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isModifier && key === "s") {
        // Override any underlying editor/browser defaults and stop other handlers.
        e.preventDefault();
        e.stopPropagation();
        onSaveRef.current?.();
        return;
      }

      if (isModifier && key === "i") {
        e.preventDefault();
        e.stopPropagation();
        onToggleAgentRef.current?.();
      }
    };

    // Capture phase: intercept before focused inputs/textareas can swallow the event.
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);
}

