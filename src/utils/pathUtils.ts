import { joinPath } from "../components/sidebar/fileTree/treeUtils";

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

export function getBasename(path: string): string {
  const normalized = normalizePath(path);
  return normalized.split("/").pop() || normalized;
}

export function isAbsolutePath(path: string): boolean {
  const t = path.trim();
  return /^[a-zA-Z]:[\\/]/.test(t) || t.startsWith("/");
}

export function resolveProjectPath(relativeOrAbsolute: string, projectRoot: string | null): string {
  const trimmed = relativeOrAbsolute.trim();
  if (!trimmed) return trimmed;

  if (isAbsolutePath(trimmed)) {
    return trimmed;
  }

  if (!projectRoot) {
    return trimmed;
  }

  const normalized = trimmed.replace(/^[/\\]+/, "");
  return joinPath(projectRoot, normalized);
}

export function pathsMatch(editorPath: string, candidatePath: string): boolean {
  const normalizedEditor = normalizePath(editorPath);
  const normalizedCandidate = normalizePath(candidatePath);

  if (normalizedEditor === normalizedCandidate) return true;
  if (normalizedEditor.endsWith(`/${normalizedCandidate}`)) return true;
  if (normalizedCandidate.endsWith(`/${normalizedEditor}`)) return true;

  return getBasename(normalizedEditor) === getBasename(normalizedCandidate);
}

export function isPlausibleProjectRootPath(path: string | null): path is string {
  if (!path) return false;
  const trimmed = path.trim();
  if (!trimmed) return false;

  return (
    /^[a-zA-Z]:\\/.test(trimmed) ||
    trimmed.startsWith("/") ||
    trimmed.startsWith(".")
  );
}
