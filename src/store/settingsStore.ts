import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import tauriConf from "../../src-tauri/tauri.conf.json";

interface SettingsState {
  // General settings
  autoSave: boolean;
  enableTerminalGuardrails: boolean;
  
  // Version info (read-only, not persisted)
  currentVersion: string;
  
  // Actions
  setAutoSave: (enabled: boolean) => void;
  setEnableTerminalGuardrails: (enabled: boolean) => void;
  setCurrentVersion: (version: string) => void;
}

// Get app version from Tauri or tauri.conf.json/package.json
const getAppVersion = async (): Promise<string> => {
  try {
    // Try Tauri app version first
    const { invoke } = await import("@tauri-apps/api/core");
    const version = await invoke("get_app_version");
    return version as string;
  } catch (error) {
    // Fallback to tauri.conf.json version (Tauri app version) - imported at build time
    if (tauriConf.version) {
      return tauriConf.version;
    }
    // If tauriConf doesn't have version, try package.json
    try {
      const response = await fetch("/package.json");
      const packageJson = await response.json();
      return packageJson.version || "0.1.0";
    } catch {
      return "0.1.0";
    }
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      autoSave: true,
      enableTerminalGuardrails: true,
      currentVersion: "v0.1.0",
      
      setAutoSave: (enabled) => {
        set({ autoSave: enabled });
      },
      
      setEnableTerminalGuardrails: (enabled) => {
        set({ enableTerminalGuardrails: enabled });
      },
      
      setCurrentVersion: (version) => {
        set({ currentVersion: version });
      },
    }),
    {
      name: "pencyl-ai-settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist user configurable settings, not version info
      partialize: (state) => ({
        autoSave: state.autoSave,
        enableTerminalGuardrails: state.enableTerminalGuardrails,
      }),
    }
  )
);

// Initialize version on startup
export const initializeSettings = async () => {
  const version = await getAppVersion();
  useSettingsStore.getState().setCurrentVersion(version);
  return version;
};