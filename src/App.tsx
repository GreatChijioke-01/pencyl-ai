import { useEffect, useState } from "react";
import "./App.css";
import TitleBar from "./components/titlebar/titlebar";
import Sidebar from "./components/sidebar/sidebar";
import Editor from "./components/editor/editor";
import { AIChat } from "./components/ai_chat/ai_chat";
import Footer from "./components/footer/footer";
import { useThemeStore } from "./store/themeStore";
import { useSystemThemeSync } from "./hooks/useSystemThemeSync";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";


export default function App() {
  const preference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [sidebarView, setSidebarView] = useState<"explorer" | "settings">("explorer");
  const [isAiOpen, setIsAiOpen] = useState(false);

  useSystemThemeSync();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-theme-mode", preference);
  }, [preference, resolvedTheme]);

  // Use the real Save implementation used by the TitleBar Save button.
  // (TitleBar owns the save logic; the App-level keyboard shortcut should invoke the same behavior.)
  const handleSave = () => {
    const ev = new CustomEvent("pencyl:titlebar-save");
    window.dispatchEvent(ev);
  };


  const handleToggleAgent = () => {
    setIsAiOpen((prev) => !prev);
  };

  useKeyboardShortcuts({
    onSave: handleSave,
    onToggleAgent: handleToggleAgent,
  });

  return (
    <div className="app-container">
      <TitleBar onOpenSettings={() => setSidebarView((prev) => (prev === "settings" ? "explorer" : "settings"))} />
      <div className="main-content">
        <Sidebar sidebarView={sidebarView} onViewChange={setSidebarView} />
        <Editor />
        {isAiOpen && (
          <div className="ai-chat-container">
            <AIChat
              projectRootPath={globalThis.__PENCYL_PROJECT_ROOT_PATH ?? null}
              onClose={() => setIsAiOpen(false)}
            />
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}