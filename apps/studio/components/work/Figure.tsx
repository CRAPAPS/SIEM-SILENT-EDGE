import type {
  BarsFigure,
  DiagramFigure,
  Figure as FigureData,
  StatPairFigure,
} from "@/content/work";

/**
 * Single-series horizontal bars: one hue (the live accent), so no legend —
 * the section heading names the series. Values are direct-labelled when
 * `showValues` is true; when false the bars carry the shape of a relationship
 * only, and the caption explains why the numbers are withheld.
 */
function Bars({ figure }: { figure: BarsFigure }) {
  return (
    <figure className="work-figure">
      <div
        className={`work-bars${figure.showValues ? "" : " work-bars-novalues"}`}
        role="img"
        aria-label={
          figure.showValues
            ? figure.bars.map((b) => `${b.label}: ${b.display ?? b.value}`).join(", ")
            : `Relative magnitude only, values withheld: ${figure.bars
                .map((b) => b.label)
                .join(", ")}`
        }
      >
        {figure.bars.map((b) => (
          <div key={b.label} className="work-bar-row">
            <span className="work-bar-label">
              {b.emphasis ? <span aria-hidden="true">◢ </span> : null}
              {b.label}
            </span>
            <span className="work-bar-track">
              <span
                className="work-bar-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, (b.value / figure.max) * 100))}%`,
                }}
              />
            </span>
            {figure.showValues && (
              <span className="work-bar-value">{b.display ?? String(b.value)}</span>
            )}
          </div>
        ))}
      </div>
      {figure.caption && (
        <figcaption className="work-figcaption">{figure.caption}</figcaption>
      )}
    </figure>
  );
}

/** Two contrasting numbers, deliberately side by side. */
function StatPair({ figure }: { figure: StatPairFigure }) {
  return (
    <figure className="work-figure">
      <div className="work-statpair">
        {figure.items.map((item) => (
          <div key={item.label} className="work-statpair-item">
            <div className="work-statpair-value glow-text">{item.value}</div>
            <div className="work-statpair-label">{item.label}</div>
            {item.note && <p className="work-statpair-note">{item.note}</p>}
          </div>
        ))}
      </div>
      {figure.caption && (
        <figcaption className="work-figcaption">{figure.caption}</figcaption>
      )}
    </figure>
  );
}

/** An ordered flow, optionally closing back on itself. */
function Diagram({ figure }: { figure: DiagramFigure }) {
  return (
    <figure className="work-figure">
      <ol className="work-diagram">
        {figure.steps.map((step, i) => (
          <li key={step.label} className="work-diagram-step">
            <span className="work-diagram-idx" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="work-diagram-body">
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      {figure.loop && (
        <div className="work-diagram-loop">
          <span aria-hidden="true">↺ </span>
          {figure.loop}
        </div>
      )}
      {figure.caption && (
        <figcaption className="work-figcaption">{figure.caption}</figcaption>
      )}
    </figure>
  );
}

export function Figure({ figure }: { figure: FigureData }) {
  switch (figure.kind) {
    case "bars":
      return <Bars figure={figure} />;
    case "stat-pair":
      return <StatPair figure={figure} />;
    case "diagram":
      return <Diagram figure={figure} />;
    default: {
      // Exhaustiveness guard: a new figure kind becomes a compile error here
      // rather than a silently blank block on the page.
      const _exhaustive: never = figure;
      return _exhaustive;
    }
  }
}
