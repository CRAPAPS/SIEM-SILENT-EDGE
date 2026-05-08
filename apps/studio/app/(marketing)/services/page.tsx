"use client";

import Link from "next/link";

const SERVICES = [
  {
    id: "siem", code: "01", title: "SIEM Incident Response",
    tags: ["Splunk", "Wazuh", "Elastic", "Sentinel"],
    body: "Ingest from every endpoint, firewall and cloud service. Correlate events in real time. When something lights up, our analysts move — containment, forensics, remediation — before the blast radius grows.",
  },
  {
    id: "saas", code: "02", title: "Security as a Service",
    tags: ["24/7 SOC", "MDR", "Playbooks", "SLA-backed"],
    body: "A managed Security Operations Center running around the clock. Tier 1 triage, Tier 2 investigation, Tier 3 hunt — remote, affordable, and staffed by analysts who have done this for a living.",
  },
  {
    id: "network", code: "03", title: "Network Security",
    tags: ["Zero Trust", "NDR", "Segmentation", "IDS/IPS"],
    body: "Architecture review, segmentation, firewall tuning, zero-trust rollout. We design networks that assume breach and survive it — with telemetry dense enough to see the attacker move.",
  },
  {
    id: "threat", code: "04", title: "Threat Intelligence",
    tags: ["MITRE ATT&CK", "IOC feeds", "Dark web", "ML triage"],
    body: "Curated feeds, dark-web monitoring, TTP mapping to MITRE ATT&CK. Your team sees what is coming — not what already hit — and the playbook to respond is in hand.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="mkt-page-hero mkt-pad" style={{ background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 24 }}>
            ~ / services
          </div>
          <h1 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(40px, 8vw, 120px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 0.9, textTransform: "uppercase",
          }}>
            Every discipline.<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 40px var(--a55)" }}>One team to call.</span>
          </h1>
          <p style={{
            fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(244,246,245,0.7)",
            lineHeight: 1.55, maxWidth: 640, marginTop: 36, marginBottom: 0,
          }}>
            Full-stack managed security for SMEs. Pick a service — or the bundle.
            Either way: one team, one SLA, one invoice.
          </p>
        </div>
      </section>

      <section className="mkt-pad" style={{ paddingTop: 80, paddingBottom: 80, background: "var(--bg)" }}>
        <div className="mkt-max">
          <div className="mkt-2col-svc">
            {SERVICES.map((s) => (
              <div key={s.id} id={s.id} style={{ background: "var(--bg-2)", padding: "clamp(24px, 4vw, 48px) clamp(20px, 3vw, 40px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: "clamp(28px, 3vw, 40px)",
                    fontWeight: 900, color: "var(--accent)", letterSpacing: -1,
                    textShadow: "0 0 20px var(--a44)",
                  }}>{s.code}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "1.5px" }}>ACTIVE</div>
                </div>
                <h2 style={{
                  fontSize: "clamp(18px, 2.5vw, 32px)", fontWeight: 900,
                  letterSpacing: -0.8, margin: "0 0 14px", textTransform: "uppercase", lineHeight: 1.05,
                }}>{s.title}</h2>
                <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "rgba(244,246,245,0.75)", lineHeight: 1.65, marginBottom: 24 }}>
                  {s.body}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                  {s.tags.map((t) => (
                    <span key={t} style={{
                      fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
                      border: "1px solid var(--border)", padding: "4px 8px", letterSpacing: "1.5px",
                    }}>
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
                <Link href="/contact" style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "1.5px", textDecoration: "none" }}>
                  ./enquire --svc={s.id} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section mkt-pad" style={{ textAlign: "center", borderTop: "1px solid var(--border)", background: "var(--bg)", position: "relative" }}>
        <div className="accent-bg-radial" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(32px, 5vw, 80px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 32px", lineHeight: 0.9, textTransform: "uppercase",
          }}>
            Ready when<br /><span style={{ color: "var(--accent)" }}>you are.</span>
          </h2>
          <Link href="/contact" style={{
            fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "1.5px", fontWeight: 700,
            background: "var(--accent)", color: "#001a10",
            padding: "16px 28px", textDecoration: "none", display: "inline-block",
            boxShadow: "0 0 32px var(--a55)",
          }}>
            ./get-protection ◢
          </Link>
        </div>
      </section>
    </>
  );
}
