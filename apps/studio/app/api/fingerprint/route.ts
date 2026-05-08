import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface GeoIPResponse {
  city?: string;
  country?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
  status?: string;
}

async function geoIP(ip: string): Promise<GeoIPResponse> {
  if (ip === "127.0.0.1" || ip.startsWith("192.168") || ip.startsWith("10.")) {
    return { city: "localhost", country: "local", lat: 0, lon: 0 };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`);
    return res.ok ? await res.json() as GeoIPResponse : {};
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json() as { visitorId?: string; confidence?: number };
  const { visitorId, confidence } = body;
  if (!visitorId) return NextResponse.json({ error: "visitorId required" }, { status: 400 });

  const serviceSupabase = createServiceClient();

  // Get profile for org info
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Geo-IP the request
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "127.0.0.1";

  const geo = await geoIP(ip);

  // Fetch last 5 sessions for this profile to detect anomalies
  const { data: lastSessions } = await serviceSupabase
    .from("fingerprint_sessions")
    .select("geo_country, geo_city, fingerprint_id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Anomaly: new country/city AND high confidence fingerprint match
  const knownCountries = new Set((lastSessions ?? []).map((s) => s.geo_country).filter(Boolean));
  const knownCities    = new Set((lastSessions ?? []).map((s) => s.geo_city).filter(Boolean));
  const knownFPs       = new Set((lastSessions ?? []).map((s) => s.fingerprint_id));

  const isNewLocation = knownCountries.size > 0
    && !knownCountries.has(geo.country ?? null)
    && !knownCities.has(geo.city ?? null);

  const isAnomalous = isNewLocation && (confidence ?? 0) > 0.6;

  // Insert session
  await serviceSupabase.from("fingerprint_sessions").insert({
    organization_id: profile?.organization_id ?? null,
    profile_id: user.id,
    fingerprint_id: visitorId,
    confidence: confidence ?? null,
    ip_address: ip !== "127.0.0.1" ? ip : null,
    user_agent: req.headers.get("user-agent") ?? null,
    geo_lat: geo.lat ?? null,
    geo_lon: geo.lon ?? null,
    geo_city: geo.city ?? null,
    geo_country: geo.country ?? null,
    is_anomalous: isAnomalous,
  });

  // If anomalous, create a system alert
  if (isAnomalous && profile?.organization_id) {
    await serviceSupabase.from("alerts").insert({
      organization_id: profile.organization_id,
      source: "system",
      source_alert_id: `fp_anomaly_${user.id}_${Date.now()}`,
      severity: "medium",
      title: "Anomalous Login Location — Silent Edge ID",
      description: `User ${user.email} logged in from unexpected location: ${geo.city}, ${geo.country}. Known locations: ${[...knownCities].join(", ")}. Fingerprint ID: ${visitorId}`,
      category: "geofence_breach",
      indicator_type: "ip",
      indicator_value: ip,
      host_ip: ip !== "127.0.0.1" ? ip : null,
      status: "open",
      raw_data: { fingerprint_id: visitorId, geo, known_countries: [...knownCountries] },
    });
  }

  return NextResponse.json({
    fingerprintId: visitorId,
    isAnomalous,
    known: knownFPs.has(visitorId),
    geo: { city: geo.city, country: geo.country },
  });
}
