-- ============================================
-- 000027 Production Drift Repair
-- ============================================
-- Production's migration history records 000017 as applied, but the
-- database only received part of it (hand-applied historically):
--   - shepherd_applications is missing all 000017 columns
--   - its 000017 RLS policies were never created (no INSERT policy at all)
--   - the legacy applications table was never dropped
-- The result: shepherd application submission fails with a 500.
-- This migration re-applies 000017's operations idempotently.

-- ── 1. Missing columns ──────────────────────────────────────────
ALTER TABLE public.shepherd_applications
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS denomination TEXT,
  ADD COLUMN IF NOT EXISTS wwcc_number TEXT,
  ADD COLUMN IF NOT EXISTS wwcc_expiry DATE,
  ADD COLUMN IF NOT EXISTS police_check_date DATE,
  ADD COLUMN IF NOT EXISTS first_aid_expiry DATE,
  ADD COLUMN IF NOT EXISTS emergency_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS reference_name TEXT,
  ADD COLUMN IF NOT EXISTS reference_contact TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shepherd_applications_email ON public.shepherd_applications(email);
CREATE INDEX IF NOT EXISTS idx_shepherd_applications_status_created ON public.shepherd_applications(status, created_at DESC);

-- ── 2. Migrate legacy applications rows, then drop the table ────
-- motivation is NOT NULL, so use a placeholder (000017's NULL would
-- violate the constraint if any legacy rows exist).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    INSERT INTO public.shepherd_applications (
      user_id, full_name, email, phone, location, denomination, tradition,
      wwcc_number, wwcc_expiry, police_check_date, first_aid_expiry,
      emergency_name, emergency_phone, reference_name, reference_contact,
      experience, motivation, vision, status, created_at, reviewed_at, reviewed_by
    )
    SELECT
      a.user_id,
      a.name,
      a.email,
      a.phone,
      a.location,
      a.denomination,
      a.denomination,
      a.wwcc_number,
      a.wwcc_expiry,
      a.police_check_date,
      a.first_aid_expiry,
      a.emergency_name,
      a.emergency_phone,
      a.reference_name,
      a.reference_contact,
      NULL,
      'Migrated from legacy applications',
      NULL,
      a.status,
      a.submitted_at,
      a.reviewed_at,
      a.reviewed_by
    FROM public.applications a
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DROP TABLE IF EXISTS public.applications CASCADE;

-- ── 3. RLS policies on shepherd_applications ────────────────────
ALTER TABLE public.shepherd_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Users can view own shepherd applications"
  ON public.shepherd_applications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Users can insert own shepherd applications"
  ON public.shepherd_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Users can update own pending shepherd applications"
  ON public.shepherd_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can read all shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Admins can read all shepherd applications"
  ON public.shepherd_applications FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can update shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Admins can update shepherd applications"
  ON public.shepherd_applications FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 4. Re-assert document table policies ────────────────────────
ALTER TABLE public.shepherd_application_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own application documents" ON public.shepherd_application_documents;
CREATE POLICY "Users can view own application documents"
  ON public.shepherd_application_documents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own application documents" ON public.shepherd_application_documents;
CREATE POLICY "Users can insert own application documents"
  ON public.shepherd_application_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage application documents" ON public.shepherd_application_documents;
CREATE POLICY "Admins can manage application documents"
  ON public.shepherd_application_documents FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
