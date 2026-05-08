"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAccent } from "./accent";

/* ─── NetworkGraph SVG ─────────────────────────────────────────────────────── */
function NetworkGraph() {
  const { accent, aa } = useAccent();
  const nodes = useMemo<[number, number][]>(() => {
    let x = 7;
    const rng = () => (x = (x * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: 38 }, () => [rng() * 1400, rng() * 900]);
  }, []);
  const edges: [number, number, number][] = useMemo(() => {
    const e: [number, number, number][] = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
        if (d < 110) e.push([i, j, d]);
      }
    return e;
  }, [nodes]);
  return (
    <svg viewBox="0 0 1400 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      {edges.map(([a, b, d], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={aa(0.4)} strokeWidth={0.5} opacity={1 - d / 110}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill={accent} opacity={0.7} />
      ))}
    </svg>
  );
}

/* ─── LogStream ─────────────────────────────────────────────────────────────── */
const LOGS = [
  { sev: "INFO",  ts: "04:12:07", msg: "edr.agent 8f2c · heartbeat ok" },
  { sev: "WARN",  ts: "04:12:09", msg: "auth.failed · 203.0.113.44 · user=admin (3/5)" },
  { sev: "INFO",  ts: "04:12:11", msg: "firewall.block · tcp/22 · 10 events" },
  { sev: "ALERT", ts: "04:12:14", msg: "beacon detected · host=fin-07 · C2 candidate" },
  { sev: "INFO",  ts: "04:12:15", msg: "playbook P-204 dispatched · analyst=K.M." },
  { sev: "WARN",  ts: "04:12:18", msg: "new-device enroll · hr-laptop-22" },
  { sev: "INFO",  ts: "04:12:21", msg: "ti.feed synced · 2,418 iocs" },
  { sev: "OK",    ts: "04:12:24", msg: "host fin-07 isolated · artefacts collected" },
  { sev: "INFO",  ts: "04:12:27", msg: "ticket #4421 opened · p2" },
  { sev: "WARN",  ts: "04:12:30", msg: "dns.anomaly · tld=.ru · 12 queries" },
  { sev: "OK",    ts: "04:12:34", msg: "incident closed · MTTR 00:04:12" },
];

function sevColor(sev: string) {
  if (sev === "ALERT" || sev === "CRIT") return "var(--sev-alert)";
  if (sev === "WARN") return "var(--sev-warn)";
  if (sev === "OK")   return "var(--sev-ok)";
  return "var(--accent)";
}

