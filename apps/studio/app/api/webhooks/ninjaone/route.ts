import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// NinjaOne activity type → Silent Edge alert severity + category
function mapNinjaActivity(activityType: string): { severity: string; category: string } {
  const t = activityType?.toLowerCase() ?? "";
  if (t.includes("ransomware") || t.includes("critical")) return { severity: "critical", category: "malware" };
  if (t.includes("malware") || t.includes("virus")) return { severity: "high", category: "malware" };
  if (t.includes("patch_fail") || t.includes("script_fail")) return { severity: "medium", category: "patch_management" };
  if (t.includes("offline") || t.includes("disconnect")) return { severity: "low", category: "availability" };
  if (t.includes("backup_fail")) return { severity: "medium", category: "backup" };
  return { severity: "info", category: "system" };
}

export async function POST(req: NextRequest) {
  // NinjaOne uses Bearer token validation
  const auth = req.headers.get("authorization") ?? "";
  const token = process.env.NINJAONE_WEBHOOK_TOKEN;
  if (token && auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Handle device online/offline status change
  if (payload.event_type === "device_status_change" || payload.activityType === "device_status_change") {
    const deviceId = String(payload.device_id ?? payload.nodeId ?? "");
    const isOnline = Boolean(payload.online ?? payload.status === "ONLINE");

    if (deviceId) {
      await supabase
        .from("devices")
        .update({ is_online: isOnline, last_seen_at: new Date().toISOString() })
        .eq("ninja_id", deviceId);
    }
    return NextResponse.json({ handled: "device_status" });
  }

  // Handle activity events
  const activities: Record<string, unknown>[] = Array.isArray(payload.activities)
    ? (payload.activities as Record<string, unknown>[])
    : [payload];

  const inserted: string[] = [];

  for (const activity of activities) {
    const activityId = String(activity.id ?? activity.activityId ?? "");
    const activityType = String(activity.type ?? activity.activityType ?? "");
    const deviceId = String(activity.deviceId ?? activity.nodeId ?? "");
    const hostname = String(activity.deviceName ?? activity.nodeName ?? "");

    if (!activityId || !activityType) continue;

    // Skip informational keepalives
    if (activityType.toLowerCase().includes("heartbeat")) continue;

    const { data: existing } = await supabase
      .from("alerts")
      .select("id")
      .eq("source", "system")
      .eq("source_alert_id", `ninja_${activityId}`)
      .maybeSingle();
    if (existing) continue;

    // Resolve device and org
    let orgId: string | null = null;
    let dbDeviceId: string | null = null;
    if (deviceId) {
      const { data: device } = await supabase
        .from("devices")
        .select("id, organization_id")
        .eq("ninja_id", deviceId)
        .maybeSingle();
      if (device) {
        orgId = device.organization_id;
        dbDeviceId = device.id;
      }
    }

    const { severity, category } = mapNinjaActivity(activityType);

    await supabase.from("alerts").insert({
      organization_id: orgId,
      device_id: dbDeviceId,
      source: "system",
      source_alert_id: `ninja_${activityId}`,
      severity,
      title: String(activity.message ?? activity.description ?? activityType),
      description: String(activity.details ?? ""),
      category,
      host: hostname || null,
      status: "open",
      raw_data: activity,
      occurred_at: String(activity.timestamp ?? activity.createdAt ?? new Date().toISOString()),
    }).select("id").single().then(({ data: alert }) => {
      if (alert) inserted.push(alert.id);
    });
  }

  return NextResponse.json({ received: activities.length, inserted: inserted.length });
}
