-- ============================================
-- 000026 RLS Recursion Fix
-- ============================================
-- "Lead shepherds can manage circle shepherds" (000015) subqueries
-- circle_shepherds in its own policy. Any other policy that subqueries
-- circle_shepherds (meetings, circle_questions, reports, ...) therefore
-- recurses infinitely and Postgres aborts with 42P17 — silently breaking
-- those queries for anon and authenticated roles alike.
--
-- Fix: SECURITY DEFINER membership helpers (the definer bypasses RLS, so
-- the recursion cycle is broken), then recreate every affected policy
-- in terms of those helpers.

-- ── 1. Membership helpers ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_circle_shepherd(p_circle_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.circle_shepherds cs
    WHERE cs.circle_id = p_circle_id AND cs.user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_circle_lead(p_circle_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.circle_shepherds cs
    WHERE cs.circle_id = p_circle_id AND cs.user_id = auth.uid() AND cs.role = 'lead'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_circle_shepherd(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_circle_lead(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_circle_shepherd(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_lead(UUID) TO anon, authenticated;

-- ── 2. circle_shepherds: the self-referential root cause ────────
DROP POLICY IF EXISTS "Lead shepherds can manage circle shepherds" ON public.circle_shepherds;
CREATE POLICY "Lead shepherds can manage circle shepherds"
  ON public.circle_shepherds FOR ALL
  USING (public.is_circle_lead(circle_id) OR public.is_app_admin())
  WITH CHECK (public.is_circle_lead(circle_id) OR public.is_app_admin());

-- ── 3. Direct circle membership checks ──────────────────────────
DROP POLICY IF EXISTS "Shepherds can manage circle actions" ON public.circle_actions;
CREATE POLICY "Shepherds can manage circle actions"
  ON public.circle_actions FOR ALL
  USING (public.is_circle_shepherd(circle_id) OR public.is_app_admin())
  WITH CHECK (public.is_circle_shepherd(circle_id) OR public.is_app_admin());

DROP POLICY IF EXISTS "Shepherds can manage meetings for their circles" ON public.meetings;
CREATE POLICY "Shepherds can manage meetings for their circles"
  ON public.meetings FOR ALL
  USING (public.is_circle_shepherd(circle_id) OR public.is_app_admin())
  WITH CHECK (public.is_circle_shepherd(circle_id) OR public.is_app_admin());

-- circle_questions / circle_routines had TWO competing policies each
-- (000015 and 000016 used different names) — unify under the 000016 names.
DROP POLICY IF EXISTS "Shepherds can manage circle questions" ON public.circle_questions;
DROP POLICY IF EXISTS "Shepherds can manage questions for their circles" ON public.circle_questions;
CREATE POLICY "Shepherds can manage questions for their circles"
  ON public.circle_questions FOR ALL
  USING (public.is_circle_shepherd(circle_id) OR public.is_app_admin())
  WITH CHECK (public.is_circle_shepherd(circle_id) OR public.is_app_admin());

DROP POLICY IF EXISTS "Shepherds can manage circle routines" ON public.circle_routines;
DROP POLICY IF EXISTS "Shepherds can manage routines for their circles" ON public.circle_routines;
CREATE POLICY "Shepherds can manage routines for their circles"
  ON public.circle_routines FOR ALL
  USING (public.is_circle_shepherd(circle_id) OR public.is_app_admin())
  WITH CHECK (public.is_circle_shepherd(circle_id) OR public.is_app_admin());

-- ── 4. Checks via the meeting's circle ──────────────────────────
DROP POLICY IF EXISTS "Shepherds can manage meeting questions for their circles" ON public.meeting_questions;
CREATE POLICY "Shepherds can manage meeting questions for their circles"
  ON public.meeting_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_questions.meeting_id
        AND public.is_circle_shepherd(m.circle_id)
    )
    OR public.is_app_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_questions.meeting_id
        AND public.is_circle_shepherd(m.circle_id)
    )
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Shepherds can view all responses for their circle's meetings" ON public.responses;
CREATE POLICY "Shepherds can view all responses for their circle's meetings"
  ON public.responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = responses.meeting_id
        AND public.is_circle_shepherd(m.circle_id)
    )
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Shepherds can view analytics for their circle meetings" ON public.meeting_analytics;
CREATE POLICY "Shepherds can view analytics for their circle meetings"
  ON public.meeting_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_analytics.meeting_id
        AND public.is_circle_shepherd(m.circle_id)
    )
    OR public.is_app_admin()
  );

-- ── 5. circles update/delete ────────────────────────────────────
DROP POLICY IF EXISTS "Shepherds can update their circles" ON public.circles;
CREATE POLICY "Shepherds can update their circles"
  ON public.circles FOR UPDATE
  USING (public.is_circle_shepherd(id) OR public.is_app_admin())
  WITH CHECK (public.is_circle_shepherd(id) OR public.is_app_admin());

DROP POLICY IF EXISTS "Shepherds can delete their circles" ON public.circles;
CREATE POLICY "Shepherds can delete their circles"
  ON public.circles FOR DELETE
  USING (public.is_circle_lead(id) OR public.is_app_admin());

-- ── 6. Insights / generated content ─────────────────────────────
DROP POLICY IF EXISTS "Circle insights viewable by shepherds" ON public.circle_insights;
CREATE POLICY "Circle insights viewable by shepherds"
  ON public.circle_insights FOR SELECT
  USING (public.is_circle_shepherd(circle_id) OR public.is_app_admin());

DROP POLICY IF EXISTS "Generated questions viewable by relevant users" ON public.generated_questions;
CREATE POLICY "Generated questions viewable by relevant users"
  ON public.generated_questions FOR SELECT
  USING (
    circle_id IS NULL
    OR public.is_app_admin()
    OR public.is_circle_shepherd(circle_id)
  );

-- ── 7. Reports / authority submissions ──────────────────────────
DROP POLICY IF EXISTS "Shepherds can view circle reports" ON public.reports;
CREATE POLICY "Shepherds can view circle reports"
  ON public.reports FOR SELECT
  USING (
    (report_type = 'circle' AND public.is_circle_shepherd(circle_id))
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Shepherds can create circle reports" ON public.reports;
CREATE POLICY "Shepherds can create circle reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    generated_by = auth.uid()
    AND report_type = 'circle'
    AND public.is_circle_shepherd(circle_id)
  );

DROP POLICY IF EXISTS "Shepherds can update own circle reports" ON public.reports;
CREATE POLICY "Shepherds can update own circle reports"
  ON public.reports FOR UPDATE
  USING (public.is_circle_shepherd(circle_id))
  WITH CHECK (public.is_circle_shepherd(circle_id));

DROP POLICY IF EXISTS "Shepherds can view own submissions" ON public.authority_submissions;
CREATE POLICY "Shepherds can view own submissions"
  ON public.authority_submissions FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR public.is_app_admin()
    OR public.is_circle_shepherd(circle_id)
  );

DROP POLICY IF EXISTS "Shepherds can record submissions" ON public.authority_submissions;
CREATE POLICY "Shepherds can record submissions"
  ON public.authority_submissions FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND (
      public.is_app_admin()
      OR public.is_circle_shepherd(circle_id)
    )
  );
