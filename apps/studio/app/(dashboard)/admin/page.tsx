import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: orgs }, { data: users }, { data: recentAudit }] = await Promise.all([
    supabase.from("organizations").select("id,name,slug,tier,status,monthly_rate,created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,display_name,role,organization_id,last_seen_at").order("last_seen_at", { ascending: false }).limit(50),
    supabase.from("audit_logs").select("id,actor_email,action,target_type,target_id,created_at").order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          ADMIN PANEL
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          RESTRICTED — ADMIN ACCESS ONLY
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Organizations */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" style={{ background: "var(--sev-info)" }} />
            ORGANIZATIONS
            <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "10px" }}>
              {(orgs ?? []).length} TOTAL
            </span>
          </div>
          <div style={{ overflow: "auto", maxHeight: 320 }}>
            {(orgs ?? []).length === 0 ? (
              <div style={{ padding: "2rem", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
                NO ORGANIZATIONS YET
              </div>
            ) : (
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th style={{ width: 80 }}>TIER</th>
                    <th style={{ width: 80 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(orgs ?? []).map((org) => (
                    <tr key={org.id}>
                      <td>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, color: "var(--fg)" }}>{org.name}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)" }}>/{org.slug}</div>
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.06em" }}>
                        {org.tier.toUpperCase()}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em",
                          color: org.status === "active" ? "var(--sev-ok)" : "var(--muted)",
                        }}>
                          {org.status === "active" ? "●" : "○"} {org.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Users */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" style={{ background: "var(--sev-ok)" }} />
            OPERATOR ACCOUNTS
            <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "10px" }}>
              {(users ?? []).length} USERS
            </span>
          </div>
          <div style={{ overflow: "auto", maxHeight: 320 }}>
            {(users ?? []).length === 0 ? (
              <div style={{ padding: "2rem", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
                NO USERS YET
              </div>
            ) : (
              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>OPERATOR</th>
                    <th style={{ width: 80 }}>ROLE</th>
                    <th style={{ width: 100 }}>LAST SEEN</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => {
                    const ROLE_COLORS: Record<string, string> = { admin: "var(--sev-crit)", analyst: "var(--sev-info)", client: "var(--muted)" };
                    const diff = u.last_seen_at ? Math.floor((Date.now() - new Date(u.last_seen_at).getTime()) / 60_000) : null;
                    const lastSeen = diff === null ? "—" : diff < 5 ? "NOW" : diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h`;
                    return (
                      <tr key={u.id}>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)" }}>
                          {u.display_name ?? u.id.slice(0, 8)}
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em", color: ROLE_COLORS[u.role] ?? "var(--muted)" }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)" }}>
                          {lastSeen}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-warn)" }} />
          AUDIT LOG
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.06em" }}>
            IMMUTABLE · LAST 30 ENTRIES
          </span>
        </div>
        <div style={{ overflow: "auto", maxHeight: 360 }}>
          {(recentAudit ?? []).length === 0 ? (
            <div style={{ padding: "2rem", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", textAlign: "center" }}>
              NO AUDIT EVENTS YET
            </div>
          ) : (
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>TIME</th>
                  <th style={{ width: 160 }}>ACTOR</th>
                  <th>ACTION</th>
                  <th style={{ width: 100 }}>TARGET</th>
                </tr>
              </thead>
              <tbody>
                {(recentAudit ?? []).map((log) => {
                  const d = new Date(log.created_at);
                  const formatted = d.toLocaleString("en-GB", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {formatted}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--fg)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.actor_email ?? "—"}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.04em" }}>
                        {log.action}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)" }}>
                        {log.target_type ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" />
          QUICK ACTIONS
        </div>
        <div style={{ padding: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { label: "◢ NEW ORGANIZATION", href: "/admin/orgs/new", color: "var(--accent)" },
            { label: "◢ INVITE ANALYST", href: "/admin/invite", color: "var(--sev-info)" },
            { label: "◢ MIGRATION STATUS", href: "/admin/migrations", color: "var(--muted)" },
            { label: "◢ SYSTEM HEALTH", href: "/api/health", color: "var(--sev-ok)" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              style={{
                fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                padding: "7px 16px", border: `1px solid ${action.color}`,
                color: action.color, textDecoration: "none", borderRadius: "2px",
                background: "transparent",
              }}
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
