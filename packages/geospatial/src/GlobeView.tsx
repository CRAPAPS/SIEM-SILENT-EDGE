"use client";

import { useEffect, useRef, useCallback } from "react";
import type { GeoDevice, ThreatArc, DevicePoint } from "./types";

function riskColor(score: number): string {
  if (score >= 70) return "#ff2222";
  if (score >= 50) return "#ff5155";
  if (score >= 30) return "#ffaa00";
  return "#00e28a";
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

function severityRingRgb(severity: ThreatArc["severity"]): string {
  if (severity === "critical") return "255,34,34";
  if (severity === "high") return "255,81,85";
  if (severity === "medium") return "255,170,0";
  return "61,126,255";
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

    type GlobeInstance = {
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
      arcDashInitialGap: (fn: (d: unknown) => number) => unknown;
      arcDashAnimateTime: (v: number) => unknown;
      arcStroke: (fn: (d: unknown) => number) => unknown;
      ringsData: (data: ThreatArc[]) => unknown;
      ringLat: (fn: (d: unknown) => number) => unknown;
      ringLng: (fn: (d: unknown) => number) => unknown;
      ringColor: (fn: (d: unknown) => (t: number) => string) => unknown;
      ringMaxRadius: (v: number) => unknown;
      ringPropagationSpeed: (v: number) => unknown;
      ringRepeatPeriod: (v: number) => unknown;
    };

    let globe: GlobeInstance;

    import("three-globe").then(({ default: ThreeGlobe }) => {
      import("three").then(({ WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Color }) => {
        if (!containerRef.current) return;

        const getAccent = () =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim() || "#3d7eff";

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
        const directional = new DirectionalLight(new Color(getAccent()), 1.2);
        directional.position.set(1, 1, 1);
        scene.add(directional);

        // React to accent-color changes (stored in localStorage as 'se-accent')
        const onStorage = (e: StorageEvent) => {
          if (e.key !== "se-accent" || !e.newValue) return;
          (g as unknown as { atmosphereColor: (c: string) => unknown }).atmosphereColor(e.newValue);
          directional.color.set(e.newValue);
        };
        window.addEventListener("storage", onStorage);

        // Globe — night earth texture (Kaspersky-style city-lights aesthetic)
        const g = new ThreeGlobe()
          .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
          .atmosphereColor(getAccent())
          .atmosphereAltitude(0.12);

        (g as unknown as { backgroundColor: (c: string) => void }).backgroundColor("rgba(0,0,0,0)");

        globe = g as unknown as GlobeInstance;
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
        (g as unknown as { arcDashGap: (v: number) => unknown }).arcDashGap(0.5);
        (g as unknown as { arcDashInitialGap: (f: (d: ThreatArc) => number) => unknown }).arcDashInitialGap(() => Math.random());
        (g as unknown as { arcDashAnimateTime: (v: number) => unknown }).arcDashAnimateTime(2000);
        (g as unknown as { arcStroke: (f: (d: ThreatArc) => number) => unknown }).arcStroke((d: ThreatArc) => {
          if (d.severity === "critical") return 1.0;
          if (d.severity === "high") return 0.7;
          return 0.4;
        });

        // Pulsing rings at attack targets (Kaspersky-style impact indicators)
        (g as unknown as { ringsData: (d: ThreatArc[]) => unknown }).ringsData(arcs);
        (g as unknown as { ringLat: (f: (d: ThreatArc) => number) => unknown }).ringLat((d: ThreatArc) => d.targetLat);
        (g as unknown as { ringLng: (f: (d: ThreatArc) => number) => unknown }).ringLng((d: ThreatArc) => d.targetLon);
        (g as unknown as { ringColor: (f: (d: ThreatArc) => (t: number) => string) => unknown }).ringColor(
          (d: ThreatArc) => (t: number) => `rgba(${severityRingRgb(d.severity)},${1 - t})`
        );
        (g as unknown as { ringMaxRadius: (v: number) => unknown }).ringMaxRadius(4);
        (g as unknown as { ringPropagationSpeed: (v: number) => unknown }).ringPropagationSpeed(2);
        (g as unknown as { ringRepeatPeriod: (v: number) => unknown }).ringRepeatPeriod(800);

        // Auto-rotate — pauses on pointer interaction, resumes after 3 s
        let rotY = 0;
        let animId: number;
        let userInteracting = false;
        let resumeTimer: ReturnType<typeof setTimeout> | null = null;

        const container = containerRef.current;
        const onPointerDown = () => {
          userInteracting = true;
          if (resumeTimer) clearTimeout(resumeTimer);
        };
        const onPointerUp = () => {
          resumeTimer = setTimeout(() => { userInteracting = false; }, 3000);
        };
        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointerup", onPointerUp);

        function animate() {
          animId = requestAnimationFrame(animate);
          if (!userInteracting) rotY += 0.002;
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

        (containerRef.current as unknown as { _cleanup?: () => void })._cleanup = () => {
          cancelAnimationFrame(animId);
          if (resumeTimer) clearTimeout(resumeTimer);
          window.removeEventListener("resize", onResize);
          window.removeEventListener("storage", onStorage);
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("pointerup", onPointerUp);
          renderer.dispose();
          renderer.domElement.remove();
        };
      });
    });

    // suppress unused warning — globe is set in async callback
    void globe!;

    return () => {
      const el = containerRef.current as unknown as { _cleanup?: () => void } | null;
      el?._cleanup?.();
    };
  }, []); // Globe init once

  // Update points, arcs, and rings when data changes without re-creating the globe
  useEffect(() => {
    if (!globeRef.current) return;
    const g = globeRef.current as {
      pointsData: (d: DevicePoint[]) => unknown;
      arcsData: (d: ThreatArc[]) => unknown;
      ringsData: (d: ThreatArc[]) => unknown;
    };
    g.pointsData(buildPoints());
    g.arcsData(arcs);
    g.ringsData(arcs);
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

      {/* Stats overlay */}
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
