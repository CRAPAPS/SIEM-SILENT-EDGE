import { createClient } from "@/lib/supabase/server";
import { GeoIntDashboard } from "./GeoIntDashboard";

export default async function GeoIntPage() {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .single();

  const orgFilter =
    profile?.role === "admin"
      ? {}
      : { organization_id: profile?.organization_id };

  // Fetch devices that have geolocation data (lat/lon stored in raw_data)
  const { data: devices } = await supabase
    .from("devices")
    .select("id, hostname, device_type, risk_score, is_online, organization_id, raw_data")
    .match(orgFilter)
    .order("risk_score", { ascending: false })
    .limit(500);

  // Fetch active alerts for threat arcs
  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, severity, host_ip, organization_id")
    .match(orgFilter)
    .eq("status", "open")
    .not("host_ip", "is", null)
    .limit(100);

  // Transform devices → GeoDevice format
  const geoDevices = (devices ?? [])
    .filter((d) => {
      const raw = d.raw_data as Record<string, unknown>;
      return raw?.lat != null && raw?.lon != null;
    })
    .map((d) => {
      const raw = d.raw_data as { lat: number; lon: number; orgName?: string; fingerprintId?: string };
      return {
        id: d.id,
        hostname: d.hostname,
        deviceType: (d.device_type ?? "unknown") as "workstation" | "server" | "mobile" | "network" | "unknown",
        lat: raw.lat,
        lon: raw.lon,
        riskScore: d.risk_score,
        isOnline: d.is_online,
        orgId: d.organization_id,
        orgName: raw.orgName,
        fingerprintId: raw.fingerprintId,
      };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--mono)",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--fg)",
            margin: 0,
          }}
        >
          GEOINT COMMAND GRID
        </h1>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            color: "var(--muted)",
            margin: "4px 0 0",
            letterSpacing: "0.04em",
          }}
        >
          {profile?.role === "admin" ? "GLOBAL PULSE — ALL CLIENTS" : "TACTICAL DEVICE MONITOR"}
          {" "}· {geoDevices.length} GEOLOCATED DEVICES
        </p>
      </div>

      <GeoIntDashboard devices={geoDevices} />
    </div>
  );
}
