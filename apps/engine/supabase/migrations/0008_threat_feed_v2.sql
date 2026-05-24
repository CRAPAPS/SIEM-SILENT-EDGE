-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0008: ThreatFeed Intelligence Engine v2
--   • Extend threat_telemetry with new sources + MITRE fields
--   • mitre_techniques table (seeded by mitre-sync edge function)
--   • cisa_kev_entries table (seeded by cisa-kev-sync edge function)
--   • threat_feed_sync_log table (feed health per source)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Extend threat_telemetry ───────────────────────────────────────────────

ALTER TABLE threat_telemetry
  DROP CONSTRAINT IF EXISTS threat_telemetry_source_check;

ALTER TABLE threat_telemetry
  ADD CONSTRAINT threat_telemetry_source_check
    CHECK (source IN ('otx','misp','threatfox','urlhaus','feodo','cisa_kev','manual'));

ALTER TABLE threat_telemetry
  ADD COLUMN IF NOT EXISTS mitre_technique_ids TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS adversary_group      TEXT;

-- ── 2. mitre_techniques ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mitre_techniques (
  technique_id    TEXT        PRIMARY KEY,          -- T1059.001
  name            TEXT        NOT NULL,             -- PowerShell
  tactic          TEXT        NOT NULL,             -- execution
  tactic_id       TEXT        NOT NULL,             -- TA0002
  is_subtechnique BOOLEAN     NOT NULL DEFAULT false,
  parent_id       TEXT,                             -- T1059 (for sub-techniques)
  platforms       TEXT[]      NOT NULL DEFAULT '{}',
  description     TEXT,
  url             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mitre_techniques_tactic_idx  ON mitre_techniques(tactic);
CREATE INDEX IF NOT EXISTS mitre_techniques_parent_idx  ON mitre_techniques(parent_id);

ALTER TABLE mitre_techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mitre_techniques_select_authenticated"
  ON mitre_techniques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "mitre_techniques_write_admin"
  ON mitre_techniques FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ── 3. cisa_kev_entries ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cisa_kev_entries (
  cve_id              TEXT        PRIMARY KEY,
  vendor_project      TEXT,
  product             TEXT,
  vulnerability_name  TEXT,
  date_added          DATE,
  short_description   TEXT,
  required_action     TEXT,
  due_date            DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cisa_kev_date_idx ON cisa_kev_entries(date_added DESC);
CREATE INDEX IF NOT EXISTS cisa_kev_due_idx  ON cisa_kev_entries(due_date);

ALTER TABLE cisa_kev_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cisa_kev_select_authenticated"
  ON cisa_kev_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cisa_kev_write_admin"
  ON cisa_kev_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ── 4. threat_feed_sync_log ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS threat_feed_sync_log (
  id           BIGSERIAL   PRIMARY KEY,
  source       TEXT        NOT NULL,
  iocs_added   INTEGER     NOT NULL DEFAULT 0,
  iocs_updated INTEGER     NOT NULL DEFAULT 0,
  error        TEXT,
  duration_ms  INTEGER,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_log_source_idx ON threat_feed_sync_log(source, synced_at DESC);

ALTER TABLE threat_feed_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_log_select_authenticated"
  ON threat_feed_sync_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sync_log_write_admin"
  ON threat_feed_sync_log FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ── 5. Realtime publication for sync log (feed status dashboard) ─────────────

ALTER PUBLICATION supabase_realtime ADD TABLE threat_feed_sync_log;
