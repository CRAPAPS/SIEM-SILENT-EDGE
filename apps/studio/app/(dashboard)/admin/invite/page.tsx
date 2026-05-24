import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function InvitePage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").single();
  if (!["super_admin","admin"].includes(profile?.role ?? "")) redirect("/dashboard");

  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 700, color: "var(--fg)", margin: 0 }}>
          INVITE ANALYST
        </h1>
        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
          SEND ONBOARDING INVITE
        </p>
      </div>
      <div className="terminal-card">
        <div className="terminal-card-header"><span className="dot" />SUPABASE INVITE</div>
        <div style={{ padding: "1.25rem", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", lineHeight: 1.8 }}>
          To invite an analyst, use the Supabase dashboard Authentication panel:<br /><br />
          <span style={{ color: "var(--accent)" }}>Authentication → Users → Invite User</span><br /><br />
          After they register, set their role to <span style={{ color: "var(--sev-info)" }}>analyst</span> in the
          <span style={{ color: "var(--accent)" }}> profiles</span> table and assign an
          <span style={{ color: "var(--accent)" }}> organization_id</span>.
        </div>
      </div>
    </div>
  );
}
