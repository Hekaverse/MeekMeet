-- ============================================
-- Fix Missing Schema (Safe to re-run)
-- ============================================
-- Applies missing pieces from migrations 000006, 000007, 000008, 000010, 000012

-- ── 1. Meetings status column (from 000006) ────────────────────
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

-- Backfill status from is_cancelled
UPDATE meetings
SET status = 'cancelled'
WHERE is_cancelled = true AND (status IS NULL OR status = 'scheduled');

UPDATE meetings
SET status = 'scheduled'
WHERE is_cancelled = false AND status IS NULL;

-- ── 2. Meeting questions table (from 000006) ──────────────────
CREATE TABLE IF NOT EXISTS meeting_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  unlock_after_minutes INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_questions_meeting ON meeting_questions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_questions_order ON meeting_questions(order_index);

ALTER TABLE meeting_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view meeting questions for meetings they RSVP'd to" ON meeting_questions;
CREATE POLICY "Members can view meeting questions for meetings they RSVP'd to"
  ON meeting_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rsvps
      JOIN meetings ON meetings.id = rsvps.meeting_id
      WHERE meetings.id = meeting_questions.meeting_id
      AND rsvps.user_id = auth.uid()
      AND rsvps.status = 'going'
    )
    OR
    EXISTS (
      SELECT 1 FROM meetings
      JOIN circles ON circles.id = meetings.circle_id
      WHERE meetings.id = meeting_questions.meeting_id
      AND circles.shepherd_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Shepherds can manage meeting questions for their circles" ON meeting_questions;
CREATE POLICY "Shepherds can manage meeting questions for their circles"
  ON meeting_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN circles ON circles.id = meetings.circle_id
      WHERE meetings.id = meeting_questions.meeting_id
      AND circles.shepherd_id = auth.uid()
    )
  );

-- ── 3. Responses table (from 000007) ──────────────────────────
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can insert responses for meetings they RSVP'd going to" ON responses;
CREATE POLICY "Members can insert responses for meetings they RSVP'd going to"
  ON responses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM rsvps
      JOIN meetings ON meetings.id = rsvps.meeting_id
      WHERE meetings.id = responses.meeting_id
      AND rsvps.user_id = auth.uid()
      AND rsvps.status = 'going'
    )
  );

DROP POLICY IF EXISTS "Members can view their own responses" ON responses;
CREATE POLICY "Members can view their own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Shepherds can view all responses for their circle's meetings" ON responses;
CREATE POLICY "Shepherds can view all responses for their circle's meetings"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN circles ON circles.id = meetings.circle_id
      WHERE meetings.id = responses.meeting_id
      AND circles.shepherd_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_responses_meeting ON responses(meeting_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(meeting_id, question_id);
CREATE INDEX IF NOT EXISTS idx_responses_user ON responses(user_id);

-- ── 4. Meeting scheduling fields (from 000008) ────────────────
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS questions_release_mode TEXT DEFAULT 'immediate'
    CHECK (questions_release_mode IN ('immediate', 'day_before', 'live_reveal')),
  ADD COLUMN IF NOT EXISTS questions_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_by UUID REFERENCES profiles(id);

ALTER TABLE meeting_questions
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;

-- Meeting analytics table
CREATE TABLE IF NOT EXISTS meeting_analytics (
  meeting_id UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id),
  total_responses INTEGER DEFAULT 0,
  response_rate NUMERIC,
  themes JSONB DEFAULT '[]',
  sentiment_score NUMERIC,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meeting_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shepherds can view analytics for their circle meetings" ON meeting_analytics;
CREATE POLICY "Shepherds can view analytics for their circle meetings"
  ON meeting_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN circles ON circles.id = meetings.circle_id
      WHERE meetings.id = meeting_analytics.meeting_id
      AND circles.shepherd_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can view analytics for meetings they attended" ON meeting_analytics;
CREATE POLICY "Members can view analytics for meetings they attended"
  ON meeting_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rsvps
      WHERE rsvps.meeting_id = meeting_analytics.meeting_id
      AND rsvps.user_id = auth.uid()
      AND rsvps.status = 'going'
    )
  );

-- Cancelled status sync trigger
CREATE OR REPLACE FUNCTION sync_meeting_cancelled_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.is_cancelled := true;
  ELSIF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
    NEW.is_cancelled := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_meeting_cancelled ON meetings;
CREATE TRIGGER trg_sync_meeting_cancelled
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION sync_meeting_cancelled_status();

CREATE INDEX IF NOT EXISTS idx_meeting_analytics_circle ON meeting_analytics(circle_id);

-- ── 5. Admin helper function (from 000010) ────────────────────
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promote meekmeets@gmail.com
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'meekmeets@gmail.com'
);

-- Fixed admin trigger (no email column in profiles)
DROP TRIGGER IF EXISTS on_auth_user_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_admin();

CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'meekmeets@gmail.com' THEN
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      'admin',
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();

-- Admin RLS policies
DROP POLICY IF EXISTS "Admins can read all applications" ON public.applications;
CREATE POLICY "Admins can read all applications"
  ON public.applications FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can read all RSVPs" ON public.rsvps;
CREATE POLICY "Admins can read all RSVPs"
  ON public.rsvps FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can read all responses" ON public.responses;
CREATE POLICY "Admins can read all responses"
  ON public.responses FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can read all meeting analytics" ON public.meeting_analytics;
CREATE POLICY "Admins can read all meeting analytics"
  ON public.meeting_analytics FOR SELECT
  USING (public.is_app_admin());

-- ── 6. Admin stats view (from 000010) ────────────────────────
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

-- ── 7. Admin messages table (from 000012) ─────────────────────
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_status ON public.admin_messages(status);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON public.admin_messages(created_at DESC);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own messages" ON public.admin_messages;
CREATE POLICY "Users can create their own messages"
  ON public.admin_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read their own messages" ON public.admin_messages;
CREATE POLICY "Users can read their own messages"
  ON public.admin_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all messages" ON public.admin_messages;
CREATE POLICY "Admins can read all messages"
  ON public.admin_messages FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can update messages" ON public.admin_messages;
CREATE POLICY "Admins can update messages"
  ON public.admin_messages FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
  END IF;
END $$;
