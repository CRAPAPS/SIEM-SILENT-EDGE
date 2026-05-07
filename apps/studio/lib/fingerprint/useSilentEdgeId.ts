"use client";

import { useEffect, useState } from "react";

export interface SilentEdgeFingerprint {
  id: string;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  userAgent: string;
  screenRes: string;
  timezone: string;
  language: string;
  timestamp: string;
}

async function buildFingerprint(): Promise<SilentEdgeFingerprint> {
  // Collect browser/hardware signals
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px 'JetBrains Mono'";
    ctx.fillText("Silent Edge 🔒", 2, 2);
  }
  const canvasHash = canvas.toDataURL();

  const signals = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height + "x" + screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ""),
    String((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? ""),
    canvasHash.slice(0, 128),
  ].join("|");

  // SHA-256 hash of signals → Silent Edge ID
  const msgBuffer = new TextEncoder().encode(signals);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const id = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return {
    id: `SE-${id.slice(0, 16).toUpperCase()}`,
    lat: null,
    lon: null,
    accuracy: null,
    userAgent: navigator.userAgent,
    screenRes: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    timestamp: new Date().toISOString(),
  };
}

async function requestGeo(fp: SilentEdgeFingerprint): Promise<SilentEdgeFingerprint> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(fp);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ...fp,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(fp), // Permission denied — return without coords
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
}

/**
 * Generates a deterministic Silent Edge Device ID from hardware/browser signals.
 * Optionally requests geolocation for GEOINT features.
 *
 * Usage: Deploy this hook on client-managed portals or agent landing pages.
 * For compliance: display a notice that device identification is in use.
 */
export function useSilentEdgeId(requestLocation = false) {
  const [fingerprint, setFingerprint] = useState<SilentEdgeFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    buildFingerprint()
      .then((fp) => (requestLocation ? requestGeo(fp) : fp))
      .then((fp) => {
        setFingerprint(fp);
        // Persist to sessionStorage so re-renders don't re-hash
        sessionStorage.setItem("se-fingerprint", JSON.stringify(fp));
      })
      .finally(() => setIsLoading(false));
  }, [requestLocation]);

  return { fingerprint, isLoading };
}
