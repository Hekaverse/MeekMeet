-- ============================================
-- Shepherd Schema Fixes + Digital Meetings
-- ============================================
-- 1. Create circle_shepherds table (was referenced but never created)
-- 2. Create circle_actions table (was referenced but never created)
-- 3. Add meeting_type + join_url to meetings for digital/hybrid support
-- 4. Backfill circle_shepherds from existing circles.shepherd_id
-- 5. Update RLS policies to check circle_shepherds membership

-- ── 1. Create circle_shepherds table ────────────────────────────

CREATE TABLE IF NOT EXISTS circle_shepherds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('lead', 'assistant')) DEFAULT 'assistant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_shepherds_circle ON circle_shepherds(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_shepherds_user ON circle_shepherds(user_id);

-- Backfill: promote existing circles.shepherd_id to 'lead' in circle_shepherds
INSERT INTO circle_shepherds (circle_id, user_id, role)
SELECT id, shepherd_id, 'lead'
FROM circles
WHERE shepherd_id IS NOT NULL
ON CONFLICT (circle_id, user_id) DO UPDATE SET role = 'lead';

-- RLS
ALTER TABLE circle_shepherds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle shepherds are publicly readable" ON circle_shepherds;
CREATE POLICY "Circle shepherds are publicly readable"
  ON circle_shepherds FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Lead shepherds can manage circle shepherds" ON circle_shepherds;
CREATE POLICY "Lead shepherds can manage circle shepherds"
  ON circle_shepherds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_shepherds.circle_id
        AND cs.user_id = auth.uid()
        AND cs.role = 'lead'
    )
    OR public.is_app_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_shepherds.circle_id
        AND cs.user_id = auth.uid()
        AND cs.role = 'lead'
    )
    OR public.is_app_admin()
  );

-- ── 2. Create circle_actions table ──────────────────────────────

CREATE TABLE IF NOT EXISTS circle_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('open', 'completed')) DEFAULT 'open',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_circle_actions_circle ON circle_actions(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_actions_status ON circle_actions(status);

-- RLS
ALTER TABLE circle_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shepherds can manage circle actions" ON circle_actions;
CREATE POLICY "Shepherds can manage circle actions"
  ON circle_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_actions.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_actions.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Anyone can read circle actions" ON circle_actions;
CREATE POLICY "Anyone can read circle actions"
  ON circle_actions FOR SELECT
  USING (true);

-- ── 3. Add digital meeting columns ──────────────────────────────

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'in_person'
    CHECK (meeting_type IN ('in_person', 'digital', 'hybrid')),
  ADD COLUMN IF NOT EXISTS join_url TEXT;

-- Backfill existing meetings
UPDATE meetings
SET meeting_type = 'in_person'
WHERE meeting_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(meeting_type);

-- Add updated_at to profiles (used by app upserts)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 4. Update existing RLS policies to check circle_shepherds ───

-- Helper: is_shepherd_of_circle(circle_id) check
-- We update policies inline rather than replacing all of them

-- meetings: update shepherd policy to check circle_shepherds
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = meetings.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- circle_questions: update shepherd policy
DROP POLICY IF EXISTS "Shepherds can manage circle questions" ON circle_questions;
CREATE POLICY "Shepherds can manage circle questions"
  ON circle_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_questions.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_questions.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- circle_routines: update shepherd policy
DROP POLICY IF EXISTS "Shepherds can manage circle routines" ON circle_routines;
CREATE POLICY "Shepherds can manage circle routines"
  ON circle_routines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_routines.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circle_routines.circle_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- meeting_questions: update shepherd policy
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN circle_shepherds cs ON cs.circle_id = m.circle_id
      WHERE m.id = meeting_questions.meeting_id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- responses: update shepherd select policy
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

-- meeting_analytics: update shepherd policy
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

-- circles: update shepherd update/delete policy
DROP POLICY IF EXISTS "Shepherds can update their circles" ON circles;
CREATE POLICY "Shepherds can update their circles"
  ON circles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circles.id
        AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

DROP POLICY IF EXISTS "Shepherds can delete their circles" ON circles;
CREATE POLICY "Shepherds can delete their circles"
  ON circles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM circle_shepherds cs
      WHERE cs.circle_id = circles.id
        AND cs.user_id = auth.uid()
        AND cs.role = 'lead'
    )
    OR public.is_app_admin()
  );
