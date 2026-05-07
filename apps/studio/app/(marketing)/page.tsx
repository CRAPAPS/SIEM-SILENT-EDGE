import Link from "next/link";

const METRICS = [
  { label: "SOC STATUS", value: "OPERATIONAL", color: "var(--sev-ok)" },
  { label: "UPTIME", value: "99.998%", color: "var(--fg)" },
  { label: "MTTR", value: "00:04:12", color: "var(--fg)" },
  { label: "EVENTS / DAY", value: "14.2M", color: "var(--fg)" },
  { label: "ACTIVE CLIENTS", value: "40+", color: "var(--fg)" },
  { label: "OPEN BREACHES", value: "0", color: "var(--sev-ok)" },
];

const DISCIPLINES = [
  {
    id: "01",
    title: "SIEM Incident Response",
    description:
      "Ingest from every endpoint, firewall and cloud service. Correlate events in real time. Containment, forensics, and remediation — handled.",
    tags: ["Splunk", "Wazuh", "Elastic", "Sentinel"],
    href: "/services#siem",
  },
  {
    id: "02",
    title: "Security as a Service",
    description:
      "A managed SOC running around the clock. Tier 1 triage, Tier 2 investigation, Tier 3 hunt — remote, affordable, SLA-backed.",
    tags: ["24/7 Coverage", "Tier 1–3", "SLA-Backed"],
    href: "/services#saas",
  },
  {
    id: "03",
    title: "Network Security",
    description:
      "Architecture review, segmentation, firewall tuning, zero-trust implementation. Networks that assume breach and survive it.",
    tags: ["Zero Trust", "NDR", "IDS/IPS", "Segmentation"],
    href: "/services#network",
  },
  {
    id: "04",
    title: "Threat Intelligence",
    description:
      "Curated feeds and dark-web monitoring with MITRE ATT&CK mapping. Your team sees what is coming — not what already hit.",
    tags: ["MITRE ATT&CK", "Dark Web", "IOC Feeds", "ML Triage"],
    href: "/services#intel",
  },
];

