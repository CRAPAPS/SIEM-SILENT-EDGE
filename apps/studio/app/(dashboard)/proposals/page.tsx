import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProposalActions } from "./ProposalActions";

const STATUS_COLOR: Record<string, string> = {
  pending:  "var(--sev-warn)",
  approved: "var(--sev-ok)",
  executed: "var(--sev-ok)",
  rejected: "var(--sev-alert)",
  failed:   "var(--sev-crit)",
};

const RISK_COLOR: Record<string, string> = {
  critical: "var(--sev-crit)",
  high:     "var(--sev-alert)",
  medium:   "var(--sev-warn)",
  low:      "var(--sev-ok)",
};

export default async function ProposalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "client") redirect("/dashboard");

  const orgFilter = profile.role === "admin" ? {} : { organization_id: profile.organization_id };

  const { data: proposals } = await supabase
    .from("remediation_proposals")
    .select(`
      id, title, summary, script_type, risk_level, status,
      created_at, reviewed_at, executed_at,
      alert_id, device_id, organization_id,
      devices(hostname),
      alerts(title, severity)
    `)
    .match(orgFilter)
    .order("created_at", { ascending: false })
    .limit(100);

  const pending   = (proposals ?? []).filter((p) => p.status === "pending");
  const actioned  = (proposals ?? []).filter((p) => p.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--fg)", margin: 0 }}>
          PROPOSAL ENGINE
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", margin: "4px 0 0", letterSpacing: "0.04em" }}>
          AI-GENERATED REMEDIATION SCRIPTS · REQUIRES AEGIS AUTHORIZATION
          {" "}· {pending.length} PENDING
        </p>
      </div>

      {/* Pending proposals */}
      {pending.length > 0 && (
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" style={{ background: "var(--sev-warn)" }} />
            PENDING AUTHORIZATION — {pending.length}
          </div>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>RISK</th>
                <th>PROPOSAL</th>
                <th>ALERT</th>
                <th>DEVICE</th>
                <th>TYPE</th>
                <th>CREATED</th>
                <th style={{ width: 200 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => {
                const alert = p.alerts as { title: string; severity: string } | null;
                const device = p.devices as { hostname: string } | null;
                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
                        color: RISK_COLOR[p.risk_level] ?? "var(--fg)",
                        fontWeight: 700,
                      }}>
                        {p.risk_level.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{p.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.summary}
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 11 }}>{alert?.title ?? "—"}</td>
                    <td style={{ color: "var(--muted)", fontSize: 11 }}>{device?.hostname ?? "—"}</td>
                    <td>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.06em" }}>
                        {p.script_type?.toUpperCase() ?? "—"}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 10, whiteSpace: "nowrap" }}>
                      {new Date(p.created_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>
                      {profile.role === "admin" && (
                        <ProposalActions proposalId={p.id} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Actioned history */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-info)" }} />
          PROPOSAL HISTORY — {actioned.length}
        </div>
        {actioned.length === 0 ? (
          <div style={{ padding: "1.5rem", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
            No actioned proposals yet.
          </div>
        ) : (
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>STATUS</th>
                <th>RISK</th>
                <th>PROPOSAL</th>
                <th>TYPE</th>
                <th>ACTIONED</th>
              </tr>
            </thead>
            <tbody>
              {actioned.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.08em",
                      color: STATUS_COLOR[p.status] ?? "var(--fg)", fontWeight: 700,
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: RISK_COLOR[p.risk_level] ?? "var(--fg)" }}>
                      {p.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{p.title}</td>
                  <td>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>
                      {p.script_type?.toUpperCase() ?? "—"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 10, whiteSpace: "nowrap" }}>
                    {p.reviewed_at
                      ? new Date(p.reviewed_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