function LogStream() {
  const [shown, setShown] = useState(LOGS.slice(0, 5));
  useEffect(() => {
    let i = 5;
    const t = setInterval(() => {
      i = (i + 1) % LOGS.length;
      setShown((s) => [...s.slice(-8), LOGS[i]]);
    }, 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", lineHeight: 1.65, color: "rgba(230,240,235,0.68)" }}>
      {shown.map((l, i) => (
        <div key={i} style={{
          opacity: 0.35 + (i / shown.length) * 0.65,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          <span style={{ color: sevColor(l.sev), marginRight: 8 }}>{l.sev}</span>
          <span style={{ color: "rgba(230,240,235,0.4)", marginRight: 8 }}>{l.ts}</span>
          {l.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Hero Logo ─────────────────────────────────────────────────────────────── */
function HeroLogo() {
  return (
    <div className="hero-logo-root" aria-hidden>
      {/* Outer rotating ring */}
      <div className="hero-ring-outer" />
      {/* Inner counter-rotating ring */}
      <div className="hero-ring-inner" />
      {/* Cardinal spark nodes */}
      <span className="hero-spark hero-spark-n" />
      <span className="hero-spark hero-spark-e" />
      <span className="hero-spark hero-spark-s" />
      <span className="hero-spark hero-spark-w" />
      {/* Targeting corner brackets */}
      <span className="hero-corner hero-corner-tl" />
      <span className="hero-corner hero-corner-tr" />
      <span className="hero-corner hero-corner-bl" />
      <span className="hero-corner hero-corner-br" />
      {/* Logo image — octagonal clip, accent drop-shadow */}
      <div className="hero-logo-glow">
        <div className="hero-logo-octa">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shel-logo.jpg" alt="" />
        </div>
      </div>
    </div>
  );
}

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const SERVICES = [
  {
    id: "siem", code: "01", title: "SIEM Incident Response",
    tags: ["Splunk", "Wazuh", "Elastic", "Sentinel"],
    body: "Ingest from every endpoint, firewall and cloud service. Correlate events in real time. When something lights up, our analysts move — containment, forensics, remediation — before the blast radius grows.",
  },
  {
    id: "saas", code: "02", title: "Security as a Service",
    tags: ["24/7 SOC", "MDR", "Playbooks", "SLA-backed"],
    body: "A managed SOC running around the clock. Tier 1 triage, Tier 2 investigation, Tier 3 hunt — remote, affordable, and staffed by analysts who have done this for a living.",
  },
  {
    id: "network", code: "03", title: "Network Security",
    tags: ["Zero Trust", "NDR", "Segmentation", "IDS/IPS"],
    body: "Architecture review, segmentation, firewall tuning, zero-trust rollout. Networks designed to assume breach and survive it — with telemetry dense enough to see the attacker move.",
  },
  {
    id: "threat", code: "04", title: "Threat Intelligence",
    tags: ["MITRE ATT&CK", "IOC feeds", "Dark web", "ML triage"],
    body: "Curated feeds, dark-web monitoring, TTP mapping to MITRE ATT&CK. Your team sees what is coming — not what already hit — and the playbook to respond is in hand.",
  },
];

const WHY = [
  { t: "Holistic coverage",  d: "Network, endpoint, identity, cloud. One partner, one pane of glass." },
  { t: "Priced for SMEs",    d: "Enterprise-grade posture without the enterprise invoice." },
  { t: "Partnered operator", d: "Alliances with Thiink VP and ThiinkTANK extend our reach." },
  { t: "ML-augmented",       d: "Modern detection stack — signatures alone are not enough." },
];

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { accent, aa } = useAccent();

  const cliBtn = (filled: boolean): React.CSSProperties => ({
    fontFamily: "var(--mono)", fontSize: "clamp(11px, 1.5vw, 13px)",
    letterSpacing: "1.5px", fontWeight: 700,
    background: filled ? "var(--accent)" : "transparent",
    color: filled ? "#001a10" : "var(--fg)",
    border: filled ? "none" : "1px solid var(--border)",
    padding: "14px 22px", cursor: "pointer",
    boxShadow: filled ? "0 0 32px var(--a55)" : "none",
    textDecoration: "none", display: "inline-block",
    whiteSpace: "nowrap",
  });

  return (
    <>
      {/* ══ Hero ══════════════════════════════════════════════════════════════ */}
      <section className="mkt-hero" style={{ position: "relative", overflow: "hidden", background: "var(--bg)" }}>
        {/* Network graph */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.22, filter: "blur(0.5px)" }}>
          <NetworkGraph />
        </div>
        {/* Grid overlay */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
        }} />

        <div className="mkt-max" style={{ position: "relative" }}>
          {/* ── Upper: headline left · logo right (desktop only) ── */}
          <div className="mkt-hero-upper">
            <div className="hero-headline-col">
              {/* Tag */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16,
                fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)",
                letterSpacing: 3, marginBottom: 28,
              }}>
                <span style={{
                  width: 8, height: 8, background: "var(--accent)", borderRadius: 4,
                  boxShadow: "0 0 12px var(--a88)", display: "inline-block", flexShrink: 0,
                }} />
                [ managed_soc · incident_response · threat_intel ]
              </div>
              {/* Cinematic headline */}
              <h1 style={{
                fontFamily: "var(--sans)",
                fontSize: "clamp(68px, 18vw, 160px)",
                lineHeight: 0.88, fontWeight: 900, letterSpacing: "-0.03em",
                margin: 0, textTransform: "uppercase",
              }}>
                <span style={{ display: "block" }}>Fortify</span>
                <span style={{ display: "block" }}>your</span>
                <span style={{ display: "block" }}>digital</span>
                <span className="glow-text" style={{ display: "block" }}>empire.</span>
              </h1>
            </div>
            <div className="hero-logo-col">
              <HeroLogo />
            </div>
          </div>

          {/* ── Lower: subhead/CTAs left, terminal right ── */}
          <div className="mkt-hero-grid" style={{ marginTop: 56 }}>
            <div>
              <p style={{
                fontSize: "clamp(15px, 2vw, 19px)",
                color: "rgba(244,246,245,0.7)", lineHeight: 1.55, maxWidth: 540, margin: 0,
              }}>
                A 24/7 SOC for teams that cannot afford to miss the alert. We watch, triage, and
                respond — so your people can keep shipping.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
                <Link href="/contact" style={cliBtn(true)}>./get-protection ◢</Link>
                <Link href="/services" style={cliBtn(false)}>book-assessment --free</Link>
              </div>
              {/* CLI prompt */}
              <div style={{ marginTop: 40, fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", letterSpacing: 1 }}>
                <span style={{ color: "var(--accent)" }}>analyst@soc-01</span> ~ %{" "}
                <span style={{ color: "var(--fg)" }}>tail -f /var/log/soc.stream</span>
                <span style={{
                  display: "inline-block", width: 8, height: 14, background: "var(--accent)",
                  marginLeft: 6, verticalAlign: "middle",
                  animation: "noir-blink 1s steps(1) infinite",
                }} />
              </div>
            </div>

            {/* Live terminal card */}
            <div style={{
              background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 3,
              overflow: "hidden", boxShadow: "0 0 0 1px var(--a10), 0 24px 60px rgba(0,0,0,0.6)",
            }}>
              <div style={{
                padding: "10px 14px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--muted)",
                letterSpacing: "1.5px", background: "var(--bg-3)",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 4, background: "var(--accent)",
                  boxShadow: "0 0 6px var(--a88)", display: "inline-block", flexShrink: 0,
                }} />
                <span>LIVE · SOC-01 · stream.json</span>
                <span style={{ marginLeft: "auto", color: "var(--accent)" }}>◉ REC</span>
              </div>
              <div style={{ padding: 16, minHeight: 220 }}>
                <LogStream />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Ticker ════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", overflow: "hidden", background: "var(--bg-2)" }}>
        <div className="mkt-ticker-track">
          {[0, 1].map((r) => (
            <span key={r} style={{ display: "flex", gap: 60, flexShrink: 0 }}>
              <span>▸ 14.2M EVENTS / DAY</span>
              <span style={{ color: "var(--accent)" }}>▸ MTTR 00:04:12</span>
              <span>▸ TIER-3 COVERAGE 24/7</span>
              <span style={{ color: "var(--accent)" }}>▸ 40+ CLIENTS</span>
              <span>▸ 0 OPEN BREACHES</span>
              <span style={{ color: "var(--accent)" }}>▸ SPLUNK · WAZUH · ELASTIC · SENTINEL</span>
              <span>▸ MITRE ATT&CK MAPPED</span>
              <span style={{ color: "var(--accent)" }}>▸ ML-AUGMENTED TRIAGE</span>
            </span>
          ))}
        </div>
      </section>

      {/* ══ Services — editorial rows ════════════════════════════════════════ */}
      <section className="mkt-section mkt-pad" style={{ background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 24 }}>
            # services.manifest
          </div>
          <h2 style={{
            fontFamily: "var(--sans)",
            fontSize: "clamp(52px, 13vw, 120px)",
            fontWeight: 900, letterSpacing: "-0.03em",
            margin: "0 0 clamp(32px, 5vw, 64px)", lineHeight: 0.9,
            textTransform: "uppercase",
          }}>
            Four<br />disciplines.<br /><span className="glow-text">One team.</span>
          </h2>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
            letterSpacing: "1.5px", marginBottom: 24, paddingLeft: 4,
          }}>
            [ 04 / 04 active ]
          </div>

          {SERVICES.map((s) => (
            <div key={s.id} className="mkt-svc-row">
              <div className="svc-code glow-text" style={{
                fontFamily: "var(--mono)",
                fontSize: "clamp(40px, 10vw, 64px)",
                fontWeight: 900,
                letterSpacing: -2, lineHeight: 1,
              }}>
                {s.code}
              </div>
              <div>
                <h3 style={{
                  fontSize: "clamp(28px, 8vw, 44px)", fontWeight: 900,
                  letterSpacing: -1, margin: 0, textTransform: "uppercase", lineHeight: 1.05,
                }}>
                  {s.title}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                  {s.tags.map((t) => (
                    <span key={t} style={{
                      fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)",
                      border: "1px solid var(--border)", padding: "5px 10px", letterSpacing: "1.5px",
                    }}>
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="svc-desc">
                <p style={{ fontSize: "clamp(14px, 1.5vw, 17px)", color: "rgba(244,246,245,0.75)", lineHeight: 1.65, margin: 0 }}>
                  {s.body}
                </p>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: "1.5px", marginTop: 20 }}>
                  <Link href={`/services#${s.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                    ./learn-more --svc={s.id} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ Why — Operators. Not resellers. ══════════════════════════════════ */}
      <section className="mkt-section mkt-pad" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <div className="mkt-max">
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 3, marginBottom: 24 }}>
            # why.us
          </div>
          <h2 style={{
            fontFamily: "var(--sans)",
            fontSize: "clamp(44px, 11vw, 96px)",
            fontWeight: 900, letterSpacing: "-0.03em",
            margin: "0 0 clamp(40px, 5vw, 80px)", lineHeight: 0.9,
            textTransform: "uppercase",
          }}>
            Operators.<br /><span className="glow-text">Not</span> resellers.
          </h2>

          <div className="mkt-why-grid">
            {WHY.map((w, i) => (
              <div key={w.t} style={{ background: "var(--bg)", padding: "clamp(28px, 4vw, 48px) clamp(20px, 3vw, 40px)", minHeight: 180 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: 2, marginBottom: 20 }}>
                  0{i + 1} /
                </div>
                <div style={{ fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 700, letterSpacing: -0.6, marginBottom: 14, textTransform: "uppercase" }}>
                  {w.t}
                </div>
                <div style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "var(--muted)", lineHeight: 1.65, maxWidth: 420 }}>
                  {w.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section className="mkt-section mkt-pad" style={{ textAlign: "center", position: "relative", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <div className="accent-bg-radial" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", letterSpacing: 3, marginBottom: 32 }}>
            <span style={{ color: "var(--muted)" }}>root@shel</span> ~ %{" "}
            <span style={{ color: "var(--accent)" }}>./initiate --client=you</span>
          </div>
          <h2 style={{
            fontFamily: "var(--sans)",
            fontSize: "clamp(52px, 13vw, 140px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: 0,
            lineHeight: 0.9, textTransform: "uppercase",
            maxWidth: 1200, marginInline: "auto",
          }}>
            Watch the{" "}
            <span className="glow-text">dark</span>,<br />
            so you can sleep.
          </h2>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: "clamp(28px, 4vw, 48px)", flexWrap: "wrap" }}>
            <Link href="/contact" style={cliBtn(true)}>./get-protection ◢</Link>
            <Link href="/contact" style={cliBtn(false)}>schedule-a-call</Link>
          </div>
        </div>
      </section>
    </>
  );
}
