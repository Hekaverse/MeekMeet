-- Authorities and submissions tables for direct civic advocacy.

CREATE TABLE IF NOT EXISTS public.authorities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  authority_type TEXT NOT NULL CHECK (authority_type IN ('council', 'mp_state', 'mp_federal', 'government_department', 'organisation')),
  region_type TEXT CHECK (region_type IN ('lga', 'state_electorate', 'federal_electorate', 'state', 'country')),
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  office_address TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (authority_type, region_code)
);

CREATE INDEX IF NOT EXISTS idx_authorities_region ON public.authorities(region_type, region_code);
CREATE INDEX IF NOT EXISTS idx_authorities_type ON public.authorities(authority_type);

CREATE TABLE IF NOT EXISTS public.authority_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  authority_id UUID REFERENCES public.authorities(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  circle_id UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'responded', 'bounced')),
  subject TEXT NOT NULL,
  body_html TEXT,
  response_received_at TIMESTAMPTZ,
  response_body TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_authority_submissions_authority ON public.authority_submissions(authority_id);
CREATE INDEX IF NOT EXISTS idx_authority_submissions_report ON public.authority_submissions(report_id);
CREATE INDEX IF NOT EXISTS idx_authority_submissions_status ON public.authority_submissions(status);

ALTER TABLE public.authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authorities are publicly readable" ON public.authorities;
CREATE POLICY "Authorities are publicly readable"
  ON public.authorities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage authorities" ON public.authorities;
CREATE POLICY "Admins can manage authorities"
  ON public.authorities FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Shepherds can view own submissions" ON public.authority_submissions;
CREATE POLICY "Shepherds can view own submissions"
  ON public.authority_submissions FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR public.is_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = authority_submissions.circle_id AND cs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage submissions" ON public.authority_submissions;
CREATE POLICY "Admins can manage submissions"
  ON public.authority_submissions FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
