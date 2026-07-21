-- ============================================
-- Unify Shepherd Application Schema
-- ============================================
-- Adopts shepherd_applications as the single source of truth.
-- Adds verification/document fields previously stored in applications.
-- Migrates existing applications rows into shepherd_applications.
-- Drops the legacy applications table.

-- ── 1. Add verification fields to shepherd_applications ───────────

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

-- Indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_shepherd_applications_email ON public.shepherd_applications(email);
CREATE INDEX IF NOT EXISTS idx_shepherd_applications_status_created ON public.shepherd_applications(status, created_at DESC);

-- ── 2. Migrate data from legacy applications table ────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    INSERT INTO public.shepherd_applications (
      user_id,
      full_name,
      email,
      phone,
      location,
      denomination,
      tradition,
      wwcc_number,
      wwcc_expiry,
      police_check_date,
      first_aid_expiry,
      emergency_name,
      emergency_phone,
      reference_name,
      reference_contact,
      experience,
      motivation,
      vision,
      status,
      created_at,
      reviewed_at,
      reviewed_by
    )
    SELECT
      a.user_id,
      a.name AS full_name,
      a.email,
      a.phone,
      a.location,
      a.denomination,
      a.denomination AS tradition,
      a.wwcc_number,
      a.wwcc_expiry,
      a.police_check_date,
      a.first_aid_expiry,
      a.emergency_name,
      a.emergency_phone,
      a.reference_name,
      a.reference_contact,
      NULL AS experience,
      NULL AS motivation,
      NULL AS vision,
      a.status,
      a.submitted_at AS created_at,
      a.reviewed_at,
      a.reviewed_by
    FROM public.applications a
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ── 3. Drop legacy applications table and related policies ────────

DROP TABLE IF EXISTS public.applications CASCADE;

-- ── 4. Ensure RLS policies on shepherd_applications are correct ───

ALTER TABLE public.shepherd_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
DROP POLICY IF EXISTS "Users can view own shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Users can view own shepherd applications"
  ON public.shepherd_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own applications
DROP POLICY IF EXISTS "Users can insert own shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Users can insert own shepherd applications"
  ON public.shepherd_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
DROP POLICY IF EXISTS "Users can update own pending shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Users can update own pending shepherd applications"
  ON public.shepherd_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can read all
DROP POLICY IF EXISTS "Admins can read all shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Admins can read all shepherd applications"
  ON public.shepherd_applications FOR SELECT
  USING (public.is_app_admin());

-- Admins can update all
DROP POLICY IF EXISTS "Admins can update shepherd applications" ON public.shepherd_applications;
CREATE POLICY "Admins can update shepherd applications"
  ON public.shepherd_applications FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 5. Create application documents table (for verification uploads) ─

CREATE TABLE IF NOT EXISTS public.shepherd_application_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES public.shepherd_applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('wwcc', 'police_check', 'first_aid', 'photo_id')),
  storage_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  file_size_bytes INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shepherd_app_docs_application ON public.shepherd_application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_shepherd_app_docs_user ON public.shepherd_application_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_shepherd_app_docs_type ON public.shepherd_application_documents(document_type);

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

-- ── 6. Add helper to check if user has pending application ────────

CREATE OR REPLACE FUNCTION public.has_pending_shepherd_application(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shepherd_applications
    WHERE user_id = p_user_id AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
