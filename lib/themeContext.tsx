"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeCtx = { isDark: boolean; toggle: () => void };

const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

function applyVars(dark: boolean) {
  const r = document.documentElement;
  if (dark) {
    r.style.setProperty("--c-bg",    "#0f0f0f");
    r.style.setProperty("--c-card",  "#1c1c1e");
    r.style.setProperty("--c-border","#2c2c2e");
    r.style.setProperty("--c-text",  "#f2f2f7");
    r.style.setProperty("--c-sub",   "#8e8e93");
    r.style.setProperty("--c-input", "#252528");
    r.style.setProperty("--c-muted", "#2c2c2e");
    r.style.setProperty("--c-hdr",   "rgba(15,15,15,0.95)");
  } else {
    r.style.setProperty("--c-bg",    "#f7f7f7");
    r.style.setProperty("--c-card",  "#ffffff");
    r.style.setProperty("--c-border","#e5e7eb");
    r.style.setProperty("--c-text",  "#111111");
    r.style.setProperty("--c-sub",   "#6b7280");
    r.style.setProperty("--c-input", "#fafafa");
    r.style.setProperty("--c-muted", "#f9fafb");
    r.style.setProperty("--c-hdr",   "rgba(247,247,247,0.95)");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("allegeats_theme");
    const dark = saved === "dark";
    setIsDark(dark);
    applyVars(dark);
  }, []);

  // Apply vars whenever isDark changes
  useEffect(() => {
    applyVars(isDark);
    localStorage.setItem("allegeats_theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
