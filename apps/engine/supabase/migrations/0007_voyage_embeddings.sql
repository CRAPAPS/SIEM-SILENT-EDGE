-- ─── Silent Edge Platform — Migration 0007: Voyage AI Embeddings ─────────────
-- Switches vector_documents from OpenAI text-embedding-3-small (1536 dims)
-- to Voyage AI voyage-3 (1024 dims).
-- Safe to run: table is empty at this point (no ingestion done yet).

-- Drop the old IVFFlat index
DROP INDEX IF EXISTS vector_documents_embedding_idx;

-- Change the column dimension from 1536 → 1024
ALTER TABLE vector_documents
  ALTER COLUMN embedding TYPE VECTOR(1024);

-- Recreate the IVFFlat index for the new dimension
CREATE INDEX vector_documents_embedding_idx
  ON vector_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Update match_documents() to accept VECTOR(1024)
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding VECTOR(1024),
  match_threshold FLOAT    DEFAULT 0.75,
  match_count     INT      DEFAULT 8,
  org_id          UUID     DEFAULT NULL
)
RETURNS TABLE(
  id          UUID,
  content     TEXT,
  source_file TEXT,
  chunk_index INT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT
    id,
    content,
    source_file,
    chunk_index,
    metadata,
    1 - (embedding <=> query_embedding) AS similarity
  FROM vector_documents
  WHERE
    (organization_id IS NULL OR organization_id = org_id)
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
