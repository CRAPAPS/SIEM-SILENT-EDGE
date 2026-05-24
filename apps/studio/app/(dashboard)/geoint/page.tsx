import { createClient } from "@/lib/supabase/server";
import { GeoIntDashboard } from "./GeoIntDashboard";
import type { ThreatArc } from "@silent-edge/geospatial";

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

  // Fetch devices with geolocation data (lat/lon stored in raw_data)
  const { data: devices } = await supabase
    .from("devices")
    .select("id, hostname, device_type, risk_score, is_online, organization_id, raw_data")
    .match(orgFilter)
    .order("risk_score", { ascending: false })
    .limit(500);

  // Fetch open alerts with host_ip for threat arc origins
  const { data: openAlerts } = await supabase
    .from("alerts")
    .select("id, severity, host_ip, device_id, organization_id")
    .match(orgFilter)
    .eq("status", "open")
    .not("host_ip", "is", null)
    .limit(200);

  // Fetch lab OSINT findings with geo coords for additional arcs
  const labOrgFilter =
    profile?.role === "admin" ? {} : { org_id: profile?.organization_id };
  const { data: labFindings } = await supabase
    .from("lab_findings")
    .select("ioc_value, ioc_type, geo_lat, geo_lon, source_tool, org_id")
    .match(labOrgFilter)
    .eq("ioc_type", "ip")
    .not("geo_lat", "is", null)
    .not("geo_lon", "is", null)
    .limit(200);

  // Fetch OTX threat telemetry for geo origins of IOCs
  const { data: threatFeed } = await supabase
    .from("threat_telemetry")
    .select("ioc_value, ioc_type, geo_lat, geo_lon, geo_country, threat_name")
    .eq("ioc_type", "ip")
    .not("geo_lat", "is", null)
    .not("geo_lon", "is", null)
    .limit(500);

  // Build fast IOC lookup map: ip → geo coords
  const iocGeoMap = new Map<string, { lat: number; lon: number; name: string }>();
  for (const ioc of threatFeed ?? []) {
    if (ioc.geo_lat != null && ioc.geo_lon != null) {
      iocGeoMap.set(ioc.ioc_value, {
        lat: ioc.geo_lat,
        lon: ioc.geo_lon,
        name: ioc.threat_name ?? ioc.ioc_value,
      });
    }
  }

  // Build device geo lookup: device_id → coords
  const deviceGeoMap = new Map<string, { lat: number; lon: number }>();
  const geoDevices = (devices ?? [])
    .filter((d) => {
      const raw = d.raw_data as Record<string, unknown>;
      return raw?.lat != null && raw?.lon != null;
    })
    .map((d) => {
      const raw = d.raw_data as { lat: number; lon: number; orgName?: string; fingerprintId?: string };
      deviceGeoMap.set(d.id, { lat: raw.lat, lon: raw.lon });
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

  // Build threat arcs: OTX-matched alert IPs → victim device coords
  const threatArcs: ThreatArc[] = [];
  for (const alert of openAlerts ?? []) {
    const hostIp = alert.host_ip as string | null;
    if (!hostIp) continue;

    // Find attacker origin from OTX feed
    const iocGeo = iocGeoMap.get(hostIp);
    if (!iocGeo) continue;

    // Find target device coords
    let targetGeo: { lat: number; lon: number } | undefined;
    if (alert.device_id) {
      targetGeo = deviceGeoMap.get(alert.device_id);
    }
    // Fallback: pick first device in same org
    if (!targetGeo) {
      const orgDevice = geoDevices.find((d) => d.orgId === alert.organization_id);
      if (orgDevice) targetGeo = { lat: orgDevice.lat, lon: orgDevice.lon };
    }
    if (!targetGeo) continue;

    threatArcs.push({
      id: alert.id,
      sourceLat: iocGeo.lat,
      sourceLon: iocGeo.lon,
      targetLat: targetGeo.lat,
      targetLon: targetGeo.lon,
      severity: alert.severity as ThreatArc["severity"],
      label: iocGeo.name,
    });
  }

  // Add OSINT lab findings as additional threat arcs
  for (const finding of labFindings ?? []) {
    if (!finding.geo_lat || !finding.geo_lon) continue;
    const targetDevice = geoDevices.find(
      (d) =>
        profile?.role === "admin" ||
        d.orgId === ((finding as Record<string, unknown>).org_id ?? profile?.organization_id),
    );
    if (!targetDevice) continue;
    threatArcs.push({
      id: `lab_${finding.ioc_value}`,
      sourceLat: Number(finding.geo_lat),
      sourceLon: Number(finding.geo_lon),
      targetLat: targetDevice.lat,
      targetLon: targetDevice.lon,
      severity: "info",
      label: `OSINT: ${finding.ioc_value}`,
    });
  }

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
          {" "}· {geoDevices.length} GEOLOCATED DEVICES · {threatArcs.length} ACTIVE THREAT ARCS
        </p>
      </div>

      <GeoIntDashboard devices={geoDevices} arcs={threatArcs} />
    </div>
  );
}
