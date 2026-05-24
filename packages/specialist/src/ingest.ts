import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VOYAGE_KEY    = process.env.VOYAGE_API_KEY!;
const KB_PATH       = process.env.KNOWLEDGE_BASE_PATH
  ?? path.resolve(__dirname, "../../../../KNOWLEDGE_BASE");

const CHUNK_SIZE    = 800;
const CHUNK_OVERLAP = 100;
const VOYAGE_BATCH  = 16;   // 16 chunks × ~200 tokens = ~3200 tokens/req, stays under 10K TPM
const RATE_DELAY_MS = 21000; // 3 RPM free tier — wait 21s before every request

// ── Text chunking ─────────────────────────────────────────────────────────────
function chunkText(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 60) chunks.push(chunk);
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

// ── Voyage AI embeddings ──────────────────────────────────────────────────────
async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_KEY}`,
    },
    body: JSON.stringify({ model: "voyage-3", input: texts }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage API ${res.status}: ${body}`);
  }

  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data.map((d) => d.embedding);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function ingest() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE env vars. Run with --env-file or export them first.");
    process.exit(1);
  }
  if (!VOYAGE_KEY) {
    console.error("Missing VOYAGE_API_KEY.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const pdfDir   = path.join(KB_PATH, "CYBER SECURITY");

  if (!fs.existsSync(pdfDir)) {
    console.error(`Knowledge base directory not found: ${pdfDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(pdfDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  console.log(`\nSilent Edge — Knowledge Base Ingestion`);
  console.log(`Found ${files.length} PDFs in ${pdfDir}\n`);

  let totalChunks   = 0;
  let totalInserted = 0;
  let totalErrors   = 0;

  for (const file of files) {
    const filePath = path.join(pdfDir, file);
    console.log(`Processing: ${file}`);

    try {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      const chunks = chunkText(parsed.text);

      if (chunks.length === 0) {
        console.log(`  Skipped — no usable text extracted`);
        continue;
      }

      console.log(`  ${chunks.length} chunks`);
      totalChunks += chunks.length;

      for (let i = 0; i < chunks.length; i += VOYAGE_BATCH) {
        const batch = chunks.slice(i, i + VOYAGE_BATCH);
        await new Promise((r) => setTimeout(r, RATE_DELAY_MS));
        const embeddings = await embedBatch(batch);

        const rows = batch.map((content, j) => ({
          source_file: file,
          chunk_index: i + j,
          content,
          embedding:   embeddings[j],
          metadata:    { file, chunk: i + j },
        }));

        const { error } = await supabase
          .from("vector_documents")
          .upsert(rows, { onConflict: "source_file,chunk_index" });

        if (error) {
          console.error(`  [ERROR] batch ${i}–${i + batch.length - 1}: ${error.message}`);
          totalErrors += batch.length;
        } else {
          console.log(`  Inserted chunks ${i}–${i + batch.length - 1}`);
          totalInserted += batch.length;
        }
      }
    } catch (err) {
      console.error(`  [ERROR] ${file}: ${err}`);
      totalErrors++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Ingestion complete`);
  console.log(`  PDFs processed : ${files.length}`);
  console.log(`  Total chunks   : ${totalChunks}`);
  console.log(`  Inserted       : ${totalInserted}`);
  console.log(`  Errors         : ${totalErrors}`);
  console.log(`─────────────────────────────────────\n`);
}

ingest().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
