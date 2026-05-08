import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const NINJAONE_BASE = Deno.env.get("NINJAONE_BASE_URL") ?? "https://app.ninjarmm.com";

interface NinjaDevice {
  id: number;
  systemName: string;
  dnsName?: string;
  nodeClass: string;
  os?: { name?: string; version?: string; lastUpdate?: string };
  ipAddresses?: string[];
  macAddresses?: string[];
  location?: { name?: string; latitude?: number; longitude?: number };
  online: boolean;
  lastContact?: string;
}

async function getNinjaToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${NINJAONE_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "monitoring management",
    }),
  });
  if (!res.ok) throw new Error(`NinjaOne OAuth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function calcRiskScore(device: NinjaDevice, hasCriticalAlert: boolean, osOutdated: boolean): number {
  const base: Record<string, number> = {
    WINDOWS_WORKSTATION: 5,
    WINDOWS_SERVER: 15,
    MAC: 5,
    LINUX_WORKSTATION: 5,
    LINUX_SERVER: 15,
    NETWORK_DEVICE: 10,
  };
  let score = base[device.nodeClass] ?? 5;
  if (hasCriticalAlert) score += 40;
  if (osOutdated) score += 20;
  if (!device.online) score += 15;
  return Math.min(100, score);
}

function classifyDeviceType(nodeClass: string): string {
  if (nodeClass.includes("SERVER")) return "server";
  if (nodeClass.includes("WORKSTATION") || nodeClass.includes("MAC")) return "workstation";
  if (nodeClass.includes("NETWORK")) return "network";
  return "unknown";
}

Deno.serve(async () => {
  const clientId     = Deno.env.get("NINJAONE_CLIENT_ID");
  const clientSecret = Deno.env.get("NINJAONE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "NinjaOne credentials not configured" }), { status: 500 });
  }

  // Get all active orgs with NinjaOne credentials
  const { data: creds } = await supabase
    .from("api_credentials")
    .select("organization_id, base_url")
    .eq("provider", "ninjaone")
    .eq("is_active", true);

  if (!creds?.length) {
    return new Response(JSON.stringify({ synced: 0, message: "no active ninjaone orgs" }));
  }

  let token: string;
  try {
    token = await getNinjaToken(clientId, clientSecret);
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }

  let totalSynced = 0;

  for (const cred of creds) {
    const baseUrl = cred.base_url ?? NINJAONE_BASE;
    const orgId   = cred.organization_id;

    // Fetch all devices
    const devRes = await fetch(`${baseUrl}/api/v2/devices?pageSize=1000`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!devRes.ok) continue;
    const devices = await devRes.json() as NinjaDevice[];

    // Fetch recent critical alerts for this org
    const alertRes = await fetch(`${baseUrl}/api/v2/alerts?severity=CRITICAL&pageSize=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const alerts = alertRes.ok ? await alertRes.json() as { deviceId: number }[] : [];
    const criticalDeviceIds = new Set(alerts.map((a) => a.deviceId));

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

    for (const device of devices) {
      const osOutdated = device.os?.lastUpdate
        ? new Date(device.os.lastUpdate) < thirtyDaysAgo
        : false;

      const hasCritical = criticalDeviceIds.has(device.id);
      const riskScore   = calcRiskScore(device, hasCritical, osOutdated);
      const riskFactors: Record<string, unknown>[] = [];
      if (hasCritical) riskFactors.push({ type: "critical_alert", ts: now.toISOString() });
      if (osOutdated)  riskFactors.push({ type: "outdated_os",    ts: now.toISOString() });
      if (!device.online) riskFactors.push({ type: "offline",     ts: now.toISOString() });

      const lat = device.location?.latitude ?? null;
      const lon = device.location?.longitude ?? null;

      await supabase.from("devices").upsert({
        organization_id: orgId,
        ninja_id: String(device.id),
        hostname: device.systemName ?? device.dnsName ?? String(device.id),
        display_name: device.systemName ?? null,
        device_type: classifyDeviceType(device.nodeClass),
        os: device.os?.name ?? null,
        os_version: device.os?.version ?? null,
        ip_address: device.ipAddresses?.[0] ?? null,
        mac_address: device.macAddresses?.[0] ?? null,
        location: device.location?.name ?? null,
        risk_score: riskScore,
        risk_factors: riskFactors,
        is_online: device.online,
        last_seen_at: device.lastContact ?? null,
        raw_data: { lat, lon, ninja_node_class: device.nodeClass },
      }, { onConflict: "organization_id,ninja_id", ignoreDuplicates: false });

      totalSynced++;
    }

    // Update last_synced_at
    await supabase
      .from("api_credentials")
      .update({ last_synced_at: now.toISOString() })
      .eq("organization_id", orgId)
      .eq("provider", "ninjaone");
  }

  return new Response(JSON.stringify({ synced: totalSynced, orgs: creds.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
