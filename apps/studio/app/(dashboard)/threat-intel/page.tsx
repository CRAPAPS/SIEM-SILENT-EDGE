"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ── Types ─────────────────────────────────────────────────────────────────────

type MitreTechnique = {
  technique_id: string;
  name: string;
  tactic: string;
  tactic_id: string;
  description: string | null;
};

type IOC = {
  id: string;
  source: string;
  ioc_type: string;
  ioc_value: string;
  threat_name: string | null;
  malware_family: string | null;
  adversary_group: string | null;
  tags: string[];
  confidence: number;
  geo_country: string | null;
  mitre_technique_ids: string[];
  first_seen: string | null;
  last_seen: string | null;
};

type KevEntry = {
  cve_id: string;
  vendor_project: string | null;
  product: string | null;
  vulnerability_name: string | null;
  short_description: string | null;
  date_added: string | null;
  due_date: string | null;
  required_action: string | null;
};

type SyncLog = {
  source: string;
  iocs_added: number;
  iocs_updated: number;
  error: string | null;
  duration_ms: number | null;
  synced_at: string;
};

type SearchResult = {
  ioc: string;
  type: string | null;
  matches: IOC[];
  techniques: { technique_id: string; name: string; tactic: string }[];
  cisa_kev: KevEntry | null;
  total: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  otx:          "AlienVault OTX",
  misp:         "MISP",
  threatfox:    "ThreatFox",
  urlhaus:      "URLhaus",
  feodo:        "Feodo Tracker",
  cisa_kev:     "CISA KEV",
  mitre_attack: "MITRE ATT&CK",
  manual:       "Manual",
};

const ALL_SOURCES = ["otx", "threatfox", "urlhaus", "feodo", "cisa_kev", "mitre_attack", "misp"];

const TACTIC_COLORS: Record<string, string> = {
  "reconnaissance":       "#7b8fa6",
  "resource-development": "#7b8fa6",
  "initial-access":       "#ff5155",
  "execution":            "#ff2222",
  "persistence":          "#ff8800",
  "privilege-escalation": "#ffaa00",
  "defense-evasion":      "#ccaa00",
  "credential-access":    "#ff4400",
  "discovery":            "#3d7eff",
  "lateral-movement":     "#ff5500",
  "collection":           "#aa44ff",
  "command-and-control":  "#ff2222",
  "exfiltration":         "#ff0055",
  "impact":               "#ff0000",
};

