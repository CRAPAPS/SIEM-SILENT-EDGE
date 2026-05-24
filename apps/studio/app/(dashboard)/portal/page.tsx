"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

type RecentAlert = {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
};

type Device = {
  id: string;
  hostname: string;
  status: string | null;
  risk_score: number | null;
  last_seen: string | null;
};

function severityColor(s: string): string {
  if (s === "critical") return "#ff2222";
  if (s === "high") return "#ff5155";
  if (s === "medium") return "#ffaa00";
  return "#7b8fa6";
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PortalPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [orgName, setOrgName] = useState("Your Organization");
  const [devices, setDevices] = useState<Device[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", profile.organization_id)
          .single();
        if (org?.name) setOrgName(org.name);
      }

      const [{ data: devData }, { data: alertData }] = await Promise.all([
        supabase.from("devices").select("id,hostname,status,risk_score,last_seen").order("risk_score", { ascending: false }),
        supabase.from("alerts").select("id,title,severity,status,created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      setDevices((devData ?? []) as Device[]);
      setRecentAlerts((alertData ?? []) as RecentAlert[]);
      setLoading(false);
    }
    void load();
  }, [supabase]);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const openAlerts = recentAlerts.filter((a) => a.status === "open").length;
  const criticalAlerts = recentAlerts.filter((a) => a.severity === "critical" && a.status === "open").length;

  const overallHealth =
    criticalAlerts > 0 ? "AT RISK" :
    openAlerts > 3 ? "NEEDS ATTENTION" :
    "HEALTHY";
  const healthColor =
    overallHealth === "AT RISK" ? "#ff2222" :
    overallHealth === "NEEDS ATTENTION" ? "#ffaa00" :
    "#00e28a";

  return (
    <div className="page-content">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          SHEL INFOSEC // CLIENT PORTAL
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
          {orgName.toUpperCase()}
        </h1>
      </div>

      {loading ? (
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "2rem" }}>
            {[
              { label: "SECURITY STATUS", value: overallHealth, color: healthColor, note: null },
              { label: "DEVICES", value: devices.length, color: "var(--accent)", note: `${onlineCount} online` },
              { label: "OPEN ALERTS", value: openAlerts, color: openAlerts > 0 ? "var(--sev-warn)" : "var(--accent)", note: criticalAlerts > 0 ? `${criticalAlerts} CRITICAL` : null },
              { label: "MONITORING", value: "24/7/365", color: "#00e28a", note: "ACTIVE" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--surface)", padding: "0.75rem 1rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em" }}>{s.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: typeof s.value === "string" && s.value.length > 6 ? "13px" : "20px", fontWeight: 700, color: s.color, marginTop: 4 }}>
                  {s.value}
                </div>
                {s.note && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: s.label === "OPEN ALERTS" && criticalAlerts > 0 ? "var(--sev-crit)" : "#00e28a", marginTop: 2 }}>
                    {s.note}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Devices + Alerts columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
            <div className="terminal-card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em" }}>[ DEVICE HEALTH ]</div>
                <Link href="/portal/devices" style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", textDecoration: "none", letterSpacing: "0.06em" }}>VIEW ALL →</Link>
              </div>
              {devices.length === 0 ? (
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>No devices enrolled yet.</div>
              ) : (
                devices.slice(0, 6).map((d) => {
                  const score = d.risk_score ?? 0;
                  const rc = score >= 70 ? "#ff2222" : score >= 50 ? "#ff5155" : score >= 30 ? "#ffaa00" : "#00e28a";
                  return (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.375rem 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.status === "online" ? "#00e28a" : "var(--muted)", flexShrink: 0 }} />
                      <div style={{ flex: 1, fontFamily: "var(--mono)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.hostname}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: rc, letterSpacing: "0.06em" }}>RISK {score}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="terminal-card" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em" }}>[ RECENT ALERTS ]</div>
                <Link href="/portal/alerts" style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", textDecoration: "none", letterSpacing: "0.06em" }}>VIEW ALL →</Link>
              </div>
              {recentAlerts.length === 0 ? (
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>No alerts — all clear.</div>
              ) : (
                recentAlerts.slice(0, 8).map((a) => (
                  <div key={a.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.375rem 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ flexShrink: 0, fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.06em", color: severityColor(a.severity), border: `1px solid ${severityColor(a.severity)}`, padding: "1px 4px", borderRadius: "2px", marginTop: 1 }}>
                      {a.severity.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", marginTop: 2 }}>{relTime(a.created_at)} · {a.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Services */}
          <div className="terminal-card" style={{ padding: "1rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>[ ACTIVE SERVICES ]</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
              {[
                "Endpoint Detection & Response",
                "Threat Intelligence Feed",
                "24/7 SOC Monitoring",
                "Vulnerability Management",
                "Incident Response (On-Call)",
                "Compliance Reporting",
              ].map((svc) => (
                <div key={svc} style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "3px", padding: "0.75rem" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)", marginBottom: 4 }}>{svc}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "#00e28a", letterSpacing: "0.1em" }}>● ACTIVE</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
