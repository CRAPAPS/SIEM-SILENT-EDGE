import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function bdSeverityToSilentEdge(score: number): string {
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  if (score >= 2) return "low";
  return "info";
}

function validateBDSignature(body: string, header: string | null): boolean {
  const secret = process.env.BITDEFENDER_WEBHOOK_TOKEN;
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
  const sig = req.headers.get("x-bitdefender-signature");

  if (!validateBDSignature(rawBody, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const events: Record<string, unknown>[] = Array.isArray(payload.events)
    ? (payload.events as Record<string, unknown>[])
    : [payload];

  const supabase = createServiceClient();
  const inserted: string[] = [];

  for (const event of events) {
    const sourceAlertId = String(event.id ?? event.eventId ?? "");

    const { data: existing } = await supabase
      .from("alerts")
      .select("id")
      .eq("source", "bitdefender")
      .eq("source_alert_id", sourceAlertId)
      .maybeSingle();
    if (existing) continue;

    const hostname = String(event.computer_name ?? event.computerName ?? event.endpointName ?? "");
    const companyId = String(event.companyId ?? "");

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .contains("meta", { bd_company_id: companyId })
      .maybeSingle();

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

    const severityScore = Number(event.severity ?? event.level ?? 5);
    const malwareName = String(event.malware_name ?? event.threatName ?? event.name ?? "Bitdefender Detection");
    const sha256 = String(event.sha256 ?? event.file_hash ?? "");
    const filePath = String(event.file_path ?? event.filePath ?? "");

    await supabase.from("alerts").insert({
      organization_id: org?.id ?? null,
      device_id: deviceId,
      source: "bitdefender",
      source_alert_id: sourceAlertId,
      severity: bdSeverityToSilentEdge(severityScore),
      title: malwareName,
      description: String(event.detection_action ?? event.action ?? ""),
      category: String(event.malware_type ?? event.threatType ?? "malware"),
      indicator_type: sha256 ? "hash" : filePath ? "file" : null,
      indicator_value: sha256 || filePath || null,
      host: hostname || null,
      host_ip: String(event.computer_ip ?? event.ip ?? "") || null,
      status: "open",
      raw_data: event,
      occurred_at: String(event.created_at ?? event.detection_time ?? new Date().toISOString()),
    }).select("id").single().then(({ data: alert }) => {
      if (alert) inserted.push(alert.id);
    });
  }

  return NextResponse.json({ received: events.length, inserted: inserted.length });
}
