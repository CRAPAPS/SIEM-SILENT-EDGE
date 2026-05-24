-- ─── Silent Edge Platform — Schema Migration 0001 ───────────────────────────
-- Run order: 0001 → 0002 → 0003
-- Extensions must be enabled before tables are created.

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Organizations (Tenants) ─────────────────────────────────────────────────
CREATE TABLE organizations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  slug           TEXT        NOT NULL UNIQUE,
  tier           TEXT        NOT NULL DEFAULT 'standard'
                               CHECK (tier IN ('standard', 'pro', 'enterprise')),
  status         TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'suspended', 'trial')),
  contract_start DATE,
  contract_end   DATE,
  monthly_rate   NUMERIC(10, 2),
  meta           JSONB       NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Profiles (Extends auth.users) ───────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  display_name    TEXT,
  role            TEXT        NOT NULL DEFAULT 'client'
                                CHECK (role IN ('super_admin', 'admin', 'analyst', 'client')),
  avatar_url      TEXT,
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── API Credentials (Per Org, Encrypted) ────────────────────────────────────
CREATE TABLE api_credentials (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider         TEXT        NOT NULL
                                 CHECK (provider IN ('sentinelone', 'ninjaone', 'bitdefender')),
  encrypted_key    BYTEA       NOT NULL,
  encrypted_secret BYTEA,
  base_url         TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  last_synced_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);

-- ─── Devices (NinjaOne Inventory) ────────────────────────────────────────────
CREATE TABLE devices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ninja_id        TEXT        NOT NULL,
  hostname        TEXT        NOT NULL,
  display_name    TEXT,
  device_type     TEXT        CHECK (device_type IN ('workstation', 'server', 'network', 'mobile', 'unknown')),
  os              TEXT,
  os_version      TEXT,
  ip_address      INET,
  mac_address     MACADDR,
  location        TEXT,
  risk_score      SMALLINT    NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  risk_factors    JSONB       NOT NULL DEFAULT '[]',
  is_online       BOOLEAN     NOT NULL DEFAULT false,
  last_seen_at    TIMESTAMPTZ,
  raw_data        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, ninja_id)
);

CREATE INDEX devices_org_risk_idx ON devices(organization_id, risk_score DESC);
CREATE INDEX devices_org_online_idx ON devices(organization_id, is_online);

-- ─── Alerts (Silent Edge Standard — Normalized from All Providers) ────────────
CREATE TABLE alerts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_id       UUID        REFERENCES devices(id) ON DELETE SET NULL,

  -- Normalized fields
  source          TEXT        NOT NULL
                                CHECK (source IN ('sentinelone', 'bitdefender', 'manual', 'system')),
  source_alert_id TEXT,
  severity        TEXT        NOT NULL DEFAULT 'info'
                                CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  title           TEXT        NOT NULL,
  description     TEXT,
  category        TEXT,
  technique_id    TEXT,
  technique_name  TEXT,
  indicator_type  TEXT,
  indicator_value TEXT,
  host            TEXT,
  host_ip         INET,

  -- Lifecycle
  status          TEXT        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'false_positive')),
  assigned_to     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  resolution_note TEXT,
  playbook_id     UUID,

  -- AI enrichment (populated async by ai-specialist)
  ai_summary      TEXT,
  ai_mitigation   TEXT,
  ai_confidence   NUMERIC(3, 2),

  raw_data        JSONB       NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX alerts_org_severity_idx ON alerts(organization_id, severity, occurred_at DESC);
CREATE INDEX alerts_org_status_idx   ON alerts(organization_id, status, occurred_at DESC);
CREATE INDEX alerts_occurred_at_idx  ON alerts(occurred_at DESC);
CREATE INDEX alerts_source_id_idx    ON alerts(source, source_alert_id);

-- ─── Playbooks ────────────────────────────────────────────────────────────────
CREATE TABLE playbooks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  incident_type   TEXT        NOT NULL,
  trigger_tags    TEXT[]      NOT NULL DEFAULT '{}',
  steps           JSONB       NOT NULL DEFAULT '[]',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  version         INTEGER     NOT NULL DEFAULT 1,
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Back-reference: alerts → playbooks
ALTER TABLE alerts
  ADD CONSTRAINT alerts_playbook_fk
  FOREIGN KEY (playbook_id) REFERENCES playbooks(id) ON DELETE SET NULL;

-- ─── Audit Logs (Immutable Append-Only) ──────────────────────────────────────
CREATE TABLE audit_logs (
  id              BIGSERIAL   PRIMARY KEY,
  organization_id UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  actor_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email     TEXT,
  action          TEXT        NOT NULL,
  target_type     TEXT,
  target_id       TEXT,
  before_state    JSONB,
  after_state     JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_org_idx    ON audit_logs(organization_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx  ON audit_logs(actor_id, created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);

-- ─── Vector Documents (AI Knowledge Base) ────────────────────────────────────
CREATE TABLE vector_documents (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID    REFERENCES organizations(id) ON DELETE CASCADE,
  source_file     TEXT    NOT NULL,
  chunk_index     INTEGER NOT NULL,
  content         TEXT    NOT NULL,
  embedding       VECTOR(1536),
  metadata        JSONB   NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_file, chunk_index)
);

-- IVFFlat index for cosine similarity search
CREATE INDEX vector_documents_embedding_idx
  ON vector_documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── System Metrics (SOC Bar Stats) ──────────────────────────────────────────
CREATE TABLE system_metrics (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name     TEXT        NOT NULL,
  metric_value    NUMERIC,
  metric_text     TEXT,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX system_metrics_org_name_idx ON system_metrics(organization_id, metric_name, recorded_at DESC);

-- ─── Service Records (Billing / Invoice Tracking) ────────────────────────────
CREATE TABLE service_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_type     TEXT        NOT NULL
                                CHECK (record_type IN ('invoice', 'credit', 'adjustment')),
  period_start    DATE        NOT NULL,
  period_end      DATE        NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  invoice_ref     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX service_records_org_idx ON service_records(organization_id, period_start DESC);
