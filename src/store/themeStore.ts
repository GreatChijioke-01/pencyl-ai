import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  setResolvedTheme: (theme: ResolvedTheme) => void;
}

const getInitialResolvedTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      resolvedTheme: getInitialResolvedTheme(),
      setPreference: (preference) =>
        set({
          preference,
          resolvedTheme:
            preference === "system" ? getInitialResolvedTheme() : preference,
        }),
      setResolvedTheme: (theme) => set(() => ({ resolvedTheme: theme })),
    }),
    {
      name: "pencyl-ai-theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
