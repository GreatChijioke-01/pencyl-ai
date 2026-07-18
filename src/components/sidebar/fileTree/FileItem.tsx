import React from "react";
import type { FileNode } from "./types";
import getFileIcon from "./fileIcons";
import "./fileTree.css";

interface FileItemProps {
  node: FileNode;
  level?: number;
  rootPath: string;
  selectedPath: string | null;
  isCreating: "file" | "folder" | null;
  creationTargetPath: string | null;
  newItemName: string;
  renamingPath: string | null;
  renameValue: string;
  onSelectNode: (path: string | null, isDirectory: boolean) => void;
  onToggleOpen: (path: string) => void;
  onStartRename: (node: FileNode) => void;
  onDeleteNode: (node: FileNode) => void;
  onMoveNode: (sourcePath: string, targetFolderPath: string) => void;
  onRenameValueChange: (value: string) => void;
  onSubmitRename: (node: FileNode) => void;
  onCancelRename: () => void;
  onNewItemNameChange: (value: string) => void;
  onSubmitNewItem: () => void;
  onCancelCreate: () => void;
  onFileOpen?: (path: string) => void;
  onRequestRefresh: () => void;
}

export default function FileItem({
  node,
  level = 0,
  rootPath,
  selectedPath,
  isCreating,
  creationTargetPath,
  newItemName,
  renamingPath,
  renameValue,
  onSelectNode,
  onToggleOpen,
  onStartRename,
  onDeleteNode,
  onMoveNode,
  onRenameValueChange,
  onSubmitRename,
  onCancelRename,
  onNewItemNameChange,
  onSubmitNewItem,
  onCancelCreate,
  onFileOpen,
  onRequestRefresh,
}: FileItemProps) {
  const isSelected = selectedPath === node.path;
  const isRenaming = renamingPath === node.path;
  const isRootNode = node.path === rootPath;
  const isFolder = node.is_directory;
  const isOpen = isFolder ? node.isOpen ?? false : false;

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectNode(node.path, isFolder);

    if (isFolder) {
      onToggleOpen(node.path);
      return;
    }

    onFileOpen?.(node.path);
  };

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData("text/plain", node.path);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event: React.DragEvent) => {
    if (!isFolder) return;
    event.preventDefault();
    event.stopPropagation();
    const sourcePath = event.dataTransfer.getData("text/plain");
    if (!sourcePath || sourcePath === node.path) return;
    onMoveNode(sourcePath, node.path);
    onRequestRefresh();
  };

  const handleRenameSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmitRename(node);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancelRename();
    }
  };

  const renderLabel = () => {
    if (isRenaming) {
      return (
        <input
          className="ft-inline-input"
          value={renameValue}
          autoFocus
          onChange={(event) => onRenameValueChange(event.target.value)}
          onBlur={onCancelRename}
          onKeyDown={handleRenameSubmit}
        />
      );
    }

    return <div className="ft-name">{node.name}</div>;
  };

  return (
    <div className="ft-item" key={node.path}>
      <div
        className={`ft-row ${isFolder ? "ft-folder" : "ft-file"} ${isSelected ? "ft-selected" : ""}`}
        style={{ paddingLeft: 12 + level * 16 }}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={(event) => {
          if (isFolder) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={handleDrop}
      >
        <div className="ft-icon">{getFileIcon(node.name, isFolder)}</div>
        {renderLabel()}
        <div className="ft-actions">
          {isFolder && (
            <button className="ft-action-button" onClick={(event) => { event.stopPropagation(); onToggleOpen(node.path); }} title={isOpen ? "Collapse" : "Expand"}>
              {isOpen ? "▾" : "▸"}
            </button>
          )}
          {!isRootNode && (
            <>
              <button className="ft-action-button" onClick={(event) => { event.stopPropagation(); onStartRename(node); }} title="Rename">
                ✎
              </button>
              <button className="ft-action-button ft-danger" onClick={(event) => { event.stopPropagation(); onDeleteNode(node); }} title="Delete">
                🗑
              </button>
            </>
          )}
        </div>
      </div>

      {isFolder && isOpen && (
        <div className="ft-children">
          {creationTargetPath === node.path && isCreating && (
            <div className="ft-row ft-create-row" style={{ paddingLeft: 12 + (level + 1) * 16 }}>
              <div className="ft-icon">{isCreating === "folder" ? "📁" : "📄"}</div>
              <input
                className="ft-inline-input"
                value={newItemName}
                autoFocus
                placeholder={isCreating === "file" ? "new-file.ts" : "new-folder"}
                onChange={(event) => onNewItemNameChange(event.target.value)}
                onBlur={onCancelCreate}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSubmitNewItem();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    onCancelCreate();
                  }
                }}
              />
            </div>
          )}

          {node.children?.map((child) => (
            <FileItem
              key={child.path}
              node={child}
              level={level + 1}
              rootPath={rootPath}
              selectedPath={selectedPath}
              isCreating={isCreating}
              creationTargetPath={creationTargetPath}
              newItemName={newItemName}
              renamingPath={renamingPath}
              renameValue={renameValue}
              onSelectNode={onSelectNode}
              onToggleOpen={onToggleOpen}
              onStartRename={onStartRename}
              onDeleteNode={onDeleteNode}
              onMoveNode={onMoveNode}
              onRenameValueChange={onRenameValueChange}
              onSubmitRename={onSubmitRename}
              onCancelRename={onCancelRename}
              onNewItemNameChange={onNewItemNameChange}
              onSubmitNewItem={onSubmitNewItem}
              onCancelCreate={onCancelCreate}
              onFileOpen={onFileOpen}
              onRequestRefresh={onRequestRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
