-- ============================================
-- Admin Setup
-- ============================================
-- 1. Helper function to check admin status
-- 2. Auto-promote meekmeets@gmail.com to admin
-- 3. Admin RLS policies for restricted tables
-- 4. Admin dashboard analytics view

-- ── 1. Admin helper function ──────────────────────

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Promote existing meekmeets@gmail.com ───────

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'meekmeets@gmail.com'
);

-- Auto-promote on future signups
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'meekmeets@gmail.com' THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_admin ON auth.users;
CREATE TRIGGER on_auth_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();

-- ── 3. Admin RLS policies ─────────────────────────

-- Applications: admin can read all
CREATE POLICY "Admins can read all applications"
  ON public.applications FOR SELECT
  USING (public.is_app_admin());

-- RSVPs: admin can read all
CREATE POLICY "Admins can read all RSVPs"
  ON public.rsvps FOR SELECT
  USING (public.is_app_admin());

-- Responses: admin can read all
CREATE POLICY "Admins can read all responses"
  ON public.responses FOR SELECT
  USING (public.is_app_admin());

-- Meeting analytics: admin can read all
CREATE POLICY "Admins can read all meeting analytics"
  ON public.meeting_analytics FOR SELECT
  USING (public.is_app_admin());

-- NOTE: admin read policies for circle_shepherds / circle_actions are NOT here —
-- those tables are not created until 000015. circle_shepherds is publicly
-- readable (000015); the admin read policy for circle_actions lives in 000025.

-- Meeting questions: admin can read all
CREATE POLICY "Admins can read all meeting questions"
  ON public.meeting_questions FOR SELECT
  USING (public.is_app_admin());

-- News questions: admin can manage
CREATE POLICY "Admins can manage news questions"
  ON public.news_questions FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 4. Admin stats helper view ────────────────────

CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'shepherd' OR role = 'admin') AS total_shepherds,
  (SELECT COUNT(*) FROM public.circles) AS total_circles,
  (SELECT COUNT(*) FROM public.meetings WHERE status = 'scheduled') AS total_scheduled_meetings,
  (SELECT COUNT(*) FROM public.meetings WHERE status = 'completed') AS total_completed_meetings,
  (SELECT COUNT(*) FROM public.applications WHERE status = 'pending') AS pending_applications,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'member') AS total_members,
  (SELECT COUNT(*) FROM public.responses) AS total_responses,
  (SELECT COUNT(DISTINCT user_id) FROM public.rsvps WHERE status = 'going') AS active_rsvps;
