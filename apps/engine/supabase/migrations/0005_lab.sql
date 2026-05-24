-- ============================================================
-- 0005_lab.sql — Silent Edge Persistent Tactical Lab
-- Tables: lab_runs, lab_findings
-- RLS: admin full / analyst create+view own org / client blocked
-- ============================================================

-- ── lab_runs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       TEXT NOT NULL CHECK (unit_id IN ('osint-unit', 'redteam-unit')),
  tool_name     TEXT NOT NULL,
  target        TEXT NOT NULL,
  script_hash   TEXT,
  status        TEXT NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'completed', 'failed')),
  stdout_path   TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  initiated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE
);

ALTER TABLE lab_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_lab_runs" ON lab_runs
  FOR ALL TO authenticated
  USING (current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_lab_runs" ON lab_runs
  FOR ALL TO authenticated
  USING (
    current_user_role() = 'analyst'
    AND org_id = current_user_org()
  )
  WITH CHECK (
    current_user_role() = 'analyst'
    AND org_id = current_user_org()
  );

-- Clients have no access to lab_runs

-- ── lab_findings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_findings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID REFERENCES lab_runs(id) ON DELETE CASCADE,
  ioc_type      TEXT NOT NULL
                  CHECK (ioc_type IN ('ip', 'domain', 'email', 'url', 'hash', 'port', 'geo')),
  ioc_value     TEXT NOT NULL,
  confidence    NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),
  source_tool   TEXT NOT NULL,
  geo_lat       NUMERIC(9,6),
  geo_lon       NUMERIC(9,6),
  geo_country   TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX lab_findings_ioc_idx ON lab_findings (ioc_type, ioc_value);
CREATE INDEX lab_findings_org_idx ON lab_findings (org_id);
CREATE INDEX lab_findings_geo_idx ON lab_findings (geo_lat, geo_lon)
  WHERE geo_lat IS NOT NULL AND geo_lon IS NOT NULL;

ALTER TABLE lab_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_lab_findings" ON lab_findings
  FOR ALL TO authenticated
  USING (current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_lab_findings" ON lab_findings
  FOR ALL TO authenticated
  USING (
    current_user_role() = 'analyst'
    AND org_id = current_user_org()
  )
  WITH CHECK (
    current_user_role() = 'analyst'
    AND org_id = current_user_org()
  );

-- Clients have no access to lab_findings

-- ── Realtime ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE lab_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE lab_findings;
