"use client";

import { useEffect, useState } from "react";

const ACCENT_PRESETS = [
  { label: "Blue",  value: "#3d7eff" },
  { label: "Sky",   value: "#5aa9ff" },
  { label: "Green", value: "#00e28a" },
  { label: "Red",   value: "#ff5155" },
  { label: "Mono",  value: "#e8e8e8" },
];

const STORAGE_KEY = "se-accent";

interface SocBarProps {
  orgName?: string;
  isAdmin?: boolean;
}

export function SocBar({ orgName, isAdmin }: SocBarProps) {
  const [clock, setClock] = useState("");
  const [activeAccent, setActiveAccent] = useState(ACCENT_PRESETS[0].value);

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Restore saved accent
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setActiveAccent(saved);
      document.documentElement.style.setProperty("--accent", saved);
    }
  }, []);

  function handleAccent(value: string) {
    setActiveAccent(value);
    document.documentElement.style.setProperty("--accent", value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  return (
    <header className="soc-bar">
      <span className="status-dot" title="SOC Operational" />

      <span style={{ color: "var(--muted)", fontSize: "9px", letterSpacing: "0.1em" }}>
        SOC_STATUS
      </span>
      <span className="metric" style={{ color: "var(--sev-ok)" }}>OPERATIONAL</span>

      <span style={{ color: "var(--border)" }}>|</span>

      <span className="label">UPTIME</span>
      <span className="metric">99.998%</span>

      <span style={{ color: "var(--border)" }}>|</span>

      <span className="label">CLOCK</span>
      <span className="metric" style={{ fontVariantNumeric: "tabular-nums" }}>
        {clock}
      </span>

      {isAdmin && orgName && (
        <>
          <span style={{ color: "var(--border)" }}>|</span>
          <span className="label">ORG</span>
          <span className="metric" style={{ color: "var(--accent)" }}>
            {orgName.toUpperCase()}
          </span>
        </>
      )}

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Accent swatches */}
      <span className="label" style={{ marginRight: "0.375rem" }}>THEME</span>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        {ACCENT_PRESETS.map((p) => (
          <button
            key={p.value}
            className={`accent-swatch${activeAccent === p.value ? " active" : ""}`}
            style={{ background: p.value }}
            title={p.label}
            onClick={() => handleAccent(p.value)}
            aria-label={`Set accent color to ${p.label}`}
          />
        ))}
      </div>

      <span style={{ color: "var(--border)" }}>|</span>

      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "var(--muted)",
        }}
      >
        SHEL/infosec
      </span>
    </header>
  );
}
