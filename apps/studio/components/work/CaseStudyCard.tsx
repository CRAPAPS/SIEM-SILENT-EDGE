import Link from "next/link";
import { STATUS_LABEL, type CaseStudy, type CaseStudyStatus } from "@/content/work";

/**
 * Honest status marker. The label always carries the meaning in text —
 * colour is secondary, never the only encoding.
 */
const STATUS_COLOR: Record<CaseStudyStatus, string> = {
  live: "var(--sev-ok)",
  "in-training": "var(--sev-warn)",
  "in-development": "var(--muted)",
};

export function StatusChip({ status }: { status: CaseStudyStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--mono)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "1.5px",
        color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          flexShrink: 0,
        }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StackChips({ stack }: { stack: string[] }) {
  if (stack.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {stack.map((t) => (
        <span
          key={t}
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--muted)",
            border: "1px solid var(--border)",
            padding: "4px 8px",
            letterSpacing: "1.5px",
          }}
        >
          {t.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

/**
 * A card on the /work index.
 *
 * An entry with no `sections` renders without a case-study link — the platform
 * is shown, but nothing pretends there is a page behind it.
 */
export function CaseStudyCard({ study }: { study: CaseStudy }) {
  const hasDetail = study.sections.length > 0;

  return (
    <article className="work-card">
      {/* Targeting brackets — same language as the hero logo, expand on hover */}
      <span aria-hidden="true" className="work-corner work-corner-tl" />
      <span aria-hidden="true" className="work-corner work-corner-tr" />
      <span aria-hidden="true" className="work-corner work-corner-bl" />
      <span aria-hidden="true" className="work-corner work-corner-br" />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 18,
          gap: 16,
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

      <h2
        style={{
          fontSize: "clamp(20px, 2.5vw, 32px)",
          fontWeight: 900,
          letterSpacing: -0.8,
          margin: "0 0 8px",
          textTransform: "uppercase",
          lineHeight: 1.05,
        }}
      >
        {study.name}
      </h2>

      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--muted)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        {study.sector}
      </div>

      <p
        style={{
          fontSize: "clamp(13px, 1.5vw, 15px)",
          color: "rgba(244,246,245,0.75)",
          lineHeight: 1.65,
          margin: "0 0 24px",
        }}
      >
        {study.summary}
      </p>

      {study.metrics.length > 0 && (
        <dl className="work-metrics">
          {study.metrics.map((m) => (
            <div key={m.label}>
              <dt
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 9,
                  letterSpacing: "1.5px",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {m.label}
              </dt>
              <dd
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "clamp(15px, 1.8vw, 19px)",
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
      )}

      <div style={{ marginBottom: 24 }}>
        <StackChips stack={study.stack} />
      </div>

      {hasDetail ? (
        <Link
          href={`/work/${study.slug}`}
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: "1.5px",
            textDecoration: "none",
          }}
        >
          ./case-study --id={study.slug} →
        </Link>
      ) : (
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "rgba(244,246,245,0.3)",
            letterSpacing: "1.5px",
          }}
        >
          {study.confidential ? "// details withheld" : "// case study in preparation"}
        </span>
      )}
    </article>
  );
}
