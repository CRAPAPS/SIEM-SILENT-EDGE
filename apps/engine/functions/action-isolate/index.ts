import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  // Verify caller JWT and role
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "invalid token" }), { status: 401, headers: corsHeaders });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "analyst"].includes(profile.role)) {
    return new Response(JSON.stringify({ error: "insufficient role" }), { status: 403, headers: corsHeaders });
  }

  const body = await req.json() as { deviceId?: string; hostname?: string; reason?: string; orgId?: string };
  const { deviceId, hostname, reason, orgId } = body;

  if (!reason) {
    return new Response(JSON.stringify({ error: "reason is required" }), { status: 400, headers: corsHeaders });
  }

  // Resolve device
  let device: { id: string; ninja_id: string; hostname: string; organization_id: string } | null = null;
  if (deviceId) {
    const { data } = await supabase.from("devices").select("id, ninja_id, hostname, organization_id").eq("id", deviceId).single();
    device = data;
  } else if (hostname) {
    const query = supabase.from("devices").select("id, ninja_id, hostname, organization_id").ilike("hostname", hostname);
    if (profile.role !== "admin") query.eq("organization_id", profile.organization_id);
    const { data } = await query.maybeSingle();
    device = data;
  }

  if (!device) {
    return new Response(JSON.stringify({ error: "device not found" }), { status: 404, headers: corsHeaders });
  }

  // Tenant boundary: analyst can only isolate devices in their own org
  if (profile.role === "analyst" && device.organization_id !== profile.organization_id) {
    return new Response(JSON.stringify({ error: "cross-org access denied" }), { status: 403, headers: corsHeaders });
  }

  // Call SentinelOne disconnect API
  const s1BaseUrl = Deno.env.get("SENTINELONE_BASE_URL");
  let s1Response: Record<string, unknown> = {};

  if (s1BaseUrl) {
    const { data: creds } = await supabase
      .from("api_credentials")
      .select("encrypted_key")
      .eq("organization_id", device.organization_id)
      .eq("provider", "sentinelone")
      .eq("is_active", true)
      .maybeSingle();

    if (creds?.encrypted_key) {
      const apiToken = new TextDecoder().decode(creds.encrypted_key as Uint8Array);
      const s1Res = await fetch(`${s1BaseUrl}/web/api/v2.1/agents/actions/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `ApiToken ${apiToken}`,
        },
        body: JSON.stringify({
          filter: { computerName: device.hostname },
          data: {},
        }),
      });
      if (s1Res.ok) {
        s1Response = await s1Res.json() as Record<string, unknown>;
      }
    }
  }

  // Update device risk factors
  const { data: currentDevice } = await supabase
    .from("devices")
    .select("risk_factors, risk_score")
    .eq("id", device.id)
    .single();

  const riskFactors = (currentDevice?.risk_factors ?? []) as unknown[];
  riskFactors.push({ type: "isolated", ts: new Date().toISOString(), reason, actor: profile.display_name ?? user.email });

  await supabase.from("devices").update({
    risk_factors: riskFactors,
    risk_score: Math.min(100, (currentDevice?.risk_score ?? 50) + 20),
  }).eq("id", device.id);

  // Write immutable audit log
  const { data: auditEntry } = await supabase.from("audit_logs").insert({
    organization_id: device.organization_id,
    actor_id: user.id,
    actor_email: user.email,
    action: "device.isolate",
    target_type: "device",
    target_id: device.id,
    before_state: { is_isolated: false },
    after_state: { is_isolated: true, reason, s1_response: s1Response },
    ip_address: req.headers.get("x-forwarded-for") ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  }).select("id").single();

  return new Response(JSON.stringify({
    success: true,
    device: { id: device.id, hostname: device.hostname },
    s1Response,
    auditId: auditEntry?.id,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
