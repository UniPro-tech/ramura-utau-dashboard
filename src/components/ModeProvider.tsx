"use client";
import * as React from "react";

type Mode = string;

interface ModeContextValue {
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
}

const ModeContext = React.createContext<ModeContextValue | undefined>(
  undefined,
);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  // Use lazy initializer to read from localStorage on first render (client only)
  const [mode, setMode] = React.useState<Mode>(() => {
    try {
      if (typeof window === "undefined") return "arane";
      const raw = window.localStorage.getItem("ramura:mode");
      return (raw as Mode) || "arane";
    } catch {
      // If access to localStorage fails for any reason, fall back to default
      return "arane";
    }
  });

  // Persist to localStorage when mode changes
  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem("ramura:mode", mode);
    } catch {
      // ignore write errors (e.g., storage quota, private mode)
    }
  }, [mode]);

  const value = React.useMemo(() => ({ mode, setMode }), [mode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = React.useContext(ModeContext);
  if (!ctx) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return ctx;
}

export default ModeProvider;
