-- Reports generated for circles and authorities.

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('circle', 'local_authority', 'regional', 'national')),
  circle_id UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  region_type TEXT CHECK (region_type IN ('lga', 'state_electorate', 'federal_electorate', 'state', 'country')),
  region_code TEXT,
  region_name TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_to_authority_at TIMESTAMPTZ,
  sent_to_authority_email TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'submitted', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_reports_circle ON public.reports(circle_id);
CREATE INDEX IF NOT EXISTS idx_reports_region ON public.reports(region_type, region_code);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON public.reports(generated_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shepherds can view circle reports" ON public.reports;
CREATE POLICY "Shepherds can view circle reports"
  ON public.reports FOR SELECT
  USING (
    (report_type = 'circle' AND EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = reports.circle_id AND cs.user_id = auth.uid()
    ))
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports"
  ON public.reports FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());