const WHY = [
  {
    title: "Holistic Coverage",
    body: "Network, endpoint, identity, and cloud — all disciplines under one team. No gaps, no handoffs to third parties.",
  },
  {
    title: "SME Pricing",
    body: "Enterprise-grade operations without enterprise costs. Fixed monthly rate, no surprise overages.",
  },
  {
    title: "Partnered Operator",
    body: "Thiink VP and ThiinkTANK alliances give you access to a global threat intelligence network.",
  },
  {
    title: "ML-Augmented Detection",
    body: "Machine learning reduces alert noise by 80%. Your team responds to what matters, not what the parser missed.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "6rem 2rem 4rem",
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* SOC metrics bar */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "3rem",
          }}
        >
          {METRICS.map((m) => (
            <div key={m.label}>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "0.25rem",
                  textTransform: "uppercase",
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: m.color,
                  letterSpacing: "0.04em",
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "clamp(2rem, 6vw, 4.5rem)",
            fontWeight: 800,
            color: "var(--fg)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 1.5rem",
            maxWidth: 800,
          }}
        >
          Fortify your
          <br />
          <span style={{ color: "var(--accent)" }}>digital empire.</span>
        </h1>

        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "14px",
            color: "var(--muted)",
            lineHeight: 1.8,
            maxWidth: 560,
            margin: "0 0 2.5rem",
          }}
        >
          A 24/7 SOC for teams that cannot afford to miss the alert.
          <br />
          MITRE ATT&CK mapped. ML-augmented. Operator-run.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/contact" className="btn btn-accent">
            Get Protection ◢
          </Link>
          <Link
            href="/services"
            className="btn"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--fg)",
            }}
          >
            View Services →
          </Link>
        </div>

        {/* Terminal decoration */}
        <div
          style={{
            position: "absolute",
            right: "2rem",
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "rgba(244,246,245,0.06)",
            lineHeight: 1.8,
            userSelect: "none",
            display: "none",
          }}
          className="hero-terminal"
        >
          {`> soc.init --mode=sentinel
> loading threat_feeds... OK
> rls.enforce --strict
> analyst.connect --tier=3
> monitor.start --24x7
> status: OPERATIONAL ●`}
        </div>
      </section>

      {/* ── Four Disciplines ─────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem" }}>
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
              [ CAPABILITIES ]
            </div>
            <h2
              style={{
                fontFamily: "var(--mono)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              Four disciplines. One team.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {DISCIPLINES.map((d) => (
              <Link
                key={d.id}
                href={d.href}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="terminal-card"
                  style={{ height: "100%", cursor: "pointer" }}
                >
                  <div className="terminal-card-header">
                    <span className="dot" />
                    <span style={{ color: "var(--accent)" }}>{d.id}</span>
                    <span style={{ marginLeft: 8 }}>{d.title}</span>
                  </div>
                  <div className="terminal-card-body">
                    <p
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--muted)",
                        lineHeight: 1.8,
                        margin: "0 0 1rem",
                      }}
                    >
                      {d.description}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {d.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: "9px",
                            letterSpacing: "0.08em",
                            color: "var(--accent)",
                            background: "rgba(61,126,255,0.08)",
                            border: "1px solid rgba(61,126,255,0.2)",
                            borderRadius: "2px",
                            padding: "2px 6px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Operators. Not resellers. ─────────────────────────────────── */}
      <section style={{ padding: "5rem 2rem" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
          }}
        >
          <div>
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
              [ PHILOSOPHY ]
            </div>
            <h2
              style={{
                fontFamily: "var(--mono)",
                fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1.15,
                margin: "0 0 1.5rem",
              }}
            >
              Operators.
              <br />
              Not resellers.
            </h2>
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                color: "var(--muted)",
                lineHeight: 1.9,
                margin: "0 0 2rem",
              }}
            >
              Every analyst on the SHEL INFOSEC team has operated in the field.
              We build the tools we use, run the playbooks we write, and take
              ownership of every incident from detection to resolution.
              <br />
              <br />
              No reselling. No white-labelling. Direct operator accountability
              — 24 hours a day.
            </p>
            <Link href="/our-story" className="btn" style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--fg)" }}>
              Our Story →
            </Link>
          </div>

          {/* Terminal block */}
          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>analyst@soc-01 ~ % incident.log</span>
            </div>
            <div className="terminal-card-body" style={{ lineHeight: 2 }}>
              {[
                { t: "00:00:00", msg: "Alert ingested · T1059.001 · CRITICAL", c: "var(--sev-crit)" },
                { t: "00:00:14", msg: "Device isolated · WIN-SRV-04", c: "var(--sev-warn)" },
                { t: "00:01:03", msg: "Forensic snapshot taken", c: "var(--muted)" },
                { t: "00:02:41", msg: "Root cause identified · lateral movement", c: "var(--muted)" },
                { t: "00:04:12", msg: "Containment confirmed · threat neutralised", c: "var(--sev-ok)" },
              ].map((line) => (
                <div
                  key={line.t}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    display: "flex",
                    gap: "1rem",
                  }}
                >
                  <span style={{ color: "rgba(244,246,245,0.25)", flexShrink: 0 }}>{line.t}</span>
                  <span style={{ color: line.c }}>{line.msg}</span>
                </div>
              ))}
              <div style={{ marginTop: "0.5rem", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>
                MTTR: <span style={{ color: "var(--sev-ok)" }}>00:04:12</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: "3rem", textAlign: "center" }}>
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
              [ WHY SHEL INFOSEC ]
            </div>
            <h2
              style={{
                fontFamily: "var(--mono)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              Watch the dark, so you can sleep.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {WHY.map((item, i) => (
              <div
                key={item.title}
                style={{
                  padding: "1.5rem",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    color: "var(--accent)",
                    marginBottom: "0.5rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--fg)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {item.title}
                </div>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "11px",
                    color: "var(--muted)",
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "var(--accent)",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            [ READY TO DEPLOY ]
          </div>
          <h2
            style={{
              fontFamily: "var(--mono)",
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--fg)",
              margin: "0 0 1.25rem",
              lineHeight: 1.2,
            }}
          >
            Your SOC goes live
            <br />
            <span style={{ color: "var(--accent)" }}>within 48 hours.</span>
          </h2>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--muted)",
              lineHeight: 1.8,
              margin: "0 0 2rem",
            }}
          >
            No lengthy onboarding. No 12-month lock-in. One call, one contract,
            one team watching your perimeter tonight.
          </p>
          <Link href="/contact" className="btn btn-accent" style={{ fontSize: "13px", padding: "0.75rem 2rem" }}>
            Get Protection ◢
          </Link>
        </div>
      </section>
    </>
  );
}
