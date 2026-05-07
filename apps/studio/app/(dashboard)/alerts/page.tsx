"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Alert = {
  id: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  description: string | null;
  host: string | null;
  host_ip: string | null;
  source: string;
  status: "open" | "investigating" | "contained" | "resolved" | "false_positive";
  category: string | null;
  technique_id: string | null;
  technique_name: string | null;
  indicator_type: string | null;
  indicator_value: string | null;
  ai_summary: string | null;
  occurred_at: string;
};

const SEV_ORDER = ["critical", "high", "medium", "low", "info"];
const STATUS_COLORS: Record<string, string> = {
  open: "var(--sev-alert)",
  investigating: "var(--sev-warn)",
  contained: "var(--sev-info)",
  resolved: "var(--sev-ok)",
  false_positive: "var(--muted)",
};

function SevBadge({ sev }: { sev: string }) {
  const colors: Record<string, string> = {
    critical: "var(--sev-crit)",
    high: "var(--sev-alert)",
    medium: "var(--sev-warn)",
    low: "var(--sev-info)",
    info: "var(--muted)",
  };
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: colors[sev] ?? "var(--muted)",
        border: `1px solid ${colors[sev] ?? "var(--border)"}`,
        padding: "1px 5px",
        borderRadius: "2px",
        whiteSpace: "nowrap",
      }}
    >
      {sev.toUpperCase()}
    </span>
  );
}

function ts(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const load = useCallback(async () => {
    let q = supabase
      .from("alerts")
      .select("id,severity,title,description,host,host_ip,source,status,category,technique_id,technique_name,indicator_type,indicator_value,ai_summary,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (sevFilter !== "all") q = q.eq("severity", sevFilter);

    const { data } = await q;
    setAlerts(data ?? []);
    setLoading(false);
  }, [sevFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("alerts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  async function updateStatus(id: string, status: Alert["status"]) {
    await supabase.from("alerts").update({ status }).eq("id", id);
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
    load();
  }

  const filtered = alerts;
  const critCount = alerts.filter((a) => a.severity === "critical" && a.status === "open").length;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 40px - 2rem)", gap: "1rem", overflow: "hidden" }}>
      {/* Left: Alert Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
              ALERT FEED
            </h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
              {critCount > 0 ? `⚠ ${critCount} CRITICAL OPEN` : "● MONITORING ACTIVE"}
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Severity filter */}
            <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
              {["all", ...SEV_ORDER].map((s) => (
                <button
                  key={s}
                  onClick={() => setSevFilter(s)}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.08em",
                    padding: "4px 8px", border: "none", cursor: "pointer",
                    background: sevFilter === s ? "var(--accent)" : "var(--bg-2)",
                    color: sevFilter === s ? "#fff" : "var(--muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Status filter */}
            <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
              {["all", "open", "investigating", "contained", "resolved"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.08em",
                    padding: "4px 8px", border: "none", cursor: "pointer",
                    background: statusFilter === s ? "var(--bg-3)" : "var(--bg-2)",
                    color: statusFilter === s ? "var(--fg)" : "var(--muted)",
                    borderBottom: statusFilter === s ? "1px solid var(--accent)" : "1px solid transparent",
                    textTransform: "uppercase",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="terminal-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ overflow: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "2rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
                LOADING...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "2rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--sev-ok)", textAlign: "center" }}>
                ● NO ALERTS MATCH FILTER
              </div>
            ) : (
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>SEV</th>
                    <th>TITLE</th>
                    <th style={{ width: 140 }}>HOST</th>
                    <th style={{ width: 90 }}>SOURCE</th>
                    <th style={{ width: 100 }}>STATUS</th>
                    <th style={{ width: 130 }}>TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alert) => (
                    <tr
                      key={alert.id}
                      onClick={() => setSelected(alert)}
                      style={{
                        cursor: "pointer",
                        background: selected?.id === alert.id ? "var(--bg-3)" : undefined,
                        borderLeft: selected?.id === alert.id ? "2px solid var(--accent)" : "2px solid transparent",
                      }}
                    >
                      <td><SevBadge sev={alert.severity} /></td>
                      <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {alert.title}
                      </td>
                      <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "10px" }}>
                        {alert.host ?? alert.host_ip ?? "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em" }}>
                        {alert.source.toUpperCase()}
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: STATUS_COLORS[alert.status] ?? "var(--muted)", letterSpacing: "0.06em" }}>
                          {alert.status.toUpperCase().replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "9px", whiteSpace: "nowrap" }}>
                        {ts(alert.occurred_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Right: Alert Detail Panel */}
      {selected && (
        <div
          className="terminal-card"
          style={{
            width: 420, flexShrink: 0, display: "flex", flexDirection: "column",
            overflow: "hidden", animation: "fadeIn 0.15s ease",
          }}
        >
          <div className="terminal-card-header" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <SevBadge sev={selected.severity} />
              ALERT DETAIL
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "14px" }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Title + ID */}
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "13px", fontWeight: 700, color: "var(--fg)", lineHeight: 1.4 }}>
                {selected.title}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", marginTop: 4, letterSpacing: "0.04em" }}>
                {selected.id}
              </div>
            </div>

            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                ["HOST", selected.host ?? "—"],
                ["IP", selected.host_ip ?? "—"],
                ["SOURCE", selected.source.toUpperCase()],
                ["CATEGORY", selected.category ?? "—"],
                ["TECHNIQUE", selected.technique_id ? `${selected.technique_id} — ${selected.technique_name ?? ""}` : "—"],
                ["TIME", ts(selected.occurred_at)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)", wordBreak: "break-all" }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {selected.description && (
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 4 }}>DESCRIPTION</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {selected.description}
                </div>
              </div>
            )}

            {/* Indicator */}
            {selected.indicator_value && (
              <div style={{ background: "var(--bg-3)", border: "1px solid var(--border)", padding: "0.625rem", borderRadius: "2px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 3 }}>
                  {selected.indicator_type?.toUpperCase() ?? "INDICATOR"}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--sev-warn)", wordBreak: "break-all" }}>
                  {selected.indicator_value}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {selected.ai_summary && (
              <div style={{ border: "1px solid var(--accent)", background: "rgba(61,126,255,0.04)", padding: "0.75rem", borderRadius: "2px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 6 }}>
                  ◢ AI SPECIALIST ASSESSMENT
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)", lineHeight: 1.6 }}>
                  {selected.ai_summary}
                </div>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>
              UPDATE STATUS
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {(["open", "investigating", "contained", "resolved", "false_positive"] as Alert["status"][]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected.id, s)}
                  style={{
                    fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em",
                    padding: "4px 8px", border: `1px solid ${STATUS_COLORS[s] ?? "var(--border)"}`,
                    background: selected.status === s ? (STATUS_COLORS[s] + "22") : "transparent",
                    color: STATUS_COLORS[s] ?? "var(--muted)",
                    cursor: "pointer", borderRadius: "2px", textTransform: "uppercase",
                    fontWeight: selected.status === s ? 700 : 400,
                  }}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
