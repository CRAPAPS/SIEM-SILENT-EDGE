import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CASE_STUDIES_WITH_DETAIL,
  getAdjacent,
  getCaseStudy,
} from "@/content/work";
import { StackChips, StatusChip } from "@/components/work/CaseStudyCard";
import { Figure } from "@/components/work/Figure";

/** Only entries with narrative content get a route — no empty pages exist. */
export function generateStaticParams() {
  return CASE_STUDIES_WITH_DETAIL.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return { title: "Not found — SHEL INFOSEC" };
  return {
    title: `${study.name} — Work — SHEL INFOSEC`,
    description: study.summary,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  // Guard both an unknown slug and an entry that has no narrative yet.
  if (!study || study.sections.length === 0) notFound();

  const { prev, next } = getAdjacent(slug);

  return (
    <>
      {/* ── Hero ── */}
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
            <Link href="/work" style={{ color: "var(--accent)", textDecoration: "none" }}>
              ~ / work
            </Link>
            <span style={{ color: "var(--muted)" }}> / {study.slug}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 20,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <span
              className="glow-text"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 900,
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              {study.code}
            </span>
            <StatusChip status={study.status} />
          </div>

          <h1
            style={{
              fontFamily: "var(--sans)",
              fontSize: "clamp(40px, 8vw, 110px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 0.9,
              textTransform: "uppercase",
            }}
          >
            {study.name}
          </h1>

          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginTop: 20,
            }}
          >
            {study.sector}
          </div>

          <p
            style={{
              fontSize: "clamp(15px, 2vw, 19px)",
              color: "rgba(244,246,245,0.7)",
              lineHeight: 1.55,
              maxWidth: 680,
              marginTop: 32,
              marginBottom: 0,
            }}
          >
            {study.summary}
          </p>

          {study.url && (
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginTop: 28,
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--accent)",
                letterSpacing: "1.5px",
                textDecoration: "none",
                border: "1px solid var(--border)",
                padding: "10px 16px",
              }}
            >
              ./visit --live {study.url.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </div>
      </section>

      {/* ── Metrics band ── */}
      {study.metrics.length > 0 && (
        <section
          className="mkt-pad"
          style={{
            background: "var(--bg-2)",
            borderBottom: "1px solid var(--border)",
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >
          <div className="mkt-max">
            <dl className="work-metrics work-metrics-band">
              {study.metrics.map((m) => (
                <div key={m.label}>
                  <dt
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9,
                      letterSpacing: "1.5px",
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {m.label}
                  </dt>
                  <dd
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "clamp(20px, 3vw, 32px)",
                      fontWeight: 700,
                      color: "var(--fg)",
                      margin: 0,
                    }}
                  >
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ── Narrative ── */}
      <section
        className="mkt-pad"
        style={{ paddingTop: 72, paddingBottom: 48, background: "var(--bg)" }}
      >
        <div className="mkt-max">
          {study.sections.map((section) => (
            <div key={section.code} className="work-section">
              <div className="work-section-code">{section.code}</div>
              <div className="work-section-body">
                <h2
                  style={{
                    fontSize: "clamp(22px, 3vw, 38px)",
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                    margin: "0 0 18px",
                    lineHeight: 1.1,
                  }}
                >
                  {section.heading}
                </h2>
                <p
                  style={{
                    fontSize: "clamp(14px, 1.7vw, 17px)",
                    color: "rgba(244,246,245,0.75)",
                    lineHeight: 1.7,
                    margin: 0,
                    maxWidth: 680,
                  }}
                >
                  {section.body}
                </p>
                {section.figure && <Figure figure={section.figure} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stack ── */}
      {study.stack.length > 0 && (
        <section
          className="mkt-pad"
          style={{
            paddingTop: 40,
            paddingBottom: 56,
            background: "var(--bg)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="mkt-max">
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                letterSpacing: "2px",
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Built with
            </div>
            <StackChips stack={study.stack} />
          </div>
        </section>
      )}

      {/* ── Prev / next ── */}
      {(prev || next) && (
        <section
          className="mkt-pad"
          style={{
            background: "var(--bg-2)",
            borderTop: "1px solid var(--border)",
            paddingTop: 28,
            paddingBottom: 28,
          }}
        >
          <div
            className="mkt-max"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "1.5px",
            }}
          >
            {prev ? (
              <Link
                href={`/work/${prev.slug}`}
                style={{ color: "var(--accent)", textDecoration: "none" }}
              >
                ← {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/work/${next.slug}`}
                style={{ color: "var(--accent)", textDecoration: "none" }}
              >
                {next.name} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
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
            Build the<br />
            <span className="glow-text">next one with us.</span>
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
