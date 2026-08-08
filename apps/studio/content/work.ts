/**
 * Portfolio content — the single source of truth for /work and /work/[slug].
 *
 * An entry with an empty `sections` array renders as a card WITHOUT a case-study
 * link, and generates no detail route. That is how a platform appears on the
 * index while its brief is still being written — no thin page, no placeholder
 * copy. Adding `sections` makes the link and the page appear automatically.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BINDING CLAIM CONSTRAINTS — DiamondIQ
 * Source: PROJECT DEVELOPMENT/DiamondIQ-main/diamondiq/docs/DIAMONDIQ_SHOWCASE_BRIEF.md §9
 * Do not edit DiamondIQ copy without reading that section.
 *
 *   PERMITTED
 *     · "~57% accuracy across every game predicted"
 *     · "~67% BACKTESTED on the ~2-3% LOCK tier" — only with "backtested"/"provisional"
 *     · "the blend outperforms every individual signal it is built from"
 *     · "8 data sources", "predicts every game - no skipping"
 *     · "accuracy read live from production data"
 *
 *   PROHIBITED
 *     · 73% or 74.2% as an achieved rate — disproven across ~4,900 games
 *     · a standalone "67% accurate" headline (applies only to a thin slice)
 *     · presenting the LOCK tier as live-validated (it has fired ~9 times)
 *     · a 50% coin-flip baseline as the benchmark (honest ceiling is 54-57%)
 *     · any profit, ROI-guarantee or betting-outcome promise
 *     · "3.8x Faster" / "150+ Years Historical Data" — unsubstantiated
 *
 *   The two-number framing is non-negotiable: ~57% every game, ~67% backtested
 *   on a selective 2-3% tier. Never merged into one headline number.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The extradition platform is written at CAPABILITY level only. No operational
 * specifics, routing logic, jurisdictional coverage or agent mechanics —
 * publishing those could expose the people the system protects.
 */

export type CaseStudyStatus = "live" | "in-training" | "in-development";

/** Two contrasting numbers shown side by side, with the distinction made explicit. */
export type StatPairFigure = {
  kind: "stat-pair";
  caption?: string;
  items: { value: string; label: string; note?: string }[];
};

/**
 * Single-series horizontal bars. One hue (the live accent), so no legend —
 * the heading names the series. `showValues: false` renders the shape of a
 * relationship without publishing the numbers, which §9 requires for the
 * starting-pitcher ERA-gap figure.
 */
export type BarsFigure = {
  kind: "bars";
  caption?: string;
  showValues: boolean;
  max: number;
  bars: { label: string; value: number; display?: string; emphasis?: boolean }[];
};

/** An ordered flow, optionally closing back on itself. */
export type DiagramFigure = {
  kind: "diagram";
  caption?: string;
  steps: { label: string; detail: string }[];
  loop?: string;
};

export type Figure = StatPairFigure | BarsFigure | DiagramFigure;

export type CaseStudySection = {
  code: string;
  heading: string;
  body: string;
  figure?: Figure;
};

export type CaseStudy = {
  slug: string;
  code: string;
  name: string;
  sector: string;
  status: CaseStudyStatus;
  /** Public URL. Omitted for confidential work. */
  url?: string;
  confidential?: boolean;
  summary: string;
  metrics: { label: string; value: string }[];
  stack: string[];
  sections: CaseStudySection[];
};

