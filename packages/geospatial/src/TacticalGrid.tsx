"use client";

import { useEffect, useRef } from "react";
import type { GeoDevice } from "./types";

export interface TacticalGridProps {
  devices?: GeoDevice[];
  center?: { lat: number; lon: number };
  zoom?: number;
  onDeviceClick?: (device: GeoDevice) => void;
  mapType?: "tactical" | "satellite";
}

function riskColor(score: number): string {
  if (score >= 70) return "#ff2222";
  if (score >= 50) return "#ff5155";
  if (score >= 30) return "#ffaa00";
  return "#00e28a";
}

export function TacticalGrid({
  devices = [],
  center = { lat: 0, lon: 0 },
  zoom = 4,
  onDeviceClick,
  mapType = "tactical",
}: TacticalGridProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !mapRef.current) return;

    // Dynamically load Google Maps
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&map_ids=DARK_MAP_ID`;
    script.async = true;
    script.onload = () => {
      const google = (window as unknown as { google: { maps: unknown } }).google;
      const maps = (google.maps as {
        Map: new (el: HTMLElement, opts: unknown) => {
          setCenter: (c: { lat: number; lng: number }) => void;
          setZoom: (z: number) => void;
        };
        Marker: new (opts: unknown) => {
          addListener: (event: string, fn: () => void) => void;
        };
      });

      const mapOptions = mapType === "satellite"
        ? { center: { lat: center.lat, lng: center.lon }, zoom, disableDefaultUI: true, backgroundColor: "#050607", mapTypeId: "hybrid", tilt: 0 }
        : { center: { lat: center.lat, lng: center.lon }, zoom, mapId: "DARK_MAP_ID", disableDefaultUI: true, backgroundColor: "#050607" };
      const map = new maps.Map(mapRef.current!, mapOptions);

      mapInstanceRef.current = map;

      devices.forEach((device) => {
        const marker = new maps.Marker({
          position: { lat: device.lat, lng: device.lon },
          map,
          title: device.hostname,
          icon: {
            path: (window as unknown as { google: { maps: { SymbolPath: { CIRCLE: unknown } } } }).google.maps.SymbolPath.CIRCLE,
            scale: device.deviceType === "server" ? 10 : 7,
            fillColor: riskColor(device.riskScore),
            fillOpacity: 0.9,
            strokeColor: "#050607",
            strokeWeight: 1.5,
          },
        });
        marker.addListener("click", () => onDeviceClick?.(device));
      });
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [center.lat, center.lon, zoom, devices, onDeviceClick, mapType]);

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!hasApiKey) {
    return (
      <div
        style={{
          width: "100%",
          height: 400,
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          fontFamily: "var(--mono)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--sev-warn)", letterSpacing: "0.06em" }}>
          TACTICAL GRID — API KEY REQUIRED
        </div>
        <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", maxWidth: 360 }}>
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable
          the Google Vector Maps tactical device grid.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: 400,
        border: "1px solid var(--border)",
        borderRadius: "2px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          fontFamily: "var(--mono)",
          fontSize: "9px",
          letterSpacing: "0.1em",
          color: "rgba(244,246,245,0.5)",
          background: "rgba(5,6,7,0.8)",
          padding: "3px 8px",
          borderRadius: "2px",
        }}
      >
        TACTICAL GRID · {devices.length} DEVICES
      </div>
    </div>
  );
}
