"use client";

import Link from "next/link";

const FEATURES = [
  { t: "Unified agent",      d: "One install across Windows, macOS, Linux. No separate tools for patch, AV, or RMM." },
  { t: "Auto-remediation",   d: "Playbooks that isolate, roll back, and re-image without waking up the analyst on call." },
  { t: "Transparent pricing",d: "Per-endpoint, monthly. No per-feature upsells, no surprise seats." },
];

export default function SilentEdgePage() {
  return (
    <>
      {/* Hero */}
      <section className="mkt-page-hero mkt-pad" style={{ background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            border: "1px solid var(--accent)", padding: "6px 12px",
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)",
            letterSpacing: 2, marginBottom: 32,
          }}>
            ◢ FLAGSHIP PRODUCT
          </div>
          <h1 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(56px, 12vw, 180px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 0.88, textTransform: "uppercase",
          }}>
            Silent<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 40px var(--a88)" }}>Edge.</span>
          </h1>
          <p style={{
            fontSize: "clamp(15px, 2vw, 20px)", color: "rgba(244,246,245,0.7)",
            lineHeight: 1.55, maxWidth: 620, marginTop: 36,
          }}>
            Our remote monitoring &amp; management stack. One agent, every endpoint. Real-time
            telemetry into the SOC, automated playbooks, zero-touch patching.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
            <Link href="/store" style={{
              fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "1.5px", fontWeight: 700,
              background: "var(--accent)", color: "#001a10",
              padding: "16px 24px", textDecoration: "none",
              boxShadow: "0 0 32px var(--a55)",
            }}>open store ◢</Link>
            <Link href="/contact" style={{
              fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "1.5px", fontWeight: 700,
              background: "transparent", color: "var(--fg)",
              border: "1px solid var(--border)", padding: "16px 24px", textDecoration: "none",
            }}>see live demo</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mkt-pad" style={{ paddingTop: 4, paddingBottom: 4, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="mkt-3col-feat mkt-max">
          {FEATURES.map((f, i) => (
            <div key={f.t} style={{ background: "var(--bg)", padding: "clamp(28px, 4vw, 48px) clamp(20px, 3vw, 36px)", minHeight: 200 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 20 }}>0{i + 1} / FEATURE</div>
              <div style={{ fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 700, letterSpacing: -0.6, marginBottom: 14, textTransform: "uppercase" }}>{f.t}</div>
              <div style={{ fontSize: "clamp(13px, 1.5vw, 14px)", color: "var(--muted)", lineHeight: 1.65 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live stats */}
      <section className="mkt-section mkt-pad" style={{ background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 32 }}>
            # live.stats
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 2, background: "var(--border)" }}>
            {[
              { v: "40+",   k: "Clients protected" },
              { v: "99.9%", k: "Agent uptime" },
              { v: "< 60s", k: "Alert to analyst" },
              { v: "24/7",  k: "SOC coverage" },
            ].map((s) => (
              <div key={s.k} style={{ background: "var(--bg)", padding: "clamp(24px, 3vw, 40px) clamp(20px, 3vw, 32px)" }}>
                <div style={{
                  fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1.5,
                  color: "var(--accent)", lineHeight: 1, textShadow: "0 0 20px var(--a44)",
                }}>{s.v}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "1.5px", marginTop: 10 }}>{s.k.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mkt-section mkt-pad" style={{ textAlign: "center", borderTop: "1px solid var(--border)", background: "var(--bg)", position: "relative" }}>
        <div className="accent-bg-radial" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(32px, 5vw, 80px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 32px", lineHeight: 0.9, textTransform: "uppercase",
          }}>
            One agent.<br /><span style={{ color: "var(--accent)" }}>Total visibility.</span>
          </h2>
          <Link href="/store" style={{
            fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "1.5px", fontWeight: 700,
            background: "var(--accent)", color: "#001a10",
            padding: "16px 28px", textDecoration: "none", display: "inline-block",
            boxShadow: "0 0 32px var(--a55)",
          }}>
            ./open-store ◢
          </Link>
        </div>
      </section>
    </>
  );
}
