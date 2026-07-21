import { create } from "zustand";

export interface PendingCommand {
  command: string;
  projectRoot: string;
  createdAt: number;
}

interface CommandState {
  pendingCommand: PendingCommand | null;
  setPendingCommand: (command: string, projectRoot: string) => void;
  clearPendingCommand: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  pendingCommand: null,

  setPendingCommand: (command: string, projectRoot: string) =>
    set({
      pendingCommand: {
        command,
        projectRoot,
        createdAt: Date.now(),
      },
    }),

  clearPendingCommand: () =>
    set({
      pendingCommand: null,
    }),
}));