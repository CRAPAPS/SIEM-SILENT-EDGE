"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Device = {
  id: string;
  hostname: string;
  device_type: "workstation" | "server" | "network" | "mobile" | null;
  os: string | null;
  ip_address: string | null;
  risk_score: number;
  risk_factors: Record<string, unknown> | null;
  is_online: boolean;
  last_seen_at: string | null;
  organization_id: string;
};

const TYPE_ICONS: Record<string, string> = {
  workstation: "□",
  server: "▣",
  network: "◈",
  mobile: "▷",
};

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "var(--sev-crit)" :
    score >= 40 ? "var(--sev-alert)" :
    score >= 20 ? "var(--sev-warn)" :
    "var(--sev-ok)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: "1px", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

function ts(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Device | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"risk" | "hostname" | "last_seen">("risk");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const load = useCallback(async () => {
    let q = supabase
      .from("devices")
      .select("id,hostname,device_type,os,ip_address,risk_score,risk_factors,is_online,last_seen_at,organization_id")
      .limit(500);

    if (typeFilter !== "all") q = q.eq("device_type", typeFilter);
    if (onlineOnly) q = q.eq("is_online", true);

    const orderMap = { risk: "risk_score", hostname: "hostname", last_seen: "last_seen_at" };
    q = q.order(orderMap[sortBy], { ascending: sortBy === "hostname" });

    const { data } = await q;
    setDevices(data ?? []);
    setLoading(false);
  }, [typeFilter, onlineOnly, sortBy]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("devices-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const online = devices.filter((d) => d.is_online).length;
  const highRisk = devices.filter((d) => d.risk_score >= 70).length;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 40px - 2rem)", gap: "1rem", overflow: "hidden" }}>
      {/* Left: Device Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
              DEVICE INVENTORY
            </h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
              {online}/{devices.length} ONLINE
              {highRisk > 0 && <span style={{ color: "var(--sev-crit)", marginLeft: "1rem" }}>⚠ {highRisk} HIGH RISK</span>}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Type filter */}
            <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
              {["all", "workstation", "server", "network", "mobile"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.08em",
                    padding: "4px 8px", border: "none", cursor: "pointer",
                    background: typeFilter === t ? "var(--accent)" : "var(--bg-2)",
                    color: typeFilter === t ? "#fff" : "var(--muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {t === "all" ? "ALL" : (TYPE_ICONS[t] + " " + t.toUpperCase())}
                </button>
              ))}
            </div>
            {/* Online toggle */}
            <button
              onClick={() => setOnlineOnly(!onlineOnly)}
              style={{
                fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.08em",
                padding: "4px 8px", border: `1px solid ${onlineOnly ? "var(--sev-ok)" : "var(--border)"}`,
                background: "var(--bg-2)", color: onlineOnly ? "var(--sev-ok)" : "var(--muted)",
                cursor: "pointer", textTransform: "uppercase",
              }}
            >
              ● ONLINE ONLY
            </button>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "risk" | "hostname" | "last_seen")}
              style={{
                fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.08em",
                padding: "4px 8px", border: "1px solid var(--border)",
                background: "var(--bg-2)", color: "var(--muted)", cursor: "pointer",
              }}
            >
              <option value="risk">SORT: RISK ↓</option>
              <option value="hostname">SORT: NAME ↑</option>
              <option value="last_seen">SORT: LAST SEEN</option>
            </select>
          </div>
        </div>

        {/* Grid / Table */}
        <div className="terminal-card" style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: "2rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
              LOADING...
            </div>
          ) : devices.length === 0 ? (
            <div style={{ padding: "3rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
              NO DEVICES SYNCED YET<br />
              <span style={{ fontSize: "9px", marginTop: "0.5rem", display: "block" }}>
                Connect NinjaOne integration to populate device inventory
              </span>
            </div>
          ) : (
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>HOSTNAME</th>
                  <th style={{ width: 100 }}>TYPE</th>
                  <th>OS</th>
                  <th style={{ width: 120 }}>IP</th>
                  <th style={{ width: 160 }}>RISK SCORE</th>
                  <th style={{ width: 100 }}>LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    onClick={() => setSelected(device)}
                    style={{
                      cursor: "pointer",
                      background: selected?.id === device.id ? "var(--bg-3)" : undefined,
                      borderLeft: selected?.id === device.id ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <td>
                      <span
                        style={{
                          display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                          background: device.is_online ? "var(--sev-ok)" : "rgba(244,246,245,0.15)",
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{device.hostname}</td>
                    <td style={{ color: "var(--muted)", fontSize: "10px" }}>
                      {TYPE_ICONS[device.device_type ?? ""] ?? "○"} {device.device_type?.toUpperCase() ?? "UNKNOWN"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "10px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {device.os ?? "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px" }}>
                      {device.ip_address ?? "—"}
                    </td>
                    <td>
                      <RiskBar score={device.risk_score} />
                    </td>
                    <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "9px" }}>
                      {ts(device.last_seen_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: Device Detail Panel */}
      {selected && (
        <div
          className="terminal-card"
          style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div className="terminal-card-header" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: selected.is_online ? "var(--sev-ok)" : "rgba(244,246,245,0.15)",
                  display: "inline-block",
                }}
              />
              DEVICE DETAIL
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "14px" }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Hostname + risk */}
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "16px", fontWeight: 700, color: "var(--fg)" }}>
                {selected.hostname}
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <RiskBar score={selected.risk_score} />
                <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginTop: 3 }}>
                  RISK SCORE / 100
                </div>
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                ["TYPE", `${TYPE_ICONS[selected.device_type ?? ""] ?? "○"} ${selected.device_type?.toUpperCase() ?? "UNKNOWN"}`],
                ["STATUS", selected.is_online ? "● ONLINE" : "○ OFFLINE"],
                ["OS", selected.os ?? "—"],
                ["IP ADDRESS", selected.ip_address ?? "—"],
                ["LAST SEEN", ts(selected.last_seen_at)],
                ["ORG ID", selected.organization_id.slice(0, 8) + "…"],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: "10px",
                    color: val === "● ONLINE" ? "var(--sev-ok)" : val === "○ OFFLINE" ? "var(--muted)" : "var(--fg)",
                  }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Factors */}
            {selected.risk_factors && Object.keys(selected.risk_factors).length > 0 && (
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>
                  RISK FACTORS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {Object.entries(selected.risk_factors).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex", justifyContent: "space-between",
                        fontFamily: "var(--mono)", fontSize: "9px",
                        padding: "4px 6px", background: "var(--bg-3)", borderRadius: "2px",
                      }}
                    >
                      <span style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{key}</span>
                      <span style={{ color: "var(--sev-warn)" }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device ID */}
            <div style={{ background: "var(--bg-3)", border: "1px solid var(--border)", padding: "0.625rem", borderRadius: "2px", marginTop: "auto" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 3 }}>
                DEVICE UUID
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--fg)", wordBreak: "break-all" }}>
                {selected.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
