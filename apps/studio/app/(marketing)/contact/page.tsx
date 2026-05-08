"use client";

import { useState } from "react";

const SERVICES = ["SIEM Incident Response", "Security as a Service", "Network Security", "Threat Intelligence", "Silent Edge RMM", "General Enquiry"];

export default function ContactPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const toggle = (s: string) =>
    setSelected((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);

  const inputStyle: React.CSSProperties = {
    background: "var(--bg)", border: "1px solid var(--border)",
    color: "var(--fg)", padding: "14px 16px",
    fontFamily: "var(--mono)", fontSize: 13, width: "100%",
    outline: "none", borderRadius: 2,
  };

  return (
    <div className="mkt-2col-page">
      {/* Left — headline + contact details */}
      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 24 }}>
          ~ / contact
        </div>
        <h1 style={{
          fontFamily: "var(--sans)", fontSize: "clamp(36px, 6vw, 96px)",
          fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 0.9, textTransform: "uppercase",
        }}>
          Let&apos;s talk<br />about your<br />
          <span style={{ color: "var(--accent)", textShadow: "0 0 32px var(--a55)" }}>posture.</span>
        </h1>
        <p style={{ fontSize: "clamp(14px, 1.8vw, 17px)", color: "var(--muted)", lineHeight: 1.65, marginTop: 28, maxWidth: 480 }}>
          30-minute intro call. No slides, no pitch. We look at what you have and tell you — honestly — where the gaps are.
        </p>

        <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 8 }}>EMAIL</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "clamp(12px, 1.5vw, 14px)", wordBreak: "break-all" }}>accounts@shelinfosec.com</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 8 }}>PHONE</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "clamp(12px, 1.5vw, 14px)" }}>+27 77 416 7672</div>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 8 }}>ADDRESS</div>
            <div style={{ fontSize: "clamp(13px, 1.5vw, 14px)", lineHeight: 1.6 }}>
              80 Chapman Ave, Mountainside<br />Cape Town, South Africa 7151
            </div>
          </div>
        </div>
      </div>

      {/* Right — intake form */}
      <div style={{ background: "var(--bg-2)", padding: "clamp(24px, 3vw, 36px)", border: "1px solid var(--border)", borderRadius: 4 }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 20 }}>◉ TRANSMITTED</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Message received.</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 12 }}>We&apos;ll be in touch within one business day.</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 24 }}># intake.form</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 6, display: "block" }}>NAME *</label>
                <input style={inputStyle} placeholder="Your name" />
              </div>
              <div>
                <label style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 6, display: "block" }}>COMPANY</label>
                <input style={inputStyle} placeholder="Company name" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 6, display: "block" }}>EMAIL *</label>
              <input type="email" style={inputStyle} placeholder="you@company.com" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 8, display: "block" }}>INTEREST</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SERVICES.map((s) => (
                  <button key={s} onClick={() => toggle(s)} style={{
                    fontFamily: "var(--mono)", fontSize: "clamp(9px, 1.2vw, 11px)", cursor: "pointer",
                    padding: "7px 12px",
                    background: selected.includes(s) ? "var(--accent)" : "transparent",
                    color: selected.includes(s) ? "#001a10" : "var(--fg)",
                    border: selected.includes(s) ? "1px solid var(--accent)" : "1px solid var(--border)",
                    transition: "all 150ms",
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px", marginBottom: 6, display: "block" }}>MESSAGE</label>
              <textarea rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--sans)", fontSize: 14 }} placeholder="Tell us what you're working with..." />
            </div>

            <button onClick={() => setSent(true)} style={{
              fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "1.5px",
              background: "var(--accent)", color: "#001a10", border: "none",
              padding: "14px 22px", fontWeight: 700, cursor: "pointer", width: "100%",
              boxShadow: "0 0 24px var(--a44)",
            }}>
              ./send-intake →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
