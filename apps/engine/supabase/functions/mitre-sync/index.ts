import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// MITRE ATT&CK Enterprise STIX bundle from official GitHub mirror
const MITRE_STIX_URL =
  "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";

interface StixObject {
  type: string;
  id: string;
  name: string;
  description?: string;
  x_mitre_deprecated?: boolean;
  x_mitre_revoked?: boolean;
  x_mitre_is_subtechnique?: boolean;
  x_mitre_platforms?: string[];
  kill_chain_phases?: { kill_chain_name: string; phase_name: string }[];
  external_references?: { source_name: string; external_id?: string; url?: string }[];
}

interface StixBundle {
  objects: StixObject[];
}

function normalizeTactic(phase: string): string {
  return phase.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const TACTIC_IDS: Record<string, string> = {
  "reconnaissance":       "TA0043",
  "resource-development": "TA0042",
  "initial-access":       "TA0001",
  "execution":            "TA0002",
  "persistence":          "TA0003",
  "privilege-escalation": "TA0004",
  "defense-evasion":      "TA0005",
  "credential-access":    "TA0006",
  "discovery":            "TA0007",
  "lateral-movement":     "TA0008",
  "collection":           "TA0009",
  "command-and-control":  "TA0011",
  "exfiltration":         "TA0010",
  "impact":               "TA0040",
};

Deno.serve(async (_req: Request) => {
  const t0 = Date.now();

  try {
    console.log("Fetching MITRE ATT&CK STIX bundle...");
    const res = await fetch(MITRE_STIX_URL);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `MITRE fetch failed: HTTP ${res.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const bundle = await res.json() as StixBundle;
    const techniques = bundle.objects.filter(
      (o) =>
        o.type === "attack-pattern" &&
        !o.x_mitre_deprecated &&
        !o.x_mitre_revoked,
    );

    console.log(`Parsed ${techniques.length} active techniques from STIX bundle`);

    let upserted = 0;
    let skipped = 0;

    for (const tech of techniques) {
      const mitreRef = tech.external_references?.find(
        (r) => r.source_name === "mitre-attack" && r.external_id?.startsWith("T"),
      );
      if (!mitreRef?.external_id) { skipped++; continue; }

      const phase = tech.kill_chain_phases?.find(
        (p) => p.kill_chain_name === "mitre-attack",
      );
      if (!phase) { skipped++; continue; }

      const techniqueId   = mitreRef.external_id;
      const tactic        = normalizeTactic(phase.phase_name);
      const tacticId      = TACTIC_IDS[phase.phase_name] ?? "";
      const isSubtech     = tech.x_mitre_is_subtechnique ?? false;
      const parentId      = isSubtech ? techniqueId.split(".")[0] : null;

      const { error } = await supabase.from("mitre_techniques").upsert({
        technique_id:    techniqueId,
        name:            tech.name,
        tactic:          tactic,
        tactic_id:       tacticId,
        is_subtechnique: isSubtech,
        parent_id:       parentId,
        platforms:       tech.x_mitre_platforms ?? [],
        description:     tech.description ? tech.description.slice(0, 2000) : null,
        url:             mitreRef.url ?? null,
      }, { onConflict: "technique_id", ignoreDuplicates: false });

      if (error) {
        console.error(`Failed to upsert ${techniqueId}: ${error.message}`);
      } else {
        upserted++;
      }
    }

    const duration_ms = Date.now() - t0;
    console.log(`MITRE sync complete: ${upserted} upserted, ${skipped} skipped (${duration_ms}ms)`);

    await supabase.from("threat_feed_sync_log").insert({
      source: "mitre_attack",
      iocs_added: upserted,
      iocs_updated: 0,
      duration_ms,
    });

    return new Response(
      JSON.stringify({ success: true, upserted, skipped, duration_ms }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const duration_ms = Date.now() - t0;
    await supabase.from("threat_feed_sync_log").insert({
      source: "mitre_attack",
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
