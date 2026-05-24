-- ─── Silent Edge Platform — Migration 0006: Super Admin Role ─────────────────
-- Patches the live DB (0001-0005 already applied).
-- Uses ALTER POLICY (not DROP+CREATE) and dynamic constraint lookup to avoid
-- transaction-aborting "already exists" errors.

-- ─── 1. Update profiles.role CHECK constraint ─────────────────────────────────
-- Find the actual constraint name dynamically, drop it, then add the new one.
DO $$
DECLARE
  v_con TEXT;
BEGIN
  SELECT conname INTO v_con
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%analyst%';

  IF v_con IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(v_con);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'analyst', 'client'));

-- ─── 2. RLS policies — use ALTER POLICY to update USING/WITH CHECK in place ───

ALTER POLICY "admin_all_organizations"  ON public.organizations
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_profiles"       ON public.profiles
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_creds"          ON public.api_credentials
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_devices"        ON public.devices
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_alerts"         ON public.alerts
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_playbooks"      ON public.playbooks
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_audit_read"         ON public.audit_logs
  USING (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_vector_docs"    ON public.vector_documents
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_metrics"        ON public.system_metrics
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_service_records" ON public.service_records
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "fp_admin"                 ON public.fingerprint_sessions
  USING (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "tt_admin"                 ON public.threat_telemetry
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "sl_admin"                 ON public.specialist_logs
  USING (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "rp_admin"                 ON public.remediation_proposals
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_lab_runs"       ON public.lab_runs
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));

ALTER POLICY "admin_all_lab_findings"   ON public.lab_findings
  USING (public.current_user_role() IN ('super_admin', 'admin'))
  WITH CHECK (public.current_user_role() IN ('super_admin', 'admin'));
