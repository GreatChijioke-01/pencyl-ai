import { create } from "zustand";
import { getBasename, normalizePath, pathsMatch } from "../utils/pathUtils";

export interface PendingDiff {
  absolutePath: string;
  relativePath: string;
  originalContent: string;
  suggestedContent: string;
  createdAt: number;
}

interface DiffState {
  pendingDiffs: Record<string, PendingDiff>;
  setPendingDiff: (diff: PendingDiff) => void;
  clearPendingDiff: (filePath: string) => void;
  clearAllPendingDiffs: () => void;
  findDiffForEditorPath: (editorPath: string) => { key: string; diff: PendingDiff } | null;
  listPendingDiffs: () => PendingDiff[];
}

function diffKeyForPath(path: string): string {
  return normalizePath(path);
}

export const useDiffStore = create<DiffState>((set, get) => ({
  pendingDiffs: {},

  setPendingDiff: (diff) =>
    set((state) => ({
      pendingDiffs: {
        ...state.pendingDiffs,
        [diffKeyForPath(diff.absolutePath)]: diff,
      },
    })),

  clearPendingDiff: (filePath) =>
    set((state) => {
      // Always resolve the real pending diff key using the same matcher
      // logic as the editor UI.
      const match = get().findDiffForEditorPath(filePath);
      if (!match) return state;

      const updated = { ...state.pendingDiffs };
      delete updated[match.key];
      return { pendingDiffs: updated };
    }),


  clearAllPendingDiffs: () => set({ pendingDiffs: {} }),

  findDiffForEditorPath: (editorPath) => {
    const entries = Object.entries(get().pendingDiffs);

    for (const [key, diff] of entries) {
      // Try multiple path representations (absolute, project-relative, and store key)
      if (
        pathsMatch(editorPath, diff.absolutePath) ||
        pathsMatch(editorPath, diff.relativePath) ||
        pathsMatch(editorPath, key)
      ) {
        return { key, diff };
      }
    }


    const editorBasename = getBasename(editorPath);
    for (const [key, diff] of entries) {
      if (getBasename(diff.absolutePath) === editorBasename || getBasename(key) === editorBasename) {
        return { key, diff };
      }
    }

    return null;
  },

  listPendingDiffs: () => Object.values(get().pendingDiffs),
}));
