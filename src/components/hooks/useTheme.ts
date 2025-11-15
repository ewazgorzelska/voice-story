import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "voice-story-theme";

/**
 * Hook for managing the application theme (light/dark mode).
 * Syncs with localStorage and applies the theme class to the document element.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get initial theme from localStorage or default to light
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = storedTheme || "light";
    setThemeState(initialTheme);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    // Apply theme to document
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    mounted,
  };
}
