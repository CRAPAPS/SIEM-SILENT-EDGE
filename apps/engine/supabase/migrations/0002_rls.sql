-- ─── Silent Edge Platform — RLS Policies Migration 0002 (Fixed for Supabase) ──
-- IMPORTANT: Supabase does not allow creating functions in the auth schema.
-- Helper functions go in public schema. Run after 0001_schema.sql.

-- ─── Enable RLS on All Tables ────────────────────────────────────────────────
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records  ENABLE ROW LEVEL SECURITY;

-- ─── Helper Functions in PUBLIC schema (not auth — Supabase restriction) ─────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- ─── organizations ────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_organizations" ON organizations
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "member_own_organization" ON organizations
  FOR SELECT TO authenticated
  USING (id = public.current_user_org() AND public.current_user_role() IN ('analyst', 'client'));

-- ─── profiles ─────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst');

CREATE POLICY "user_own_profile_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_own_profile_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── api_credentials (client role has NO access) ─────────────────────────────
CREATE POLICY "admin_all_creds" ON api_credentials
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_creds_ro" ON api_credentials
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst');

-- ─── devices ──────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_devices" ON devices
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_devices" ON devices
  FOR ALL TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst')
  WITH CHECK (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst');

CREATE POLICY "client_own_org_devices_ro" ON devices
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'client');

-- ─── alerts ───────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_alerts" ON alerts
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_alerts" ON alerts
  FOR ALL TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst')
  WITH CHECK (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst');

CREATE POLICY "client_own_org_alerts_ro" ON alerts
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'client');

-- ─── playbooks ────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_playbooks" ON playbooks
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_playbooks" ON playbooks
  FOR ALL TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst')
  WITH CHECK (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst');

CREATE POLICY "client_own_org_playbooks_ro" ON playbooks
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'client');

-- ─── audit_logs (append-only — no UPDATE or DELETE for anyone) ───────────────
CREATE POLICY "admin_audit_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "analyst_own_org_audit_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'analyst');

CREATE POLICY "authenticated_insert_audit" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- ─── vector_documents ─────────────────────────────────────────────────────────
CREATE POLICY "admin_all_vector_docs" ON vector_documents
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "member_global_vector_docs" ON vector_documents
  FOR SELECT TO authenticated
  USING (organization_id IS NULL);

CREATE POLICY "member_own_org_vector_docs" ON vector_documents
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org());

-- ─── system_metrics ───────────────────────────────────────────────────────────
CREATE POLICY "admin_all_metrics" ON system_metrics
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "member_own_org_metrics" ON system_metrics
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() OR organization_id IS NULL);

-- ─── service_records ──────────────────────────────────────────────────────────
CREATE POLICY "admin_all_service_records" ON service_records
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

CREATE POLICY "client_own_org_service_records_ro" ON service_records
  FOR SELECT TO authenticated
  USING (organization_id = public.current_user_org() AND public.current_user_role() = 'client');
