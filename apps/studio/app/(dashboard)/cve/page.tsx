"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

// ── NVD Types ─────────────────────────────────────────────────────────────────

type CvssV3 = {
  baseScore: number;
  baseSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  vectorString: string;
};

type NvdCve = {
  id: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  descriptions: { lang: string; value: string }[];
  metrics?: {
    cvssMetricV31?: { cvssData: CvssV3 }[];
    cvssMetricV30?: { cvssData: CvssV3 }[];
    cvssMetricV2?: { cvssData: { baseScore: number; baseSeverity: string } }[];
  };
  weaknesses?: { description: { lang: string; value: string }[] }[];
  references?: { url: string; source: string; tags?: string[] }[];
};

type NvdResponse = {
  totalResults: number;
  resultsPerPage: number;
  vulnerabilities: { cve: NvdCve }[];
  error?: string;
};

// ── Supabase types ────────────────────────────────────────────────────────────

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

// ── Response Plan Templates ───────────────────────────────────────────────────

type ResponseStep = { order: number; phase: string; title: string; description: string };

const RESPONSE_TEMPLATES: Record<string, ResponseStep[]> = {
  default: [
    { order: 1, phase: "IDENTIFY",   title: "Confirm Scope",         description: "Verify the CVE applies to your environment. Check product versions, OS, and configurations against the affected software list." },
    { order: 2, phase: "CONTAIN",    title: "Isolate If Exploited",  description: "If active exploitation is suspected, isolate affected hosts via SentinelOne disconnect or network ACLs. Preserve memory and disk state for forensics." },
    { order: 3, phase: "ASSESS",     title: "Impact Assessment",     description: "Determine blast radius: which systems are exposed? Is the vulnerability network-reachable? Does it require authentication? Check CVSS attack vector." },
    { order: 4, phase: "PATCH",      title: "Apply Vendor Fix",      description: "Apply the vendor-supplied patch or configuration mitigation. Validate patch integrity via hash. Test in staging before production rollout." },
    { order: 5, phase: "VERIFY",     title: "Confirm Remediation",   description: "Re-run vulnerability scan post-patch. Confirm CVE no longer appears. Check EDR telemetry for IOCs associated with this CVE." },
    { order: 6, phase: "DOCUMENT",   title: "Incident Record",       description: "Log the CVE, affected assets, patch date, and approver. Update asset inventory with new software versions. Notify clients if applicable." },
  ],
  rce: [
    { order: 1, phase: "URGENT",     title: "Emergency Isolation",   description: "RCE vulnerabilities require immediate host isolation. Disconnect from network NOW. Preserve evidence before remediation." },
    { order: 2, phase: "FORENSICS",  title: "Process & Network Dump", description: "Capture running processes, network connections, and scheduled tasks. Check for webshells, new user accounts, and backdoors installed post-exploitation." },
    { order: 3, phase: "HUNT",       title: "Lateral Movement Hunt", description: "Search for lateral movement from compromised host. Check DNS requests, SMB connections, and auth events. Query SIEM for similar patterns across fleet." },
    { order: 4, phase: "ERADICATE",  title: "Remove Implants",       description: "Identify and remove all persistence mechanisms: startup items, cron jobs, registry run keys, webshells. Rotate all credentials on affected system." },
    { order: 5, phase: "REBUILD",    title: "Clean Restore",         description: "Restore from last known-clean backup. Re-image if compromise depth is unknown. Apply patch before reconnecting to network." },
    { order: 6, phase: "VERIFY",     title: "Confirm Clean",         description: "Run endpoint scan, network scan, and integrity check. Monitor for 72 hours. Update firewall rules to block the exploitation vector." },
  ],
  sqli: [
    { order: 1, phase: "IDENTIFY",   title: "Audit DB Access Logs",  description: "Pull database audit logs for the affected application. Look for anomalous queries: UNION selects, stacked queries, time-based delays." },
    { order: 2, phase: "ASSESS",     title: "Data Exposure Check",   description: "Determine what data the attacker could access. Map DB schema: PII, credentials, API keys. Check for exfiltration via DNS or HTTP." },
    { order: 3, phase: "CONTAIN",    title: "WAF Block",             description: "Enable WAF rules for SQLi patterns on the affected endpoint. Consider temporary takedown if exploitation is confirmed." },
    { order: 4, phase: "PATCH",      title: "Parameterize Queries",  description: "Apply vendor patch or implement parameterized queries / prepared statements. Code review for all user-supplied input to DB." },
    { order: 5, phase: "NOTIFY",     title: "Breach Assessment",     description: "If PII or credentials were exposed, initiate breach notification process. Rotate all DB credentials. Notify DPO." },
    { order: 6, phase: "MONITOR",    title: "Extended Monitoring",   description: "Enable enhanced DB logging for 30 days. Set alerts for off-hours queries and large result sets. Retest the endpoint." },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function cvssColor(score: number): string {
  if (score >= 9.0) return "#ff2222";
  if (score >= 7.0) return "#ff5155";
  if (score >= 4.0) return "#ffaa00";
  if (score >= 0.1) return "#3d7eff";
  return "var(--muted)";
}

function severityLabel(score: number): string {
  if (score >= 9.0) return "CRITICAL";
  if (score >= 7.0) return "HIGH";
  if (score >= 4.0) return "MEDIUM";
  if (score >= 0.1) return "LOW";
  return "NONE";
}

function getCvss(cve: NvdCve): { score: number; version: string } | null {
  const v31 = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
  if (v31) return { score: v31.baseScore, version: "3.1" };
  const v30 = cve.metrics?.cvssMetricV30?.[0]?.cvssData;
  if (v30) return { score: v30.baseScore, version: "3.0" };
  const v2 = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
  if (v2) return { score: v2.baseScore, version: "2.0" };
  return null;
}

function getDescription(cve: NvdCve): string {
  return cve.descriptions.find((d) => d.lang === "en")?.value ?? "";
}

function guessTemplate(cve: NvdCve): string {
  const desc = getDescription(cve).toLowerCase();
  if (desc.includes("remote code execution") || desc.includes("arbitrary code")) return "rce";
  if (desc.includes("sql injection") || desc.includes("sqli")) return "sqli";
  return "default";
}

function relDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Phase color map ───────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  IDENTIFY:  "#3d7eff",
  URGENT:    "#ff2222",
  CONTAIN:   "#ff5155",
  ASSESS:    "#ffaa00",
  FORENSICS: "#cc44ff",
  HUNT:      "#ff8800",
  PATCH:     "#00e28a",
  ERADICATE: "#ff4400",
  REBUILD:   "#00b366",
  VERIFY:    "#3d7eff",
  DOCUMENT:  "#7b8fa6",
  NOTIFY:    "#ffaa00",
  MONITOR:   "#3d7eff",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CvePage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [tab, setTab] = useState<"search" | "kev" | "plan">("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NvdCve[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [kevEntries, setKevEntries] = useState<KevEntry[]>([]);
  const [kevMap, setKevMap] = useState<Map<string, KevEntry>>(new Map());
  const [kevLoading, setKevLoading] = useState(true);

  const [selected, setSelected] = useState<NvdCve | null>(null);
  const [planSteps, setPlanSteps] = useState<ResponseStep[]>(RESPONSE_TEMPLATES.default!);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("cisa_kev_entries")
      .select("cve_id,vendor_project,product,vulnerability_name,short_description,date_added,due_date,required_action")
      .order("date_added", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const entries = (data ?? []) as KevEntry[];
        setKevEntries(entries);
        const m = new Map<string, KevEntry>();
        for (const e of entries) m.set(e.cve_id, e);
        setKevMap(m);
        setKevLoading(false);
      });
  }, [supabase]);

  const handleSearch = useCallback(async () => {
    const val = query.trim();
    if (!val) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelected(null);

    try {
      const isCveId = /^CVE-\d{4}-\d+$/i.test(val);
      const url = isCveId
        ? `/api/cve?cveId=${encodeURIComponent(val)}`
        : `/api/cve?keyword=${encodeURIComponent(val)}&limit=20`;
      const res = await fetch(url);
      const data = await res.json() as NvdResponse;
      if (data.error) {
        setSearchError(data.error);
      } else {
        setSearchResults((data.vulnerabilities ?? []).map((v) => v.cve));
        setSearchTotal(data.totalResults ?? 0);
      }
    } catch {
      setSearchError("Failed to reach NVD API");
    } finally {
      setSearching(false);
    }
  }, [query]);

  function selectCve(cve: NvdCve) {
    setSelected(cve);
    const template = guessTemplate(cve);
    setPlanSteps(RESPONSE_TEMPLATES[template] ?? RESPONSE_TEMPLATES.default!);
    setActiveStep(null);
    setTab("plan");
  }

  function selectKevAsCve(kev: KevEntry) {
    const synthetic: NvdCve = {
      id: kev.cve_id,
      published: kev.date_added ?? "",
      lastModified: kev.date_added ?? "",
      vulnStatus: "Known Exploited",
      descriptions: [{ lang: "en", value: `${kev.vulnerability_name ?? ""} — ${kev.short_description ?? ""}` }],
      references: [],
    };
    setSelected(synthetic);
    setPlanSteps(RESPONSE_TEMPLATES.default!);
    setActiveStep(null);
    setTab("plan");
  }

  const cvss = selected ? getCvss(selected) : null;
  const kevEntry = selected ? kevMap.get(selected.id) : null;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
          SILENT EDGE // VULNERABILITY INTELLIGENCE
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
          CVE DATABASE
        </h1>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "1.5rem" }}>
        {[
          { label: "CISA KEV", value: kevEntries.length, note: "KNOWN EXPLOITED" },
          { label: "NVD RESULTS", value: searchTotal > 0 ? searchTotal : "—", note: "LAST SEARCH" },
          { label: "RESPONSE PLANS", value: Object.keys(RESPONSE_TEMPLATES).length, note: "TEMPLATES" },
          { label: "NVD COVERAGE", value: "229K+", note: "TOTAL CVEs" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", padding: "0.5rem 0.75rem" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "18px", fontWeight: 700, color: "var(--accent)", marginTop: 1 }}>{s.value}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "7px", color: "var(--muted)", letterSpacing: "0.06em", marginTop: 1 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "1px", background: "var(--border)", width: "fit-content", marginBottom: "1.5rem" }}>
        {([
          { key: "search", label: "◎ NVD SEARCH" },
          { key: "kev",    label: "⚠ CISA KEV" },
          { key: "plan",   label: "◈ RESPONSE PLAN" + (selected ? ` — ${selected.id}` : "") },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: tab === key ? "var(--bg-3)" : "var(--bg-2)",
              color: tab === key ? "var(--fg)" : "var(--muted)",
              border: "none",
              padding: "0.375rem 1rem",
              fontFamily: "var(--mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              cursor: "pointer",
              borderBottom: tab === key ? "1px solid var(--accent)" : "1px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── NVD SEARCH TAB ──────────────────────────────────────────────────── */}
      {tab === "search" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="CVE-2024-1234  or  log4j  or  apache  or  ssh..."
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
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              style={{
                background: "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontFamily: "var(--mono)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "0.5rem 1.25rem",
                cursor: searching ? "not-allowed" : "pointer",
                borderRadius: "3px",
                letterSpacing: "0.06em",
                opacity: searching ? 0.5 : 1,
              }}
            >
              {searching ? "..." : "SEARCH NVD"}
            </button>
          </div>

          {searchError && (
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--sev-alert)", padding: "0.5rem", border: "1px solid var(--sev-alert)", borderRadius: "3px", marginBottom: "1rem" }}>
              {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
              {searchTotal} RESULTS — SHOWING {searchResults.length} · CLICK ROW TO GENERATE RESPONSE PLAN
            </div>
          )}

          {searchResults.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["CVE ID", "SEVERITY", "SCORE", "PUBLISHED", "STATUS", "KEV", "DESCRIPTION"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((cve) => {
                    const c = getCvss(cve);
                    const kev = kevMap.has(cve.id);
                    return (
                      <tr
                        key={cve.id}
                        onClick={() => selectCve(cve)}
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: selected?.id === cve.id ? "var(--surface)" : "transparent" }}
                      >
                        <td style={{ padding: "0.4rem 0.6rem", fontWeight: 700, whiteSpace: "nowrap", color: c ? cvssColor(c.score) : "var(--fg)" }}>
                          {cve.id}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", whiteSpace: "nowrap" }}>
                          {c ? (
                            <span style={{ fontSize: "8px", color: cvssColor(c.score), border: `1px solid ${cvssColor(c.score)}`, padding: "1px 5px", borderRadius: "2px", letterSpacing: "0.06em" }}>
                              {severityLabel(c.score)}
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", color: c ? cvssColor(c.score) : "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {c?.score.toFixed(1) ?? "—"}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "10px" }}>
                          {cve.published ? relDate(cve.published) : "—"}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", fontSize: "9px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {cve.vulnStatus}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", whiteSpace: "nowrap" }}>
                          {kev && (
                            <span style={{ fontSize: "8px", color: "var(--sev-crit)", border: "1px solid var(--sev-crit)", padding: "1px 5px", borderRadius: "2px", letterSpacing: "0.06em" }}>
                              KEV
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>
                          {getDescription(cve)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            !searching && !searchError && (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "32px", color: "var(--border)", marginBottom: "1rem" }}>◈</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  SEARCH THE NATIONAL VULNERABILITY DATABASE
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", opacity: 0.6, lineHeight: 1.8 }}>
                  Search by CVE ID (CVE-2024-1234) or keyword (log4j, apache httpd, openssl)<br />
                  Select any result to auto-generate a tailored incident response plan
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── CISA KEV TAB ────────────────────────────────────────────────────── */}
      {tab === "kev" && (
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            {kevEntries.length} KNOWN EXPLOITED VULNERABILITIES · CLICK ROW TO GENERATE RESPONSE PLAN
          </div>
          {kevLoading ? (
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", padding: "2rem", textAlign: "center" }}>loading...</div>
          ) : kevEntries.length === 0 ? (
            <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)" }}>
              No KEV entries — deploy cisa-kev-sync edge function to populate.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["CVE ID", "VENDOR / PRODUCT", "VULNERABILITY", "DESCRIPTION", "DATE ADDED", "DUE DATE", "ACTION"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: "var(--muted)", fontSize: "9px", letterSpacing: "0.08em", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kevEntries.map((kev) => {
                    const overdue = kev.due_date ? new Date(kev.due_date) < new Date() : false;
                    return (
                      <tr
                        key={kev.cve_id}
                        onClick={() => selectKevAsCve(kev)}
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", color: overdue ? "var(--sev-crit)" : "var(--fg)" }}
                      >
                        <td style={{ padding: "0.4rem 0.6rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          <span style={{ border: "1px solid var(--sev-crit)", color: "var(--sev-crit)", fontSize: "8px", padding: "1px 4px", borderRadius: "2px", marginRight: 6, letterSpacing: "0.06em" }}>KEV</span>
                          {kev.cve_id}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "10px" }}>
                          {kev.vendor_project} / {kev.product}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {kev.vulnerability_name ?? "—"}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted)", fontSize: "10px" }}>
                          {kev.short_description ?? "—"}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", color: "var(--muted)", whiteSpace: "nowrap", fontSize: "10px" }}>
                          {kev.date_added ?? "—"}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", whiteSpace: "nowrap", fontSize: "10px" }}>
                          {kev.due_date ?? "—"}
                          {overdue && <span style={{ marginLeft: 4, fontSize: "7px", letterSpacing: "0.1em" }}>OVERDUE</span>}
                        </td>
                        <td style={{ padding: "0.4rem 0.6rem", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--muted)", fontSize: "10px" }}>
                          {kev.required_action ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RESPONSE PLAN TAB ───────────────────────────────────────────────── */}
      {tab === "plan" && (
        <div>
          {!selected ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "32px", color: "var(--border)", marginBottom: "1rem" }}>◈</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted)", marginBottom: "0.5rem" }}>
                NO CVE SELECTED
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", opacity: 0.6, lineHeight: 1.8 }}>
                Search a CVE or select from CISA KEV to auto-generate an incident response plan.<br />
                Plans are auto-tailored: RCE → emergency isolation workflow, SQLi → audit + notify workflow.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* CVE detail panel */}
              <div style={{ flex: "0 0 320px", minWidth: 0 }}>
                <div style={{
                  background: "var(--surface)",
                  border: `1px solid ${cvss ? cvssColor(cvss.score) : "var(--border)"}`,
                  borderRadius: "4px",
                  padding: "1rem",
                  marginBottom: "1rem",
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                    {kevEntry ? "⚠ CISA KEV — KNOWN EXPLOITED" : "NVD ENTRY"}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "14px", fontWeight: 700, color: cvss ? cvssColor(cvss.score) : "var(--accent)", marginBottom: "0.5rem" }}>
                    {selected.id}
                  </div>

                  {cvss && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 700, color: cvssColor(cvss.score) }}>
                        {cvss.score.toFixed(1)}
                      </span>
                      <div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.08em", color: cvssColor(cvss.score) }}>
                          {severityLabel(cvss.score)}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)" }}>CVSSv{cvss.version}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                    {getDescription(selected)}
                  </div>

                  {selected.weaknesses && selected.weaknesses.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>WEAKNESSES</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {selected.weaknesses.flatMap((w) => w.description.filter((d) => d.lang === "en")).map((d, i) => (
                          <span key={i} style={{ fontFamily: "var(--mono)", fontSize: "8px", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: "2px", color: "var(--muted)" }}>
                            {d.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {kevEntry && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--sev-crit)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>CISA REQUIRED ACTION</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--fg)", lineHeight: 1.6 }}>
                        {kevEntry.required_action}
                      </div>
                      {kevEntry.due_date && (
                        <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--sev-warn)", marginTop: 4 }}>
                          DUE: {kevEntry.due_date}{new Date(kevEntry.due_date) < new Date() ? " — OVERDUE" : ""}
                        </div>
                      )}
                    </div>
                  )}

                  {selected.references && selected.references.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>REFERENCES</div>
                      {selected.references.slice(0, 4).map((ref, i) => (
                        <div key={i} style={{ marginBottom: 3 }}>
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--accent)", textDecoration: "none", wordBreak: "break-all" }}>
                            {ref.url.length > 55 ? ref.url.slice(0, 55) + "…" : ref.url}
                          </a>
                          {ref.tags && ref.tags.length > 0 && (
                            <span style={{ fontFamily: "var(--mono)", fontSize: "7px", color: "var(--muted)", marginLeft: 4 }}>
                              [{ref.tags.join(", ")}]
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Template selector */}
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>RESPONSE TEMPLATE</div>
                  <div style={{ display: "flex", gap: "1px", background: "var(--border)" }}>
                    {Object.keys(RESPONSE_TEMPLATES).map((key) => {
                      const active = planSteps === RESPONSE_TEMPLATES[key] || JSON.stringify(planSteps) === JSON.stringify(RESPONSE_TEMPLATES[key]);
                      return (
                        <button
                          key={key}
                          onClick={() => { setPlanSteps(RESPONSE_TEMPLATES[key]!); setActiveStep(null); }}
                          style={{
                            background: active ? "var(--bg-3)" : "var(--bg-2)",
                            color: active ? "var(--accent)" : "var(--muted)",
                            border: "none",
                            padding: "3px 10px",
                            fontFamily: "var(--mono)",
                            fontSize: "9px",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Response plan steps */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                  INCIDENT RESPONSE PLAN · {selected.id}
                  {activeStep !== null && (
                    <span style={{ color: "var(--accent)", marginLeft: "1rem" }}>
                      STEP {activeStep + 1} / {planSteps.length} ACTIVE
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {planSteps.map((step, i) => {
                    const isActive = activeStep === i;
                    const isDone = activeStep !== null && i < activeStep;
                    const phaseColor = PHASE_COLORS[step.phase] ?? "var(--muted)";
                    return (
                      <div
                        key={i}
                        onClick={() => setActiveStep(isActive ? null : i)}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          cursor: "pointer",
                          padding: "0.875rem",
                          background: isActive ? "var(--surface)" : "var(--bg-2)",
                          border: `1px solid ${isActive ? phaseColor : isDone ? "rgba(0,226,138,0.3)" : "var(--border)"}`,
                          borderRadius: "2px",
                          transition: "border-color 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 36 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "2px",
                            background: isActive ? phaseColor : isDone ? "rgba(0,226,138,0.15)" : "var(--bg-3)",
                            border: `1px solid ${isActive ? phaseColor : isDone ? "var(--sev-ok)" : "var(--border)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700,
                            color: isActive ? "#fff" : isDone ? "var(--sev-ok)" : "var(--muted)",
                          }}>
                            {isDone ? "✓" : step.order}
                          </div>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "7px", color: phaseColor, letterSpacing: "0.06em", textAlign: "center" }}>
                            {step.phase}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, color: isActive ? "var(--fg)" : "var(--muted)", letterSpacing: "0.04em" }}>
                            {step.title}
                          </div>
                          {(isActive || activeStep === null) && (
                            <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--muted)", marginTop: 4, lineHeight: 1.7 }}>
                              {step.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                  {activeStep === null ? (
                    <button
                      onClick={() => setActiveStep(0)}
                      style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", padding: "8px 20px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", borderRadius: "2px" }}
                    >
                      ◢ BEGIN RESPONSE
                    </button>
                  ) : (
                    <>
                      {activeStep > 0 && (
                        <button onClick={() => setActiveStep((s) => (s ?? 1) - 1)} style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em", padding: "6px 16px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--muted)", cursor: "pointer", borderRadius: "2px" }}>
                          ← PREV
                        </button>
                      )}
                      {activeStep < planSteps.length - 1 ? (
                        <button onClick={() => setActiveStep((s) => (s ?? 0) + 1)} style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em", padding: "6px 16px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", borderRadius: "2px" }}>
                          NEXT STEP →
                        </button>
                      ) : (
                        <button onClick={() => setActiveStep(null)} style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", padding: "6px 16px", border: "none", background: "var(--sev-ok)", color: "#000", cursor: "pointer", borderRadius: "2px" }}>
                          ✓ MARK COMPLETE
                        </button>
                      )}
                      <button onClick={() => setActiveStep(null)} style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--muted)", cursor: "pointer", borderRadius: "2px", marginLeft: "auto" }}>
                        RESET
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelected(null); setActiveStep(null); setTab("search"); }}
                    style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.06em", padding: "6px 12px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--muted)", cursor: "pointer", borderRadius: "2px" }}
                  >
                    ← NEW CVE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
