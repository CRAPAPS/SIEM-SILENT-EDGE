"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Alert = {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  source: string | null;
  created_at: string;
  resolved_at: string | null;
};

function severityColor(s: string): string {
  if (s === "critical") return "#ff2222";
  if (s === "high") return "#ff5155";
  if (s === "medium") return "#ffaa00";
  return "#7b8fa6";
}

function statusColor(s: string): string {
  if (s === "resolved") return "#00e28a";
  if (s === "acknowledged") return "#3d7eff";
  return "var(--sev-warn)";
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

export default function PortalAlertsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("alerts")
      .select("id,title,description,severity,status,source,created_at,resolved_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setAlerts((data ?? []) as Alert[]);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = alerts.filter((a) => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const openCount = alerts.filter((a) => a.status === "open").length;
  const critCount = alerts.filter((a) => a.severity === "critical").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div className="page-content">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          CLIENT PORTAL // SECURITY EVENTS
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>MY ALERTS</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "1.5rem" }}>
        {[
          { label: "TOTAL", value: alerts.length, color: "var(--accent)" },
          { label: "OPEN", value: openCount, color: openCount > 0 ? "var(--sev-warn)" : "var(--accent)" },
          { label: "CRITICAL", value: critCount, color: critCount > 0 ? "#ff2222" : "var(--accent)" },
          { label: "RESOLVED", value: resolvedCount, color: "#00e28a" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", padding: "0.5rem 0.75rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
          {(["all", "open", "acknowledged", "resolved"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ background: statusFilter === s ? "var(--bg-3)" : "var(--bg-2)", color: statusFilter === s ? "var(--accent)" : "var(--muted)", border: "none", padding: "3px 10px", fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
          {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
            <button key={s} onClick={() => setSeverityFilter(s)} style={{ background: severityFilter === s ? "var(--bg-3)" : "var(--bg-2)", color: severityFilter === s ? (s === "all" ? "var(--accent)" : severityColor(s)) : "var(--muted)", border: "none", padding: "3px 10px", fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", padding: "2rem 0", textAlign: "center" }}>
          {alerts.length === 0 ? "No alerts — all clear." : "No alerts match the current filters."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((a) => (
            <>
              <div
                key={a.id}
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.625rem 0.75rem", borderBottom: "1px solid var(--border)", cursor: "pointer", background: expanded === a.id ? "var(--surface)" : "transparent" }}
              >
                <span style={{ flexShrink: 0, fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.06em", color: severityColor(a.severity), border: `1px solid ${severityColor(a.severity)}`, padding: "1px 4px", borderRadius: "2px", marginTop: 2 }}>
                  {a.severity.toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", marginTop: 2 }}>
                    {relTime(a.created_at)}{a.source ? ` · ${a.source}` : ""}
                  </div>
                </div>
                <span style={{ flexShrink: 0, fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.06em", color: statusColor(a.status), marginTop: 2 }}>
                  {a.status.toUpperCase()}
                </span>
              </div>
              {expanded === a.id && (
                <div key={`${a.id}-exp`} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", fontFamily: "var(--mono)", fontSize: "10px" }}>
                  <div style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "0.5rem" }}>
                    {a.description ?? "No additional details available."}
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div><span style={{ color: "var(--muted)" }}>CREATED: </span>{new Date(a.created_at).toLocaleString()}</div>
                    {a.resolved_at && <div><span style={{ color: "var(--muted)" }}>RESOLVED: </span>{new Date(a.resolved_at).toLocaleString()}</div>}
                    {a.source && <div><span style={{ color: "var(--muted)" }}>SOURCE: </span>{a.source}</div>}
                  </div>
                </div>
              )}
            </>
          ))}
        </div>
      )}
    </div>
  );
}
