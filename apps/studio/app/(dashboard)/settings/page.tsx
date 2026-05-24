import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "AEGIS COMMAND",
  admin: "GOD VIEW",
  analyst: "ANALYST",
  client: "CLIENT",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,display_name,role,organization_id,created_at")
    .single();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 640 }}>
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          OPERATOR SETTINGS
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          {ROLE_LABELS[profile?.role ?? ""] ?? profile?.role?.toUpperCase() ?? "—"} CLEARANCE
        </p>
      </div>

      {/* Identity */}
      <div className="terminal-card">
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-ok)" }} />
          IDENTITY
        </div>
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            ["EMAIL", user?.email ?? "—"],
            ["ROLE", ROLE_LABELS[profile?.role ?? ""] ?? profile?.role?.toUpperCase() ?? "—"],
            ["USER ID", user?.id ?? "—"],
            ["MEMBER SINCE", profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB") : "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", minWidth: 120 }}>
                {label}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--fg)", wordBreak: "break-all" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Display Name + Password */}
      <SettingsForm displayName={profile?.display_name ?? ""} />

      {/* Danger zone */}
      <div className="terminal-card" style={{ borderColor: "rgba(var(--sev-crit-rgb, 255,59,48), 0.3)" }}>
        <div className="terminal-card-header">
          <span className="dot" style={{ background: "var(--sev-crit)" }} />
          <span style={{ color: "var(--sev-crit)" }}>DANGER ZONE</span>
        </div>
        <div style={{ padding: "1rem" }}>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              style={{
                fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                padding: "8px 20px", border: "1px solid var(--sev-crit)",
                color: "var(--sev-crit)", background: "transparent", cursor: "pointer", borderRadius: "2px",
              }}
            >
              ◢ SIGN OUT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
