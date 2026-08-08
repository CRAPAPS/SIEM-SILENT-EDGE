# Portfolio Section (`~/work`) — Design

**Date:** 2026-08-06
**Status:** Approved, in implementation

## Purpose

A portfolio section on the SHEL INFOSEC marketing site showcasing platforms the firm has built.
It exists to prove engineering capability to prospective clients who arrive knowing SHEL as a
security firm and do not yet know it ships production software.

## Scope

- New route `/work` (index) and `/work/[slug]` (case-study detail).
- Five platforms at launch. Detail pages are generated only for entries that have narrative content.
- No CMS, no database. Content is a typed module.

Out of scope: filtering/search, client logos, testimonials, and the clinic lead-routing portal
(still a proposal — publishing it as delivered work would misrepresent it).

## Architecture

```
app/(marketing)/work/page.tsx         index — server component, statically rendered
app/(marketing)/work/[slug]/page.tsx  detail — generateStaticParams + generateMetadata
content/work.ts                       typed CaseStudy[] — single source of truth
components/work/                      presentational pieces, no data fetching
globals.css                           "Work / Portfolio" block
```

Both routes are server components. The content is static, so shipping JS for it is waste. All
interaction is CSS. The accent system still applies because `AccentProvider` sits above these
routes in `(marketing)/layout.tsx` and drives CSS custom properties.

This is a deliberate small improvement on `services/page.tsx`, which is marked `"use client"`
without needing to be. We are not refactoring that page — only avoiding repeating the pattern.

Unknown slug calls `notFound()`.

Two edits to existing files: add `{ href: "/work", label: "work" }` to `NAV_LINKS` and a "Work"
entry to the footer `LINKS` list, both in `(marketing)/layout.tsx`.

## Content model

```ts
type CaseStudy = {
  slug, code, name, sector
  status: "live" | "in-training" | "in-development"
  url?          // only when public
  confidential? // suppresses url, keeps copy at capability level
  summary       // index card
  metrics: { label, value }[]   // max 3
  stack: string[]
  sections: { code, heading, body, figure? }[]  // empty = no detail page
}
```

`sections` is an ordered array rather than fixed problem/approach/outcome fields, because the
strongest stories do not share a shape. DiamondIQ runs Hook → Investigation → Reversal → Rebuild →
Result; a simpler platform runs Problem → Approach → Outcome. A fixed schema would flatten the
difference.

**`sections.length === 0` means no detail page is generated and the card renders without a
case-study link.** This is how platforms still awaiting briefs appear at launch without thin pages
or placeholder copy. Adding `sections` later makes the link and route appear with no other change.

At the time of writing: five entries, three with full case studies (DiamondIQ, Silent Edge, Grey
Horse) and two card-only (extradition tracking, investigator training) pending briefs.

**Grey Horse carries no technology stack chips.** `GREY-HORSE-SHOWCASE.md` §9 forbids naming
internal structure — tables, functions, endpoints, migrations or providers — because naming a live
system on a security company's site invites probing. Its `stack` array is capability-level only.
**§9 also requires sign-off from the practice owner before the project is named publicly**; this
entry must not ship until that is confirmed.

`figure` is a discriminated union: `StatPair` (two contrasting numbers), `Bars` (labelled
horizontal bars), `Diagram` (labelled flow steps).

## Visual design

Follows the established marketing grammar exactly: `~ / work` mono breadcrumb → Inter 900 uppercase
headline at `clamp(40px, 8vw, 120px)` with `.glow-text` on the second line → muted lede → hairline
grid → `accent-bg-radial` closing CTA.

Cards use the existing 2px-gap-over-`var(--border)` grid. Each carries the glowing mono code,
right-aligned status chip, uppercase name, mono sector line, summary, metric row, bordered mono
stack chips, and `./case-study --id=<slug> →`.

**Card hover** reuses the hero logo's targeting-bracket language (`.hero-corner`): four accent
brackets snap outward, border lifts toward `--a33`, 2px rise. It reads as targeting, which suits a
security brand, and costs no JavaScript. Gated behind `prefers-reduced-motion`.

Status chips are honest and colour-coded from existing severity tokens: `live` → `--sev-ok`,
`in-training` → `--sev-warn`, `in-development` → `--muted`.

Detail pages render the numbered narrative sections with optional figures, then a spec panel, a
metrics band, prev/next navigation, and the CTA.

**Platforms render in SHEL's palette, not their own.** DiamondIQ's brief offers its sky-blue system
for visual continuity; we decline it. A portfolio that changes palette per project reads as a
template gallery. Product identity is hinted with a small swatch only.

## Claims constraints (binding)

`DIAMONDIQ_SHOWCASE_BRIEF.md` §9 governs all DiamondIQ copy and is reproduced as a comment block in
`content/work.ts` so later edits cannot silently violate it.

Permitted: ~57% across every game; ~67% **backtested** on the 2–3% LOCK tier; the blend outperforms
every individual signal; 8 data sources; predicts every game; accuracy read live from production.

Prohibited: 73% or 74.2% as achieved rates; a standalone 67% headline; presenting LOCK as
live-validated; a 50% coin-flip baseline; any profit or guaranteed-return language; and the
unsubstantiated "3.8x Faster" / "150+ Years Historical Data" claims from the current live landing
page.

The two-number framing (~57% every game / ~67% backtested selective tier) is non-negotiable.

The extradition platform is written at capability level only — chain-of-custody, role segregation,
audit logging — with no operational specifics, routing logic, jurisdictional coverage, or agent
mechanics, because publishing those could expose the people the system protects.

## Error handling

Unknown slug → `notFound()`. Entries without `sections` generate no route, so no empty page can be
reached. Figures are typed unions, so an unhandled variant is a compile error rather than a blank
block. External links carry `rel="noopener noreferrer"`.

## Testing

Verification is `next build` — it type-checks the content module against the components and proves
every intended route generates. Note `next.config.ts` sets `ignoreBuildErrors: true`, so a clean
build alone does not prove type-correctness; types must be checked explicitly with `tsc --noEmit`
scoped to the new files, and the generated route list inspected rather than assumed.

Manual check: index renders five cards, exactly the entries with `sections` link through, both
detail pages render, accent switching recolours the section, and layout holds at 360px, 768px and
1440px.
