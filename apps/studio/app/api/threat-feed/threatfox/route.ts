import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "child_process";

// ThreatFox API caps responses at ~64KB, cutting off mid-JSON.
// Repair by trimming to the last complete IOC object before the cut.
function parseTruncatedThreatFox(raw: string): { query_status: string; data?: ThreatFoxIOC[] } | null {
  try {
    return JSON.parse(raw);
  } catch {
    // Find last complete IOC object: ends with `}` followed by `,` or whitespace before `]`
    const lastClose = raw.lastIndexOf("},");
    if (lastClose < 0) return null;
    const repaired = raw.substring(0, lastClose + 1) + "]}";
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = "Bearer " + (process.env.THREAT_FEED_PROXY_SECRET ?? "");
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.THREATFOX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "THREATFOX_API_KEY not set" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const t0 = Date.now();
  let added = 0;

  try {
    const bodyJson = JSON.stringify({ query: "get_iocs", days: 1 });

    const result = spawnSync("curl", [
      "--max-time", "30",
      "-s", "-X", "POST",
      "https://threatfox-api.abuse.ch/api/v1/",
      "-H", "Content-Type: application/json",
      "-H", `Auth-Key: ${apiKey}`,
      "-d", bodyJson,
    ], { encoding: "utf8", timeout: 35000, maxBuffer: 20 * 1024 * 1024 });

    const stdout = result.stdout ?? "";
    if (!stdout || result.error) {
      const errDetail = result.error?.message ?? `exit ${result.status ?? "null"}`;
      return NextResponse.json({ error: `curl failed: ${errDetail}`, iocs_added: 0 }, { status: 500 });
    }

    const data = parseTruncatedThreatFox(stdout);
    if (!data || data.query_status !== "ok" || !data.data) {
      return NextResponse.json({ iocs_added: 0, duration_ms: Date.now() - t0 });
    }

    // ThreatFox ioc_type values: "ip:port", "domain", "url", "md5_hash", "sha256_hash"
    const typeMap: Record<string, string> = {
      "ip:port": "ip",
      domain: "domain",
      url: "url",
      md5_hash: "hash",
      sha256_hash: "hash",
    };

    for (const ioc of data.data) {
      const iocType = typeMap[ioc.ioc_type];
      if (!iocType) continue;
      const iocValue =
        iocType === "ip" && ioc.ioc.includes(":") ? ioc.ioc.split(":")[0] : ioc.ioc;

      const { error } = await supabase.from("threat_telemetry").upsert(
        {
          source: "threatfox",
          ioc_type: iocType,
          ioc_value: iocValue,
          threat_name: ioc.threat_type,
          malware_family: ioc.malware_printable || ioc.malware,
          tags: ioc.tags ?? [],
          confidence: ioc.confidence_level,
          first_seen: ioc.first_seen,
          last_seen: ioc.last_seen ?? null,
          mitre_technique_ids: [],
          raw_data: { threatfox_id: ioc.id, reporter: ioc.reporter },
        },
        { onConflict: "source,ioc_type,ioc_value", ignoreDuplicates: false },
      );

      if (!error) added++;
    }

    const duration_ms = Date.now() - t0;
    await supabase.from("threat_feed_sync_log").insert({
      source: "threatfox",
      iocs_added: added,
      iocs_updated: 0,
      duration_ms,
    });

    return NextResponse.json({ iocs_added: added, duration_ms });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg, iocs_added: added }, { status: 500 });
  }
}

interface ThreatFoxIOC {
  id: string;
  ioc: string;
  ioc_type: string;
  threat_type: string;
  malware: string;
  malware_printable: string;
  tags?: string[];
  confidence_level: number;
  first_seen: string;
  last_seen?: string | null;
  reporter?: string;
}
