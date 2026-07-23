import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeFileContent, readFileContent } from "../../services/fileService";
import { useFileStore } from "../../store/filestore";
import { Settings, X, Minus, Square, Maximize2, Circle } from "lucide-react";
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
    const existingTerminal = files.find((f) => f.kind === "terminal");
    if (existingTerminal) {
      updateActiveFile(existingTerminal.id);
    } else {
      const id = `terminal-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      addFile({
        id,
        path: "",
        name: "Terminal",
        content: "Welcome to the terminal. Type a command and press Enter or Run.\n",
        isDirty: false,
        kind: "terminal",
      });
    }
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
                  {file.isDirty && <Circle size={8} className="titlebar-dirty-indicator" />}
                </span>
                <button
                  className="titlebar-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  title="Close"
                >
                  <X size={12} />
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

        <button className="titlebar-button flex items-center justify-center" title="Settings" onClick={onOpenSettings}>
          <Settings size={16} />
        </button>
        {/* Window Controls */}
        <div className="window-controls">
          <button
            className="window-button minimize"
            onClick={handleMinimize}
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            className="window-button maximize"
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Maximize2 size={12} /> : <Square size={12} />}
          </button>
          <button
            className="window-button close"
            onClick={handleClose}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
