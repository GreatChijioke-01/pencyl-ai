import { useEffect } from "react";
import { useThemeStore, ResolvedTheme } from "../store/themeStore";

const getSystemTheme = (): ResolvedTheme => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  return mediaQuery.matches ? "dark" : "light";
};

export const useSystemThemeSync = () => {
  const preference = useThemeStore((state) => state.preference);
  const setResolvedTheme = useThemeStore((state) => state.setResolvedTheme);

  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const updateTheme = async () => {
      const current = await getSystemTheme();
      setResolvedTheme(current);
    };

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = async () => {
      const nextTheme = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(nextTheme);
    };

    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [preference, setResolvedTheme]);
};
