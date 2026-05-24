import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const ioc  = searchParams.get("ioc")?.trim();
  const type = searchParams.get("type")?.trim();

  if (!ioc) return NextResponse.json({ error: "ioc parameter required" }, { status: 400 });

  const serviceSupabase = createServiceClient();

  let query = serviceSupabase
    .from("threat_telemetry")
    .select("id,source,ioc_type,ioc_value,threat_name,malware_family,adversary_group,tags,confidence,geo_country,mitre_technique_ids,first_seen,last_seen,pulse_id")
    .eq("ioc_value", ioc)
    .order("confidence", { ascending: false })
    .limit(20);

  if (type) {
    query = query.eq("ioc_type", type);
  }

  const { data: matches, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve MITRE technique names for any referenced technique IDs
  const allTechIds = [...new Set((matches ?? []).flatMap((m) => (m.mitre_technique_ids ?? []) as string[]))];
  let techniques: { technique_id: string; name: string; tactic: string }[] = [];

  if (allTechIds.length > 0) {
    const { data } = await serviceSupabase
      .from("mitre_techniques")
      .select("technique_id,name,tactic")
      .in("technique_id", allTechIds);
    techniques = data ?? [];
  }

  // Check CISA KEV if input looks like a CVE ID
  let kevEntry = null;
  if (/^CVE-\d{4}-\d+$/i.test(ioc)) {
    const { data } = await serviceSupabase
      .from("cisa_kev_entries")
      .select("cve_id,vendor_project,product,vulnerability_name,date_added,due_date,required_action")
      .eq("cve_id", ioc.toUpperCase())
      .maybeSingle();
    kevEntry = data;
  }

  return NextResponse.json({
    ioc,
    type: type ?? null,
    matches: matches ?? [],
    techniques,
    cisa_kev: kevEntry,
    total: (matches ?? []).length,
  });
}
