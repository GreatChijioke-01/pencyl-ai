import React, { useState } from "react";
import { FileNode } from "./types";
import getFileIcon from "./fileIcons";
import "./fileTree.css";

interface FileItemProps {
  node: FileNode;
  level?: number;
  onFileOpen?: (path: string) => void;
}

export default function FileItem({ node, level = 0, onFileOpen }: FileItemProps) {
  const [open, setOpen] = useState<boolean>(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.is_directory) {
      setOpen((v) => !v);
    } else {
      onFileOpen?.(node.path);
    }
  };

  return (
    <div className="ft-item">
      <div
        className={`ft-row ${node.is_directory ? 'ft-folder' : 'ft-file'}`}
        style={{ paddingLeft: 12 + level * 16 }}
        onClick={handleClick}
      >
        <div className="ft-icon">{getFileIcon(node.name, node.is_directory)}</div>
        <div className="ft-name">{node.name}</div>
      </div>

      {node.is_directory && open && node.children && (
        <div className="ft-children">
          {node.children.map((child) => (
            <FileItem key={child.path} node={child} level={level + 1} onFileOpen={onFileOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
