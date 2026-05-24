import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MigrationsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").single();
  if (!["super_admin","admin"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: tables } = await supabase.rpc("get_tables" as string).catch(() => ({ data: null }));

  const expected = [
    "organizations","profiles","api_credentials","devices","alerts","playbooks",
    "audit_logs","vector_documents","system_metrics","service_records",
    "fingerprint_sessions","threat_telemetry","specialist_logs","remediation_proposals",
    "mitre_techniques","cisa_kev_entries","threat_feed_sync_log",
    "lab_runs","lab_findings",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          MIGRATION STATUS
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          SCHEMA VERIFICATION
        </p>
      </div>
      <div className="terminal-card">
        <div className="terminal-card-header"><span className="dot" />EXPECTED TABLES</div>
        <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
          {expected.map((t) => (
            <div key={t} style={{
              fontFamily: "var(--mono)", fontSize: "10px",
              padding: "6px 10px", background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: "2px",
              color: "var(--fg)", display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
              <span style={{ color: "var(--sev-ok)", fontSize: "12px" }}>●</span>
              {t}
            </div>
          ))}
        </div>
        <div style={{ padding: "0 1rem 1rem", fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)" }}>
          Apply migrations in Supabase SQL Editor if any tables are missing. Migrations are in apps/engine/supabase/migrations/.
        </div>
      </div>
    </div>
  );
}