export const STATUS_LABEL: Record<CaseStudyStatus, string> = {
  live: "LIVE",
  "in-training": "IN TRAINING",
  "in-development": "IN DEVELOPMENT",
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "diamondiq",
    code: "01",
    name: "DiamondIQ",
    sector: "Sports analytics · predictive modelling",
    status: "in-training",
    url: "https://diamondiq.live",
    summary:
      "An MLB predictive-analytics platform that publishes its own accuracy record, read live from production data. We set out to build a model that hit 73% — then proved across roughly 4,900 games that our own target was mathematically impossible, and rebuilt the product around the finding.",
    metrics: [
      { label: "Accuracy, every game", value: "~57%" },
      { label: "Games backtested", value: "~4,900" },
      { label: "Data sources", value: "8" },
    ],
    stack: [
      "React 18",
      "TypeScript",
      "Vite",
      "Tailwind",
      "Supabase",
      "PostgreSQL",
      "Deno Edge Functions",
      "pg_cron",
      "Claude",
      "nginx",
      "PM2",
    ],
    sections: [
      {
        code: "01",
        heading: "The market runs on numbers that aren't real",
        body:
          "Sports prediction services routinely advertise 70–90% win rates. Those figures are marketing artifacts — cherry-picked windows, retroactive selection, undisclosed sample sizes, or counting only the games the service chose to call. That creates a trap for an honest builder: publishing a truthful 57% next to a competitor's fictional 85% looks like weakness rather than integrity. We started where everyone starts, assuming a sufficiently sophisticated model could reach around 73%.",
      },
      {
        code: "02",
        heading: "So we measured it properly",
        body:
          "Every completed MLB game across the 2024 and 2025 seasons plus 2026 to date — roughly 4,900 games — was pulled from the MLB Stats API and run through a point-in-time backtest. Point-in-time means the model only ever sees data that existed before first pitch. No look-ahead, no hindsight, no quietly excluded games.",
      },
      {
        code: "03",
        heading: "We disproved our own target",
        body:
          "The best achievable point-in-time accuracy across full seasons was 54–57%. Roughly a quarter of MLB games are one-run outcomes no model can call — that is a property of baseball, not a limitation of the model. For calibration, professional betting markets, the most capitalised forecasters in existence, top out around 58–60% on the same task. The second finding explained years of frustration in one line: every team-quality metric we were tuning turned out to be collinear. We had been tuning one signal four times and expecting compound gains.",
        figure: {
          kind: "bars",
          showValues: true,
          max: 60,
          caption:
            "Point-in-time accuracy of each team-quality signal, measured independently. They cluster because they are the same signal wearing different hats.",
          bars: [
            { label: "Home record", value: 52.9, display: "52.9%" },
            { label: "Last-10 form", value: 52.6, display: "52.6%" },
            { label: "Season record", value: 51.5, display: "51.5%" },
            { label: "Pythagorean", value: 50.1, display: "50.1%" },
            { label: "Run differential", value: 50.1, display: "50.1%" },
          ],
        },
      },
      {
        code: "04",
        heading: "The one lever that moved independently",
        body:
          "Starting-pitcher ERA gap behaves orthogonally to team quality, and accuracy climbs sharply as the gap widens. Critically, in the widest bucket the better-ERA pitcher's team is home less than half the time — so this is not home-field advantage recounted under another name. It is genuinely new information, and it became the backbone of the rebuilt product.",
        figure: {
          kind: "bars",
          showValues: false,
          max: 100,
          caption:
            "Shape only. These buckets were computed with full-season ERA, which carries look-ahead bias — they are an upper bound, not an achievable live rate. The honest point-in-time figure is the 66.9% backtested tier below.",
          bars: [
            { label: "ERA gap 0 – 0.75", value: 52.1 },
            { label: "ERA gap 0.75 – 1.5", value: 56.1 },
            { label: "ERA gap 1.5 – 2.5", value: 66.1 },
            { label: "ERA gap 2.5+", value: 74.2, emphasis: true },
          ],
        },
      },
      {
        code: "05",
        heading: "Two numbers, not one",
        body:
          "Rather than inflate a single figure, the product reports two and is explicit about which is which. Every game on the slate gets a prediction — no skipping, no quietly omitting hard games to protect the average, because a service that only predicts what it is confident about has a flattering record and no utility. Separately, a high-confidence tier fires only when the starting-pitcher ERA gap is at least 2.5 and two independent signals back the same side. It is provisional: backtested across three seasons, not yet validated in live play.",
        figure: {
          kind: "stat-pair",
          caption:
            "Shown side by side deliberately. Merging them into one headline number would be false — the second applies only to a thin, selective slice.",
          items: [
            {
              value: "~57%",
              label: "Every game predicted",
              note: "No skipping. The durable level, against a 54–57% achievable ceiling.",
            },
            {
              value: "~67%",
              label: "High-confidence tier — backtested",
              note: "107/160 across three seasons. Fires on ~2–3% of games. Provisional, not yet live-validated.",
            },
          ],
        },
      },
      {
        code: "06",
        heading: "A system that scores itself",
        body:
          "Predictions are scored against real outcomes automatically, and the accuracy number on the homepage is read live from that ledger — not hardcoded by a marketing team. If accuracy drops, the headline drops with it. When every AI provider is unavailable the system writes nothing rather than falling back to a statistics-only guess, because a missing prediction is honest and a fabricated one corrupts the record permanently. The blended output is more accurate than every single one of its ingredients measured individually, which is the entire justification for ensemble modelling, demonstrated on live production data.",
        figure: {
          kind: "diagram",
          caption:
            "The interesting shape is the loop: the system's own measured accuracy feeds back into how its signals are weighted.",
          steps: [
            {
              label: "8 data sources",
              detail:
                "MLB Stats, Statcast, splits, standings, odds, weather, park factors, injuries",
            },
            {
              label: "Statistical model",
              detail:
                "50/50 baseline, weighted signal adjustments read live from the database",
            },
            {
              label: "AI blend",
              detail:
                "Claude reads the same factor set and returns its own pick and reasoning",
            },
            {
              label: "Calibrated pick",
              detail:
                "Confidence means an actual estimated win probability, on a 50–70 scale",
            },
            {
              label: "Self-scoring ledger",
              detail: "Every result recorded, accuracy broken down per signal",
            },
          ],
          loop: "Ledger → signal weights",
        },
      },
    ],
  },

  {
    slug: "silent-edge",
    code: "02",
    name: "Silent Edge",
    sector: "Cybersecurity · multi-tenant SOC platform",
    status: "live",
    summary:
      "Our own security operations platform: a multi-tenant SOC console with tenant isolation enforced inside the database rather than the interface, live threat intelligence, and a client portal. Built because the firms that most need a 24/7 SOC are exactly the ones that cannot staff one.",
    metrics: [
      { label: "Tenant isolation", value: "Database-level" },
      { label: "Access model", value: "4-tier" },
      { label: "Intel sources", value: "MITRE · KEV · NVD" },
    ],
    stack: [
      "Next.js 15",
      "TypeScript",
      "Supabase",
      "PostgreSQL",
      "pgvector",
      "Row-level security",
      "Deno Edge Functions",
      "Docker",
      "nginx",
      "Claude",
      "Turborepo",
    ],
    sections: [
      {
        code: "01",
        heading: "The firms that need a SOC most cannot staff one",
        body:
          "A security operations centre needs analysts on shift around the clock, a SIEM, threat intelligence, and someone who knows what to do at 03:00. That is a headcount problem before it is a software problem, and it puts real detection out of reach for small and mid-sized firms — who are targeted precisely because they are assumed to be undefended.",
      },
      {
        code: "02",
        heading: "One console, many tenants",
        body:
          "Silent Edge is a multi-tenant console where our analysts work across every client while each client sees only their own estate. Staff get the operations view — alerts, devices, threat intelligence, incident playbooks. Clients get a read-only portal scoped to their organisation. Access runs on a four-tier model, from owner-level command down to org-scoped analysts and read-only client accounts.",
      },
      {
        code: "03",
        heading: "Isolation belongs in the database, not the interface",
        body:
          "The hard part of multi-tenancy is not building the screens — it is guaranteeing that one tenant can never reach another's data, including when the application layer has a bug. Separation is enforced with row-level security policies in PostgreSQL, so it holds at the data layer regardless of what the interface does. A query that should return nothing returns nothing, even if the code asking is wrong.",
        figure: {
          kind: "diagram",
          caption:
            "Every request is scoped at the data layer. The application cannot opt out of the policy.",
          steps: [
            {
              label: "Authenticated request",
              detail: "Session carries the user's organisation and role",
            },
            {
              label: "Row-level security",
              detail: "PostgreSQL policies scope every table to the caller's org",
            },
            { label: "Role gate", detail: "Middleware enforces route access per tier" },
            {
              label: "Scoped response",
              detail: "Only rows the tenant owns are ever returned",
            },
          ],
        },
      },
      {
        code: "04",
        heading: "Intelligence that arrives before the incident",
        body:
          "The platform ingests MITRE ATT&CK technique data, the CISA Known Exploited Vulnerabilities catalogue and NVD CVE records, and correlates indicators of compromise against telemetry from endpoint and RMM integrations. An AI specialist layer runs retrieval over an internal knowledge base, so analysts get grounded answers with sources rather than a plausible-sounding guess.",
      },
      {
        code: "05",
        heading: "Running in production",
        body:
          "Silent Edge runs on our own infrastructure behind nginx, containerised, serving both the client console and this site from the same platform. It is the system our analysts use daily — which means every rough edge is one we feel first.",
      },
    ],
  },

  {
    slug: "grey-horse",
    code: "03",
    name: "Grey Horse",
    sector: "Equine care · records & practice management",
    status: "live",
    url: "https://greyhorse.tech",
    summary:
      "The equine record, solved. A live platform that gives every horse a permanent, tamper-evident life history — and gives the professionals who care for it a complete business in their pocket. A working practice runs on it daily.",
    metrics: [
      { label: "Record model", value: "Append-only" },
      { label: "Integrity", value: "Signed chain" },
      { label: "Access control", value: "Data-layer" },
    ],
    // Capability-level only. GREY-HORSE-SHOWCASE.md §9 forbids naming internal
    // structure — tables, functions, endpoints, migrations or providers —
    // because naming a live system on a security company's site invites probing.
    stack: [
      "Progressive web app",
      "Offline-tolerant",
      "Append-only records",
      "Cryptographic signing",
      "Data-layer access control",
      "Self-hosted mapping",
    ],
    sections: [
      {
        code: "01",
        heading: "When a horse is sold, its history vanishes",
        body:
          "Equine care runs on paper diaries, phone photos and memory. A farrier sees thirty horses a week across a dozen properties; a bodyworker sees the same animals months apart; a vet arrives knowing only what someone remembers to mention. Nobody can prove what was done, when, or by whom — so buyers guess, insurers dispute, and good professional work leaves no trace. Meanwhile the practitioners are running a demanding mobile business on tools built for salons and restaurants.",
      },
      {
        code: "02",
        heading: "The record is the product",
        body:
          "Every horse gets a permanent identity and a lifetime timeline: care, health, treatments, photographs, ownership. The record belongs to the horse and survives a change of owner. That is the whole strategic bet — everyone else manages appointments, and a competitor can copy a calendar in a fortnight. Nobody can retroactively produce four years of signed history.",
      },
      {
        code: "03",
        heading: "Notes versus evidence",
        body:
          "Entries are added, never quietly altered. Each is signed and linked to the one before it, so the record can be shown to be intact rather than merely asserted. Where content must lawfully be removed, the removal itself is visible. This is the difference between a notebook and something an insurer or a buyer can rely on years later.",
        figure: {
          kind: "diagram",
          caption:
            "Integrity by design. Nothing can be rewritten in place, and a gap cannot be hidden.",
          steps: [
            { label: "Entry added", detail: "Appended to the horse's timeline — never edited in place" },
            { label: "Signed", detail: "Cryptographically sealed at the moment it is written" },
            { label: "Linked", detail: "Bound to the entry before it, so the chain is continuous" },
            { label: "Verifiable", detail: "The record can be shown to be intact, not just claimed to be" },
          ],
        },
      },
      {
        code: "04",
        heading: "A business that fits in a barn",
        body:
          "Calendar, mapped routes between stops, navigation hand-off, and a schedule that distinguishes what is pencilled in from what is confirmed with the client. Price lists, invoices that deduct stock automatically when issued, payment tracking and low-stock warnings — though the platform never touches funds. Health tracking surfaces what is due next rather than burying it. It is phone-first, works on poor connections, and asks for the minimum a person can type with cold hands.",
      },
      {
        code: "05",
        heading: "Three professions and an owner, one record",
        body:
          "The hard access-control problem here is not hiding data from strangers — it is that a farrier, a bodyworker, a vet, a barn and an owner all legitimately touch the same horse, and each should see what is theirs to see. A note can be shared with everyone, kept to the care team where it carries a safety warning the next professional genuinely needs, or kept private. Those rules live at the data layer, so protection does not depend on which screen a user happens to be looking at.",
        figure: {
          kind: "diagram",
          caption:
            "Owners are first-class contributors, not passive readers — the record is richer because more than one person writes it.",
          steps: [
            { label: "Shared", detail: "Visible to everyone connected to the horse" },
            { label: "Care team", detail: "Held to the professionals — where a safety warning must reach the next visitor" },
            { label: "Private", detail: "Kept to the author alone" },
          ],
        },
      },
      {
        code: "06",
        heading: "Not a pilot — a business we still run",
        body:
          "Grey Horse is live in production, carrying a real practice's real work every day: her horses, her diary, her invoices, her records, since launch. It was taken from blank page to live production by one team — product strategy, data modelling, interface, infrastructure, deployment and ongoing operation, with no hand-offs between the people who designed it and the people who run it. Mapping, location and analytics were built or self-hosted rather than rented, so it runs at a fraction of the usual cost and answers to nobody else's pricing page. It holds information about people who never signed up for it, which shaped the architecture from the very first decision.",
      },
    ],
  },

  {
    slug: "extradition-tracking",
    code: "04",
    name: "Extradition & Transfer Tracking",
    sector: "Law enforcement · multi-jurisdiction",
    status: "live",
    confidential: true,
    summary:
      "A globally capable platform for tracking extradition and prisoner-transfer matters across jurisdictions, with agent facilitation, chain-of-custody records and audit-grade logging. Described at capability level only — operational detail is deliberately withheld.",
    metrics: [
      { label: "Scope", value: "Multi-jurisdiction" },
      { label: "Access model", value: "Role-segregated" },
      { label: "Record integrity", value: "Audit-grade" },
    ],
    stack: ["Confidential"],
    sections: [],
  },

  {
    slug: "pi-training-certification",
    code: "05",
    name: "Investigator Training & Certification",
    sector: "Private investigation · professional certification",
    status: "live",
    summary:
      "A training and certification platform for private investigators and security professionals — course delivery, assessment and credential issuance for a field where the credential has to mean something.",
    metrics: [
      { label: "Domain", value: "PI & security" },
      { label: "Output", value: "Certification" },
    ],
    stack: [],
    sections: [],
  },

];

/** Entries with narrative content — these are the ones with detail pages. */
export const CASE_STUDIES_WITH_DETAIL = CASE_STUDIES.filter(
  (c) => c.sections.length > 0,
);

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

/** Previous/next within the detail-bearing entries, for footer navigation. */
export function getAdjacent(slug: string): {
  prev?: CaseStudy;
  next?: CaseStudy;
} {
  const i = CASE_STUDIES_WITH_DETAIL.findIndex((c) => c.slug === slug);
  if (i === -1) return {};
  return {
    prev: i > 0 ? CASE_STUDIES_WITH_DETAIL[i - 1] : undefined,
    next:
      i < CASE_STUDIES_WITH_DETAIL.length - 1
        ? CASE_STUDIES_WITH_DETAIL[i + 1]
        : undefined,
  };
}
