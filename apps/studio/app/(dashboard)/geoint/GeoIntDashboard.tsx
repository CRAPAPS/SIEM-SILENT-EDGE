"use client";

import { useState } from "react";
import type { GeoDevice, GlobeViewProps, TacticalGridProps, GroundIntelProps } from "@silent-edge/geospatial";

// Lazy imports so Three.js doesn't break SSR
import dynamic from "next/dynamic";

const GlobeView = dynamic<GlobeViewProps>(
  () => import("@silent-edge/geospatial").then((m) => ({ default: m.GlobeView })),
  { ssr: false, loading: () => <GlobeLoading /> }
);

const TacticalGrid = dynamic<TacticalGridProps>(
  () => import("@silent-edge/geospatial").then((m) => ({ default: m.TacticalGrid })),
  { ssr: false, loading: () => <GridLoading /> }
);

const GroundIntel = dynamic<GroundIntelProps>(
  () => import("@silent-edge/geospatial").then((m) => ({ default: m.GroundIntel })),
  { ssr: false }
);

function GlobeLoading() {
  return (
    <div
      style={{
        height: 520,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--muted)",
        letterSpacing: "0.08em",
      }}
    >
      INITIALIZING 3D GLOBE...
    </div>
  );
}

function GridLoading() {
  return (
    <div
      style={{
        height: 400,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--muted)",
        letterSpacing: "0.08em",
      }}
    >
      LOADING TACTICAL GRID...
    </div>
  );
}

type ViewMode = "globe" | "tactical" | "ground";

interface GeoIntDashboardProps {
  devices: GeoDevice[];
}

export function GeoIntDashboard({ devices }: GeoIntDashboardProps) {
  const [view, setView] = useState<ViewMode>("globe");
  const [selectedDevice, setSelectedDevice] = useState<GeoDevice | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | undefined>();

  function handleDeviceClick(device: GeoDevice) {
    setSelectedDevice(device);
    setMapCenter({ lat: device.lat, lon: device.lon });
    // Auto-drill down on click
    if (view === "globe") setView("tactical");
    else if (view === "tactical") setView("ground");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* View selector */}
      <div
        style={{
          display: "flex",
          gap: "1px",
          background: "var(--border)",
          width: "fit-content",
        }}
      >
        {(["globe", "tactical", "ground"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              background: view === v ? "var(--bg-3)" : "var(--bg-2)",
              color: view === v ? "var(--fg)" : "var(--muted)",
              border: "none",
              padding: "0.375rem 1rem",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 100ms",
              borderBottom: view === v ? "1px solid var(--accent)" : "1px solid transparent",
            }}
          >
            {v === "globe" ? "◎ GLOBAL PULSE" : v === "tactical" ? "⊞ TACTICAL GRID" : "◻ GROUND INTEL"}
          </button>
        ))}
      </div>

      {/* Main view */}
      {view === "globe" && (
        <GlobeView
          devices={devices}
          arcs={[]}
          onDeviceClick={handleDeviceClick}
          height={520}
        />
      )}

      {view === "tactical" && (
        <TacticalGrid
          devices={devices}
          center={mapCenter ?? { lat: 0, lon: 0 }}
          zoom={mapCenter ? 12 : 3}
          onDeviceClick={handleDeviceClick}
        />
      )}

      {view === "ground" && <GroundIntel device={selectedDevice} />}

      {/* Selected device panel */}
      {selectedDevice && (
        <div
          className="terminal-card"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "1px", background: "var(--border)" }}
        >
          {[
            { label: "SELECTED", value: selectedDevice.hostname },
            { label: "RISK SCORE", value: String(selectedDevice.riskScore) },
            { label: "COORDINATES", value: `${selectedDevice.lat.toFixed(4)}, ${selectedDevice.lon.toFixed(4)}` },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--bg-2)", padding: "0.625rem 1rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--fg)", marginTop: 2 }}>
                {s.value}
              </div>
            </div>
          ))}
          <div style={{ background: "var(--bg-2)", padding: "0.625rem 1rem", display: "flex", alignItems: "center" }}>
            <button
              onClick={() => {
                setSelectedDevice(null);
                setView("globe");
              }}
              className="btn btn-ghost"
              style={{ fontSize: 9, padding: "3px 8px" }}
            >
              CLEAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
