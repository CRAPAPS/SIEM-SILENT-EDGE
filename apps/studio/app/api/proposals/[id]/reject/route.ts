import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin", "analyst"].includes(profile.role)) {
    return NextResponse.json({ error: "insufficient role" }, { status: 403 });
  }

  const { data: proposal } = await serviceSupabase
    .from("remediation_proposals")
    .select("id, organization_id, status")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "proposal not found or already actioned" }, { status: 404 });
  }

  const now = new Date().toISOString();

  await serviceSupabase
    .from("remediation_proposals")
    .update({ status: "rejected", reviewed_by: user.id, reviewed_at: now })
    .eq("id", id);

  await serviceSupabase.from("audit_logs").insert({
    organization_id: proposal.organization_id,
    actor_id: user.id,
    actor_email: user.email,
    action: "proposal.rejected",
    target_type: "remediation_proposal",
    target_id: id,
    before_state: { status: "pending" },
    after_state: { status: "rejected" },
  });

  return NextResponse.json({ success: true });
}
