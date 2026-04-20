"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

type ThemeCtx = {
  isDark:   boolean;
  mode:     ThemeMode;
  setMode:  (m: ThemeMode) => void;
  /** Legacy toggle — cycles light → dark → system */
  toggle:   () => void;
};

const ThemeContext = createContext<ThemeCtx>({
  isDark:  false,
  mode:    "system",
  setMode: () => {},
  toggle:  () => {},
});

const STORAGE_KEY = "alegeats_theme"; // intentional legacy key name — do not rename

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
    r.style.setProperty("--bn-circle-bg",  "#000000");
    r.style.setProperty("--bn-icon",       "#e5e7eb");
    r.style.setProperty("--bn-pill-bg",    "#000000");
    r.style.setProperty("--bn-pill-text",  "#6b7280");
    r.style.setProperty("--bn-bar-bg",     "#000000");
    r.style.setProperty("--bn-fade-start", "rgba(0,0,0,0)");
    r.style.setProperty("--bn-fade-s1",    "rgba(0,0,0,0.03)");
    r.style.setProperty("--bn-fade-s2",    "rgba(0,0,0,0.09)");
    r.style.setProperty("--bn-fade-s3",    "rgba(0,0,0,0.20)");
    r.style.setProperty("--bn-fade-s4",    "rgba(0,0,0,0.38)");
    r.style.setProperty("--bn-fade-s5",    "rgba(0,0,0,0.60)");
    r.style.setProperty("--bn-fade-s6",    "rgba(0,0,0,0.80)");
    r.style.setProperty("--bn-fade-s7",    "rgba(0,0,0,0.93)");
    r.style.setProperty("--bn-fade-end",   "rgba(0,0,0,1)");
  } else {
    r.style.setProperty("--c-bg",    "#f7f7f7");
    r.style.setProperty("--c-card",  "#ffffff");
    r.style.setProperty("--c-border","#e5e7eb");
    r.style.setProperty("--c-text",  "#111111");
    r.style.setProperty("--c-sub",   "#6b7280");
    r.style.setProperty("--c-input", "#fafafa");
    r.style.setProperty("--c-muted", "#f9fafb");
    r.style.setProperty("--c-hdr",   "rgba(247,247,247,0.95)");
    r.style.setProperty("--bn-circle-bg",  "#ffffff");
    r.style.setProperty("--bn-icon",       "#374151");
    r.style.setProperty("--bn-pill-bg",    "#ffffff");
    r.style.setProperty("--bn-pill-text",  "#9ca3af");
    r.style.setProperty("--bn-bar-bg",     "transparent");
    r.style.setProperty("--bn-fade-start", "rgba(255,255,255,0)");
    r.style.setProperty("--bn-fade-s1",    "rgba(255,255,255,0.03)");
    r.style.setProperty("--bn-fade-s2",    "rgba(255,255,255,0.09)");
    r.style.setProperty("--bn-fade-s3",    "rgba(255,255,255,0.20)");
    r.style.setProperty("--bn-fade-s4",    "rgba(255,255,255,0.38)");
    r.style.setProperty("--bn-fade-s5",    "rgba(255,255,255,0.60)");
    r.style.setProperty("--bn-fade-s6",    "rgba(255,255,255,0.80)");
    r.style.setProperty("--bn-fade-s7",    "rgba(255,255,255,0.93)");
    r.style.setProperty("--bn-fade-end",   "rgba(255,255,255,1)");
  }
}

function systemIsDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // "system" is the default — no localStorage entry needed
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isDark, setIsDark]  = useState(false);

  // Derive the actual dark value from mode
  const resolve = useCallback((m: ThemeMode): boolean => {
    if (m === "dark")   return true;
    if (m === "light")  return false;
    return systemIsDark();
  }, []);

  // Load saved mode on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    // Map legacy "dark"/"light" booleans and accept "system"
    const initial: ThemeMode =
      saved === "dark" || saved === "light" || saved === "system" ? saved : "system";
    const dark = resolve(initial);
    setModeState(initial);      // eslint-disable-line react-hooks/set-state-in-effect
    setIsDark(dark);
    applyVars(dark);
  }, [resolve]);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      if (mode !== "system") return;
      const dark = mq.matches;
      setIsDark(dark);
      applyVars(dark);
    }
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, [mode]);

  function setMode(m: ThemeMode) {
    const dark = resolve(m);
    setModeState(m);
    setIsDark(dark);
    applyVars(dark);
    localStorage.setItem(STORAGE_KEY, m);
  }

  function toggle() {
    // Cycle: light → dark → system
    const next: ThemeMode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(next);
  }

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
