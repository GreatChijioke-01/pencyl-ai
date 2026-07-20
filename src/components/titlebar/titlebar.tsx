import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeFileContent, readFileContent } from "../../services/fileService";
import { useFileStore } from "../../store/filestore";
import "./titlebar.css";

type TitleBarProps = {
  onOpenSettings: () => void;
};

export default function TitleBar({ onOpenSettings }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [appWindow, setAppWindow] = useState<any | null>(null);
  const files = useFileStore((state) => state.files);
  const activeFileId = useFileStore((state) => state.activeFileId);
  const addFile = useFileStore((state) => state.addFile);
  const removeFile = useFileStore((state) => state.removeFile);
  const updateActiveFile = useFileStore((state) => state.updateActiveFile);
  const [tabQueue, setTabQueue] = useState<string[]>(() => files.slice(0, 3).map((f) => f.id));

  useEffect(() => {
    try {
      setAppWindow(getCurrentWindow());
    } catch (error) {
      console.warn("Tauri window API unavailable:", error);
    }
  }, []);

  useEffect(() => {
    if (!appWindow) return;
    appWindow.isMaximized().then(setIsMaximized);
  }, [appWindow]);

  const handleMinimize = () => appWindow?.minimize();
  const handleMaximize = async () => {
    if (!appWindow) return;
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };
  const handleClose = () => appWindow?.close();

  const handleOpenFile = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        title: "Open file",
      });
      const path = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;

      if (!path || typeof path !== "string") {
        return;
      }

      const existingFile = files.find((f) => f.path === path);

      if (existingFile) {
        updateActiveFile(existingFile.id);
        // request sidebar to show only this file in the file tree
        const ev = new CustomEvent("pencyl:show-file-in-tree", { detail: path });
        window.dispatchEvent(ev);
      } else {
        const content = await readFileContent(path);
        const fileName = path.split("\\").pop()?.split("/").pop() || "Untitled";

        addFile({
          id: path,
          path,
          name: fileName,
          content,
          isDirty: false,
          kind: "file",
        });
        // request sidebar to show only this file in the file tree
        const ev = new CustomEvent("pencyl:show-file-in-tree", { detail: path });
        window.dispatchEvent(ev);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const handleOpenFolder = async () => {
    // Delegate to Sidebar's handler via a custom event so behavior is identical
    const ev = new CustomEvent("pencyl:open-folder");
    window.dispatchEvent(ev);
  };

  const handleOpenTerminal = () => {
    const id = `terminal-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    addFile({
      id,
      path: "",
      name: "Terminal",
      content: "Welcome to the terminal. Type a command and press Enter or Run.\n",
      isDirty: false,
      kind: "terminal",
    });
  };

  const handleSave = async () => {
    if (!activeFileId) return;
    const file = files.find((f) => f.id === activeFileId);
    if (!file) return;
    if (file.kind !== "file") return;

    try {
      if (file.path && file.path.length > 0) {
        await writeFileContent(file.path, file.content);
        // mark clean
        const markFileClean = useFileStore.getState().markFileClean;
        markFileClean(file.id);
      } else {
        // fallback to Save As
        await handleSaveAs();
      }
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  };

  // Allow global Ctrl-S shortcut (wired via App/useKeyboardShortcuts) to call the same Save logic
  useEffect(() => {
    const onSaveShortcut = () => {
      void handleSave();
    };

    window.addEventListener("pencyl:titlebar-save", onSaveShortcut);
    return () => {
      window.removeEventListener("pencyl:titlebar-save", onSaveShortcut);
    };
    // Intentionally depend on handleSave via state/closure.
  }, [handleSave]);


  const handleSaveAs = async () => {
    if (!activeFileId) return;
    const file = files.find((f) => f.id === activeFileId);
    if (!file) return;
    if (file.kind !== "file") return;

    try {
      // Use a save dialog so users can pick a target filename/location
      const selectedPath = await save({ defaultPath: file.name, title: "Save file" });
      const path = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;

      if (!path || typeof path !== "string") {
        return;
      }

      await writeFileContent(path, file.content);
      const fileName = path.split("\\").pop()?.split("/").pop() || file.name;
      useFileStore.getState().saveAsFile(file.id, path, fileName);
    } catch (err) {
      console.error("Failed Save As:", err);
    }
  };

  // Maintain a FIFO queue of visible tabs (max 3). When a file becomes active,
  // enqueue it if not present; if queue exceeds 3, remove the oldest.
  useEffect(() => {
    if (!activeFileId) return;
    setTabQueue((prev) => {
      if (prev.includes(activeFileId)) return prev;
      const next = [...prev, activeFileId];
      if (next.length > 3) next.shift();
      return next;
    });
  }, [activeFileId]);

  // Keep queue in sync with available files (remove ids that no longer exist)
  useEffect(() => {
    setTabQueue((prev) => prev.filter((id) => files.some((f) => f.id === id)));
  }, [files]);

  return (
    <div className="titlebar">
      {/* Left: Logo */}
      <div className="titlebar-left">
        <img src="/app-icon.png" alt="Pencyl-AI" className="app-logo" />
      </div>

      {/* Center: Active File Name */}
      <div className="titlebar-center" style={{ overflowX: "auto", display: "flex", gap: "6px", alignItems: "center", padding: "0 12px" }}>
        {files.length === 0 ? (
          <span className="active-file">No file open</span>
        ) : (
          tabQueue.map((id) => {
            const file = files.find((f) => f.id === id);
            if (!file) return null;
            return (
              <div
                key={file.id}
                className={`titlebar-tab${activeFileId === file.id ? " active" : ""}`}
                onClick={() => updateActiveFile(file.id)}
                role="button"
                tabIndex={0}
              >
                <span className="titlebar-tab-label">
                  {file.name}
                  {file.isDirty ? " ●" : ""}
                </span>
                <button
                  className="titlebar-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  title="Close"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Right: Action Buttons + Window Controls */}
      <div className="titlebar-right">
        <button className="titlebar-button" title="Open File" onClick={handleOpenFile}>
          Open
        </button>
        <button className="titlebar-button" title="Open Folder" onClick={handleOpenFolder}>
          Open Folder
        </button>
        <button className="titlebar-button" title="Open Terminal" onClick={handleOpenTerminal}>
          Terminal
        </button>
        <button className="titlebar-button" title="Save" onClick={handleSave}>
          Save
        </button>
        <button className="titlebar-button" title="Save As" onClick={handleSaveAs}>
          Save As
        </button>
        <button className="titlebar-button" title="Settings" onClick={onOpenSettings}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M19.4 12.9999L21 11.5999L19.4 10.1999L19.15 7.99994L17.45 7.59994L16.45 5.99994L14.05 6.09994L12.65 4.49994L11.35 4.49994L9.95 6.09994L7.55 5.99994L6.55 7.59994L4.85 7.99994L4.6 10.1999L3 11.5999L4.6 12.9999L4.85 15.1999L6.55 15.5999L7.55 17.1999L9.95 17.0999L11.35 18.6999L12.65 18.6999L14.05 17.0999L16.45 17.1999L17.45 15.5999L19.15 15.1999L19.4 12.9999Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>

        {/* Window Controls */}
        <div className="window-controls">
          <button
            className="window-button minimize"
            onClick={handleMinimize}
            title="Minimize"
          >
            −
          </button>
          <button
            className="window-button maximize"
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? "❐" : "□"}
          </button>
          <button
            className="window-button close"
            onClick={handleClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
