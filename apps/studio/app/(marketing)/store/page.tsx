import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store | SHEL INFOSEC",
  description: "Silent Edge platform plans and SHEL INFOSEC managed security packages.",
};

const PLANS = [
  {
    name: "Standard",
    tagline: "Essential protection for growing businesses.",
    price: "Contact for pricing",
    billedAs: "per endpoint / month",
    features: [
      "Silent Edge agent deployment",
      "24/7 SOC monitoring (Tier 1 & 2)",
      "SIEM event ingestion & correlation",
      "MITRE ATT&CK tagging",
      "Monthly threat report",
      "Email & phone support",
    ],
    cta: "Get Started",
    accent: "var(--muted)",
    featured: false,
  },
  {
    name: "Pro",
    tagline: "Full-spectrum coverage with proactive hunting.",
    price: "Contact for pricing",
    billedAs: "per endpoint / month",
    features: [
      "Everything in Standard",
      "Tier 3 proactive threat hunting",
      "Dark web credential monitoring",
      "Automated playbook execution",
      "Zero-touch patch management",
      "Priority 1-hour SLA response",
      "Quarterly executive briefing",
    ],
    cta: "Most Popular — Get Pro",
    accent: "var(--accent)",
    featured: true,
  },
  {
    name: "Enterprise",
    tagline: "Custom deployment for complex environments.",
    price: "Custom pricing",
    billedAs: "tailored to your environment",
    features: [
      "Everything in Pro",
      "Dedicated analyst team",
      "On-site incident response",
      "Custom playbook development",
      "Network architecture review",
      "Compliance reporting (ISO, POPIA)",
      "24h SLA with penalty clauses",
    ],
    cta: "Talk to an Operator",
    accent: "var(--sev-ok)",
    featured: false,
  },
];

export default function StorePage() {
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
          [ STORE ]
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
          Pick a plan.
          <br />
          <span style={{ color: "var(--accent)" }}>Deploy tonight.</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "12px",
            color: "var(--muted)",
            lineHeight: 1.8,
            margin: 0,
            maxWidth: 520,
          }}
        >
          All plans include the Silent Edge platform, 24/7 SOC coverage, and direct
          operator access. Per-endpoint billing — scale up or down each month.
        </p>
      </section>

      <section style={{ padding: "1rem 2rem 6rem", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="terminal-card"
              style={{
                border: plan.featured
                  ? `1px solid rgba(61,126,255,0.5)`
                  : "1px solid var(--border)",
                position: "relative",
              }}
            >
              {plan.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--accent)",
                    fontFamily: "var(--mono)",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    color: "#fff",
                    padding: "2px 12px",
                    borderRadius: "0 0 2px 2px",
                  }}
                >
                  MOST POPULAR
                </div>
              )}
              <div className="terminal-card-header">
                <span className="dot" />
                <span style={{ color: plan.accent }}>{plan.name.toUpperCase()}</span>
              </div>
              <div className="terminal-card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "13px",
                      color: "var(--muted)",
                      marginBottom: "1rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.tagline}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "18px",
                      fontWeight: 800,
                      color: plan.accent,
                      marginBottom: "0.125rem",
                    }}
                  >
                    {plan.price}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "9px",
                      color: "var(--muted)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {plan.billedAs}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1.25rem",
                  }}
                >
                  {plan.features.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "rgba(244,246,245,0.65)",
                        display: "flex",
                        gap: "0.75rem",
                        marginBottom: "0.625rem",
                        alignItems: "flex-start",
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: "var(--sev-ok)", flexShrink: 0, marginTop: 2 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className="btn btn-accent"
                  style={{
                    justifyContent: "center",
                    background: plan.featured ? "var(--accent)" : "transparent",
                    border: plan.featured ? "none" : "1px solid var(--border)",
                    color: plan.featured ? "#fff" : "var(--fg)",
                    marginTop: "auto",
                  }}
                >
                  {plan.cta} ◢
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee strip */}
        <div
          style={{
            marginTop: "3rem",
            padding: "1.5rem 2rem",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            display: "flex",
            gap: "3rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            "No 12-month lock-in",
            "Cancel anytime",
            "Onboarding in 48 hours",
            "Direct operator access",
            "No setup fees",
          ].map((g) => (
            <div
              key={g}
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                color: "rgba(244,246,245,0.4)",
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--sev-ok)", fontSize: 8 }}>●</span> {g}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
