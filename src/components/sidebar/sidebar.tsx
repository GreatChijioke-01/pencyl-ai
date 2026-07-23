import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useFileStore } from "../../store/filestore";
import FileTree from "./fileTree/FileTree.tsx";
import { readFileContent } from "../../services/fileService";
import { getParentPath, joinPath } from "./fileTree/treeUtils";
import { FileText, Folder, Plus, Terminal } from 'lucide-react';
import "./sidebar.css";

export default function Sidebar() {
  const files = useFileStore((state) => state.files);
  const activeFileId = useFileStore((state) => state.activeFileId);
  const updateActiveFile = useFileStore((state) => state.updateActiveFile);
  const addFile = useFileStore((state) => state.addFile);
  const removeFile = useFileStore((state) => state.removeFile);

  const [rootPath, setRootPath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedIsDirectory, setSelectedIsDirectory] = useState(false);
  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [creationTargetPath, setCreationTargetPath] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const getCreationTarget = () => {
    if (!rootPath) return null;
    if (!selectedPath) return rootPath;
    return selectedIsDirectory ? selectedPath : getParentPath(selectedPath) || rootPath;
  };

  const handleOpenFolder = async () => {
    try {
      const selectedPath = await open({ multiple: false, directory: true, title: "Open folder" });
      const folderPath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
      if (folderPath && typeof folderPath === "string") {
        setRootPath(folderPath);
        setSelectedPath(null);
        setSelectedIsDirectory(false);
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

  useEffect(() => {
    globalThis.__PENCYL_PROJECT_ROOT_PATH = rootPath;
  }, [rootPath]);

  // Manage terminal file in file store when root path changes
  useEffect(() => {
    const terminalId = "terminal";
    const terminalFile = files.find((f) => f.kind === "terminal");
    
    if (rootPath) {
      // Add or update terminal file with current root path
      if (!terminalFile) {
        addFile({
          id: terminalId,
          path: rootPath,
          name: "Terminal",
          content: "",
          isDirty: false,
          kind: "terminal"
        });
      } else if (terminalFile.path !== rootPath) {
        // Update existing terminal file path
        removeFile(terminalFile.id);
        addFile({
          id: terminalId,
          path: rootPath,
          name: "Terminal",
          content: "",
          isDirty: false,
          kind: "terminal"
        });
      }
    } else {
      // Remove terminal file if no root path
      const existingTerminal = files.find((f) => f.kind === "terminal");
      if (existingTerminal) {
        removeFile(existingTerminal.id);
      }
    }
  }, [rootPath, addFile, removeFile]);

  useEffect(() => {
    const handler = () => setRefreshToken((value) => value + 1);
    window.addEventListener("pencyl:refresh-tree", handler as EventListener);
    return () => window.removeEventListener("pencyl:refresh-tree", handler as EventListener);
  }, []);

  const cancelCreate = () => {
    setIsCreating(null);
    setNewItemName("");
    setCreationTargetPath(null);
  };

  const submitNewItem = async () => {
    const entryName = newItemName.trim();
    const targetPath = creationTargetPath || getCreationTarget();
    if (!entryName || !targetPath || !isCreating) {
      cancelCreate();
      return;
    }

    const fullPath = joinPath(targetPath, entryName);

    try {
      if (isCreating === "file") {
        await invoke("create_file", { path: fullPath });
        addFile({
          id: fullPath,
          path: fullPath,
          name: entryName.split("\\").pop()?.split("/").pop() || entryName,
          content: "",
          isDirty: false,
          kind: "file",
        });
        updateActiveFile(fullPath);
        setSelectedPath(fullPath);
        setSelectedIsDirectory(false);
      } else {
        await invoke("create_dir", { path: fullPath });
        setSelectedPath(fullPath);
        setSelectedIsDirectory(true);
      }

      setRefreshToken((value) => value + 1);
      cancelCreate();
    } catch (err) {
      console.error(`Failed to create ${isCreating}:`, err);
    }
  };

  const handleStartCreate = (mode: "file" | "folder") => {
    const targetPath = getCreationTarget();
    if (!targetPath) return;
    setIsCreating(mode);
    setCreationTargetPath(targetPath);
    setNewItemName("");
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-body">
        <div className="sidebar-view">
          <div className="explorer-header">
            <span className="explorer-title">EXPLORER</span>
            <div className="explorer-actions">
              <button className="sidebar-icon-button" onClick={() => handleStartCreate("file")} title="New File"><FileText size={14} /><Plus size={12} /></button>
              <button className="sidebar-icon-button" onClick={() => handleStartCreate("folder")} title="New Folder"><Folder size={14} /><Plus size={12} /></button>
            </div>
          </div>

          {rootPath ? (
            <>
              <FileTree
                rootPath={rootPath}
                onFileOpen={handleFileOpen}
                refreshToken={refreshToken}
                selectedPath={selectedPath}
                creationTargetPath={creationTargetPath}
                isCreating={isCreating}
                newItemName={newItemName}
                onSelectNode={(path: string | null, isDirectory: boolean) => {
                  setSelectedPath(path);
                  setSelectedIsDirectory(Boolean(path) && isDirectory);
                }}
                onNewItemNameChange={setNewItemName}
                onSubmitNewItem={submitNewItem}
                onCancelCreate={cancelCreate}
                onRequestRefresh={() => setRefreshToken((value) => value + 1)}
              />
              {/* Terminal entry */}
              {files.find((f) => f.kind === "terminal") && (
                <div
                  className="ft-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    const terminalFile = files.find((f) => f.kind === "terminal");
                    if (terminalFile) {
                      updateActiveFile(terminalFile.id);
                      setSelectedPath(null);
                      setSelectedIsDirectory(false);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className={`ft-row ft-file ${activeFileId === files.find((f) => f.kind === "terminal")?.id ? "ft-selected" : ""}`}
                    style={{ paddingLeft: "12px" }}
                  >
                    <div className="ft-icon"><Terminal size={14} className="text-green-400" /></div>
                    <div className="ft-name">Terminal</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="sidebar-empty">No folder selected. Click "Open Folder".</div>
          )}
        </div>
      </div>
    </div>
  );
}
