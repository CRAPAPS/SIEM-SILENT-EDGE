import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story | SHEL INFOSEC",
  description: "Operators. Not resellers. Based in Cape Town, operating globally.",
};

const VALUES = [
  {
    title: "Operator accountability",
    body: "Every analyst takes personal ownership of every incident they handle. No ticket queues, no handoff culture. You speak to the person watching your network.",
  },
  {
    title: "Transparency by default",
    body: "Monthly reporting shows you exactly what happened, what we did, and what the threat landscape looks like for your sector. No vague PDFs.",
  },
  {
    title: "No vendor lock-in",
    body: "We work with your existing stack. If we recommend a tool, it is because it is the right tool — not because we earn a margin on the licence.",
  },
  {
    title: "SME first",
    body: "We built our pricing, our tooling, and our processes specifically for organisations that are too big to ignore security and too smart to overpay for it.",
  },
];

const CERTIFICATIONS = [
  "CompTIA CySA+",
  "CompTIA Security+",
  "MITRE ATT&CK Practitioner",
  "ISO/IEC 27001 Awareness",
  "SABSA Foundation",
  "Zero Trust Architecture",
];

export default function OurStoryPage() {
  return (
    <>
      {/* Header */}
      <section style={{ padding: "5rem 2rem 4rem", maxWidth: 1280, margin: "0 auto" }}>
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
          [ OUR STORY ]
        </div>
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "var(--fg)",
            margin: "0 0 1.5rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          Built by operators,
          <br />
          <span style={{ color: "var(--accent)" }}>for operators.</span>
        </h1>
      </section>

      {/* Story body */}
      <section
        style={{
          padding: "0 2rem 5rem",
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--muted)",
              lineHeight: 2,
            }}
          >
            <p>
              SHEL INFOSEC was founded in Cape Town with one conviction: that
              small and medium enterprises deserve the same quality of security
              operations as the enterprises paying seven-figure retainer fees —
              without the seven-figure price tag attached.
            </p>
            <p>
              The team is built from practitioners who have worked in SOC
              environments, conducted red-team engagements, and responded to
              live breaches. We do not resell other companies&apos; products under
              a SHEL INFOSEC logo. We operate our own tooling, write our own
              playbooks, and stand behind every recommendation with our own
              analysts.
            </p>
            <p>
              The Silent Edge platform is the product of years of building the
              monitoring infrastructure we wished we had access to when working
              inside client environments. One agent. Real-time telemetry.
              Automated remediation. Transparent pricing. Deployed and managed
              by the same team that built it.
            </p>
            <p>
              Today SHEL INFOSEC protects 40+ clients across multiple sectors,
              processes 14.2 million security events per day, and maintains a
              mean time to response of under five minutes — around the clock,
              every day of the year.
            </p>
          </div>

          <div
            style={{
              marginTop: "2.5rem",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link href="/contact" className="btn btn-accent">
              Work With Us ◢
            </Link>
            <Link
              href="/services"
              className="btn"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--fg)" }}
            >
              View Services →
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Stats */}
          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>team.stats</span>
            </div>
            <div className="terminal-card-body">
              {[
                ["Active Clients", "40+"],
                ["Events / Day", "14.2M"],
                ["MTTR", "00:04:12"],
                ["SOC Uptime", "99.998%"],
                ["Open Breaches", "0"],
                ["HQ", "Cape Town, ZA"],
                ["Coverage", "Global"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.375rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ color: "var(--fg)" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="terminal-card">
            <div className="terminal-card-header">
              <span className="dot" />
              <span>certifications</span>
            </div>
            <div className="terminal-card-body">
              {CERTIFICATIONS.map((cert) => (
                <div
                  key={cert}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    color: "rgba(244,246,245,0.6)",
                    display: "flex",
                    gap: "0.75rem",
                    marginBottom: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--sev-ok)", fontSize: 8 }}>●</span>
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        style={{
          padding: "5rem 2rem",
          background: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: "2.5rem" }}>
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
              [ VALUES ]
            </div>
            <h2
              style={{
                fontFamily: "var(--mono)",
                fontSize: "clamp(1.25rem, 2.5vw, 2rem)",
                fontWeight: 700,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              How we operate.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {VALUES.map((v, i) => (
              <div
                key={v.title}
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
                  {v.title}
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
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
