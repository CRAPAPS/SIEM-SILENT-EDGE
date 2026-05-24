import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Org = {
  id: string;
  name: string;
  slug: string;
  tier: "standard" | "pro" | "enterprise";
  status: string;
  monthly_rate: number | null;
  contract_end: string | null;
};

const TIER_COLORS: Record<string, string> = {
  standard: "var(--muted)",
  pro: "var(--sev-info)",
  enterprise: "var(--sev-warn)",
};

function formatMRR(rate: number | null) {
  if (!rate) return "â€”";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(rate);
}

function contractDaysLeft(end: string | null) {
  if (!end) return null;
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
  return diff;
}

export default async function BusinessPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (!["super_admin","admin"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id,name,slug,tier,status,monthly_rate,contract_end")
    .order("monthly_rate", { ascending: false });

  const { data: alertStats } = await supabase
    .from("alerts")
    .select("organization_id,severity,status")
    .eq("status", "open");

  const orgAlertMap: Record<string, { total: number; critical: number }> = {};
  for (const a of alertStats ?? []) {
    if (!orgAlertMap[a.organization_id]) orgAlertMap[a.organization_id] = { total: 0, critical: 0 };
    orgAlertMap[a.organization_id].total++;
    if (a.severity === "critical") orgAlertMap[a.organization_id].critical++;
  }

  const totalMRR = (orgs ?? []).reduce((sum, o) => sum + (o.monthly_rate ?? 0), 0);
  const activeOrgs = (orgs ?? []).filter((o) => o.status === "active").length;
  const totalAlerts = (alertStats ?? []).length;
  const critAlerts = (alertStats ?? []).filter((a) => a.severity === "critical").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          BUSINESS STUDIO
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          GOD VIEW â€” CLIENT ROSTER & REVENUE
        </p>
      </div>

      {/* Revenue Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)" }}>
        {[
          { label: "MONTHLY RECURRING", value: formatMRR(totalMRR), color: "var(--sev-ok)" },
          { label: "ACTIVE CLIENTS", value: activeOrgs, color: "var(--fg)" },
          { label: "OPEN ALERTS (ALL)", value: totalAlerts, color: totalAlerts > 0 ? "var(--sev-warn)" : "var(--sev-ok)" },
          { label: "CRITICAL OPEN", value: critAlerts, color: critAlerts > 0 ? "var(--sev-crit)" : "var(--sev-ok)" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--bg-2)", padding: "1rem 1.25rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.375rem" }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "26px", fontWeight: 700, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Client Roster */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-ok)" }} />
          CLIENT ROSTER
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "10px" }}>
            {(orgs ?? []).length} ORGANIZATIONS
          </span>
        </div>
        {(orgs ?? []).length === 0 ? (
          <div style={{ padding: "3rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
            NO ORGANIZATIONS ONBOARDED YET<br />
            <span style={{ fontSize: "9px", marginTop: "0.5rem", display: "block", opacity: 0.6 }}>
              Create organizations in the Admin panel to begin onboarding clients.
            </span>
          </div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>CLIENT</th>
                  <th style={{ width: 90 }}>TIER</th>
                  <th style={{ width: 90 }}>STATUS</th>
                  <th style={{ width: 110 }}>MRR</th>
                  <th style={{ width: 100 }}>CONTRACT</th>
                  <th style={{ width: 80 }}>ALERTS</th>
                  <th style={{ width: 80 }}>CRITICAL</th>
                </tr>
              </thead>
              <tbody>
                {(orgs as Org[]).map((org) => {
                  const days = contractDaysLeft(org.contract_end);
                  const stats = orgAlertMap[org.id] ?? { total: 0, critical: 0 };
                  return (
                    <tr
                      key={org.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => window.location.assign(`/admin/orgs/${org.id}`)}
                    >
                      <td>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, color: "var(--fg)" }}>
                          {org.name}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", marginTop: 1 }}>
                          /{org.slug}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: TIER_COLORS[org.tier], letterSpacing: "0.06em" }}>
                          {org.tier.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.06em",
                          color: org.status === "active" ? "var(--sev-ok)" : "var(--muted)" }}>
                          {org.status === "active" ? "â— " : "â—‹ "}{org.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, color: "var(--sev-ok)" }}>
                        {formatMRR(org.monthly_rate)}
                      </td>
                      <td>
                        {days !== null ? (
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px",
                            color: days < 30 ? "var(--sev-warn)" : days < 7 ? "var(--sev-crit)" : "var(--muted)" }}>
                            {days}d left
                          </span>
                        ) : "â€”"}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "11px",
                        color: stats.total > 0 ? "var(--sev-warn)" : "var(--sev-ok)" }}>
                        {stats.total || "0"}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "11px",
                        color: stats.critical > 0 ? "var(--sev-crit)" : "var(--sev-ok)" }}>
                        {stats.critical || "0"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
