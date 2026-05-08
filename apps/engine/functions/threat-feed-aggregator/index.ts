import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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
  indicators: OTXIndicator[];
}

function otxTypeToSilentEdge(otxType: string): string | null {
  const map: Record<string, string> = {
    IPv4: "ip",
    IPv6: "ip",
    domain: "domain",
    hostname: "domain",
    URL: "url",
    "FileHash-MD5": "hash",
    "FileHash-SHA1": "hash",
    "FileHash-SHA256": "hash",
    email: "email",
  };
  return map[otxType] ?? null;
}

async function pullOTX(since: string): Promise<OTXPulse[]> {
  const apiKey = Deno.env.get("OTX_API_KEY");
  if (!apiKey) {
    console.log("OTX_API_KEY not set — skipping OTX pull");
    return [];
  }

  const url = `https://otx.alienvault.com/api/v1/pulses/subscribed?modified_since=${since}&limit=50`;
  const res = await fetch(url, { headers: { "X-OTX-API-KEY": apiKey } });

  if (!res.ok) {
    console.error(`OTX API error: ${res.status}`);
    return [];
  }

  const data = await res.json() as { results: OTXPulse[] };
  return data.results ?? [];
}

async function enrichMatchingAlerts(iocValue: string, iocType: string, pulseId: string, threatName: string) {
  // Find open alerts whose indicator_value or host_ip matches this IOC
  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, raw_data")
    .eq("status", "open")
    .or(`indicator_value.eq.${iocValue},host_ip.eq.${iocValue}`);

  for (const alert of alerts ?? []) {
    const raw = (alert.raw_data ?? {}) as Record<string, unknown>;
    const matches = (raw.otx_matches as unknown[] | undefined) ?? [];
    matches.push({ pulse_id: pulseId, threat_name: threatName, ioc_type: iocType, ioc_value: iocValue });

    await supabase
      .from("alerts")
      .update({ category: "known_threat", raw_data: { ...raw, otx_matches: matches } })
      .eq("id", alert.id);
  }
}

Deno.serve(async (req: Request) => {
  // Allow manual trigger via POST, or scheduled invocation
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  let upserted = 0;
  let enriched = 0;

  // ── AlienVault OTX ────────────────────────────────────────────────────────
  const pulses = await pullOTX(yesterday);
  console.log(`OTX: pulled ${pulses.length} pulses`);

  for (const pulse of pulses) {
    const malwareFamily = pulse.malware_families?.[0]?.display_name ?? null;
    const tags = pulse.tags ?? [];

    for (const indicator of pulse.indicators) {
      const iocType = otxTypeToSilentEdge(indicator.type);
      if (!iocType) continue;

      const { error } = await supabase.from("threat_telemetry").upsert({
        source: "otx",
        ioc_type: iocType,
        ioc_value: indicator.indicator,
        threat_name: pulse.name ?? indicator.title ?? null,
        malware_family: malwareFamily,
        tags,
        confidence: 70,
        geo_lat: indicator.latitude ?? null,
        geo_lon: indicator.longitude ?? null,
        geo_country: indicator.country_code ?? null,
        first_seen: indicator.created ?? null,
        last_seen: new Date().toISOString(),
        pulse_id: pulse.id,
        raw_data: { pulse_name: pulse.name, indicator_type: indicator.type },
      }, {
        onConflict: "source,ioc_type,ioc_value",
        ignoreDuplicates: false,
      });

      if (!error) {
        upserted++;
        await enrichMatchingAlerts(indicator.indicator, iocType, pulse.id, pulse.name);
        enriched++;
      }
    }
  }

  // ── MISP (optional) ───────────────────────────────────────────────────────
  const mispUrl   = Deno.env.get("MISP_URL");
  const mispKey   = Deno.env.get("MISP_AUTH_KEY");

  if (mispUrl && mispKey) {
    const mispRes = await fetch(`${mispUrl}/events/restSearch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: mispKey,
        Accept: "application/json",
      },
      body: JSON.stringify({ last: "1d", limit: 100, returnFormat: "json" }),
    }).catch(() => null);

    if (mispRes?.ok) {
      const mispData = await mispRes.json() as { response?: { Event?: { Attribute?: { type: string; value: string; comment?: string }[]; info?: string }[] }[] };
      const events = mispData.response ?? [];

      for (const wrapper of events) {
        const event = wrapper.Event;
        if (!event) continue;
        for (const attr of (event.Attribute ?? [])) {
          const iocType = otxTypeToSilentEdge(attr.type);
          if (!iocType) continue;

          await supabase.from("threat_telemetry").upsert({
            source: "misp",
            ioc_type: iocType,
            ioc_value: attr.value,
            threat_name: event.info ?? null,
            confidence: 80,
            last_seen: new Date().toISOString(),
            raw_data: { misp_type: attr.type, comment: attr.comment },
          }, { onConflict: "source,ioc_type,ioc_value", ignoreDuplicates: false });

          upserted++;
        }
      }
    }
  }

  return new Response(JSON.stringify({ success: true, upserted, enriched, pulses: pulses.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
