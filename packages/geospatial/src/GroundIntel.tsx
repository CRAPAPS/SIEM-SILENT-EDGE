"use client";

import { useState } from "react";
import type { GeoDevice } from "./types";

export interface GroundIntelProps {
  device: GeoDevice | null;
}

export function GroundIntel({ device }: GroundIntelProps) {
  const [loading, setLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  function loadStreetView() {
    if (!device || !apiKey) return;
    setLoading(true);
    const url = `https://maps.googleapis.com/maps/api/streetview?size=640x360&location=${device.lat},${device.lon}&fov=90&heading=0&pitch=0&key=${apiKey}`;
    setImgSrc(url);
    setLoading(false);
  }

  if (!device) {
    return (
      <div
        className="terminal-card"
        style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span
          style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em" }}
        >
          SELECT A DEVICE TO LOAD GROUND INTEL
        </span>
      </div>
    );
  }

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <span className="dot" style={{ background: "var(--sev-info)" }} />
        GROUND INTEL — {device.hostname}
        <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--muted)" }}>
          {device.lat.toFixed(4)}, {device.lon.toFixed(4)}
        </span>
      </div>

      <div style={{ padding: "0.875rem 1rem" }}>
        {/* Device summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "var(--border)",
            marginBottom: "1rem",
          }}
        >
          {[
            { label: "TYPE", value: device.deviceType.toUpperCase() },
            { label: "RISK", value: String(device.riskScore) },
            { label: "STATUS", value: device.isOnline ? "ONLINE" : "OFFLINE" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--bg-3)", padding: "0.5rem 0.75rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", color: "var(--muted)" }}>
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    s.label === "STATUS"
                      ? device.isOnline
                        ? "var(--sev-ok)"
                        : "var(--muted)"
                      : s.label === "RISK"
                      ? device.riskScore >= 70
                        ? "var(--sev-crit)"
                        : device.riskScore >= 50
                        ? "var(--sev-alert)"
                        : "var(--fg)"
                      : "var(--fg)",
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Street View */}
        {!imgSrc ? (
          <button
            className="btn btn-ghost"
            onClick={loadStreetView}
            disabled={!apiKey || loading}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {!apiKey
              ? "GOOGLE MAPS KEY REQUIRED"
              : loading
              ? "LOADING PANORAMA..."
              : "◢ LOAD STREET VIEW PANORAMA"}
          </button>
        ) : (
          <div style={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
            <img
              src={imgSrc}
              alt={`Street view at ${device.lat},${device.lon}`}
              style={{ width: "100%", display: "block", borderRadius: 2 }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "4px 8px",
                background: "rgba(5,6,7,0.8)",
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: "rgba(244,246,245,0.4)",
                letterSpacing: "0.06em",
              }}
            >
              STREET VIEW · {device.lat.toFixed(6)}, {device.lon.toFixed(6)} · GOOGLE MAPS
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
