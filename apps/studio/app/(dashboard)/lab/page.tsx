import { createClient } from "@/lib/supabase/server";
import { LabConsole } from "@/components/lab/LabConsole";

export const dynamic = "force-dynamic";

// lab_runs and lab_findings are not yet in the generated Database type (pending migration 0005).
// All queries on these tables use `db as any` until types are regenerated post-migration.

interface Profile {
  role: "admin" | "analyst" | "client";
  organization_id: string | null;
}

export default async function LabPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profile } = (await db
    .from("profiles")
    .select("role, organization_id")
    .single()) as { data: Profile | null };

  if (!profile || profile.role === "client") {
    return (
      <div style={{ padding: "2rem", fontFamily: "var(--mono)", color: "var(--sev-alert)" }}>
        ACCESS DENIED — Lab access requires analyst or admin role.
      </div>
    );
  }

  const orgFilter =
    profile.role === "admin" ? {} : { org_id: profile.organization_id };

  // Recent runs (table added in migration 0005)
  const { data: recentRunsRaw } = await db
    .from("lab_runs")
    .select("id, unit_id, tool_name, target, status, started_at, completed_at")
    .match(orgFilter)
    .order("started_at", { ascending: false })
    .limit(10);

  // Findings counts
  const { count: findingsCount } = await db
    .from("lab_findings")
    .select("*", { count: "exact", head: true })
    .match(orgFilter);

  const { data: recentFindingsRaw } = await db
    .from("lab_findings")
    .select("id, ioc_type, ioc_value, source_tool, confidence, geo_country, created_at")
    .match(orgFilter)
    .order("created_at", { ascending: false })
    .limit(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentRuns = (recentRunsRaw ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentFindings = (recentFindingsRaw ?? []) as any[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
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
          TACTICAL LAB
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
          PERSISTENT TACTICAL UNITS · {findingsCount ?? 0} TOTAL FINDINGS
        </p>
      </div>

      {/* Lab Console — client component handles unit control + task dispatch */}
      <LabConsole
        recentRuns={recentRuns}
        recentFindings={recentFindings}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
