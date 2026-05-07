import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | SHEL INFOSEC",
  description: "Threat intelligence briefings, platform updates, and SOC insights from SHEL INFOSEC.",
};

const POSTS = [
  {
    date: "2026-04-28",
    category: "THREAT BRIEF",
    title: "T1059.001 PowerShell abuse spikes across South African SME sector",
    excerpt:
      "SHEL INFOSEC SOC observed a 340% increase in PowerShell-based lateral movement attempts targeting SMEs in the manufacturing and logistics verticals. MITRE ATT&CK technique T1059.001.",
    severity: "high",
  },
  {
    date: "2026-04-15",
    category: "PLATFORM UPDATE",
    title: "Silent Edge v2.1 — Zero-touch patching now GA",
    excerpt:
      "The zero-touch patching module has graduated from beta after 90 days of canary testing across 22 client environments. Emergency patch deployment time reduced to under 8 minutes.",
    severity: "info",
  },
  {
    date: "2026-04-02",
    category: "THREAT BRIEF",
    title: "Dark web credential dump includes 14 ZA financial sector domains",
    excerpt:
      "Our dark web monitoring service identified a fresh credential dump containing accounts from 14 South African financial sector domains. Affected clients were notified and forced password resets applied within 2 hours of detection.",
    severity: "critical",
  },
  {
    date: "2026-03-20",
    category: "INDUSTRY",
    title: "Why your MSSP is reselling you someone else's SOC",
    excerpt:
      "Most managed security providers do not operate their own SOC. They white-label tier-1 triage from a shared service centre and call it 24/7 coverage. Here is how to tell the difference.",
    severity: "info",
  },
  {
    date: "2026-03-08",
    category: "PLATFORM UPDATE",
    title: "GEOINT dashboard now live — global threat arc visualisation",
    excerpt:
      "Silent Edge now renders active threat arcs on a real-time 3D globe. Devices are plotted by geolocation with risk score colour coding. Analyst-facing feature available in all tiers.",
    severity: "info",
  },
];

const SEV_COLOR: Record<string, string> = {
  critical: "var(--sev-crit)",
  high: "var(--sev-alert)",
  medium: "var(--sev-warn)",
  info: "var(--accent)",
};

export default function NewsPage() {
  return (
    <>
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
          [ NEWS & THREAT BRIEFS ]
        </div>
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 800,
            color: "var(--fg)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          Intelligence feed.
        </h1>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "12px",
            color: "var(--muted)",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          Threat briefs, platform updates, and SOC insights from the operations floor.
        </p>
      </section>

      <section style={{ padding: "0 2rem 6rem", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {POSTS.map((post) => (
            <div
              key={post.title}
              className="terminal-card"
              style={{
                borderLeft: `2px solid ${SEV_COLOR[post.severity]}`,
                cursor: "pointer",
              }}
            >
              <div className="terminal-card-body">
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "9px",
                      letterSpacing: "0.08em",
                      color: SEV_COLOR[post.severity],
                      background: `${SEV_COLOR[post.severity]}14`,
                      border: `1px solid ${SEV_COLOR[post.severity]}33`,
                      borderRadius: "2px",
                      padding: "2px 7px",
                    }}
                  >
                    {post.category}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "9px",
                      color: "var(--muted)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {post.date}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--fg)",
                    marginBottom: "0.625rem",
                    lineHeight: 1.4,
                  }}
                >
                  {post.title}
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
                  {post.excerpt}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "3rem",
            padding: "2rem",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--muted)",
              marginBottom: "1rem",
            }}
          >
            Get threat briefs delivered to your inbox as they are published.
          </div>
          <Link href="/contact" className="btn btn-accent" style={{ fontSize: "11px" }}>
            Subscribe to Intelligence Feed ◢
          </Link>
        </div>
      </section>
    </>
  );
}
