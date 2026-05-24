import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").single();
  if (!["super_admin","admin"].includes(profile?.role ?? "")) redirect("/dashboard");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id,actor_email,action,target_type,target_id,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          AUDIT LOG
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          IMMUTABLE OPERATOR ACTIVITY — LAST 200 ENTRIES
        </p>
      </div>

      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-warn)" }} />
          ALL EVENTS
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "9px" }}>
            {(logs ?? []).length} RECORDS
          </span>
        </div>
        {(logs ?? []).length === 0 ? (
          <div style={{ padding: "3rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
            NO AUDIT EVENTS YET
          </div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: 150 }}>TIMESTAMP</th>
                  <th style={{ width: 180 }}>ACTOR</th>
                  <th>ACTION</th>
                  <th style={{ width: 120 }}>TARGET TYPE</th>
                  <th style={{ width: 120 }}>TARGET ID</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log) => {
                  const d = new Date(log.created_at);
                  const fmt = d.toLocaleString("en-GB", { hour12: false, day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", whiteSpace: "nowrap" }}>{fmt}</td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--fg)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.actor_email ?? "—"}
                      </td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.04em" }}>{log.action}</td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)" }}>{log.target_type ?? "—"}</td>
                      <td style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.target_id ?? "—"}
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
