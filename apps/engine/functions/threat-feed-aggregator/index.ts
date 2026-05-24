import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ── Type definitions ──────────────────────────────────────────────────────────

interface IOCRecord {
  source: string;
  ioc_type: string;
  ioc_value: string;
  threat_name?: string | null;
  malware_family?: string | null;
  adversary_group?: string | null;
  tags?: string[];
  confidence?: number;
  geo_lat?: number | null;
  geo_lon?: number | null;
  geo_country?: string | null;
  first_seen?: string | null;
  last_seen?: string | null;
  pulse_id?: string | null;
  mitre_technique_ids?: string[];
  raw_data?: Record<string, unknown>;
}

interface SyncResult {
  source: string;
  iocs_added: number;
  iocs_updated: number;
  error?: string;
  duration_ms: number;
}

// ── Shared upsert helper ──────────────────────────────────────────────────────

async function upsertIOC(record: IOCRecord): Promise<"added" | "error"> {
  const { error } = await supabase.from("threat_telemetry").upsert({
    source: record.source,
    ioc_type: record.ioc_type,
    ioc_value: record.ioc_value,
    threat_name: record.threat_name ?? null,
    malware_family: record.malware_family ?? null,
    adversary_group: record.adversary_group ?? null,
    tags: record.tags ?? [],
    confidence: record.confidence ?? 50,
    geo_lat: record.geo_lat ?? null,
    geo_lon: record.geo_lon ?? null,
    geo_country: record.geo_country ?? null,
    first_seen: record.first_seen ?? null,
    last_seen: record.last_seen ?? new Date().toISOString(),
    pulse_id: record.pulse_id ?? null,
    mitre_technique_ids: record.mitre_technique_ids ?? [],
    raw_data: record.raw_data ?? {},
  }, {
    onConflict: "source,ioc_type,ioc_value",
    ignoreDuplicates: false,
  });

  return error ? "error" : "added";
}

async function logSync(result: SyncResult) {
  await supabase.from("threat_feed_sync_log").insert({
    source: result.source,
    iocs_added: result.iocs_added,
    iocs_updated: result.iocs_updated,
    error: result.error ?? null,
    duration_ms: result.duration_ms,
  });
}

// ── Alert enrichment ──────────────────────────────────────────────────────────

async function enrichMatchingAlerts(
  iocValue: string,
  iocType: string,
  source: string,
  threatName: string,
) {
  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, raw_data")
    .eq("status", "open")
    .or(`indicator_value.eq.${iocValue},host_ip.eq.${iocValue}`);

  for (const alert of alerts ?? []) {
    const raw = (alert.raw_data ?? {}) as Record<string, unknown>;
    const matches = (raw.threat_matches as unknown[] | undefined) ?? [];
    matches.push({ source, threat_name: threatName, ioc_type: iocType, ioc_value: iocValue });
    await supabase
      .from("alerts")
      .update({ category: "known_threat", raw_data: { ...raw, threat_matches: matches } })
      .eq("id", alert.id);
  }
}

// ── OTX source ────────────────────────────────────────────────────────────────

interface OTXIndicator {
  type: string;
  indicator: string;
  description?: string;
  title?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  created?: string;
}

interface OTXPulse {
  id: string;
  name: string;
  malware_families?: { display_name: string }[];
  tags?: string[];
  adversary?: string;
  attack_ids?: { id: string }[];
  indicators: OTXIndicator[];
}

function otxTypeToIocType(otxType: string): string | null {
  const map: Record<string, string> = {
    IPv4: "ip", IPv6: "ip",
    domain: "domain", hostname: "domain",
    URL: "url",
    "FileHash-MD5": "hash", "FileHash-SHA1": "hash", "FileHash-SHA256": "hash",
    email: "email",
  };
  return map[otxType] ?? null;
}

