"use client";

import Link from "next/link";

const STATS = [
  ["2021", "FOUNDED"],
  ["40+",  "CLIENTS"],
  ["4",    "TIME ZONES"],
];

export default function OurStoryPage() {
  return (
    <>
      <section className="mkt-page-hero mkt-pad" style={{ background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 24 }}>
            ~ / our-story
          </div>
          <h1 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(36px, 7vw, 120px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 0.9,
            textTransform: "uppercase",
          }}>
            Born from a gap.<br />
            <span className="glow-text">Built for the mid-market.</span>
          </h1>
        </div>
      </section>

      <section className="mkt-pad" style={{ paddingTop: 64, paddingBottom: 80, background: "var(--bg)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", fontSize: "clamp(15px, 2vw, 19px)", lineHeight: 1.7, color: "rgba(244,246,245,0.8)" }}>
          <p>
            SHEL infosec did not start in a boardroom. It started with a frustration: small and medium
            businesses were being priced out of real cybersecurity, and told to make do with antivirus and hope.
          </p>
          <p>
            We built SHEL to close that gap. By running a remote SOC with analysts who know what they are
            looking at — and pairing it with a hardened agent stack (Silent Edge) that does most of the rote
            work — we deliver enterprise-grade posture for a fraction of what big consultancies charge.
          </p>
          <p>
            Today, we operate from Cape Town, watching networks in four time zones, working with partners
            like Thiink VP and ThiinkTANK to extend our reach.
          </p>

          {/* Stats */}
          <div className="mkt-3col-feat" style={{ marginTop: 64 }}>
            {STATS.map(([v, k]) => (
              <div key={k} style={{ background: "var(--bg)", padding: "clamp(28px, 4vw, 40px) clamp(20px, 3vw, 28px)" }}>
                <div className="glow-text" style={{
                  fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 900,
                  letterSpacing: -2, lineHeight: 1,
                }}>{v}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "1.5px", marginTop: 10 }}>{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mkt-section mkt-pad" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 24 }}>
            # values
          </div>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(28px, 4vw, 64px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 48px", lineHeight: 0.9, textTransform: "uppercase",
          }}>
            Operator principles.
          </h2>
          <div className="mkt-why-grid">
            {[
              { t: "Ownership", d: "Every alert, every incident, every remediation — owned from start to finish. No handoffs." },
              { t: "Transparency", d: "You see what we see. Live dashboards, real metrics, no filtered reporting." },
              { t: "Integrity", d: "We tell you what you need to hear, not what sounds good. Assessments are honest." },
              { t: "Precision", d: "Noise reduction is a discipline. We tune, threshold, and maintain — constantly." },
            ].map((w, i) => (
              <div key={w.t} style={{ background: "var(--bg)", padding: "clamp(24px, 3vw, 40px) clamp(20px, 3vw, 36px)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 16 }}>0{i + 1} /</div>
                <div style={{ fontSize: "clamp(18px, 2vw, 26px)", fontWeight: 700, letterSpacing: -0.5, marginBottom: 12, textTransform: "uppercase" }}>{w.t}</div>
                <div style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "var(--muted)", lineHeight: 1.65 }}>{w.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-pad" style={{ textAlign: "center", borderTop: "1px solid var(--border)", background: "var(--bg)", position: "relative" }}>
        <div className="accent-bg-radial" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(28px, 4vw, 64px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 32px", textTransform: "uppercase",
          }}>
            Want to work<br /><span className="glow-text">with us?</span>
          </h2>
          <Link href="/contact" style={{
            fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "1.5px", fontWeight: 700,
            background: "var(--accent)", color: "#001a10",
            padding: "16px 28px", textDecoration: "none", display: "inline-block",
            boxShadow: "0 0 32px var(--a55)",
          }}>
            ./get-in-touch →
          </Link>
        </div>
      </section>
    </>
  );
}
