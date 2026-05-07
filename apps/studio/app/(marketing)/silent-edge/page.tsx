import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Silent Edge | SHEL INFOSEC",
  description: "Our remote monitoring & management stack. One agent, every endpoint.",
};

const FEATURES = [
  {
    num: "01",
    title: "Unified Agent",
    body: "Single installation across Windows, macOS, and Linux. No separate patch management tool, antivirus console, or RMM dashboard. One pane of glass into every endpoint — fed directly into the SOC.",
    tags: ["Windows", "macOS", "Linux"],
  },
  {
    num: "02",
    title: "Auto-Remediation",
    body: "Automated playbooks trigger the moment a threshold is crossed. Systems isolated, changes rolled back, and devices reimaged — without waiting for an analyst to click accept. Speed is the only defence that matters at 2am.",
    tags: ["Isolate", "Rollback", "Reimage", "Playbooks"],
  },
  {
    num: "03",
    title: "Real-Time Telemetry",
    body: "Every process, every network connection, every registry write streams into the SOC in real time. No polling intervals. No log delay. When the kill chain starts, you see it before the second step executes.",
    tags: ["Process Events", "Network", "Registry", "File System"],
  },
  {
    num: "04",
    title: "Zero-Touch Patching",
    body: "Patch windows scheduled, tested on a canary group, and rolled out automatically. Emergency patches deployed in minutes, not maintenance cycles. Vulnerability window closed before the weekend.",
    tags: ["Scheduled", "Canary Group", "Emergency Deploy"],
  },
  {
    num: "05",
    title: "Transparent Pricing",
    body: "Per-endpoint monthly billing. Every feature included. No hidden costs for advanced playbooks, no extra seat licences for your analysts, no professional services surcharge to turn on a dashboard widget.",
    tags: ["Per-Endpoint", "All Features", "No Upsells"],
  },
];

export default function SilentEdgePage() {
  return (
    <>
      {/* Header */}
      <section
        style={{
          padding: "5rem 2rem 3rem",
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
            [ SILENT EDGE PLATFORM ]
          </div>
          <h1
            style={{
              fontFamily: "var(--mono)",
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--fg)",
              margin: "0 0 1.25rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            One agent.
            <br />
            Every endpoint.
            <br />
            <span style={{ color: "var(--accent)" }}>Real-time into the SOC.</span>
          </h1>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--muted)",
              lineHeight: 1.9,
              margin: "0 0 2rem",
            }}
          >
            Silent Edge is SHEL INFOSEC's own remote monitoring and management
            stack. Built by operators, for operators. It feeds telemetry directly
            into the SOC, executes automated playbooks, and gives your team
            zero-touch control over every managed endpoint.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/contact" className="btn btn-accent">
              Deploy Silent Edge ◢
            </Link>
            <Link
              href="/login"
              className="btn"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--fg)" }}
            >
              SOC Console →
            </Link>
          </div>
        </div>

        {/* Live stats terminal */}
        <div className="terminal-card">
          <div className="terminal-card-header">
            <span className="dot" />
            <span>silent-edge ~ % status --all</span>
          </div>
          <div className="terminal-card-body" style={{ lineHeight: 2.2 }}>
            {[
              ["PLATFORM", "OPERATIONAL", "var(--sev-ok)"],
              ["AGENTS CONNECTED", "247", "var(--fg)"],
              ["EVENTS / SEC", "164", "var(--fg)"],
              ["PLAYBOOKS FIRED (24h)", "12", "var(--sev-warn)"],
              ["PATCHES DEPLOYED (7d)", "891", "var(--fg)"],
              ["OPEN BREACHES", "0", "var(--sev-ok)"],
            ].map(([label, val, color]) => (
              <div
                key={label}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "0.25rem",
                }}
              >
                <span style={{ color: "var(--muted)" }}>{label}</span>
                <span style={{ color }}>{val}</span>
              </div>
            ))}
            <div
              style={{
                marginTop: "0.5rem",
                fontFamily: "var(--mono)",
                fontSize: "10px",
                color: "rgba(244,246,245,0.2)",
              }}
            >
              root@silent-edge ~ %{" "}
              <span className="animate-blink" style={{ color: "var(--accent)" }}>
                ▋
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          padding: "4rem 2rem 6rem",
          background: "var(--bg-2)",
          borderTop: "1px solid var(--border)",
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
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
                color: "var(--fg)",
                margin: 0,
              }}
            >
              Everything included. No feature gates.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {FEATURES.map((f) => (
              <div
                key={f.num}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr auto",
                  gap: "2rem",
                  padding: "1.5rem",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "rgba(61,126,255,0.15)",
                    lineHeight: 1,
                  }}
                >
                  {f.num}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--fg)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {f.title}
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
                    {f.body}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                    minWidth: 140,
                  }}
                >
                  {f.tags.map((tag) => (
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
                        padding: "2px 7px",
                        textAlign: "center",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "3rem",
              padding: "2.5rem",
              background: "var(--bg)",
              border: "1px solid rgba(61,126,255,0.3)",
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
                Ready to deploy Silent Edge?
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  color: "var(--muted)",
                }}
              >
                Agent deployment takes under 10 minutes per site. We handle the rollout.
              </div>
            </div>
            <Link href="/contact" className="btn btn-accent">
              Start Deployment ◢
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