async function fetchOTX(since: string): Promise<SyncResult> {
  const t0 = Date.now();
  const apiKey = Deno.env.get("OTX_API_KEY");
  if (!apiKey) return { source: "otx", iocs_added: 0, iocs_updated: 0, error: "OTX_API_KEY not set", duration_ms: 0 };

  let added = 0;

  try {
    const url = `https://otx.alienvault.com/api/v1/pulses/subscribed?modified_since=${since}&limit=50`;
    const res = await fetch(url, { headers: { "X-OTX-API-KEY": apiKey } });
    if (!res.ok) throw new Error(`OTX HTTP ${res.status}`);

    const data = await res.json() as { results: OTXPulse[] };
    for (const pulse of data.results ?? []) {
      const malwareFamily = pulse.malware_families?.[0]?.display_name ?? null;
      const mitreIds = (pulse.attack_ids ?? []).map((a) => a.id);

      for (const indicator of pulse.indicators) {
        const iocType = otxTypeToIocType(indicator.type);
        if (!iocType) continue;

        const status = await upsertIOC({
          source: "otx",
          ioc_type: iocType,
          ioc_value: indicator.indicator,
          threat_name: pulse.name ?? indicator.title ?? null,
          malware_family: malwareFamily,
          adversary_group: pulse.adversary ?? null,
          tags: pulse.tags ?? [],
          confidence: 70,
          geo_lat: indicator.latitude ?? null,
          geo_lon: indicator.longitude ?? null,
          geo_country: indicator.country_code ?? null,
          first_seen: indicator.created ?? null,
          pulse_id: pulse.id,
          mitre_technique_ids: mitreIds,
          raw_data: { pulse_name: pulse.name, indicator_type: indicator.type },
        });

        if (status !== "error") {
          added++;
          await enrichMatchingAlerts(indicator.indicator, iocType, "otx", pulse.name);
        }
      }
    }
  } catch (err) {
    return { source: "otx", iocs_added: 0, iocs_updated: 0, error: String(err), duration_ms: Date.now() - t0 };
  }

  return { source: "otx", iocs_added: added, iocs_updated: 0, duration_ms: Date.now() - t0 };
}

// ── MISP source ───────────────────────────────────────────────────────────────

