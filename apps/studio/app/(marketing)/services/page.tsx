import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | SHEL INFOSEC",
  description: "Full-stack managed security for SMEs. SIEM, SOC, Network Security, and Threat Intelligence.",
};

const SERVICES = [
  {
    id: "siem",
    num: "01",
    title: "SIEM Incident Response",
    tagline: "Ingest from every endpoint, firewall and cloud service. Correlate events in real time.",
    body: "Every alert that enters the Silent Edge platform is normalised to the MITRE ATT&CK framework, enriched with device context, and triaged within minutes. When containment is required, we act — not just advise.",
    capabilities: [
      "Real-time event correlation across endpoints, firewalls, and cloud",
      "MITRE ATT&CK technique mapping and tagging",
      "Automated playbook execution on confirmed threats",
      "Host isolation and rollback via Silent Edge RMM",
      "Full forensic timeline and chain-of-custody reporting",
    ],
    platforms: ["Splunk", "Wazuh", "Elastic / ELK", "Microsoft Sentinel"],
    color: "var(--sev-crit)",
  },
  {
    id: "saas",
    num: "02",
    title: "Security as a Service",
    tagline: "A managed SOC running around the clock.",
    body: "Tier 1 handles noise. Tier 2 investigates anomalies. Tier 3 hunts what evaded detection. You get all three, under one SLA, at a fixed monthly rate — without hiring a single additional headcount.",
    capabilities: [
      "24/7 SOC coverage — no shift gaps, no public holidays off",
      "Tier 1: alert triage and false-positive suppression",
      "Tier 2: deep investigation and incident scoping",
      "Tier 3: proactive threat hunting across your environment",
      "Monthly reporting with executive-ready summaries",
    ],
    platforms: ["Remote delivery", "SLA-backed", "Per-endpoint pricing"],
    color: "var(--sev-alert)",
  },
  {
    id: "network",
    num: "03",
    title: "Network Security",
    tagline: "Networks that assume breach and survive it.",
    body: "We design, segment, and harden your network infrastructure against lateral movement. Every rule has a reason. Every firewall is tuned to your environment — not copied from a template.",
    capabilities: [
      "Architecture review and gap analysis",
      "Zero-trust network design and implementation",
      "Firewall rule audit and tuning",
      "Network Detection & Response (NDR) deployment",
      "IDS/IPS configuration and signature management",
      "Micro-segmentation for critical asset isolation",
    ],
    platforms: ["Zero Trust", "NDR", "IDS/IPS", "Firewall"],
    color: "var(--sev-warn)",
  },
  {
    id: "intel",
    num: "04",
    title: "Threat Intelligence",
    tagline: "Your team sees what is coming — not what already hit.",
    body: "Curated IOC feeds, dark-web monitoring, and adversary profiling — all mapped to MITRE ATT&CK so your team knows exactly what technique is being used against your industry right now.",
    capabilities: [
      "Curated threat intelligence feeds (updated every 4 hours)",
      "Dark web monitoring for credential exposure",
      "MITRE ATT&CK adversary profiling per sector",
      "IOC enrichment injected directly into your SIEM",
      "Weekly threat briefings tailored to your environment",
      "ML-augmented triage to cut alert fatigue by 80%",
    ],
    platforms: ["MITRE ATT&CK", "Dark Web", "IOC Feeds", "ML Triage"],
    color: "var(--accent)",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Header */}
      <section style={{ padding: "5rem 2rem 3rem", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "var(--accent)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          [ SERVICES ]
        </div>
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "var(--fg)",
            margin: "0 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Full-stack managed security
          <br />
          <span style={{ color: "var(--accent)" }}>for SMEs.</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            color: "var(--muted)",
            lineHeight: 1.8,
            maxWidth: 560,
            margin: 0,
          }}
        >
          Pick a service — or the bundle. Every engagement is operator-run,
          SLA-backed, and priced for businesses that need enterprise protection
          without the enterprise price tag.
        </p>
      </section>

      {/* Service blocks */}
      <section style={{ padding: "0 2rem 6rem", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {SERVICES.map((svc) => (
            <div
              key={svc.id}
              id={svc.id}
              className="terminal-card"
              style={{ borderLeft: `2px solid ${svc.color}` }}
            >
              <div className="terminal-card-header">
                <span className="dot" />
                <span style={{ color: svc.color }}>{svc.num}</span>
                <span style={{ marginLeft: 8 }}>{svc.title}</span>
              </div>
              <div className="terminal-card-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "2rem",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--fg)",
                        margin: "0 0 0.75rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {svc.tagline}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--muted)",
                        lineHeight: 1.9,
                        margin: "0 0 1.25rem",
                      }}
                    >
                      {svc.body}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {svc.platforms.map((p) => (
                        <span
                          key={p}
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "9px",
                            letterSpacing: "0.08em",
                            color: svc.color,
                            background: `${svc.color}14`,
                            border: `1px solid ${svc.color}33`,
                            borderRadius: "2px",
                            padding: "2px 7px",
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        marginBottom: "0.75rem",
                      }}
                    >
                      Capabilities
                    </div>
                    {svc.capabilities.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          color: "rgba(244,246,245,0.6)",
                          display: "flex",
                          gap: "0.75rem",
                          marginBottom: "0.5rem",
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: svc.color, flexShrink: 0 }}>◦</span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: "4rem",
            padding: "2.5rem",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--fg)",
                marginBottom: "0.25rem",
              }}
            >
              Not sure which service fits?
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                color: "var(--muted)",
              }}
            >
              Book a 30-minute threat assessment — no commitment, no sales pitch.
            </div>
          </div>
          <Link href="/contact" className="btn btn-accent">
            Talk to an Operator ◢
          </Link>
        </div>
      </section>
    </>
  );
}
