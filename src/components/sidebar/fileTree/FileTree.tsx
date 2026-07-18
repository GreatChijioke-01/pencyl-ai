import { useEffect, useState } from "react";
import { deletePath, movePath, readDirTree, renamePath } from "../../../services/fileService";
import { FileNode } from "./types";
import { mergeTreeState, openTreePath } from "./treeUtils";
import FileItem from "./FileItem.tsx";
import "./fileTree.css";

interface FileTreeProps {
  rootPath: string;
  onFileOpen?: (path: string) => void;
  refreshToken?: number;
  selectedPath: string | null;
  creationTargetPath: string | null;
  isCreating: "file" | "folder" | null;
  newItemName: string;
  onSelectNode: (path: string | null, isDirectory: boolean) => void;
  onNewItemNameChange: (value: string) => void;
  onSubmitNewItem: () => void;
  onCancelCreate: () => void;
  onRequestRefresh: () => void;
}

export default function FileTree({
  rootPath,
  onFileOpen,
  refreshToken,
  selectedPath,
  creationTargetPath,
  isCreating,
  newItemName,
  onSelectNode,
  onNewItemNameChange,
  onSubmitNewItem,
  onCancelCreate,
  onRequestRefresh,
}: FileTreeProps) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!rootPath) return;
    setLoading(true);
    readDirTree(rootPath)
      .then((res) => {
        setTree((previous) => mergeTreeState(res as unknown as FileNode, previous));
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [rootPath, refreshToken]);

  useEffect(() => {
    if (!creationTargetPath) return;
    setTree((previous) => openTreePath(previous, creationTargetPath));
  }, [creationTargetPath]);

  const handleStartRename = (node: FileNode) => {
    setRenamingPath(node.path);
    setRenameValue(node.name);
  };

  const handleCancelRename = () => {
    setRenamingPath(null);
    setRenameValue("");
  };

  const handleSubmitRename = async (node: FileNode) => {
    const nextName = renameValue.trim();
    if (!nextName) {
      handleCancelRename();
      return;
    }

    const separator = node.path.includes("\\") ? "\\" : "/";
    const parentPath = node.path.split(separator).slice(0, -1).join(separator);
    const nextPath = parentPath ? `${parentPath}${separator}${nextName}` : nextName;

    try {
      await renamePath(node.path, nextPath);
      if (selectedPath === node.path) {
        onSelectNode(nextPath, node.is_directory);
      }
      handleCancelRename();
      onRequestRefresh();
    } catch (err) {
      console.error("Failed to rename item:", err);
    }
  };

  const handleDeleteNode = async (node: FileNode) => {
    try {
      await deletePath(node.path);
      if (selectedPath === node.path) {
        onSelectNode(rootPath, true);
      }
      onRequestRefresh();
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleMoveNode = async (sourcePath: string, targetFolderPath: string) => {
    try {
      await movePath(sourcePath, targetFolderPath);
      onRequestRefresh();
    } catch (err) {
      console.error("Failed to move item:", err);
    }
  };

  if (!rootPath) return <div className="ft-empty">No folder selected.</div>;
  if (loading) return <div className="ft-loading">Loading…</div>;
  if (error) return <div className="ft-error">{error}</div>;
  if (!tree) return <div className="ft-empty">Empty folder</div>;

  return (
    <div className="ft-root">
      <FileItem
        node={tree}
        level={0}
        rootPath={rootPath}
        selectedPath={selectedPath}
        isCreating={isCreating}
        creationTargetPath={creationTargetPath}
        newItemName={newItemName}
        renamingPath={renamingPath}
        renameValue={renameValue}
        onSelectNode={onSelectNode}
        onToggleOpen={(path: string) => {
          setTree((current) => {
            if (!current) return current;
            const toggle = (node: FileNode): FileNode => {
              if (node.path === path) {
                return { ...node, isOpen: !node.isOpen };
              }
              return {
                ...node,
                children: node.children?.map(toggle) ?? node.children ?? null,
              };
            };

            return toggle(current);
          });
        }}
        onStartRename={handleStartRename}
        onDeleteNode={handleDeleteNode}
        onMoveNode={handleMoveNode}
        onRenameValueChange={setRenameValue}
        onSubmitRename={handleSubmitRename}
        onCancelRename={handleCancelRename}
        onNewItemNameChange={onNewItemNameChange}
        onSubmitNewItem={onSubmitNewItem}
        onCancelCreate={onCancelCreate}
        onFileOpen={onFileOpen}
        onRequestRefresh={onRequestRefresh}
      />
    </div>
  );
}