async function fetchMISP(): Promise<SyncResult> {
  const t0 = Date.now();
  const mispUrl = Deno.env.get("MISP_URL");
  const mispKey = Deno.env.get("MISP_AUTH_KEY");
  if (!mispUrl || !mispKey) return { source: "misp", iocs_added: 0, iocs_updated: 0, duration_ms: 0 };

  let added = 0;

  try {
    const res = await fetch(`${mispUrl}/events/restSearch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: mispKey,
        Accept: "application/json",
      },
      body: JSON.stringify({ last: "1d", limit: 100, returnFormat: "json" }),
    });
    if (!res.ok) throw new Error(`MISP HTTP ${res.status}`);

    const mispData = await res.json() as {
      response?: { Event?: { Attribute?: { type: string; value: string; comment?: string }[]; info?: string }[] }[];
    };

    for (const wrapper of mispData.response ?? []) {
      const event = wrapper.Event;
      if (!event) continue;
      for (const attr of event.Attribute ?? []) {
        const iocType = otxTypeToIocType(attr.type);
        if (!iocType) continue;
        const status = await upsertIOC({
          source: "misp",
          ioc_type: iocType,
          ioc_value: attr.value,
          threat_name: event.info ?? null,
          confidence: 80,
          raw_data: { misp_type: attr.type, comment: attr.comment },
        });
        if (status !== "error") added++;
      }
    }
  } catch (err) {
    return { source: "misp", iocs_added: 0, iocs_updated: 0, error: String(err), duration_ms: Date.now() - t0 };
  }

  return { source: "misp", iocs_added: added, iocs_updated: 0, duration_ms: Date.now() - t0 };
}

// ── ThreatFox source (Abuse.ch) ───────────────────────────────────────────────

interface ThreatFoxIOC {
  id: string;
  ioc: string;
  ioc_type: string;
  threat_type: string;
  malware: string;
  malware_printable: string;
  malware_malpedia?: string;
  confidence_level: number;
  first_seen: string;
  last_seen?: string | null;
  reporter?: string;
  tags?: string[] | null;
}

async function fetchThreatFox(): Promise<SyncResult> {
  const t0 = Date.now();
  const apiKey = Deno.env.get("THREATFOX_API_KEY");
  if (!apiKey) return { source: "threatfox", iocs_added: 0, iocs_updated: 0, error: "THREATFOX_API_KEY not set", duration_ms: 0 };

  let added = 0;

  try {
    const res = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Auth-Key": apiKey },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
    });
    if (!res.ok) throw new Error(`ThreatFox HTTP ${res.status}`);

    const data = await res.json() as { query_status: string; data?: ThreatFoxIOC[] };
    if (data.query_status !== "ok" || !data.data) {
      return { source: "threatfox", iocs_added: 0, iocs_updated: 0, duration_ms: Date.now() - t0 };
    }

    const typeMap: Record<string, string> = {
      ip_port: "ip", domain: "domain", url: "url", md5_hash: "hash", sha256_hash: "hash",
    };

    for (const ioc of data.data) {
      const iocType = typeMap[ioc.ioc_type];
      if (!iocType) continue;

      // ip_port is "1.2.3.4:80" — strip port
      const iocValue = iocType === "ip" && ioc.ioc.includes(":") ? ioc.ioc.split(":")[0] : ioc.ioc;

      const status = await upsertIOC({
        source: "threatfox",
        ioc_type: iocType,
        ioc_value: iocValue,
        threat_name: ioc.threat_type,
        malware_family: ioc.malware_printable || ioc.malware,
        tags: ioc.tags ?? [],
        confidence: ioc.confidence_level,
        first_seen: ioc.first_seen,
        last_seen: ioc.last_seen ?? null,
        raw_data: {
          threatfox_id: ioc.id,
          malware_malpedia: ioc.malware_malpedia,
          reporter: ioc.reporter,
        },
      });

      if (status !== "error") {
        added++;
        await enrichMatchingAlerts(iocValue, iocType, "threatfox", ioc.malware_printable);
      }
    }
  } catch (err) {
    return { source: "threatfox", iocs_added: 0, iocs_updated: 0, error: String(err), duration_ms: Date.now() - t0 };
  }

  return { source: "threatfox", iocs_added: added, iocs_updated: 0, duration_ms: Date.now() - t0 };
}

// ── URLhaus source (Abuse.ch) ─────────────────────────────────────────────────

interface URLhausEntry {
  id: string;
  url: string;
  url_status: string;
  date_added: string;
  threat: string;
  tags?: string[] | null;
  urlhaus_reference: string;
}

async function fetchURLhaus(): Promise<SyncResult> {
  const t0 = Date.now();
  let added = 0;

  try {
    const res = await fetch("https://urlhaus-api.abuse.ch/v1/urls/recent/limit/500/");
    if (!res.ok) throw new Error(`URLhaus HTTP ${res.status}`);

    const data = await res.json() as { query_status: string; urls?: URLhausEntry[] };
    if (!data.urls) return { source: "urlhaus", iocs_added: 0, iocs_updated: 0, duration_ms: Date.now() - t0 };

    for (const entry of data.urls) {
      if (entry.url_status === "offline") continue;

      const status = await upsertIOC({
        source: "urlhaus",
        ioc_type: "url",
        ioc_value: entry.url,
        threat_name: entry.threat,
        tags: entry.tags ?? [],
        confidence: 75,
        first_seen: entry.date_added,
        pulse_id: entry.id,
        raw_data: {
          url_status: entry.url_status,
          urlhaus_reference: entry.urlhaus_reference,
        },
      });

      if (status !== "error") {
        added++;
        await enrichMatchingAlerts(entry.url, "url", "urlhaus", entry.threat);
      }
    }
  } catch (err) {
    return { source: "urlhaus", iocs_added: 0, iocs_updated: 0, error: String(err), duration_ms: Date.now() - t0 };
  }

  return { source: "urlhaus", iocs_added: added, iocs_updated: 0, duration_ms: Date.now() - t0 };
}

// ── Feodo Tracker source (Abuse.ch botnet C2) ─────────────────────────────────

interface FeodoEntry {
  ip_address: string;
  port: number;
  status: string;
  hostname?: string | null;
  as_number?: number | null;
  as_name?: string | null;
  country?: string | null;
  first_seen: string;
  last_online?: string | null;
  malware: string;
}

async function fetchFeodo(): Promise<SyncResult> {
  const t0 = Date.now();
  let added = 0;

  try {
    const res = await fetch("https://feodotracker.abuse.ch/downloads/ipblocklist.json");
    if (!res.ok) throw new Error(`Feodo HTTP ${res.status}`);

    const data = await res.json() as FeodoEntry[];

    for (const entry of data) {
      if (entry.status !== "Online") continue;

      const status = await upsertIOC({
        source: "feodo",
        ioc_type: "ip",
        ioc_value: entry.ip_address,
        threat_name: `${entry.malware} C2 Server`,
        malware_family: entry.malware,
        tags: ["botnet", "c2", entry.malware.toLowerCase()],
        confidence: 90,
        geo_country: entry.country ?? null,
        first_seen: entry.first_seen,
        last_seen: entry.last_online ?? null,
        raw_data: {
          port: entry.port,
          hostname: entry.hostname,
          as_number: entry.as_number,
          as_name: entry.as_name,
        },
      });

      if (status !== "error") {
        added++;
        await enrichMatchingAlerts(entry.ip_address, "ip", "feodo", `${entry.malware} C2`);
      }
    }
  } catch (err) {
    return { source: "feodo", iocs_added: 0, iocs_updated: 0, error: String(err), duration_ms: Date.now() - t0 };
  }

  return { source: "feodo", iocs_added: added, iocs_updated: 0, duration_ms: Date.now() - t0 };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

  const results = await Promise.allSettled([
    fetchOTX(yesterday),
    fetchMISP(),
    fetchThreatFox(),
    fetchURLhaus(),
    fetchFeodo(),
  ]);

  const syncResults: SyncResult[] = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { source: "unknown", iocs_added: 0, iocs_updated: 0, error: String((r as PromiseRejectedResult).reason), duration_ms: 0 }
  );

  await Promise.all(syncResults.map(logSync));

  const totalAdded = syncResults.reduce((s, r) => s + r.iocs_added, 0);

  return new Response(
    JSON.stringify({ success: true, sources: syncResults, total_iocs: totalAdded }),
    { headers: { "Content-Type": "application/json" } },
  );
});
