-- ============================================
-- RLS Audit Fixes
-- ============================================
-- Fixes invalid CREATE POLICY IF NOT EXISTS syntax,
-- stale circles.shepherd_id references, public profile exposure,
-- responses INSERT regression, and admin stat accuracy.
-- Safe to re-run.

-- ── 0. Ensure all referenced tables/columns exist ────────────────
-- Several intermediate migrations were skipped in this project.
-- We create missing tables and columns here so the rest of this
-- migration (and the app) can rely on them.

-- shepherd_applications (from 000005)
CREATE TABLE IF NOT EXISTS public.shepherd_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  location TEXT,
  tradition TEXT,
  experience TEXT,
  motivation TEXT NOT NULL,
  vision TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shepherd_applications_user ON shepherd_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_shepherd_applications_status ON shepherd_applications(status);
ALTER TABLE public.shepherd_applications ENABLE ROW LEVEL SECURITY;

-- meeting_questions (from 000006) + meetings columns
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.meeting_questions (
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
ALTER TABLE public.meeting_questions ENABLE ROW LEVEL SECURITY;

-- responses (from 000007)
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_responses_meeting ON responses(meeting_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(meeting_id, question_id);
CREATE INDEX IF NOT EXISTS idx_responses_user ON responses(user_id);
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- meeting_analytics + more meeting columns (from 000008)
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS questions_release_mode TEXT DEFAULT 'immediate'
    CHECK (questions_release_mode IN ('immediate', 'day_before', 'live_reveal')),
  ADD COLUMN IF NOT EXISTS questions_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_by UUID REFERENCES profiles(id);

ALTER TABLE public.meeting_questions
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.meeting_analytics (
  meeting_id UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id),
  total_responses INTEGER DEFAULT 0,
  response_rate NUMERIC,
  themes JSONB DEFAULT '[]',
  sentiment_score NUMERIC,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meeting_analytics_circle ON meeting_analytics(circle_id);
ALTER TABLE public.meeting_analytics ENABLE ROW LEVEL SECURITY;

-- news_questions (from 000009)
CREATE TABLE IF NOT EXISTS public.news_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question TEXT NOT NULL,
  context TEXT NOT NULL,
  category TEXT NOT NULL,
  source_headline TEXT,
  source_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_news_questions_generated_at ON news_questions(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_questions_expires_at ON news_questions(expires_at);
ALTER TABLE public.news_questions ENABLE ROW LEVEL SECURITY;

-- place_service_times (from 000004)
CREATE TABLE IF NOT EXISTS public.place_service_times (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  place_id TEXT NOT NULL,
  place_source TEXT NOT NULL DEFAULT 'google',
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Service',
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(place_id, day, time, label)
);
CREATE INDEX IF NOT EXISTS idx_place_service_times_place ON place_service_times(place_id);
CREATE INDEX IF NOT EXISTS idx_place_service_times_verified ON place_service_times(is_verified);
ALTER TABLE public.place_service_times ENABLE ROW LEVEL SECURITY;

-- admin_messages (from 000012)
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

-- profiles.updated_at (from 000015)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- meetings digital columns (from 000015)
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'in_person'
    CHECK (meeting_type IN ('in_person', 'digital', 'hybrid')),
  ADD COLUMN IF NOT EXISTS join_url TEXT;

-- ── 1. Fix invalid "CREATE POLICY IF NOT EXISTS" leftovers ─────
-- PostgreSQL does NOT support IF NOT EXISTS on CREATE POLICY.

DROP POLICY IF EXISTS "Admins can read all circle shepherds" ON public.circle_shepherds;
CREATE POLICY "Admins can read all circle shepherds"
  ON public.circle_shepherds FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can read all circle actions" ON public.circle_actions;
CREATE POLICY "Admins can read all circle actions"
  ON public.circle_actions FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can read all meeting questions" ON public.meeting_questions;
CREATE POLICY "Admins can read all meeting questions"
  ON public.meeting_questions FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Anyone can read news questions" ON public.news_questions;
CREATE POLICY "Anyone can read news questions"
  ON public.news_questions FOR SELECT
  USING (expires_at > NOW());

DROP POLICY IF EXISTS "Admins can manage news questions" ON public.news_questions;
CREATE POLICY "Admins can manage news questions"
  ON public.news_questions FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 2. Remove permissive responses INSERT regression ────────────
-- 000014 re-created an old RSVP-only INSERT policy that bypasses
-- the question-unlock security added in 000008. Drop it.
DROP POLICY IF EXISTS "Members can insert responses for meetings they RSVP'd going to" ON responses;

-- ── 3. Restrict public profile access to authenticated users ─────
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 4. Fix circles INSERT to be admin-only ──────────────────────
-- Any authenticated user could previously create a circle by setting
-- shepherd_id = auth.uid(). Restrict to admins.
DROP POLICY IF EXISTS "Shepherds can insert circles" ON circles;
CREATE POLICY "Only admins can insert circles"
  ON circles FOR INSERT
  WITH CHECK (public.is_app_admin());

-- ── 5. Update all stale circles.shepherd_id references ──────────
-- These policies were never updated when circle_shepherds was introduced.

-- Circle questions
DROP POLICY IF EXISTS "Shepherds can manage questions for their circles" ON circle_questions;
CREATE POLICY "Shepherds can manage questions for their circles"
  ON circle_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_questions.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- Circle routines
DROP POLICY IF EXISTS "Shepherds can manage routines for their circles" ON circle_routines;
CREATE POLICY "Shepherds can manage routines for their circles"
  ON circle_routines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_routines.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- Meetings
DROP POLICY IF EXISTS "Shepherds can manage meetings for their circles" ON meetings;
CREATE POLICY "Shepherds can manage meetings for their circles"
  ON meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = meetings.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- RSVPs
DROP POLICY IF EXISTS "Shepherds can view RSVPs for their meetings" ON rsvps;
CREATE POLICY "Shepherds can view RSVPs for their meetings"
  ON rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN circle_shepherds cs ON cs.circle_id = m.circle_id
      WHERE m.id = rsvps.meeting_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- Meeting questions (member + shepherd view)
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
    OR EXISTS (
      SELECT 1 FROM meetings m
      JOIN circle_shepherds cs ON cs.circle_id = m.circle_id
      WHERE m.id = meeting_questions.meeting_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Shepherds can manage meeting questions for their circles" ON meeting_questions;
CREATE POLICY "Shepherds can manage meeting questions for their circles"
  ON meeting_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN circle_shepherds cs ON cs.circle_id = m.circle_id
      WHERE m.id = meeting_questions.meeting_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- Responses (shepherd view)
DROP POLICY IF EXISTS "Shepherds can view all responses for their circle's meetings" ON responses;
CREATE POLICY "Shepherds can view all responses for their circle's meetings"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN circle_shepherds cs ON cs.circle_id = m.circle_id
      WHERE m.id = responses.meeting_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- Meeting analytics
DROP POLICY IF EXISTS "Shepherds can view analytics for their circle meetings" ON meeting_analytics;
CREATE POLICY "Shepherds can view analytics for their circle meetings"
  ON meeting_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN circle_shepherds cs ON cs.circle_id = m.circle_id
      WHERE m.id = meeting_analytics.meeting_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- ── 6. Allow circle creators to seed their own lead record ──────
-- Without this, the first shepherd for a new circle can't be inserted
-- because the lead-shepherd policy requires an existing lead.
DROP POLICY IF EXISTS "Circle creators can initialise shepherd record" ON circle_shepherds;
CREATE POLICY "Circle creators can initialise shepherd record"
  ON circle_shepherds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circles c
      WHERE c.id = circle_shepherds.circle_id
        AND c.shepherd_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- ── 7. Standardise remaining inline admin checks ─────────────────
DROP POLICY IF EXISTS "Admins can update all applications" ON applications;
CREATE POLICY "Admins can update all applications"
  ON applications FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can verify service times" ON place_service_times;
CREATE POLICY "Admins can verify service times"
  ON place_service_times FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can read all shepherd applications" ON shepherd_applications;
CREATE POLICY "Admins can read all shepherd applications"
  ON shepherd_applications FOR SELECT
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "Admins can update shepherd applications" ON shepherd_applications;
CREATE POLICY "Admins can update shepherd applications"
  ON shepherd_applications FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ── 8. Auto-update profiles.updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- ── 9. Prevent duplicate responses ──────────────────────────────
ALTER TABLE responses
  DROP CONSTRAINT IF EXISTS unique_response_per_question;
ALTER TABLE responses
  ADD CONSTRAINT unique_response_per_question
  UNIQUE (meeting_id, question_id, user_id);

-- ── 10. Fix admin_stats view to count shepherd_applications ─────
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'shepherd' OR role = 'admin') AS total_shepherds,
  (SELECT COUNT(*) FROM public.circles) AS total_circles,
  (SELECT COUNT(*) FROM public.meetings WHERE status = 'scheduled') AS total_scheduled_meetings,
  (SELECT COUNT(*) FROM public.meetings WHERE status = 'completed') AS total_completed_meetings,
  (SELECT COUNT(*) FROM public.shepherd_applications WHERE status = 'pending') AS pending_applications,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'member') AS total_members,
  (SELECT COUNT(*) FROM public.responses) AS total_responses,
  (SELECT COUNT(DISTINCT user_id) FROM public.rsvps WHERE status = 'going') AS active_rsvps;
