"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export function NewOrgForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", tier: "standard", monthly_rate: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    const { error } = await supabase.from("organizations").insert({
      name: form.name,
      slug: form.slug || slugify(form.name),
      tier: form.tier,
      status: "active",
      monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
    });
    if (error) { setErr(error.message); setSaving(false); return; }
    router.push("/admin");
  }

  const inputStyle = {
    fontFamily: "var(--mono)", fontSize: "11px", color: "var(--fg)",
    background: "var(--bg-3)", border: "1px solid var(--border)",
    padding: "7px 10px", width: "100%", outline: "none", borderRadius: "2px",
  };
  const labelStyle = {
    fontFamily: "var(--mono)", fontSize: "8px", letterSpacing: "0.1em",
    color: "var(--muted)", display: "block", marginBottom: 4,
  };

  return (
    <form onSubmit={submit} className="terminal-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="terminal-card-header"><span className="dot" />CLIENT DETAILS</div>
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <div>
          <label style={labelStyle}>ORGANIZATION NAME *</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="Acme Security Ltd" />
        </div>
        <div>
          <label style={labelStyle}>SLUG (URL-SAFE)</label>
          <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} style={inputStyle} placeholder={slugify(form.name) || "acme-security"} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <div>
            <label style={labelStyle}>SERVICE TIER *</label>
            <select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} style={{...inputStyle, cursor: "pointer"}}>
              <option value="standard">STANDARD</option>
              <option value="pro">PRO</option>
              <option value="enterprise">ENTERPRISE</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>MONTHLY RATE (£)</label>
            <input type="number" min="0" step="0.01" value={form.monthly_rate} onChange={e => setForm({...form, monthly_rate: e.target.value})} style={inputStyle} placeholder="1500" />
          </div>
        </div>
        {err && <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--sev-crit)" }}>ERROR: {err}</div>}
        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
          <button type="submit" disabled={saving} style={{
            fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
            padding: "8px 20px", border: "1px solid var(--accent)",
            color: saving ? "var(--muted)" : "var(--accent)", background: "transparent",
            cursor: saving ? "not-allowed" : "pointer", borderRadius: "2px",
          }}>
            {saving ? "CREATING..." : "◢ CREATE ORGANIZATION"}
          </button>
          <a href="/admin" style={{
            fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em",
            padding: "8px 16px", border: "1px solid var(--border)",
            color: "var(--muted)", textDecoration: "none", borderRadius: "2px",
            display: "inline-flex", alignItems: "center",
          }}>
            CANCEL
          </a>
        </div>
      </div>
    </form>
  );
}
