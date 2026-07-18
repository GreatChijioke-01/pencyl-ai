import { useEffect, useState } from "react";
import { readDirTree } from "../../../services/fileService";
import { FileNode } from "./types";
import FileItem from "./FileItem";
import "./fileTree.css";

interface FileTreeProps {
  rootPath: string;
  onFileOpen?: (path: string) => void;
  highlightPath?: string | null;
}

export default function FileTree({ rootPath, onFileOpen, highlightPath = null }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rootPath) return;
    setLoading(true);
    readDirTree(rootPath)
      .then((res) => {
        // convert service's snake_case keys to our camel-case interface if needed
        let t = res as unknown as FileNode;
        if (highlightPath) {
          const prune = (node: FileNode | null): FileNode | null => {
            if (!node) return null;
            if (node.path === highlightPath) return node;
            if (node.children && node.children.length > 0) {
              const kept = node.children
                .map((c) => prune(c as FileNode))
                .filter(Boolean) as FileNode[];
              if (kept.length > 0) return { ...node, children: kept } as FileNode;
            }
            return null;
          };

          const pruned = prune(t);
          setTree(pruned);
        } else {
          setTree(t);
        }
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [rootPath]);

  if (!rootPath) return <div className="ft-empty">No folder selected.</div>;
  if (loading) return <div className="ft-loading">Loading…</div>;
  if (error) return <div className="ft-error">{error}</div>;
  if (!tree) return <div className="ft-empty">Empty folder</div>;

  return (
    <div className="ft-root">
      <FileItem node={tree as FileNode} onFileOpen={onFileOpen} />
    </div>
  );
}
