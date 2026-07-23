import { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";
import TitleBar from "./components/titlebar/titlebar";
import Sidebar from "./components/sidebar/sidebar";
import Editor from "./components/editor/editor";
import Preferences from "./components/preferences/Preferences";
import { AIChat } from "./components/ai_chat/ai_chat";
import Footer from "./components/footer/footer";
import { useThemeStore } from "./store/themeStore";
import { useSystemThemeSync } from "./hooks/useSystemThemeSync";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { initializeSettings } from "./store/settingsStore";


export default function App() {
  const preference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const savedWidth = localStorage.getItem('pencyl.sidebarWidth');
      return savedWidth ? parseInt(savedWidth, 10) : 260;
    } catch {
      return 260;
    }
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useSystemThemeSync();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-theme-mode", preference);
  }, [preference, resolvedTheme]);

  // Initialize settings on app start
  useEffect(() => {
    initializeSettings();
  }, []);

  // Handle sidebar resize
  const startResizing = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    e.preventDefault();
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const clientX = e.clientX;
    if (sidebarRef.current) {
      const containerRect = sidebarRef.current.parentElement?.getBoundingClientRect();
      if (containerRect) {
        const newWidth = clientX - containerRect.left;
        if (newWidth >= 150 && newWidth <= 600) {
          setSidebarWidth(newWidth);
          try {
            localStorage.setItem('pencyl.sidebarWidth', newWidth.toString());
          } catch {
            // Ignore localStorage errors
          }
        }
      }
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleResize]);

  // Cleanup resize listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleResize, stopResizing]);

  // Use the real Save implementation used by the TitleBar Save button.
  // (TitleBar owns the save logic; the App-level keyboard shortcut should invoke the same behavior.)
  const handleSave = () => {
    const ev = new CustomEvent("pencyl:titlebar-save");
    window.dispatchEvent(ev);
  };

  const handleToggleAgent = () => {
    setIsAiOpen((prev) => !prev);
  };

  const handleOpenPreferences = () => {
    setIsPreferencesOpen(true);
  };

  const handleClosePreferences = () => {
    setIsPreferencesOpen(false);
  };

  useKeyboardShortcuts({
    onSave: handleSave,
    onToggleAgent: handleToggleAgent,
  });

  return (
    <div className="app-container">
      <TitleBar onOpenSettings={handleOpenPreferences} />
      <div className="main-content">
        <div 
          ref={sidebarRef} 
          className="sidebar-container-wrapper" 
          style={{ width: `${sidebarWidth}px` }}
        >
          <Sidebar />
          <div 
            className="sidebar-resize-handle" 
            onMouseDown={startResizing}
          />
        </div>
        {isPreferencesOpen ? (
          <Preferences onClose={handleClosePreferences} />
        ) : (
          <>
            <Editor />
            {isAiOpen && (
              <div className="ai-chat-container">
                <AIChat
                  projectRootPath={globalThis.__PENCYL_PROJECT_ROOT_PATH ?? null}
                  onClose={() => setIsAiOpen(false)}
                />
              </div>
            )}
          </>
        )}

      </div>
      <Footer />
    </div>
  );
}