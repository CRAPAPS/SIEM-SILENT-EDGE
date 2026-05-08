import { createClient } from "@supabase/supabase-js";

export async function matchDocuments(
  queryEmbedding: number[],
  orgId: string | null,
  matchCount = 8,
  matchThreshold = 0.7,
): Promise<{ content: string; source_file: string; metadata: Record<string, unknown> }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_org_id: orgId,
  });

  return (data ?? []) as { content: string; source_file: string; metadata: Record<string, unknown> }[];
}

export function buildRagContext(
  chunks: { content: string; source_file: string }[],
): string {
  return chunks.map((c) => `[${c.source_file}]\n${c.content}`).join("\n\n---\n\n");
}
