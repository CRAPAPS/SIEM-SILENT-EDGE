"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function SettingsForm({ displayName }: { displayName: string }) {
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function save() {
    setSaving(true);
    setMsg("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg("Not authenticated"); setSaving(false); return; }
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    setMsg(error ? `ERROR: ${error.message}` : "SAVED");
    setSaving(false);
  }

  return (
    <div className="terminal-card">
      <div className="terminal-card-header">
        <span className="dot" />
        PROFILE
      </div>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label style={{ fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em", color: "var(--muted)", display: "block", marginBottom: 4 }}>
            DISPLAY NAME
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              fontFamily: "var(--mono)", fontSize: "11px", color: "var(--fg)",
              background: "var(--bg-3)", border: "1px solid var(--border)",
              padding: "6px 10px", width: "100%", outline: "none", borderRadius: "2px",
            }}
            placeholder="Operator handle"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
              padding: "7px 18px", border: "1px solid var(--accent)",
              color: saving ? "var(--muted)" : "var(--accent)", background: "transparent",
              cursor: saving ? "not-allowed" : "pointer", borderRadius: "2px",
            }}
          >
            {saving ? "SAVING..." : "◢ SAVE PROFILE"}
          </button>
          {msg && (
            <span style={{ fontFamily: "var(--mono)", fontSize: "9px",
              color: msg.startsWith("ERROR") ? "var(--sev-crit)" : "var(--sev-ok)" }}>
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
