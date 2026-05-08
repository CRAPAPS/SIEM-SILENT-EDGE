"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

export const ACCENTS = [
  { name: "Brand blue",   v: "#3d7eff" },
  { name: "Ice",          v: "#5aa9ff" },
  { name: "Signal green", v: "#00e28a" },
  { name: "Alert red",    v: "#ff5155" },
  { name: "Bone",         v: "#e8e8e8" },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function a(hex: string, opacity: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}

type AccentCtx = {
  accent: string;
  aa: (opacity: number) => string;
  setAccent: (v: string) => void;
};

const Ctx = createContext<AccentCtx>({
  accent: "#3d7eff",
  aa: (op) => `rgba(61,126,255,${op})`,
  setAccent: () => {},
});

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setState] = useState("#3d7eff");

  const apply = useCallback((v: string) => {
    setState(v);
    const [r, g, b] = hexToRgb(v);
    const root = document.documentElement;
    root.style.setProperty("--accent", v);
    // Pre-compute alpha variants used in shadows/glows via CSS vars
    root.style.setProperty("--a5",  `rgba(${r},${g},${b},0.05)`);
    root.style.setProperty("--a10", `rgba(${r},${g},${b},0.10)`);
    root.style.setProperty("--a15", `rgba(${r},${g},${b},0.15)`);
    root.style.setProperty("--a20", `rgba(${r},${g},${b},0.20)`);
    root.style.setProperty("--a33", `rgba(${r},${g},${b},0.33)`);
    root.style.setProperty("--a44", `rgba(${r},${g},${b},0.44)`);
    root.style.setProperty("--a55", `rgba(${r},${g},${b},0.55)`);
    root.style.setProperty("--a88", `rgba(${r},${g},${b},0.88)`);
  }, []);

  useEffect(() => {
    // Random accent on every page load
    const pick = ACCENTS[Math.floor(Math.random() * ACCENTS.length)].v;
    apply(pick);
  }, [apply]);

  const value: AccentCtx = {
    accent,
    aa: (op) => a(accent, op),
    setAccent: apply,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccent() {
  return useContext(Ctx);
}
