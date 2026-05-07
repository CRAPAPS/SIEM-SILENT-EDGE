-- ─── Silent Edge Platform — Functions & Realtime Migration 0003 (Fixed) ──────
-- Run after 0002_rls.sql.
-- NOTE: pg_net is pre-installed on Supabase — do NOT re-create it.
-- NOTE: pgvector must be enabled in Dashboard > Extensions before running this.

-- ─── Realtime Publication ────────────────────────────────────────────────────
-- Enables live alert/device feeds in the SOC dashboard.
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE system_metrics;

-- ─── updated_at Auto-Trigger ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_devices_updated_at
  BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_alerts_updated_at
  BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_playbooks_updated_at
  BEFORE UPDATE ON playbooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Vector Similarity Search ─────────────────────────────────────────────────
-- Used by the AI Specialist RAG pipeline (requires pgvector extension).
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding VECTOR(1536),
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

-- ─── Alert Stats Aggregate (SOC bar / business studio) ───────────────────────
CREATE OR REPLACE FUNCTION public.get_alert_stats(p_org_id UUID DEFAULT NULL)
RETURNS TABLE(
  total_open    BIGINT,
  critical_open BIGINT,
  high_open     BIGINT,
  resolved_24h  BIGINT,
  avg_ttr_mins  NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'open')                                                    AS total_open,
    COUNT(*) FILTER (WHERE status = 'open'     AND severity = 'critical')                      AS critical_open,
    COUNT(*) FILTER (WHERE status = 'open'     AND severity = 'high')                          AS high_open,
    COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at > now() - interval '24 hours')  AS resolved_24h,
    ROUND(
      AVG(
        EXTRACT(EPOCH FROM (resolved_at - occurred_at)) / 60.0
      ) FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL),
    1) AS avg_ttr_mins
  FROM alerts
  WHERE
    (p_org_id IS NULL AND public.current_user_role() = 'admin')
    OR organization_id = p_org_id;
$$;