const TACTIC_SHORT: Record<string, string> = {
  "reconnaissance":       "RECON",
  "resource-development": "RSRC DEV",
  "initial-access":       "INIT ACCESS",
  "execution":            "EXECUTION",
  "persistence":          "PERSISTENCE",
  "privilege-escalation": "PRIV ESC",
  "defense-evasion":      "DEF EVASION",
  "credential-access":    "CRED ACCESS",
  "discovery":            "DISCOVERY",
  "lateral-movement":     "LATERAL MOV",
  "collection":           "COLLECTION",
  "command-and-control":  "C2",
  "exfiltration":         "EXFIL",
  "impact":               "IMPACT",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function confidenceColor(c: number): string {
  if (c >= 80) return "var(--sev-crit)";
  if (c >= 60) return "var(--sev-alert)";
  if (c >= 40) return "var(--sev-warn)";
  return "var(--muted)";
}

function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return new Date(due) < new Date();
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ThreatIntelPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [iocs, setIocs] = useState<IOC[]>([]);
  const [kevEntries, setKevEntries] = useState<KevEntry[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [mitreMap, setMitreMap] = useState<Map<string, MitreTechnique>>(new Map());
  const [expandedIoc, setExpandedIoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [lookupValue, setLookupValue] = useState("");
  const [lookupResult, setLookupResult] = useState<SearchResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: iocData }, { data: kevData }, { data: logData }, { data: mitreData }] = await Promise.all([
      supabase
        .from("threat_telemetry")
        .select("id,source,ioc_type,ioc_value,threat_name,malware_family,adversary_group,tags,confidence,geo_country,mitre_technique_ids,first_seen,last_seen")
        .order("last_seen", { ascending: false })
        .limit(500),
      supabase
        .from("cisa_kev_entries")
        .select("cve_id,vendor_project,product,vulnerability_name,short_description,date_added,due_date,required_action")
        .order("date_added", { ascending: false })
        .limit(50),
      supabase
        .from("threat_feed_sync_log")
        .select("source,iocs_added,iocs_updated,error,duration_ms,synced_at")
        .order("synced_at", { ascending: false })
        .limit(100),
      supabase
        .from("mitre_techniques")
        .select("technique_id,name,tactic,tactic_id,description")
        .limit(1000),
    ]);

    setIocs((iocData ?? []) as IOC[]);
    setKevEntries((kevData ?? []) as KevEntry[]);

    // Build MITRE lookup map: technique_id → technique details
    const mmap = new Map<string, MitreTechnique>();
    for (const t of (mitreData ?? []) as MitreTechnique[]) {
      mmap.set(t.technique_id, t);
    }
    setMitreMap(mmap);

    // Keep only latest log per source
    const latestBySource: Record<string, SyncLog> = {};
    for (const log of (logData ?? []) as SyncLog[]) {
      if (!latestBySource[log.source]) latestBySource[log.source] = log;
    }
    setSyncLogs(Object.values(latestBySource));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleLookup() {
    const val = lookupValue.trim();
    if (!val) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/threat-feed/search?ioc=${encodeURIComponent(val)}`);
      const data = await res.json() as SearchResult & { error?: string };
      if (!res.ok) {
        setLookupError(data.error ?? "Search failed");
      } else {
        setLookupResult(data);
      }
    } catch {
      setLookupError("Network error");
    } finally {
      setLookupLoading(false);
    }
  }

  // Derived: filtered IOCs
  const filteredIocs = iocs.filter((ioc) => {
    if (sourceFilter !== "all" && ioc.source !== sourceFilter) return false;
    if (typeFilter !== "all" && ioc.ioc_type !== typeFilter) return false;
    return true;
  });

  // Stats
  const sourceCounts = iocs.reduce<Record<string, number>>((acc, ioc) => {
    acc[ioc.source] = (acc[ioc.source] ?? 0) + 1;
    return acc;
  }, {});
  const typeCounts = iocs.reduce<Record<string, number>>((acc, ioc) => {
    acc[ioc.ioc_type] = (acc[ioc.ioc_type] ?? 0) + 1;
    return acc;
  }, {});
  const tacticSet = new Set<string>();
  for (const ioc of iocs) {
    for (const tid of (ioc.mitre_technique_ids ?? [])) {
      const t = mitreMap.get(tid);
      if (t) tacticSet.add(t.tactic);
    }
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          SILENT EDGE // THREAT INTELLIGENCE
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
          THREAT FEED ENGINE
        </h1>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      {!loading && iocs.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: "1px",
          background: "var(--border)",
          marginBottom: "1.5rem",
        }}>
          {[
            { label: "TOTAL IOCs", value: iocs.length },
            { label: "IPs", value: typeCounts["ip"] ?? 0 },
            { label: "DOMAINS", value: typeCounts["domain"] ?? 0 },
            { label: "HASHES", value: typeCounts["hash"] ?? 0 },
            { label: "URLs", value: typeCounts["url"] ?? 0 },
            { label: "TACTICS", value: tacticSet.size },
            { label: "KEV CVEs", value: kevEntries.length },
            { label: "MITRE DB", value: mitreMap.size },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--surface)", padding: "0.5rem 0.75rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "18px", fontWeight: 700, color: "var(--accent)", marginTop: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Feed Status ─────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ FEED STATUS ]
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem" }}>
          {ALL_SOURCES.map((src) => {
            const log = syncLogs.find((l) => l.source === src);
            const hasError = !!log?.error;
            const isSelfHosted = src === "misp" && !log;
            return (
              <div key={src} style={{
                background: "var(--surface)",
                border: `1px solid ${hasError ? "var(--sev-alert)" : "var(--border)"}`,
                borderRadius: "4px",
                padding: "0.75rem",
                opacity: isSelfHosted ? 0.55 : 1,
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
                  {SOURCE_LABELS[src] ?? src}
                </div>
                {isSelfHosted ? (
                  <>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, color: "var(--muted)" }}>SELF-HOSTED</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.4 }}>
                      Set MISP_URL + MISP_AUTH_KEY in .env to connect your MISP instance
                    </div>
                  </>
                ) : log ? (
                  <>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "13px", fontWeight: 700, color: hasError ? "var(--sev-alert)" : "var(--accent)" }}>
                      {hasError ? "ERROR" : `+${log.iocs_added}`}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>
                      {relativeTime(log.synced_at)}{log.duration_ms != null ? ` · ${log.duration_ms}ms` : ""}
                    </div>
                    {log.iocs_updated > 0 && !hasError && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", marginTop: "2px" }}>{log.iocs_updated} updated</div>
                    )}
                    {hasError && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--sev-alert)", marginTop: "4px", wordBreak: "break-all" }}>
                        {log.error?.slice(0, 80)}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>
                    {loading ? "loading..." : "never synced"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── IOC / CVE Lookup ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ IOC / CVE LOOKUP ]
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input
            ref={inputRef}
            type="text"
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="IP, domain, hash, URL, CVE-ID, or MITRE T-ID..."
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "0.5rem 0.75rem",
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--fg)",
              outline: "none",
            }}
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !lookupValue.trim()}
            style={{
              background: "transparent",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              fontWeight: 700,
              padding: "0.5rem 1rem",
              cursor: lookupLoading ? "not-allowed" : "pointer",
              borderRadius: "3px",
              letterSpacing: "0.06em",
              opacity: lookupLoading ? 0.5 : 1,
            }}
          >
            {lookupLoading ? "..." : "QUERY"}
          </button>
        </div>

        {lookupError && (
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--sev-alert)", padding: "0.5rem", border: "1px solid var(--sev-alert)", borderRadius: "3px" }}>
            {lookupError}
          </div>
        )}

        {lookupResult && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", marginBottom: "0.5rem" }}>
              {lookupResult.total} match{lookupResult.total !== 1 ? "es" : ""} for{" "}
              <span style={{ color: "var(--accent)" }}>{lookupResult.ioc}</span>
            </div>

            {lookupResult.cisa_kev && (
              <div style={{ border: "1px solid var(--sev-crit)", borderRadius: "3px", padding: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--sev-crit)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                  CISA KEV — KNOWN EXPLOITED VULNERABILITY
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: 700 }}>{lookupResult.cisa_kev.vulnerability_name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                  {lookupResult.cisa_kev.vendor_project} / {lookupResult.cisa_kev.product}
                  {lookupResult.cisa_kev.due_date && ` · Due: ${lookupResult.cisa_kev.due_date}`}
                </div>
                {lookupResult.cisa_kev.short_description && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)", marginTop: "4px", opacity: 0.8 }}>
                    {lookupResult.cisa_kev.short_description}
                  </div>
                )}
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--sev-warn)", marginTop: "4px" }}>
                  ACTION: {lookupResult.cisa_kev.required_action}
                </div>
              </div>
            )}

            {lookupResult.techniques.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
                  MITRE ATT&CK TECHNIQUES
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {lookupResult.techniques.map((t) => (
                    <span key={t.technique_id} style={{
                      fontFamily: "var(--mono)",
                      fontSize: "9px",
                      background: "var(--bg-2)",
                      border: `1px solid ${TACTIC_COLORS[t.tactic] ?? "var(--border)"}`,
                      color: TACTIC_COLORS[t.tactic] ?? "var(--fg)",
                      padding: "2px 7px",
                      borderRadius: "2px",
                    }}>
                      {t.technique_id} · {t.name} [{TACTIC_SHORT[t.tactic] ?? t.tactic.toUpperCase()}]
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lookupResult.matches.map((m) => (
              <div key={m.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "2px" }}>
                    {SOURCE_LABELS[m.source] ?? m.source}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700 }}>
                    {m.threat_name ?? m.malware_family ?? "—"}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: confidenceColor(m.confidence) }}>
                    CONF {m.confidence}%
                  </span>
                  {m.geo_country && <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>{m.geo_country}</span>}
                  {m.adversary_group && (
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--sev-alert)" }}>
                      ACTOR: {m.adversary_group}
                    </span>
                  )}
                </div>
                {m.tags?.length > 0 && (
                  <div style={{ marginTop: "4px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {m.tags.map((tag) => (
                      <span key={tag} style={{ fontFamily: "var(--mono)", fontSize: "8px", background: "var(--bg-2)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "2px", color: "var(--muted)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {lookupResult.total === 0 && !lookupResult.cisa_kev && (
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
                No threat intelligence found for this indicator.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── IOC Table ───────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em" }}>
            [ IOCs — {filteredIocs.length} / {iocs.length} ]
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Source filter */}
            <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
              {(["all", "otx", "threatfox", "urlhaus", "feodo"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  style={{
                    background: sourceFilter === src ? "var(--bg-3)" : "var(--bg-2)",
                    color: sourceFilter === src ? "var(--accent)" : "var(--muted)",
                    border: "none",
                    padding: "3px 10px",
                    fontFamily: "var(--mono)",
                    fontSize: "9px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {src === "all" ? `ALL (${iocs.length})` : `${(SOURCE_LABELS[src] ?? src).split(" ")[0]} (${sourceCounts[src] ?? 0})`}
                </button>
              ))}
            </div>
            {/* Type filter */}
            <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
              {(["all", "ip", "domain", "url", "hash"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    background: typeFilter === t ? "var(--bg-3)" : "var(--bg-2)",
                    color: typeFilter === t ? "var(--accent)" : "var(--muted)",
                    border: "none",
                    padding: "3px 10px",
                    fontFamily: "var(--mono)",
                    fontSize: "9px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {t === "all" ? "ALL TYPES" : `${t.toUpperCase()} (${typeCounts[t] ?? 0})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["TYPE", "INDICATOR", "THREAT / FAMILY", "CONF", "SOURCE", "COUNTRY", "TACTIC", "ATT&CK IDs", "SEEN"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>loading...</td></tr>
              ) : filteredIocs.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                  {iocs.length === 0
                    ? "No IOCs yet — invoke threat-feed-aggregator edge function to populate."
                    : "No IOCs match current filters."}
                </td></tr>
              ) : filteredIocs.map((ioc) => {
                const techniques = (ioc.mitre_technique_ids ?? [])
                  .map((tid) => mitreMap.get(tid))
                  .filter((t): t is MitreTechnique => !!t);
                const primaryTactic = techniques[0]?.tactic ?? null;
                const tacticColor = primaryTactic ? (TACTIC_COLORS[primaryTactic] ?? "var(--muted)") : "var(--muted)";

                return (
                  <>
                    <tr
                      key={ioc.id}
                      onClick={() => setExpandedIoc(expandedIoc === ioc.id ? null : ioc.id)}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: expandedIoc === ioc.id ? "var(--surface)" : "transparent" }}
                    >
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{ioc.ioc_type.toUpperCase()}</td>
                      <td style={{ padding: "0.4rem 0.6rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ioc.ioc_value}>{ioc.ioc_value}</td>
                      <td style={{ padding: "0.4rem 0.6rem", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ioc.malware_family ?? ioc.threat_name ?? <span style={{ color: "var(--muted)" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem" }}>
                        <span style={{ color: confidenceColor(ioc.confidence), fontWeight: 700 }}>{ioc.confidence}</span>
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--accent)", fontSize: "9px", whiteSpace: "nowrap" }}>
                        {SOURCE_LABELS[ioc.source] ?? ioc.source}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{ioc.geo_country ?? "—"}</td>
                      <td style={{ padding: "0.4rem 0.6rem", whiteSpace: "nowrap" }}>
                        {primaryTactic ? (
                          <span style={{
                            fontSize: "8px",
                            color: tacticColor,
                            border: `1px solid ${tacticColor}`,
                            padding: "1px 4px",
                            borderRadius: "2px",
                          }}>
                            {TACTIC_SHORT[primaryTactic] ?? primaryTactic.toUpperCase()}
                          </span>
                        ) : <span style={{ color: "var(--muted)" }}>—</span>}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--sev-warn)", fontSize: "9px", whiteSpace: "nowrap" }}>
                        {techniques.length > 0
                          ? techniques.slice(0, 2).map((t) => t.technique_id).join(", ") + (techniques.length > 2 ? ` +${techniques.length - 2}` : "")
                          : "—"}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "10px", whiteSpace: "nowrap" }}>
                        {ioc.last_seen ? relativeTime(ioc.last_seen) : "—"}
                      </td>
                    </tr>
                    {expandedIoc === ioc.id && (
                      <tr key={`${ioc.id}-exp`} style={{ background: "var(--surface)" }}>
                        <td colSpan={9} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem", fontSize: "10px", fontFamily: "var(--mono)", marginBottom: "0.5rem" }}>
                            <div><span style={{ color: "var(--muted)" }}>IOC: </span>{ioc.ioc_value}</div>
                            {ioc.adversary_group && (
                              <div><span style={{ color: "var(--muted)" }}>ADVERSARY: </span><span style={{ color: "var(--sev-alert)" }}>{ioc.adversary_group}</span></div>
                            )}
                            {ioc.first_seen && (
                              <div><span style={{ color: "var(--muted)" }}>FIRST SEEN: </span>{new Date(ioc.first_seen).toLocaleDateString()}</div>
                            )}
                            {ioc.last_seen && (
                              <div><span style={{ color: "var(--muted)" }}>LAST SEEN: </span>{new Date(ioc.last_seen).toLocaleDateString()}</div>
                            )}
                          </div>
                          {ioc.tags?.length > 0 && (
                            <div style={{ marginBottom: "0.5rem", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {ioc.tags.map((tag) => (
                                <span key={tag} style={{ fontFamily: "var(--mono)", fontSize: "8px", background: "var(--bg-2)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "2px", color: "var(--muted)" }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {techniques.length > 0 && (
                            <div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
                                MITRE ATT&CK TECHNIQUES
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                                {techniques.map((t) => (
                                  <span
                                    key={t.technique_id}
                                    title={t.description ?? ""}
                                    style={{
                                      fontFamily: "var(--mono)",
                                      fontSize: "9px",
                                      background: "var(--bg-2)",
                                      border: `1px solid ${TACTIC_COLORS[t.tactic] ?? "var(--border)"}`,
                                      color: TACTIC_COLORS[t.tactic] ?? "var(--fg)",
                                      padding: "2px 7px",
                                      borderRadius: "2px",
                                      cursor: "default",
                                    }}
                                  >
                                    {t.technique_id} · {t.name} · {TACTIC_SHORT[t.tactic] ?? t.tactic.toUpperCase()} ({t.tactic_id})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CISA KEV Panel ──────────────────────────────────────────────────── */}
      <section>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ CISA KNOWN EXPLOITED VULNERABILITIES — LATEST {kevEntries.length} ]
        </div>
        {loading ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>loading...</div>
        ) : kevEntries.length === 0 ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
            No KEV entries — deploy and invoke cisa-kev-sync edge function to populate.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["CVE ID", "PRODUCT", "VULNERABILITY", "DESCRIPTION", "DATE ADDED", "DUE DATE", "ACTION"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kevEntries.map((kev) => {
                  const overdue = isOverdue(kev.due_date);
                  return (
                    <tr key={kev.cve_id} style={{ borderBottom: "1px solid var(--border)", color: overdue ? "var(--sev-crit)" : "var(--fg)" }}>
                      <td style={{ padding: "0.4rem 0.6rem", fontWeight: overdue ? 700 : 400, whiteSpace: "nowrap" }}>{kev.cve_id}</td>
                      <td style={{ padding: "0.4rem 0.6rem", color: overdue ? "inherit" : "var(--muted)", whiteSpace: "nowrap" }}>
                        {kev.vendor_project} / {kev.product}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {kev.vulnerability_name}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted)", fontSize: "10px" }}>
                        {kev.short_description ?? "—"}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{kev.date_added ?? "—"}</td>
                      <td style={{ padding: "0.4rem 0.6rem", whiteSpace: "nowrap" }}>
                        {kev.due_date ?? "—"}
                        {overdue && <span style={{ marginLeft: "4px", fontSize: "8px", letterSpacing: "0.1em" }}> OVERDUE</span>}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {kev.required_action}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
