"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GeoDevice, ThreatArc, DevicePoint } from "./types";

// Risk score → color mapping (matches Silent Edge severity palette)
function riskColor(score: number): string {
  if (score >= 70) return "#ff2222"; // sev-crit
  if (score >= 50) return "#ff5155"; // sev-alert
  if (score >= 30) return "#ffaa00"; // sev-warn
  return "#00e28a";                  // sev-ok
}

function severityArcColor(severity: ThreatArc["severity"]): string {
  const map: Record<ThreatArc["severity"], string> = {
    critical: "#ff2222",
    high:     "#ff5155",
    medium:   "#ffaa00",
    low:      "#7b8fa6",
    info:     "#3d7eff",
  };
  return map[severity];
}

export interface GlobeViewProps {
  devices?: GeoDevice[];
  arcs?: ThreatArc[];
  onDeviceClick?: (device: GeoDevice) => void;
  height?: number;
}

export function GlobeView({
  devices = [],
  arcs = [],
  onDeviceClick,
  height = 600,
}: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<unknown>(null);

  const buildPoints = useCallback((): DevicePoint[] =>
    devices.map((d) => ({
      lat: d.lat,
      lon: d.lon,
      size: d.deviceType === "server" ? 0.6 : 0.4,
      color: riskColor(d.riskScore),
      device: d,
      label: `${d.hostname} [${d.riskScore}]`,
    })),
  [devices]);

  useEffect(() => {
    if (!containerRef.current) return;

    let globe: {
      globeImageUrl: (url: string) => unknown;
      backgroundColor: (color: string) => unknown;
      atmosphereColor: (color: string) => unknown;
      atmosphereAltitude: (alt: number) => unknown;
      pointsData: (data: DevicePoint[]) => unknown;
      pointLat: (fn: (d: unknown) => number) => unknown;
      pointLng: (fn: (d: unknown) => number) => unknown;
      pointColor: (fn: (d: unknown) => string) => unknown;
      pointAltitude: (fn: (d: unknown) => number) => unknown;
      pointRadius: (fn: (d: unknown) => number) => unknown;
      pointLabel: (fn: (d: unknown) => string) => unknown;
      onPointClick: (fn: (d: unknown) => void) => unknown;
      arcsData: (data: ThreatArc[]) => unknown;
      arcStartLat: (fn: (d: unknown) => number) => unknown;
      arcStartLng: (fn: (d: unknown) => number) => unknown;
      arcEndLat: (fn: (d: unknown) => number) => unknown;
      arcEndLng: (fn: (d: unknown) => number) => unknown;
      arcColor: (fn: (d: unknown) => string) => unknown;
      arcDashLength: (v: number) => unknown;
      arcDashGap: (v: number) => unknown;
      arcDashAnimateTime: (v: number) => unknown;
      arcStroke: (fn: (d: unknown) => number) => unknown;
    };

    // Dynamic import so Three.js only loads client-side
    import("three-globe").then(({ default: ThreeGlobe }) => {
      import("three").then(({ WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Color }) => {
        if (!containerRef.current) return;

        const w = containerRef.current.clientWidth;
        const h = height;

        // Renderer
        const renderer = new WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(new Color("#050607"), 1);
        containerRef.current.appendChild(renderer.domElement);

        // Scene
        const scene = new Scene();
        scene.background = new Color("#050607");

        // Camera
        const camera = new PerspectiveCamera(45, w / h, 0.1, 2000);
        camera.position.z = 300;

        // Lighting
        const ambient = new AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        const directional = new DirectionalLight(0x3d7eff, 1.2);
        directional.position.set(1, 1, 1);
        scene.add(directional);

        // Globe
        const g = new ThreeGlobe()
          .globeImageUrl(
            "https://unpkg.com/three-globe@2.31.0/example/img/earth-dark.jpg"
          )
          .atmosphereColor("#3d7eff")
          .atmosphereAltitude(0.12);

        // set transparent background via direct property (newer three-globe types omit this method)
        (g as unknown as { backgroundColor: (c: string) => void }).backgroundColor("rgba(0,0,0,0)");

        globe = g as unknown as typeof globe;
        globeRef.current = g;
        scene.add(g as unknown as import("three").Object3D);

        // Device points
        const points = buildPoints();
        (g as unknown as { pointsData: (d: DevicePoint[]) => unknown }).pointsData(points);
        (g as unknown as { pointLat: (f: (d: DevicePoint) => number) => unknown }).pointLat((d: DevicePoint) => d.lat);
        (g as unknown as { pointLng: (f: (d: DevicePoint) => number) => unknown }).pointLng((d: DevicePoint) => d.lon);
        (g as unknown as { pointColor: (f: (d: DevicePoint) => string) => unknown }).pointColor((d: DevicePoint) => d.color);
        (g as unknown as { pointAltitude: (f: (d: DevicePoint) => number) => unknown }).pointAltitude((d: DevicePoint) => d.device.riskScore / 200);
        (g as unknown as { pointRadius: (f: (d: DevicePoint) => number) => unknown }).pointRadius((d: DevicePoint) => d.size);
        (g as unknown as { pointLabel: (f: (d: DevicePoint) => string) => unknown }).pointLabel((d: DevicePoint) => `
          <div style="font-family:JetBrains Mono,monospace;font-size:11px;background:#0a0c0e;border:1px solid rgba(244,246,245,0.12);padding:6px 10px;border-radius:2px">
            <div style="color:#f4f6f5">${d.device.hostname}</div>
            <div style="color:#7b8fa6;font-size:9px">${d.device.deviceType.toUpperCase()} · RISK ${d.device.riskScore}</div>
            ${d.device.orgName ? `<div style="color:#3d7eff;font-size:9px">${d.device.orgName}</div>` : ""}
          </div>
        `);
        (g as unknown as { onPointClick: (f: (d: DevicePoint) => void) => unknown }).onPointClick((d: DevicePoint) => {
          onDeviceClick?.(d.device);
        });

        // Threat arcs
        (g as unknown as { arcsData: (d: ThreatArc[]) => unknown }).arcsData(arcs);
        (g as unknown as { arcStartLat: (f: (d: ThreatArc) => number) => unknown }).arcStartLat((d: ThreatArc) => d.sourceLat);
        (g as unknown as { arcStartLng: (f: (d: ThreatArc) => number) => unknown }).arcStartLng((d: ThreatArc) => d.sourceLon);
        (g as unknown as { arcEndLat: (f: (d: ThreatArc) => number) => unknown }).arcEndLat((d: ThreatArc) => d.targetLat);
        (g as unknown as { arcEndLng: (f: (d: ThreatArc) => number) => unknown }).arcEndLng((d: ThreatArc) => d.targetLon);
        (g as unknown as { arcColor: (f: (d: ThreatArc) => string) => unknown }).arcColor((d: ThreatArc) => severityArcColor(d.severity));
        (g as unknown as { arcDashLength: (v: number) => unknown }).arcDashLength(0.4);
        (g as unknown as { arcDashGap: (v: number) => unknown }).arcDashGap(0.15);
        (g as unknown as { arcDashAnimateTime: (v: number) => unknown }).arcDashAnimateTime(2000);
        (g as unknown as { arcStroke: (f: (d: ThreatArc) => number) => unknown }).arcStroke((d: ThreatArc) => {
          if (d.severity === "critical") return 0.6;
          if (d.severity === "high") return 0.4;
          return 0.25;
        });

        // Auto-rotate
        let rotY = 0;
        let animId: number;
        function animate() {
          animId = requestAnimationFrame(animate);
          rotY += 0.002;
          (g as unknown as import("three").Object3D).rotation.y = rotY;
          renderer.render(scene, camera);
        }
        animate();

        // Resize handler
        function onResize() {
          if (!containerRef.current) return;
          const nw = containerRef.current.clientWidth;
          camera.aspect = nw / height;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, height);
        }
        window.addEventListener("resize", onResize);

        // Cleanup stored on ref for effect cleanup
        (containerRef.current as unknown as { _cleanup?: () => void })._cleanup = () => {
          cancelAnimationFrame(animId);
          window.removeEventListener("resize", onResize);
          renderer.dispose();
          renderer.domElement.remove();
        };
      });
    });

    return () => {
      const el = containerRef.current as unknown as { _cleanup?: () => void } | null;
      el?._cleanup?.();
    };
  }, []); // Globe init once

  // Update points and arcs when data changes without re-creating the globe
  useEffect(() => {
    if (!globeRef.current) return;
    const g = globeRef.current as {
      pointsData: (d: DevicePoint[]) => unknown;
      arcsData: (d: ThreatArc[]) => unknown;
    };
    g.pointsData(buildPoints());
    g.arcsData(arcs);
  }, [devices, arcs, buildPoints]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        background: "#050607",
        borderRadius: "2px",
        overflow: "hidden",
      }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Overlay legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "rgba(244,246,245,0.4)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {[
          { color: "#ff2222", label: "CRITICAL RISK (70+)" },
          { color: "#ff5155", label: "HIGH RISK (50–69)" },
          { color: "#ffaa00", label: "MEDIUM RISK (30–49)" },
          { color: "#00e28a", label: "LOW RISK (<30)" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: item.color,
                boxShadow: `0 0 4px ${item.color}`,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Device count */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "10px",
          color: "rgba(244,246,245,0.3)",
          letterSpacing: "0.06em",
        }}
      >
        {devices.length} DEVICES · {arcs.length} THREAT ARCS
      </div>
    </div>
  );
}
