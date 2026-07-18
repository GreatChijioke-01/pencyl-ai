import type { FileNode } from "./types";

export function getParentPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return path.includes("\\") ? parts.slice(0, -1).join("\\") : parts.slice(0, -1).join("/");
}

export function joinPath(basePath: string, entryName: string): string {
  const separator = basePath.includes("\\") ? "\\" : "/";
  return basePath.endsWith(separator) ? `${basePath}${entryName}` : `${basePath}${separator}${entryName}`;
}

export function mergeTreeState(nextTree: FileNode | null, previousTree: FileNode | null): FileNode | null {
  if (!nextTree) return null;

  const previousByPath = new Map<string, FileNode>();

  const indexTree = (node: FileNode | null) => {
    if (!node) return;
    previousByPath.set(node.path, node);
    node.children?.forEach(indexTree);
  };

  indexTree(previousTree);

  const mergeNode = (node: FileNode): FileNode => {
    const previous = previousByPath.get(node.path);
    const mergedChildren = node.children?.map(mergeNode) ?? node.children ?? null;

    return {
      ...node,
      isOpen: previous?.isOpen ?? node.isOpen ?? (node.is_directory ? node.path === nextTree.path : false),
      children: mergedChildren,
    };
  };

  return mergeNode(nextTree);
}

export function openTreePath(tree: FileNode | null, targetPath: string): FileNode | null {
  if (!tree) return null;

  const openNode = (node: FileNode): FileNode => {
    const children = node.children?.map(openNode) ?? node.children ?? null;
    const shouldOpen = node.is_directory && (node.path === targetPath || (children?.some((child) => child.path === targetPath || child.isOpen) ?? false));

    return {
      ...node,
      isOpen: node.is_directory ? node.path === targetPath || shouldOpen || node.isOpen === true : node.isOpen,
      children,
    };
  };

  return openNode(tree);
}

export function upsertTreePath(tree: FileNode | null, targetPath: string): FileNode | null {
  if (!tree) return null;

  const walk = (node: FileNode): FileNode => {
    if (node.path === targetPath) {
      return { ...node, isOpen: true };
    }

    return {
      ...node,
      isOpen: node.is_directory ? true : node.isOpen,
      children: node.children?.map(walk) ?? node.children ?? null,
    };
  };

  return walk(tree);
}
