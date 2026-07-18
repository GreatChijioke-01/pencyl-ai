import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useFileStore } from "../../store/filestore";
import SettingsPanel from "./settings_panel";
import FileTree from "./fileTree/FileTree";
import { readFileContent } from "../../services/fileService";
import "./sidebar.css";

type SidebarView = "explorer" | "settings";

interface SidebarProps {
  sidebarView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

export default function Sidebar({ sidebarView, onViewChange }: SidebarProps) {
  const files = useFileStore((state) => state.files);
  const updateActiveFile = useFileStore((state) => state.updateActiveFile);
  const addFile = useFileStore((state) => state.addFile);

  const [rootPath, setRootPath] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<string | null>(null);

  const handleOpenFolder = async () => {
    try {
      const selectedPath = await open({ multiple: false, directory: true, title: "Open folder" });
      const folderPath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
      if (folderPath && typeof folderPath === "string") {
        setRootPath(folderPath);
        try {
          localStorage.setItem("pencyl.lastRoot", folderPath);
        } catch (err) {
          console.warn("Failed to persist last root folder", err);
        }
      }
    } catch (err) {
      console.error("Failed to open folder:", err);
    }
  };

  // Listen for programmatic open-folder requests (e.g., from the titlebar)
  useEffect(() => {
    const handler = () => {
      handleOpenFolder();
    };
    window.addEventListener("pencyl:open-folder", handler as EventListener);
    return () => window.removeEventListener("pencyl:open-folder", handler as EventListener);
  }, []);

  const handleFileOpen = async (path: string) => {
    const existing = files.find((f) => f.path === path);
    if (existing) {
      updateActiveFile(existing.id);
      return;
    }

    try {
      const content = await readFileContent(path);
      const fileName = path.split("\\").pop()?.split("/").pop() || "Untitled";
      addFile({ id: path, path, name: fileName, content, isDirty: false, kind: "file" });
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  };

  // Restore last opened folder from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pencyl.lastRoot");
      if (saved) setRootPath(saved);
    } catch (err) {
      // ignore
    }
  }, []);

  // Listen for requests to show only a specific file in the tree
  useEffect(() => {
    const handler = (e: any) => {
      const path = e?.detail ?? e?.detail?.path ?? e;
      if (!path || typeof path !== "string") return;
      const parent = path.split("\\").slice(0, -1).join("\\") || path.split("/").slice(0, -1).join("/");
      setRootPath(parent || null);
      setHighlightPath(path);
    };
    window.addEventListener("pencyl:show-file-in-tree", handler as EventListener);
    return () => window.removeEventListener("pencyl:show-file-in-tree", handler as EventListener);
  }, []);

  return (
    <div className="sidebar-container">
      <div className="sidebar-body">
        {sidebarView === "settings" ? (
          <SettingsPanel onDone={() => onViewChange("explorer")} />
        ) : (
          <div className="sidebar-view">
            <div className="sidebar-actions" style={{ padding: 8 }}>
              <button className="titlebar-button" onClick={handleOpenFolder}>Open Folder</button>
            </div>
            {rootPath ? (
              <FileTree rootPath={rootPath} onFileOpen={handleFileOpen} highlightPath={highlightPath} />
            ) : (
              <div className="sidebar-empty">No folder selected. Click "Open Folder".</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
