import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "admin-theme";

type ThemePref = "light" | "dark" | "system";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveIsDark(pref: ThemePref) {
  if (pref === "system") return getSystemDark();
  return pref === "dark";
}

export function useAdminTheme() {
  const [pref, setPref] = useState<ThemePref>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePref | null;
    return stored || "system";
  });
  const [isDark, setIsDark] = useState(() => resolveIsDark(pref));

  useEffect(() => {
    setIsDark(resolveIsDark(pref));

    if (pref === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [pref]);

  const toggle = useCallback(() => {
    const next: ThemePref = isDark ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    setPref(next);
  }, [isDark]);

  return { isDark, pref, toggle };
}
