import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
interface LabFinding {
  ioc_type: "ip" | "domain" | "email" | "url" | "hash" | "port" | "geo";
  ioc_value: string;
  confidence?: number;
  source_tool: string;
  geo_lat?: number;
  geo_lon?: number;
  geo_country?: string;
  metadata?: Record<string, unknown>;
}

// Called by external systems (e.g., lab gateway push, SpiderFoot webhook)
// to normalise and store lab findings with optional geo enrichment.
export async function POST(req: NextRequest) {
  // Validate gateway secret (not user auth — this is a machine-to-machine call)
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = process.env.LAB_GATEWAY_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    run_id?: string;
    org_id?: string;
    findings: LabFinding[];
  };

  if (!Array.isArray(body.findings) || body.findings.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  // Geo-enrich IP findings via ip-api.com batch endpoint (free, no key)
  const ipFindings = body.findings.filter(
    (f) => f.ioc_type === "ip" && !f.geo_lat,
  );
  const ipGeoMap = new Map<string, { lat: number; lon: number; country: string }>();

  if (ipFindings.length > 0) {
    try {
      const batch = ipFindings.slice(0, 100).map((f) => ({ query: f.ioc_value }));
      const geoRes = await fetch("http://ip-api.com/batch?fields=status,lat,lon,countryCode,query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(8_000),
      });
      if (geoRes.ok) {
        const geoData = (await geoRes.json()) as {
          status: string;
          query: string;
          lat: number;
          lon: number;
          countryCode: string;
        }[];
        for (const g of geoData) {
          if (g.status === "success") {
            ipGeoMap.set(g.query, { lat: g.lat, lon: g.lon, country: g.countryCode });
          }
        }
      }
    } catch {
      // Geo enrichment is best-effort
    }
  }

  const rows = body.findings.map((f) => {
    const geo = f.ioc_type === "ip" ? ipGeoMap.get(f.ioc_value) : undefined;
    return {
      run_id: body.run_id ?? null,
      org_id: body.org_id ?? null,
      ioc_type: f.ioc_type,
      ioc_value: f.ioc_value,
      confidence: f.confidence ?? 0.5,
      source_tool: f.source_tool,
      geo_lat: f.geo_lat ?? geo?.lat ?? null,
      geo_lon: f.geo_lon ?? geo?.lon ?? null,
      geo_country: f.geo_country ?? geo?.country ?? null,
      metadata: f.metadata ?? {},
    };
  });

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error, count } = await db
    .from("lab_findings")
    .insert(rows, { count: "exact" });

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
  }

  // Mark run complete if run_id provided
  if (body.run_id) {
    await db
      .from("lab_runs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", body.run_id);
  }

  return NextResponse.json({ inserted: count ?? rows.length });
}
