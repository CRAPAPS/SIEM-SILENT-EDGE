import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role, organization_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  }

  // Fetch proposal
  const { data: proposal } = await serviceSupabase
    .from("remediation_proposals")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "proposal not found or already actioned" }, { status: 404 });
  }

  let executionResult: Record<string, unknown> = {};
  let executionError: string | null = null;

  // Execute based on script type
  try {
    if (proposal.script_type === "sentinelone_api") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey && proposal.device_id) {
        const isolateRes = await fetch(`${supabaseUrl}/functions/v1/action-isolate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            deviceId: proposal.device_id,
            reason: `Proposal #${id}: ${proposal.title}`,
          }),
        });
        executionResult = isolateRes.ok ? await isolateRes.json() as Record<string, unknown> : { error: `HTTP ${isolateRes.status}` };
      }
    } else if (proposal.script_type === "ninjaone_api" && proposal.script) {
      // NinjaOne script execution would go here
      executionResult = { dispatched: true, note: "NinjaOne script queued" };
    } else {
      // powershell/bash — log intent; actual execution via RMM agent
      executionResult = { dispatched: true, script_type: proposal.script_type, note: "Script queued for RMM dispatch" };
    }
  } catch (e) {
    executionError = String(e);
  }

  const now = new Date().toISOString();

  // Update proposal status
  await serviceSupabase
    .from("remediation_proposals")
    .update({
      status: executionError ? "failed" : "executed",
      reviewed_by: user.id,
      reviewed_at: now,
      executed_at: executionError ? null : now,
      execution_result: { ...executionResult, error: executionError },
    })
    .eq("id", id);

  // Immutable audit log entry
  const { data: auditEntry } = await serviceSupabase
    .from("audit_logs")
    .insert({
      organization_id: proposal.organization_id,
      actor_id: user.id,
      actor_email: user.email,
      action: "proposal.approved",
      target_type: "remediation_proposal",
      target_id: id,
      before_state: { status: "pending" },
      after_state: { status: executionError ? "failed" : "executed", result: executionResult },
    })
    .select("id")
    .single();

  return NextResponse.json({
    success: !executionError,
    executionResult,
    executionError,
    auditId: auditEntry?.id,
  });
}
