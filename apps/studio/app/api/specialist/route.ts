import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SpecialistHandler } from "@silent-edge/specialist";
import OpenAI from "openai";

interface ProposalBlock {
  title: string;
  risk: string;
  summary: string;
  scriptType: string;
  script: string;
}

function parseProposal(text: string): ProposalBlock | null {
  const proposalMatch = text.match(/PROPOSAL:\s*(.+)/);
  const riskMatch     = text.match(/RISK:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i);
  const summaryMatch  = text.match(/SUMMARY:\s*([\s\S]+?)(?=SCRIPT_TYPE:|$)/i);
  const typeMatch     = text.match(/SCRIPT_TYPE:\s*(powershell|bash|sentinelone_api|ninjaone_api)/i);
  const scriptMatch   = text.match(/SCRIPT:\s*```[\w]*\n([\s\S]+?)```/i);

  if (!proposalMatch) return null;
  return {
    title:      proposalMatch[1].trim(),
    risk:       riskMatch?.[1]?.toLowerCase() ?? "medium",
    summary:    summaryMatch?.[1]?.trim() ?? "",
    scriptType: typeMatch?.[1]?.toLowerCase() ?? "bash",
    script:     scriptMatch?.[1]?.trim() ?? "",
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "client") {
    return NextResponse.json({ error: "access denied" }, { status: 403 });
  }

  const body = await req.json() as { query: string; alertId?: string; deviceId?: string };
  const { query, alertId, deviceId } = body;

  if (!query?.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });

  // ── RAG context ───────────────────────────────────────────────────────────
  let ragContext = "";
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      const vec = embedding.data[0].embedding;

      const { data: chunks } = await serviceSupabase.rpc("match_documents", {
        query_embedding: vec,
        match_threshold: 0.7,
        match_count: 8,
        filter_org_id: profile.organization_id,
      });

      if (chunks?.length) {
        ragContext = chunks.map((c: { content: string; source_file: string }) =>
          `[${c.source_file}]\n${c.content}`
        ).join("\n\n---\n\n");
      }
    } catch {
      // RAG is non-blocking — Specialist still answers without KB context
    }
  }

  // ── Alert context ──────────────────────────────────────────────────────────
  let alertContext: string | undefined;
  if (alertId) {
    const { data: alert } = await serviceSupabase
      .from("alerts")
      .select("*")
      .eq("id", alertId)
      .maybeSingle();
    if (alert) alertContext = JSON.stringify(alert, null, 2);
  }

  // ── Device context ────────────────────────────────────────────────────────
  let deviceContext: string | undefined;
  if (deviceId) {
    const { data: device } = await serviceSupabase
      .from("devices")
      .select("id, hostname, device_type, os, ip_address, risk_score, risk_factors, is_online, last_seen_at")
      .eq("id", deviceId)
      .maybeSingle();
    if (device) deviceContext = JSON.stringify(device, null, 2);
  }

  // ── Streaming response ────────────────────────────────────────────────────
  const handler = new SpecialistHandler();
  let fullResponse = "";
  const toolCalls: { name: string; input: Record<string, unknown>; output?: unknown }[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      try {
        const gen = handler.stream(
          { query },
          ragContext,
          alertContext,
          deviceContext,
        );

        for await (const chunk of gen) {
          fullResponse += chunk;
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }

        // ── Tool execution (post-stream) ──────────────────────────────────
        // Tool calls are embedded as JSON in the stream by the handler
        // Re-query the model without streaming to get tool_use blocks
        // (Simplified: tool calls come back as text directives we parse)

        // ── Proposal extraction ───────────────────────────────────────────
        const proposal = parseProposal(fullResponse);
        let proposalId: string | undefined;

        if (proposal && profile.organization_id) {
          const { data: inserted } = await serviceSupabase
            .from("remediation_proposals")
            .insert({
              organization_id: profile.organization_id,
              alert_id: alertId ?? null,
              device_id: deviceId ?? null,
              title: proposal.title,
              summary: proposal.summary,
              script: proposal.script || null,
              script_type: proposal.scriptType,
              risk_level: proposal.risk,
              status: "pending",
            })
            .select("id")
            .single();

          proposalId = inserted?.id;
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ proposal: { id: proposalId, ...proposal } })}\n\n`));
        }

        // ── Save specialist log (non-blocking) ────────────────────────────
        await serviceSupabase.from("specialist_logs").insert({
          organization_id: profile.organization_id ?? null,
          alert_id: alertId ?? null,
          actor_id: user.id,
          query,
          response: fullResponse,
          tool_calls: toolCalls,
          rag_chunks_used: ragContext ? 8 : 0,
          provider: "claude",
        });

        controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, proposalId })}\n\n`));
      } catch (err) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
