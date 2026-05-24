"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Device = {
  id: string;
  hostname: string;
  os: string | null;
  device_type: string | null;
  status: string | null;
  risk_score: number | null;
  last_seen: string | null;
  ip_address: string | null;
};

function riskColor(score: number): string {
  if (score >= 70) return "#ff2222";
  if (score >= 50) return "#ff5155";
  if (score >= 30) return "#ffaa00";
  return "#00e28a";
}

function riskLabel(score: number): string {
  if (score >= 70) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PortalDevicesPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "online" | "offline" | "risk">("all");

  useEffect(() => {
    supabase
      .from("devices")
      .select("id,hostname,os,device_type,status,risk_score,last_seen,ip_address")
      .order("risk_score", { ascending: false })
      .then(({ data }) => {
        setDevices((data ?? []) as Device[]);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = devices.filter((d) => {
    if (filter === "online") return d.status === "online";
    if (filter === "offline") return d.status !== "online";
    if (filter === "risk") return (d.risk_score ?? 0) >= 50;
    return true;
  });

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const atRiskCount = devices.filter((d) => (d.risk_score ?? 0) >= 50).length;

  return (
    <div className="page-content">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          CLIENT PORTAL // DEVICE INVENTORY
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>MY DEVICES</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "1.5rem" }}>
        {[
          { label: "TOTAL", value: devices.length, color: "var(--accent)" },
          { label: "ONLINE", value: onlineCount, color: "#00e28a" },
          { label: "OFFLINE", value: devices.length - onlineCount, color: "var(--muted)" },
          { label: "AT RISK (50+)", value: atRiskCount, color: atRiskCount > 0 ? "var(--sev-alert)" : "var(--accent)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", padding: "0.5rem 0.75rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1px", background: "var(--border)", width: "fit-content", marginBottom: "1rem" }}>
        {(["all", "online", "offline", "risk"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "var(--bg-3)" : "var(--bg-2)", color: filter === f ? "var(--accent)" : "var(--muted)", border: "none", padding: "3px 12px", fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            {f === "risk" ? "AT RISK" : f.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
          {devices.length === 0 ? "No devices enrolled yet." : "No devices match the current filter."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["STATUS", "HOSTNAME", "OS / TYPE", "IP ADDRESS", "RISK SCORE", "LAST SEEN"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const score = d.risk_score ?? 0;
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.status === "online" ? "#00e28a" : "var(--muted)" }} />
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: d.status === "online" ? "#00e28a" : "var(--muted)", letterSpacing: "0.06em" }}>
                          {(d.status ?? "unknown").toUpperCase()}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600, whiteSpace: "nowrap" }}>{d.hostname}</td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "10px" }}>
                      {d.os ?? "—"}{d.device_type ? ` · ${d.device_type}` : ""}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "10px" }}>{d.ip_address ?? "—"}</td>
                    <td style={{ padding: "0.5rem 0.6rem", whiteSpace: "nowrap" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: riskColor(score), border: `1px solid ${riskColor(score)}`, padding: "1px 5px", borderRadius: "2px", letterSpacing: "0.06em" }}>
                        {riskLabel(score)} {score}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "10px" }}>
                      {d.last_seen ? relTime(d.last_seen) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
