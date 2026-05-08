import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// SentinelOne threat severity → Silent Edge Standard
function mapSeverity(s1Severity: string): string {
  const map: Record<string, string> = {
    critical: "critical",
    high: "high",
    medium: "medium",
    suspicious: "medium",
    low: "low",
    behavioral: "low",
    info: "info",
  };
  return map[s1Severity?.toLowerCase()] ?? "info";
}

function validateSignature(body: string, header: string | null): boolean {
  const secret = process.env.SENTINELONE_WEBHOOK_TOKEN;
  if (!secret || !header) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-sentinelone-webhook-token");

  if (!validateSignature(rawBody, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // S1 wraps events in a `data` array
  const events: Record<string, unknown>[] = Array.isArray(payload.data)
    ? (payload.data as Record<string, unknown>[])
    : [payload];

  const supabase = createServiceClient();
  const inserted: string[] = [];

  for (const event of events) {
    const threat = (event.threat ?? event) as Record<string, unknown>;
    const info = (threat.threatInfo ?? threat) as Record<string, unknown>;
    const agentInfo = (threat.agentDetectionInfo ?? {}) as Record<string, unknown>;

    const hostname = String(agentInfo.agentComputerName ?? info.computerName ?? "");
    const orgSlug = String(threat.accountName ?? "");
    const sourceAlertId = String(info.threatId ?? event.id ?? "");

    // Skip duplicates
    const { data: existing } = await supabase
      .from("alerts")
      .select("id")
      .eq("source", "sentinelone")
      .eq("source_alert_id", sourceAlertId)
      .maybeSingle();

    if (existing) continue;

    // Resolve organization by slug or name
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .or(`slug.eq.${orgSlug.toLowerCase()},name.ilike.${orgSlug}`)
      .maybeSingle();

    // Resolve device
    let deviceId: string | null = null;
    if (hostname && org?.id) {
      const { data: device } = await supabase
        .from("devices")
        .select("id")
        .eq("organization_id", org.id)
        .ilike("hostname", hostname)
        .maybeSingle();
      deviceId = device?.id ?? null;
    }

    // MITRE fields
    const tactics = (info.mitreTactics as { name: string }[] | undefined) ?? [];
    const techniques = (info.mitreTechniques as { id: string; name: string }[] | undefined) ?? [];

    const { data: alert, error } = await supabase.from("alerts").insert({
      organization_id: org?.id ?? null,
      device_id: deviceId,
      source: "sentinelone",
      source_alert_id: sourceAlertId,
      severity: mapSeverity(String(info.confidenceLevel ?? info.threatClassification ?? "info")),
      title: String(info.threatName ?? info.classification ?? "SentinelOne Alert"),
      description: String(info.storyline ?? info.threatClassificationSource ?? ""),
      category: String(info.classification ?? ""),
      technique_id: techniques[0]?.id ?? null,
      technique_name: techniques[0]?.name ?? tactics[0]?.name ?? null,
      indicator_type: info.sha256 ? "hash" : info.filePath ? "file" : null,
      indicator_value: String(info.sha256 ?? info.filePath ?? ""),
      host: hostname || null,
      host_ip: String(agentInfo.agentIpV4 ?? agentInfo.agentLastIpToMgmt ?? "") || null,
      status: "open",
      raw_data: event,
      occurred_at: String(event.createdAt ?? event.updatedAt ?? new Date().toISOString()),
    }).select("id").single();

    if (!error && alert) {
      inserted.push(alert.id);

      // Fire-and-forget: queue AI enrichment via Supabase Edge Function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        fetch(`${supabaseUrl}/functions/v1/ai-specialist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ alertId: alert.id, mode: "enrich" }),
        }).catch(() => {/* non-blocking */});
      }
    }
  }

  return NextResponse.json({ received: events.length, inserted: inserted.length });
}
