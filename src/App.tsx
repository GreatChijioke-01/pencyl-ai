import { useEffect, useState } from "react";
import "./App.css";
import TitleBar from "./components/titlebar/titlebar";
import Sidebar from "./components/sidebar/sidebar";
import Editor from "./components/editor/editor";
import AI_Chat from "./components/ai_chat/ai_chat";
import Footer from "./components/footer/footer";
import { useThemeStore } from "./store/themeStore";
import { useSystemThemeSync } from "./hooks/useSystemThemeSync";

export default function App() {
  const preference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [sidebarView, setSidebarView] = useState<"explorer" | "settings">("explorer");

  useSystemThemeSync();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-theme-mode", preference);
  }, [preference, resolvedTheme]);

  return (
    <div className="app-container">
      <TitleBar onOpenSettings={() => setSidebarView((prev) => (prev === "settings" ? "explorer" : "settings"))} />
            <div className="main-content">
          <Sidebar sidebarView={sidebarView} onViewChange={setSidebarView} />
                <Editor />
                <AI_Chat />
            </div>
            <Footer />
        </div>
    );
}