"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

/* ── Design tokens (mirroring CSS vars for inline usage) ── */
const bg  = "#050607";
const bg2 = "#0a0c0e";
const bg3 = "#0e1113";
const fg  = "#f4f6f5";
const muted  = "rgba(244,246,245,0.5)";
const border = "rgba(244,246,245,0.08)";

/* ── NetworkGraph ── */
function NetworkGraph({ stroke, dot }: { stroke: string; dot: string }) {
  const nodes = useMemo(() => {
    let x = 7;
    const rng = () => (x = (x * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: 38 }, (): [number, number] => [rng() * 1400, rng() * 900]);
  }, []);

  const edges: [number, number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
      if (d < 110) edges.push([i, j, d]);
    }
  }

  return (
    <svg viewBox="0 0 1400 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      {edges.map(([a, b, d], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={stroke} strokeWidth={0.5} opacity={1 - d / 110}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill={dot} opacity={0.7} />
      ))}
    </svg>
  );
}

/* ── LogStream ── */
const SAMPLE_LOGS = [
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

function sevColor(sev: string, accent: string) {
  if (sev === "ALERT" || sev === "CRIT") return "#ff5155";
  if (sev === "WARN") return "#ffaa00";
  if (sev === "OK") return "#00e28a";
  return accent;
}

function LogStream({ accent }: { accent: string }) {
  const [shown, setShown] = useState(SAMPLE_LOGS.slice(0, 5));
  useEffect(() => {
    let i = 5;
    const t = setInterval(() => {
      i = (i + 1) % SAMPLE_LOGS.length;
      setShown((s) => [...s.slice(-8), SAMPLE_LOGS[i]]);
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, lineHeight: 1.65, color: "rgba(230,240,235,0.68)" }}>
      {shown.map((l, i) => (
        <div key={i} style={{
          opacity: 0.35 + (i / shown.length) * 0.65,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          <span style={{ color: sevColor(l.sev, accent), marginRight: 8 }}>{l.sev}</span>
          <span style={{ color: "rgba(230,240,235,0.4)", marginRight: 8 }}>{l.ts}</span>
          {l.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Data ── */
const SERVICES = [
  {
    id: "siem", code: "01", title: "SIEM Incident Response",
    tags: ["Splunk", "Wazuh", "Elastic", "Sentinel"],
    body: "Ingest from every endpoint, firewall and cloud service. Correlate events in real time. When something lights up, our analysts move — containment, forensics, remediation — before the blast radius grows.",
  },
  {
    id: "saas", code: "02", title: "Security as a Service",
    tags: ["24/7 SOC", "MDR", "Playbooks", "SLA-backed"],
    body: "A managed Security Operations Center running around the clock. Tier 1 triage, Tier 2 investigation, Tier 3 hunt — remote, affordable, and staffed by analysts who have done this for a living.",
  },
  {
    id: "network", code: "03", title: "Network Security",
    tags: ["Zero Trust", "NDR", "Segmentation", "IDS/IPS"],
    body: "Architecture review, segmentation, firewall tuning, zero-trust rollout. We design networks that assume breach and survive it — with telemetry dense enough to see the attacker move.",
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

/* ── Page ── */
export default function HomePage() {
  const [accent, setAccent] = useState("#3d7eff");

  useEffect(() => {
    const stored = localStorage.getItem("se-accent");
    if (stored) setAccent(stored);
    const handler = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      if (v) setAccent(v);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const cliBtn = (filled: boolean) => ({
    fontFamily: "var(--mono)", fontSize: 13, letterSpacing: 1.5, fontWeight: 700,
    background: filled ? accent : "transparent",
    color: filled ? "#001a10" : fg,
    border: filled ? "none" : `1px solid ${border}`,
    padding: "16px 24px", cursor: "pointer",
    boxShadow: filled ? `0 0 32px ${accent}55` : "none",
    textDecoration: "none", display: "inline-block",
  } as React.CSSProperties);

  return (
    <>
      {/* ── Hero ── */}
      <section style={{ padding: "64px 48px 100px", position: "relative", overflow: "hidden", background: bg }}>
        {/* Network graph bg */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.22, filter: "blur(0.5px)" }}>
          <NetworkGraph stroke={`${accent}66`} dot={accent} />
        </div>
        {/* Grid overlay */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(${border} 1px, transparent 1px), linear-gradient(90deg, ${border} 1px, transparent 1px)`,
          backgroundSize: "96px 96px",
        }} />

        <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
          {/* Tag line */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "var(--mono)", fontSize: 11, color: accent, letterSpacing: 3, marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, background: accent, borderRadius: 4, boxShadow: `0 0 12px ${accent}`, display: "inline-block" }} />
            [ managed_soc · incident_response · threat_intel ]
          </div>

          {/* Cinematic headline */}
          <h1 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(56px, 10vw, 160px)",
            lineHeight: 0.88, fontWeight: 900, letterSpacing: "-0.03em",
            margin: 0, textTransform: "uppercase",
          }}>
            <span style={{ display: "block" }}>Fortify your</span>
            <span style={{ display: "block", color: accent, textShadow: `0 0 40px ${accent}88` }}>
              digital empire.
            </span>
          </h1>

          {/* Subhead + CTAs + terminal panel */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, marginTop: 56, alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 19, color: "rgba(244,246,245,0.7)", lineHeight: 1.5, maxWidth: 540, margin: 0 }}>
                A 24/7 SOC for teams that cannot afford to miss the alert. We watch, triage, and
                respond — so your people can keep shipping.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
                <Link href="/contact" style={cliBtn(true)}>./get-protection ◢</Link>
                <Link href="/services" style={cliBtn(false)}>book-assessment --free</Link>
              </div>

              {/* CLI prompt */}
              <div style={{ marginTop: 40, fontFamily: "var(--mono)", fontSize: 12, color: muted, letterSpacing: 1 }}>
                <span style={{ color: accent }}>analyst@soc-01</span> ~ %{" "}
                <span style={{ color: fg }}>tail -f /var/log/soc.stream</span>
                <span style={{
                  display: "inline-block", width: 8, height: 14,
                  background: accent, marginLeft: 6, verticalAlign: "middle",
                  animation: "noir-blink 1s steps(1) infinite",
                }} />
              </div>
            </div>

            {/* Live terminal card */}
            <div style={{
              background: bg2, border: `1px solid ${border}`, borderRadius: 3,
              overflow: "hidden", boxShadow: `0 0 0 1px ${accent}10, 0 24px 60px rgba(0,0,0,0.6)`,
            }}>
              <div style={{
                padding: "10px 14px", borderBottom: `1px solid ${border}`,
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: "var(--mono)", fontSize: 10.5, color: muted,
                letterSpacing: 1.5, background: bg3,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: accent, boxShadow: `0 0 6px ${accent}`, display: "inline-block" }} />
                <span>LIVE · SOC-01 · stream.json</span>
                <span style={{ marginLeft: "auto", color: accent }}>◉ REC</span>
              </div>
              <div style={{ padding: "16px", minHeight: 230 }}>
                <LogStream accent={accent} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker strip ── */}
      <section style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, overflow: "hidden", background: bg2 }}>
        <div style={{
          display: "flex", gap: 60, padding: "18px 0", whiteSpace: "nowrap",
          fontFamily: "var(--mono)", fontSize: 12, color: muted, letterSpacing: 2,
          animation: "noir-tick 40s linear infinite",
        }}>
          {[0, 1].map((r) => (
            <span key={r} style={{ display: "flex", gap: 60 }}>
              <span>▸ 14.2M EVENTS / DAY</span>
              <span style={{ color: accent }}>▸ MTTR 00:04:12</span>
              <span>▸ TIER-3 COVERAGE 24/7</span>
              <span style={{ color: accent }}>▸ 40+ CLIENTS</span>
              <span>▸ 0 OPEN BREACHES</span>
              <span style={{ color: accent }}>▸ SPLUNK · WAZUH · ELASTIC · SENTINEL</span>
              <span>▸ MITRE ATT&CK MAPPED</span>
              <span style={{ color: accent }}>▸ ML-AUGMENTED TRIAGE</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── Services — editorial stacked ── */}
      <section style={{ padding: "140px 48px 60px", background: bg }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: accent, letterSpacing: 3, marginBottom: 24 }}>
            # services.manifest
          </div>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(40px, 8vw, 120px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 64px",
            lineHeight: 0.9, textTransform: "uppercase", maxWidth: 1100,
          }}>
            Four<br />disciplines.<br /><span style={{ color: accent }}>One team.</span>
          </h2>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: muted, letterSpacing: 1.5, marginBottom: 24, paddingLeft: 4 }}>
            [ 04 / 04 active ]
          </div>

          {SERVICES.map((s) => (
            <div key={s.id} style={{
              display: "grid", gridTemplateColumns: "120px 1fr 1fr", gap: 56,
              padding: "56px 0", borderTop: `1px solid ${border}`, alignItems: "start",
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "clamp(32px, 4vw, 64px)",
                fontWeight: 900, color: accent, letterSpacing: -2,
                lineHeight: 1, textShadow: `0 0 24px ${accent}44`,
              }}>
                {s.code}
              </div>
              <div>
                <h3 style={{
                  fontSize: "clamp(24px, 3vw, 44px)", fontWeight: 900,
                  letterSpacing: -1.2, margin: 0, textTransform: "uppercase", lineHeight: 1,
                }}>
                  {s.title}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
                  {s.tags.map((t) => (
                    <span key={t} style={{
                      fontFamily: "var(--mono)", fontSize: 10, color: muted,
                      border: `1px solid ${border}`, padding: "5px 10px", letterSpacing: 1.5,
                    }}>
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 17, color: "rgba(244,246,245,0.75)", lineHeight: 1.6, margin: 0 }}>
                  {s.body}
                </p>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: accent, letterSpacing: 1.5, marginTop: 20 }}>
                  <Link href={`/services#${s.id}`} style={{ color: accent, textDecoration: "none" }}>
                    ./learn-more --svc={s.id} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why — Operators. Not resellers. ── */}
      <section style={{ padding: "140px 48px", borderTop: `1px solid ${border}`, background: bg }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: accent, letterSpacing: 3, marginBottom: 24 }}>
            # why.us
          </div>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(36px, 6vw, 96px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 80px",
            lineHeight: 0.9, textTransform: "uppercase", maxWidth: 1000,
          }}>
            Operators.<br /><span style={{ color: accent }}>Not</span> resellers.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: border }}>
            {WHY.map((w, i) => (
              <div key={w.t} style={{ background: bg, padding: "48px 40px", minHeight: 220 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: accent, letterSpacing: 2, marginBottom: 20 }}>
                  0{i + 1} /
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 16, textTransform: "uppercase" }}>
                  {w.t}
                </div>
                <div style={{ fontSize: 15, color: muted, lineHeight: 1.6, maxWidth: 420 }}>
                  {w.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "140px 48px", textAlign: "center", position: "relative", borderTop: `1px solid ${border}`, background: bg }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(circle at 50% 50%, ${accent}15 0%, transparent 60%)`,
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: accent, letterSpacing: 3, marginBottom: 32 }}>
            <span style={{ color: muted }}>root@shel</span> ~ %{" "}
            <span style={{ color: accent }}>./initiate --client=you</span>
          </div>
          <h2 style={{
            fontFamily: "var(--sans)", fontSize: "clamp(44px, 9vw, 140px)",
            fontWeight: 900, letterSpacing: "-0.03em", margin: 0,
            lineHeight: 0.9, textTransform: "uppercase", maxWidth: 1200, marginInline: "auto",
          }}>
            Watch the <span style={{ color: accent, textShadow: `0 0 40px ${accent}88` }}>dark</span>,<br />
            so you can sleep.
          </h2>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
            <Link href="/contact" style={cliBtn(true)}>./get-protection ◢</Link>
            <Link href="/contact" style={cliBtn(false)}>schedule-a-call</Link>
          </div>
        </div>
      </section>
    </>
  );
}
