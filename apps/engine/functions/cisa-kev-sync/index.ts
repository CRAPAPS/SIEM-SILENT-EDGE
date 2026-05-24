import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// CISA Known Exploited Vulnerabilities catalog — public endpoint, no auth required
const CISA_KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

interface CisaVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
}

interface CisaKevResponse {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: CisaVulnerability[];
}

Deno.serve(async (_req: Request) => {
  const t0 = Date.now();

  try {
    console.log("Fetching CISA KEV catalog...");
    const res = await fetch(CISA_KEV_URL);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `CISA KEV fetch failed: HTTP ${res.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const catalog = await res.json() as CisaKevResponse;
    const vulns = catalog.vulnerabilities ?? [];
    console.log(`Fetched ${vulns.length} KEV entries (catalog v${catalog.catalogVersion})`);

    let upserted = 0;
    let errors = 0;

    // Batch upsert in chunks of 100 to avoid payload limits
    const CHUNK = 100;
    for (let i = 0; i < vulns.length; i += CHUNK) {
      const chunk = vulns.slice(i, i + CHUNK).map((v) => ({
        cve_id:             v.cveID,
        vendor_project:     v.vendorProject,
        product:            v.product,
        vulnerability_name: v.vulnerabilityName,
        date_added:         v.dateAdded,
        short_description:  v.shortDescription,
        required_action:    v.requiredAction,
        due_date:           v.dueDate,
        updated_at:         new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("cisa_kev_entries")
        .upsert(chunk, { onConflict: "cve_id", ignoreDuplicates: false });

      if (error) {
        console.error(`Batch ${i}-${i + CHUNK} error: ${error.message}`);
        errors++;
      } else {
        upserted += chunk.length;
      }
    }

    const duration_ms = Date.now() - t0;
    console.log(`CISA KEV sync complete: ${upserted} upserted, ${errors} batch errors (${duration_ms}ms)`);

    await supabase.from("threat_feed_sync_log").insert({
      source: "cisa_kev",
      iocs_added: upserted,
      iocs_updated: 0,
      error: errors > 0 ? `${errors} batch errors` : null,
      duration_ms,
    });

    return new Response(
      JSON.stringify({
        success: true,
        catalog_version: catalog.catalogVersion,
        total: vulns.length,
        upserted,
        errors,
        duration_ms,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const duration_ms = Date.now() - t0;
    await supabase.from("threat_feed_sync_log").insert({
      source: "cisa_kev",
      iocs_added: 0,
      iocs_updated: 0,
      error: String(err),
      duration_ms,
    });

    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
