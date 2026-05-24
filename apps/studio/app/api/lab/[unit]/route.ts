import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_UNITS = ["osint-unit", "redteam-unit"] as const;
type AllowedUnit = (typeof ALLOWED_UNITS)[number];

// Inline SpiderFoot JSON parser — avoids requiring @silent-edge/lab-manager build
interface SpiderfootItem {
  type: string;
  data: string;
  module: string;
  confidence?: number;
}

const SF_TYPE_MAP: Record<string, string> = {
  IP_ADDRESS: "ip",
  IPV6_ADDRESS: "ip",
  NETBLOCK_OWNER: "ip",
  INTERNET_NAME: "domain",
  EMAILADDR: "email",
  URL_FORM: "url",
  URL_STATIC: "url",
  HASH: "hash",
};

function parseSpiderfootOutput(stdout: string) {
  try {
    const raw = JSON.parse(stdout) as SpiderfootItem[];
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      const ioc_type = SF_TYPE_MAP[item.type];
      if (!ioc_type) return [];
      const ioc_value = String(item.data ?? "").trim();
      if (!ioc_value) return [];
      return [
        {
          ioc_type,
          ioc_value,
          confidence: typeof item.confidence === "number" ? item.confidence / 100 : 0.5,
          source_tool: "spiderfoot",
          metadata: { sf_type: item.type, module: item.module },
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ unit: string }> },
) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profileRaw } = await db
    .from("profiles")
    .select("role, organization_id")
    .single();
  const profile = profileRaw as { role: string; organization_id: string | null } | null;

  if (!profile || profile.role === "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { unit } = await params;
  if (!ALLOWED_UNITS.includes(unit as AllowedUnit)) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  const body = (await req.json()) as {
    action: "wake" | "suspend" | "execute";
    script?: string;
    target?: string;
    tool?: string;
  };

  const baseUrl = process.env.LAB_GATEWAY_URL;
  const secret = process.env.LAB_GATEWAY_SECRET;
  if (!baseUrl || !secret) {
    return NextResponse.json({ error: "Lab gateway not configured" }, { status: 503 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };

  try {
    if (body.action === "wake") {
      const r = await fetch(`${baseUrl}/units/${unit}/wake`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      return NextResponse.json(await r.json(), { status: r.ok ? 200 : 500 });
    }

    if (body.action === "suspend") {
      const r = await fetch(`${baseUrl}/units/${unit}/suspend`, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      return NextResponse.json(await r.json(), { status: r.ok ? 200 : 500 });
    }

    if (body.action === "execute") {
      const script = body.script;
      if (!script) return NextResponse.json({ error: "Missing script" }, { status: 400 });

      // Record run start
      const { data: runRaw } = await db
        .from("lab_runs")
        .insert({
          unit_id: unit,
          tool_name: body.tool ?? "manual",
          target: body.target ?? "unknown",
          status: "running",
          initiated_by: user.id,
          org_id: ["super_admin", "admin"].includes(profile.role) ? null : profile.organization_id,
        })
        .select("id")
        .single();
      const run = runRaw as { id: string } | null;

      const r = await fetch(`${baseUrl}/units/${unit}/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ script }),
        signal: AbortSignal.timeout(120_000),
      });

      const result = (await r.json()) as {
        exitCode: number;
        stdout: string;
        stderr: string;
      };

      const status = r.ok && result.exitCode === 0 ? "completed" : "failed";
      if (run?.id) {
        await db
          .from("lab_runs")
          .update({ status, completed_at: new Date().toISOString() })
          .eq("id", run.id);
      }

      // Parse SpiderFoot JSON output into lab_findings
      if (r.ok && result.stdout) {
        const findings = parseSpiderfootOutput(result.stdout);
        if (findings.length > 0) {
          const rows = findings.map((f) => ({
            ...f,
            run_id: run?.id ?? null,
            org_id: ["super_admin", "admin"].includes(profile.role) ? null : profile.organization_id,
          }));
          await db.from("lab_findings").insert(rows);
        }
      }

      return NextResponse.json({ ...result, runId: run?.id, status });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
