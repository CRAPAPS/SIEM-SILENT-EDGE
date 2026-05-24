import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").single();
  if (!["super_admin","admin"].includes(profile?.role ?? "")) redirect("/dashboard");

  const [
    { data: orgs },
    { data: alerts },
    { data: devices },
    { data: feedLog },
  ] = await Promise.all([
    supabase.from("organizations").select("id,name,tier,status,monthly_rate"),
    supabase.from("alerts").select("organization_id,severity,status,created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("devices").select("organization_id,risk_score,is_online"),
    supabase.from("threat_feed_sync_log").select("source,iocs_added,created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const now = Date.now();
  const day = 86_400_000;
  const alerts24h = (alerts ?? []).filter(a => now - new Date(a.created_at).getTime() < day).length;
  const openCrit = (alerts ?? []).filter(a => a.severity === "critical" && a.status === "open").length;
  const totalMRR = (orgs ?? []).reduce((s, o) => s + (o.monthly_rate ?? 0), 0);
  const highRiskDevices = (devices ?? []).filter(d => d.risk_score >= 70).length;

  // Last feed sync summary
  const feedMap: Record<string, number> = {};
  for (const r of (feedLog ?? [])) {
    if (!feedMap[r.source]) feedMap[r.source] = r.iocs_added;
  }
  const totalIOCs = Object.values(feedMap).reduce((s, v) => s + v, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          OPERATIONS REPORT
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          LIVE SNAPSHOT — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)" }}>
        {[
          { label: "MONTHLY RECURRING", value: `£${totalMRR.toLocaleString()}`, color: "var(--sev-ok)" },
          { label: "ALERTS (24H)", value: alerts24h, color: alerts24h > 10 ? "var(--sev-warn)" : "var(--fg)" },
          { label: "CRITICAL OPEN", value: openCrit, color: openCrit > 0 ? "var(--sev-crit)" : "var(--sev-ok)" },
          { label: "HIGH RISK DEVICES", value: highRiskDevices, color: highRiskDevices > 0 ? "var(--sev-alert)" : "var(--sev-ok)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-2)", padding: "1rem 1.25rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Threat Feed Status */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-info)" }} />
          THREAT INTELLIGENCE FEEDS
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "9px" }}>{totalIOCs} IOCs INDEXED</span>
        </div>
        <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.5rem" }}>
          {Object.entries(feedMap).map(([source, count]) => (
            <div key={source} style={{ background: "var(--bg-3)", border: "1px solid var(--border)", padding: "0.625rem", borderRadius: "2px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 4 }}>
                {source.toUpperCase().replace("_", " ")}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "18px", fontWeight: 700, color: count > 0 ? "var(--sev-ok)" : "var(--muted)" }}>
                {count}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", marginTop: 2 }}>IOCs (LAST RUN)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-client alert summary */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-warn)" }} />
          CLIENT ALERT SUMMARY
        </div>
        <div style={{ overflow: "auto" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>CLIENT</th>
                <th style={{ width: 80 }}>TIER</th>
                <th style={{ width: 80 }}>TOTAL OPEN</th>
                <th style={{ width: 80 }}>CRITICAL</th>
                <th style={{ width: 80 }}>HIGH</th>
                <th style={{ width: 80 }}>MRR</th>
              </tr>
            </thead>
            <tbody>
              {(orgs ?? []).map((org) => {
                const orgAlerts = (alerts ?? []).filter(a => a.organization_id === org.id && a.status === "open");
                const crit = orgAlerts.filter(a => a.severity === "critical").length;
                const high = orgAlerts.filter(a => a.severity === "high").length;
                return (
                  <tr key={org.id}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, color: "var(--fg)" }}>{org.name}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.06em" }}>{org.tier.toUpperCase()}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11px", color: orgAlerts.length > 0 ? "var(--sev-warn)" : "var(--sev-ok)" }}>{orgAlerts.length}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11px", color: crit > 0 ? "var(--sev-crit)" : "var(--sev-ok)" }}>{crit}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11px", color: high > 0 ? "var(--sev-alert)" : "var(--sev-ok)" }}>{high}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--sev-ok)" }}>
                      {org.monthly_rate ? `£${org.monthly_rate.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
