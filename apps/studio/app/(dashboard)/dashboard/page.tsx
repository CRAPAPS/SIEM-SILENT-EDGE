import { createClient } from "@/lib/supabase/server";

const LOG_POOL = [
  { ts: "00:00:01", msg: "SENTINEL_ONE ingestion pipeline ACTIVE" },
  { ts: "00:00:03", msg: "NINJAONE device sync: 0 changes detected" },
  { ts: "00:00:07", msg: "BITDEFENDER webhook listener READY" },
  { ts: "00:00:12", msg: "RLS policies verified — tenant isolation ENFORCED" },
  { ts: "00:00:18", msg: "AI Specialist ONLINE — knowledge base indexed" },
  { ts: "00:00:22", msg: "REALTIME subscription ACTIVE on alerts table" },
  { ts: "00:00:31", msg: "SOC_STATUS: OPERATIONAL — no active incidents" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .single();

  const orgFilter =
    profile?.role === "admin" ? {} : { organization_id: profile?.organization_id };

  const [alertsRes, devicesRes] = await Promise.all([
    supabase
      .from("alerts")
      .select("id, severity, title, host, occurred_at, status, source")
      .match(profile?.role !== "admin" ? { organization_id: profile?.organization_id } : {})
      .eq("status", "open")
      .order("occurred_at", { ascending: false })
      .limit(12),
    supabase
      .from("devices")
      .select("id, hostname, device_type, is_online, risk_score, last_seen_at")
      .match(profile?.role !== "admin" ? { organization_id: profile?.organization_id } : {})
      .order("risk_score", { ascending: false })
      .limit(8),
  ]);

  const alerts = alertsRes.data ?? [];
  const devices = devicesRes.data ?? [];

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const onlineDevices = devices.filter((d) => d.is_online).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--fg)",
            margin: 0,
          }}
        >
          SOC COMMAND CONSOLE
        </h1>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "var(--muted)",
            margin: "4px 0 0",
            letterSpacing: "0.04em",
          }}
        >
          {profile?.role === "admin" ? "GOD VIEW — ALL ORGANIZATIONS" : "LIVE THREAT MONITOR"}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)" }}>
        {[
          { label: "OPEN ALERTS", value: alerts.length, color: "var(--fg)" },
          { label: "CRITICAL", value: criticalCount, color: criticalCount > 0 ? "var(--sev-crit)" : "var(--sev-ok)" },
          { label: "HIGH", value: highCount, color: highCount > 0 ? "var(--sev-alert)" : "var(--sev-ok)" },
          { label: "DEVICES ONLINE", value: `${onlineDevices}/${devices.length}`, color: "var(--sev-ok)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ background: "var(--bg-2)", padding: "1rem 1.25rem" }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: "0.375rem",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "28px",
                fontWeight: 700,
                color: stat.color,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Three-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 340px", gap: "1rem" }}>
        {/* Alert Feed */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" style={{ background: alerts.length > 0 ? "var(--sev-warn)" : "var(--sev-ok)" }} />
            LIVE ALERT FEED
            <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
              {alerts.length} OPEN
            </span>
          </div>
          <div style={{ overflow: "auto", maxHeight: "420px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SEV</th>
                  <th>TITLE</th>
                  <th>HOST</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ color: "var(--sev-ok)", textAlign: "center", padding: "2rem" }}>
                      ● NO OPEN ALERTS
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <span className={`sev-badge sev-badge-${alert.severity}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </td>
                      <td
                        style={{
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {alert.title}
                      </td>
                      <td style={{ color: "var(--muted)" }}>{alert.host ?? "—"}</td>
                      <td style={{ color: "var(--muted)", fontSize: "9px", letterSpacing: "0.06em" }}>
                        {alert.source.toUpperCase()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Health */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" style={{ background: "var(--sev-info)" }} />
            DEVICE HEALTH
            <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
              {onlineDevices}/{devices.length} ONLINE
            </span>
          </div>
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {devices.length === 0 ? (
              <div style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "11px", textAlign: "center", padding: "2rem" }}>
                NO DEVICES SYNCED
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--fg)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: device.is_online ? "var(--sev-ok)" : "var(--border)",
                          flexShrink: 0,
                        }}
                      />
                      {device.hostname}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", marginTop: 2, paddingLeft: 13 }}>
                      {device.device_type?.toUpperCase() ?? "UNKNOWN"}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      color:
                        device.risk_score >= 70
                          ? "var(--sev-crit)"
                          : device.risk_score >= 40
                          ? "var(--sev-alert)"
                          : "var(--sev-ok)",
                      fontWeight: 700,
                    }}
                  >
                    {device.risk_score}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Terminal Log Card */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" />
            SYSTEM LOG
          </div>
          <div className="terminal-card-body" style={{ padding: "0.875rem 1rem" }}>
            {LOG_POOL.map((line, i) => (
              <div key={i} className="log-line">
                <span className="ts">{line.ts}</span>
                <span className="msg">{line.msg}</span>
              </div>
            ))}
            <div className="log-line" style={{ marginTop: "0.5rem" }}>
              <span style={{ color: "var(--accent)" }} className="cursor-blink">
                root@soc-01 ~ %{" "}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
