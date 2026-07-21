-- ============================================
-- 000025 Production Hardening
-- ============================================
-- Fixes from the production-readiness audit:
--   1. Missing schema used by code (profiles.email, meetings.ended_at)
--   2. Signup trigger deadlock + email capture + search_path hardening
--   3. Role-escalation lockdown on profiles
--   4. Admin review RPC (only sanctioned path for role changes)
--   5. Remove service-role key from meek_meet_config (use Supabase Vault)
--   6. Missing write policies (reports, authority_submissions)
--   7. Broken get_meeting_responses() (uuid = text join, wrong table)
--   8. meeting_analytics columns the synthesize functions actually write
--   9. admin_stats (anon-readable, references dropped table) -> admin RPC
--  10. Tighten public exposure (meetings, circle_actions, place_service_times)
--  11. Realtime publication for meetings
--  12. Normalize circles.country_code casing
--
-- MANUAL STEP REQUIRED AFTER DEPLOY (one time, SQL editor):
--   SELECT vault.create_secret('<service-role-key>', 'supabase_service_role_key');
--   INSERT INTO public.meek_meet_config (key, value) VALUES ('supabase_project_ref', '<project-ref>')
--     ON CONFLICT (key) DO NOTHING;

-- ── 1. Missing columns ──────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Backfill profile emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- ── 2. Signup triggers ──────────────────────────────────────────
-- handle_new_user: capture email; ON CONFLICT removes the ordering deadlock
-- with handle_new_user_admin (same-event triggers fire in name order).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles AS p (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, p.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, p.avatar_url),
        email = COALESCE(EXCLUDED.email, p.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email = 'meekmeets@gmail.com' THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.email,
      'admin'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$;

-- Keep profiles.email in sync when a user changes their auth email
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- ── 3. search_path hardening for existing SECURITY DEFINER functions ──
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_pending_shepherd_application(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shepherd_applications
    WHERE user_id = p_user_id AND status = 'pending'
  );
END;
$$;

-- ── 4. Role-escalation lockdown ─────────────────────────────────
-- End-user API calls (anon/authenticated JWT) may never change profiles.role.
-- Trusted contexts (no JWT: migrations, SQL editor, Auth service; or a
-- service_role JWT) may. The review RPC flips a transaction-local switch.
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('app.role_change_allowed', true) = 'on' THEN
    RETURN NEW;
  END IF;
  IF auth.jwt() IS NULL OR COALESCE(auth.jwt() ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND NEW.role IS DISTINCT FROM 'member' THEN
    RAISE EXCEPTION 'profile role cannot be set directly';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'profile role cannot be changed directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_role ON public.profiles;
CREATE TRIGGER trg_guard_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- Tighten the self-update policy and add the (previously missing) admin update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 5. Admin review RPC — the only sanctioned role-change path ──
CREATE OR REPLACE FUNCTION public.review_shepherd_application(
  p_application_id UUID,
  p_decision TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid decision: %', p_decision;
  END IF;

  UPDATE public.shepherd_applications
  SET status = p_decision,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_application_id AND status = 'pending'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application % not found or already reviewed', p_application_id;
  END IF;

  IF p_decision = 'approved' AND v_user_id IS NOT NULL THEN
    PERFORM set_config('app.role_change_allowed', 'on', true);
    UPDATE public.profiles SET role = 'shepherd' WHERE id = v_user_id AND role = 'member';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_shepherd_application(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_shepherd_application(UUID, TEXT) TO authenticated;

-- ── 6. Service key out of the config table ──────────────────────
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

DELETE FROM public.meek_meet_config WHERE key = 'supabase_service_role_key';

DROP POLICY IF EXISTS "Admins can manage config" ON public.meek_meet_config;
CREATE POLICY "Admins can read config"
  ON public.meek_meet_config FOR SELECT
  USING (public.is_app_admin());

-- The vault view must not be readable by API roles (definer functions still can).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'vault' AND c.relname = 'decrypted_secrets'
  ) THEN
    EXECUTE 'REVOKE SELECT ON vault.decrypted_secrets FROM anon, authenticated';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_meeting_synthesis()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  project_ref TEXT;
  service_key TEXT;
  function_url TEXT;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT value INTO project_ref FROM public.meek_meet_config WHERE key = 'supabase_project_ref';
    SELECT decrypted_secret INTO service_key
      FROM vault.decrypted_secrets
      WHERE name = 'supabase_service_role_key'
      LIMIT 1;

    IF project_ref IS NULL OR service_key IS NULL THEN
      RAISE NOTICE 'Meeting synthesis skipped: set meek_meet_config.supabase_project_ref and the vault secret supabase_service_role_key';
      RETURN NEW;
    END IF;

    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/synthesize-meeting';

    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('meeting_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ── 7. Missing write policies ───────────────────────────────────
DROP POLICY IF EXISTS "Shepherds can create circle reports" ON public.reports;
CREATE POLICY "Shepherds can create circle reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    generated_by = auth.uid()
    AND report_type = 'circle'
    AND EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = reports.circle_id AND cs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Shepherds can update own circle reports" ON public.reports;
CREATE POLICY "Shepherds can update own circle reports"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = reports.circle_id AND cs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = reports.circle_id AND cs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Shepherds can record submissions" ON public.authority_submissions;
CREATE POLICY "Shepherds can record submissions"
  ON public.authority_submissions FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND (
      public.is_app_admin()
      OR EXISTS (
        SELECT 1 FROM public.circle_shepherds cs
        WHERE cs.circle_id = authority_submissions.circle_id AND cs.user_id = auth.uid()
      )
    )
  );

-- ── 8. get_meeting_responses: fix type mismatch and wrong join table ──
-- responses.question_id is TEXT and references meeting_questions.question_id
-- (not circle_questions.id). The old function joined uuid = text and errored.
CREATE OR REPLACE FUNCTION public.get_meeting_responses(p_meeting_id UUID)
RETURNS TABLE (
  question_id UUID,
  question_content TEXT,
  response_id UUID,
  response_content TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mq.id AS question_id,
    mq.content AS question_content,
    r.id AS response_id,
    r.content AS response_content,
    r.user_id,
    r.created_at
  FROM public.responses r
  JOIN public.meeting_questions mq
    ON mq.meeting_id = r.meeting_id
   AND mq.question_id = r.question_id
  WHERE r.meeting_id = p_meeting_id
  ORDER BY mq.order_index, r.created_at;
END;
$$;

-- ── 9. meeting_analytics columns the synthesis pipeline uses ────
ALTER TABLE public.meeting_analytics
  ADD COLUMN IF NOT EXISTS anonymised_quotes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS raw_summary TEXT;

-- ── 10. admin_stats -> admin-only RPC ───────────────────────────
-- The view was readable by anon and referenced the dropped applications table.
DROP VIEW IF EXISTS public.admin_stats;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN json_build_object(
    'total_shepherds', (SELECT COUNT(*) FROM public.profiles WHERE role IN ('shepherd', 'admin')),
    'total_circles', (SELECT COUNT(*) FROM public.circles),
    'total_scheduled_meetings', (SELECT COUNT(*) FROM public.meetings WHERE status = 'scheduled'),
    'total_completed_meetings', (SELECT COUNT(*) FROM public.meetings WHERE status = 'completed'),
    'pending_applications', (SELECT COUNT(*) FROM public.shepherd_applications WHERE status = 'pending'),
    'total_members', (SELECT COUNT(*) FROM public.profiles WHERE role = 'member'),
    'total_responses', (SELECT COUNT(*) FROM public.responses),
    'active_rsvps', (SELECT COUNT(DISTINCT user_id) FROM public.rsvps WHERE status = 'going')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- ── 11. Tighten public exposure ─────────────────────────────────
-- meetings: no more anonymous reads of join_url/notes/coordinates.
-- Anonymous marketing pages use the column-restricted view instead.
DROP POLICY IF EXISTS "Meetings are viewable by everyone" ON public.meetings;
CREATE POLICY "Meetings are viewable by authenticated users"
  ON public.meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE VIEW public.public_meetings
WITH (security_invoker = false) AS
SELECT
  id,
  circle_id,
  scheduled_at,
  duration_minutes,
  location_name,
  location_address,
  is_cancelled,
  status
FROM public.meetings;

GRANT SELECT ON public.public_meetings TO anon, authenticated;

-- circle_actions: internal task data, no longer world-readable
DROP POLICY IF EXISTS "Anyone can read circle actions" ON public.circle_actions;
DROP POLICY IF EXISTS "Admins can read circle actions" ON public.circle_actions;
CREATE POLICY "Admins can read circle actions"
  ON public.circle_actions FOR SELECT
  USING (public.is_app_admin());

-- place_service_times: bind submissions to their author
DROP POLICY IF EXISTS "Authenticated users can submit service times" ON public.place_service_times;
CREATE POLICY "Authenticated users can submit service times"
  ON public.place_service_times FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND submitted_by = auth.uid());

-- ── 12. Realtime for meetings (mobile live-meeting screen) ──────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
  END IF;
END $$;

-- ── 13. Normalize country_code casing ───────────────────────────
UPDATE public.circles
SET country_code = UPPER(country_code)
WHERE country_code IS NOT NULL AND country_code <> UPPER(country_code);

-- ── 14. Fix mislabeled generated_questions policy ───────────────
DROP POLICY IF EXISTS "Service role can manage generated questions" ON public.generated_questions;
CREATE POLICY "Admins can manage generated questions"
  ON public.generated_questions FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 15. authorities.updated_at maintenance ──────────────────────
-- set_profiles_updated_at() (000016) is generic: NEW.updated_at = NOW().
DROP TRIGGER IF EXISTS trg_authorities_updated_at ON public.authorities;
CREATE TRIGGER trg_authorities_updated_at
  BEFORE UPDATE ON public.authorities
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();
