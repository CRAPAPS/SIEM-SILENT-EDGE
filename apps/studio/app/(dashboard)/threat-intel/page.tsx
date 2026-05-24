"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const [expandedIoc, setExpandedIoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [lookupValue, setLookupValue] = useState("");
  const [lookupResult, setLookupResult] = useState<SearchResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: iocData }, { data: kevData }, { data: logData }] = await Promise.all([
      supabase
        .from("threat_telemetry")
        .select("id,source,ioc_type,ioc_value,threat_name,malware_family,adversary_group,tags,confidence,geo_country,mitre_technique_ids,first_seen,last_seen")
        .order("last_seen", { ascending: false })
        .limit(100),
      supabase
        .from("cisa_kev_entries")
        .select("cve_id,vendor_project,product,vulnerability_name,date_added,due_date,required_action")
        .order("date_added", { ascending: false })
        .limit(20),
      supabase
        .from("threat_feed_sync_log")
        .select("source,iocs_added,iocs_updated,error,duration_ms,synced_at")
        .order("synced_at", { ascending: false })
        .limit(50),
    ]);

    setIocs((iocData ?? []) as IOC[]);
    setKevEntries((kevData ?? []) as KevEntry[]);

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

      {/* ── A. Feed Status ──────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ FEED STATUS ]
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.5rem" }}>
          {ALL_SOURCES.map((src) => {
            const log = syncLogs.find((l) => l.source === src);
            const hasError = !!log?.error;
            return (
              <div key={src} style={{ background: "var(--surface)", border: `1px solid ${hasError ? "var(--sev-alert)" : "var(--border)"}`, borderRadius: "4px", padding: "0.75rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
                  {SOURCE_LABELS[src] ?? src}
                </div>
                {log ? (
                  <>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "13px", fontWeight: 700, color: hasError ? "var(--sev-alert)" : "var(--accent)" }}>
                      {hasError ? "ERROR" : `+${log.iocs_added}`}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>
                      {relativeTime(log.synced_at)}{log.duration_ms != null ? ` · ${log.duration_ms}ms` : ""}
                    </div>
                    {hasError && (
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--sev-alert)", marginTop: "4px", wordBreak: "break-all" }}>
                        {log.error?.slice(0, 60)}
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

      {/* ── D. IOC Lookup ───────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ IOC LOOKUP ]
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input
            ref={inputRef}
            type="text"
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="IP, domain, hash, URL, or CVE-ID..."
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
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--sev-crit)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>CISA KEV</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: 700 }}>{lookupResult.cisa_kev.vulnerability_name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: "4px" }}>
                  {lookupResult.cisa_kev.vendor_project} / {lookupResult.cisa_kev.product} · Due: {lookupResult.cisa_kev.due_date ?? "N/A"}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--fg)", marginTop: "4px" }}>{lookupResult.cisa_kev.required_action}</div>
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
                  {m.geo_country && (
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)" }}>{m.geo_country}</span>
                  )}
                </div>
                {lookupResult.techniques
                  .filter((t) => m.mitre_technique_ids?.includes(t.technique_id))
                  .map((t) => (
                    <span key={t.technique_id} style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--sev-warn)", marginRight: "0.5rem", display: "inline-block", marginTop: "4px" }}>
                      {t.technique_id} {t.name} [{t.tactic}]
                    </span>
                  ))}
              </div>
            ))}

            {lookupResult.total === 0 && !lookupResult.cisa_kev && (
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
                No threat intelligence found. IOC may be clean or not yet ingested.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── B. IOC Table ────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ LATEST IOCs — {iocs.length} ENTRIES ]
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["TYPE", "VALUE", "THREAT / FAMILY", "CONF", "SOURCE", "COUNTRY", "MITRE", "LAST SEEN"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>loading...</td></tr>
              ) : iocs.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                  No IOCs yet — deploy and invoke threat-feed-aggregator to populate.
                </td></tr>
              ) : iocs.map((ioc) => (
                <>
                  <tr
                    key={ioc.id}
                    onClick={() => setExpandedIoc(expandedIoc === ioc.id ? null : ioc.id)}
                    style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: expandedIoc === ioc.id ? "var(--surface)" : "transparent" }}
                  >
                    <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.06em" }}>{ioc.ioc_type.toUpperCase()}</td>
                    <td style={{ padding: "0.4rem 0.6rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ioc.ioc_value}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}>{ioc.malware_family ?? ioc.threat_name ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                    <td style={{ padding: "0.4rem 0.6rem" }}><span style={{ color: confidenceColor(ioc.confidence), fontWeight: 700 }}>{ioc.confidence}</span></td>
                    <td style={{ padding: "0.4rem 0.6rem", color: "var(--accent)", fontSize: "9px" }}>{SOURCE_LABELS[ioc.source] ?? ioc.source}</td>
                    <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)" }}>{ioc.geo_country ?? "—"}</td>
                    <td style={{ padding: "0.4rem 0.6rem", color: "var(--sev-warn)", fontSize: "9px" }}>
                      {ioc.mitre_technique_ids?.length > 0 ? ioc.mitre_technique_ids.slice(0, 2).join(", ") : "—"}
                    </td>
                    <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "10px" }}>
                      {ioc.last_seen ? relativeTime(ioc.last_seen) : "—"}
                    </td>
                  </tr>
                  {expandedIoc === ioc.id && (
                    <tr key={`${ioc.id}-exp`} style={{ background: "var(--surface)" }}>
                      <td colSpan={8} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem", fontSize: "10px", fontFamily: "var(--mono)" }}>
                          <div><span style={{ color: "var(--muted)" }}>VALUE: </span>{ioc.ioc_value}</div>
                          {ioc.adversary_group && <div><span style={{ color: "var(--muted)" }}>ADVERSARY: </span>{ioc.adversary_group}</div>}
                          {ioc.first_seen && <div><span style={{ color: "var(--muted)" }}>FIRST SEEN: </span>{new Date(ioc.first_seen).toLocaleDateString()}</div>}
                          {ioc.tags?.length > 0 && <div><span style={{ color: "var(--muted)" }}>TAGS: </span>{ioc.tags.join(", ")}</div>}
                          {ioc.mitre_technique_ids?.length > 0 && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <span style={{ color: "var(--muted)" }}>MITRE TECHNIQUES: </span>
                              <span style={{ color: "var(--sev-warn)" }}>{ioc.mitre_technique_ids.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── C. CISA KEV Panel ───────────────────────────────────────────────── */}
      <section>
        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          [ CISA KNOWN EXPLOITED VULNERABILITIES — LATEST {kevEntries.length} ]
        </div>
        {loading ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>loading...</div>
        ) : kevEntries.length === 0 ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
            No KEV entries — deploy and invoke cisa-kev-sync to populate.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["CVE ID", "PRODUCT", "VULNERABILITY", "DATE ADDED", "DUE DATE", "ACTION"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kevEntries.map((kev) => {
                  const overdue = isOverdue(kev.due_date);
                  return (
                    <tr key={kev.cve_id} style={{ borderBottom: "1px solid var(--border)", color: overdue ? "var(--sev-crit)" : "var(--fg)" }}>
                      <td style={{ padding: "0.4rem 0.6rem", fontWeight: overdue ? 700 : 400 }}>{kev.cve_id}</td>
                      <td style={{ padding: "0.4rem 0.6rem", color: overdue ? "inherit" : "var(--muted)" }}>
                        {kev.vendor_project} / {kev.product}
                      </td>
                      <td style={{ padding: "0.4rem 0.6rem", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {kev.vulnerability_name}
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
