import Link from "next/link";
import type { Metadata } from "next";
import { CASE_STUDIES } from "@/content/work";
import { CaseStudyCard } from "@/components/work/CaseStudyCard";

export const metadata: Metadata = {
  title: "Work — SHEL INFOSEC",
  description:
    "Platforms we have designed, built and run — security operations, predictive analytics, certification and multi-jurisdiction tracking.",
};

export default function WorkPage() {
  return (
    <>
      <section className="mkt-page-hero mkt-pad" style={{ background: "var(--bg)" }}>
        <div className="mkt-max">
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--accent)",
              letterSpacing: 3,
              marginBottom: 24,
            }}
          >
            ~ / work
          </div>
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(40px, 8vw, 120px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 0.9,
              textTransform: "uppercase",
            }}
          >
            We don&apos;t just<br />
            <span className="glow-text">secure systems.</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 2vw, 19px)",
              color: "rgba(244,246,245,0.7)",
              lineHeight: 1.55,
              maxWidth: 660,
              marginTop: 36,
              marginBottom: 0,
            }}
          >
            We build them. Production platforms across sports analytics, security
            operations, professional certification and multi-jurisdiction tracking —
            designed, engineered and run by the same team that defends them.
          </p>
        </div>
      </section>

      <section
        className="mkt-pad"
        style={{ paddingTop: 80, paddingBottom: 80, background: "var(--bg)" }}
      >
        <div className="mkt-max">
          <div className="mkt-2col-svc">
            {CASE_STUDIES.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
          </div>

          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "rgba(244,246,245,0.35)",
              letterSpacing: "1px",
              lineHeight: 1.8,
              marginTop: 32,
              maxWidth: 720,
            }}
          >
            // Some engagements are covered by confidentiality and are described at
            capability level only.
          </p>
        </div>
      </section>

      <section
        className="mkt-section mkt-pad"
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          position: "relative",
        }}
      >
        <div
          className="accent-bg-radial"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
        <div style={{ position: "relative" }}>
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(32px, 5vw, 80px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 32px",
              lineHeight: 0.9,
              textTransform: "uppercase",
            }}
          >
            Got something<br />
            <span className="glow-text">difficult?</span>
          </h2>
          <Link
            href="/contact"
            style={{
              fontFamily: "var(--mono)",
              fontSize: 13,
              letterSpacing: "1.5px",
              fontWeight: 700,
              background: "var(--accent)",
              color: "#001a10",
              padding: "16px 28px",
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 0 32px var(--a55)",
            }}
          >
            ./start-a-project ◢
          </Link>
        </div>
      </section>
    </>
  );
}
