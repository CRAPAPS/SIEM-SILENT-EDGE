-- ─── Silent Edge Platform — Migration 0004: Iron Vault ──────────────────────
-- New tables: fingerprint_sessions, threat_telemetry, specialist_logs, remediation_proposals

-- ─── Silent Edge ID — Browser/Device DNA ─────────────────────────────────────
CREATE TABLE fingerprint_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id      UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  fingerprint_id  TEXT        NOT NULL,
  confidence      NUMERIC(4,3),
  ip_address      INET,
  user_agent      TEXT,
  geo_lat         NUMERIC(9,6),
  geo_lon         NUMERIC(9,6),
  geo_city        TEXT,
  geo_country     TEXT,
  is_anomalous    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fp_sessions_profile_idx ON fingerprint_sessions(profile_id, created_at DESC);
CREATE INDEX fp_sessions_fp_idx      ON fingerprint_sessions(fingerprint_id);
CREATE INDEX fp_sessions_org_idx     ON fingerprint_sessions(organization_id, created_at DESC);

-- ─── Threat Intelligence Feed (OTX / MISP) ───────────────────────────────────
CREATE TABLE threat_telemetry (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT        NOT NULL CHECK (source IN ('otx', 'misp', 'manual')),
  ioc_type        TEXT        NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'hash', 'url', 'email', 'asn')),
  ioc_value       TEXT        NOT NULL,
  threat_name     TEXT,
  malware_family  TEXT,
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  confidence      SMALLINT    NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  geo_lat         NUMERIC(9,6),
  geo_lon         NUMERIC(9,6),
  geo_country     TEXT,
  first_seen      TIMESTAMPTZ,
  last_seen       TIMESTAMPTZ,
  pulse_id        TEXT,
  raw_data        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX threat_telemetry_ioc_idx    ON threat_telemetry(source, ioc_type, ioc_value);
CREATE INDEX        threat_telemetry_val_idx     ON threat_telemetry(ioc_type, ioc_value);
CREATE INDEX        threat_telemetry_country_idx ON threat_telemetry(geo_country);

-- ─── Specialist Decision Log (Immutable — Forensic Chain of Custody) ──────────
CREATE TABLE specialist_logs (
  id              BIGSERIAL   PRIMARY KEY,
  organization_id UUID        REFERENCES organizations(id) ON DELETE SET NULL,
  alert_id        UUID        REFERENCES alerts(id) ON DELETE SET NULL,
  actor_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  query           TEXT        NOT NULL,
  response        TEXT        NOT NULL,
  tool_calls      JSONB       NOT NULL DEFAULT '[]',
  rag_chunks_used INTEGER,
  tokens_used     INTEGER,
  provider        TEXT        NOT NULL DEFAULT 'claude',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX specialist_logs_org_idx   ON specialist_logs(organization_id, created_at DESC);
CREATE INDEX specialist_logs_alert_idx ON specialist_logs(alert_id);
CREATE INDEX specialist_logs_actor_idx ON specialist_logs(actor_id);

-- ─── Proposal Engine — AI-Drafted Remediation Proposals ──────────────────────
CREATE TABLE remediation_proposals (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_id          UUID        REFERENCES alerts(id) ON DELETE SET NULL,
  device_id         UUID        REFERENCES devices(id) ON DELETE SET NULL,
  specialist_log_id BIGINT      REFERENCES specialist_logs(id) ON DELETE SET NULL,
  title             TEXT        NOT NULL,
  summary           TEXT        NOT NULL,
  script            TEXT,
  script_type       TEXT        CHECK (script_type IN ('powershell', 'bash', 'sentinelone_api', 'ninjaone_api')),
  risk_level        TEXT        NOT NULL DEFAULT 'medium'
                                  CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'failed')),
  reviewed_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  executed_at       TIMESTAMPTZ,
  execution_result  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX proposals_org_status_idx ON remediation_proposals(organization_id, status, created_at DESC);
CREATE INDEX proposals_alert_idx      ON remediation_proposals(alert_id);

-- Auto-update updated_at on proposals
CREATE TRIGGER set_updated_at_proposals
  BEFORE UPDATE ON remediation_proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE fingerprint_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_telemetry      ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_proposals ENABLE ROW LEVEL SECURITY;

-- fingerprint_sessions: admin sees all; each user sees their own sessions
CREATE POLICY fp_admin ON fingerprint_sessions
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin');

CREATE POLICY fp_self ON fingerprint_sessions
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- threat_telemetry: shared intel — all authenticated can read; only admin can write
CREATE POLICY tt_read ON threat_telemetry
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY tt_admin ON threat_telemetry
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- specialist_logs: immutable — admin sees all; others see own org; insert requires actor = self
CREATE POLICY sl_admin ON specialist_logs
  FOR SELECT TO authenticated
  USING (current_user_role() = 'admin');

CREATE POLICY sl_org ON specialist_logs
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('analyst', 'client')
    AND organization_id = current_user_org()
  );

CREATE POLICY sl_insert ON specialist_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- remediation_proposals: admin full access; analyst can see + create own org; client blocked
CREATE POLICY rp_admin ON remediation_proposals
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

CREATE POLICY rp_analyst_read ON remediation_proposals
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'analyst'
    AND organization_id = current_user_org()
  );

CREATE POLICY rp_analyst_create ON remediation_proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN ('admin', 'analyst')
    AND organization_id = current_user_org()
  );

-- ─── Realtime publications ────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE remediation_proposals;
