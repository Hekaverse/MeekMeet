-- ============================================
-- Foundation Fixes
-- ============================================
-- 1. Denormalize circle_id onto responses for cross-meeting analytics
-- 2. Add question release mode + scheduling fields to meetings
-- 3. Add unlocked_at to meeting_questions for server-side unlock validation
-- 4. Create meeting_analytics table for persistent insights
-- 5. Sync is_cancelled with status via trigger
-- 6. Auto-compute unlock times when meeting goes live
-- 7. Update RLS policies for server-side unlock enforcement

-- ── 1. Add circle_id to responses ─────────────────────────────
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES circles(id);

-- Backfill circle_id from meetings
UPDATE responses
SET circle_id = meetings.circle_id
FROM meetings
WHERE responses.meeting_id = meetings.id
  AND responses.circle_id IS NULL;

-- Make circle_id NOT NULL after backfill (soft: only for new rows)
-- We keep existing NULLs graceful; app code handles it.

-- ── 2. New meeting scheduling fields ──────────────────────────
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS questions_release_mode TEXT DEFAULT 'immediate'
    CHECK (questions_release_mode IN ('immediate', 'day_before', 'live_reveal')),
  ADD COLUMN IF NOT EXISTS questions_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_by UUID REFERENCES profiles(id);

-- Backfill status from is_cancelled for any stale rows
UPDATE meetings
SET status = 'cancelled'
WHERE is_cancelled = true AND status NOT IN ('cancelled', 'completed');

UPDATE meetings
SET status = 'scheduled'
WHERE is_cancelled = false AND status IS NULL;

-- Set default release mode on existing meetings
UPDATE meetings
SET questions_release_mode = 'live_reveal',
    questions_released_at = started_at
WHERE status = 'live' AND questions_release_mode IS NULL;

UPDATE meetings
SET questions_release_mode = 'immediate'
WHERE status != 'live' AND questions_release_mode IS NULL;

-- ── 3. Add unlocked_at to meeting_questions ───────────────────
ALTER TABLE meeting_questions
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;

-- Backfill: for existing meetings that are live/completed, assume all unlocked
UPDATE meeting_questions
SET unlocked_at = meetings.started_at
FROM meetings
WHERE meeting_questions.meeting_id = meetings.id
  AND meeting_questions.unlocked_at IS NULL
  AND meetings.status IN ('live', 'completed');

-- ── 4. Create meeting_analytics table ─────────────────────────
CREATE TABLE IF NOT EXISTS meeting_analytics (
  meeting_id UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id),
  total_responses INTEGER DEFAULT 0,
  response_rate NUMERIC,
  themes JSONB DEFAULT '[]',
  sentiment_score NUMERIC,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on meeting_analytics
ALTER TABLE meeting_analytics ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role can manage meeting analytics"
  ON meeting_analytics FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 5. Trigger: keep is_cancelled in sync with status ─────────
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

-- ── 6. Trigger: auto-compute unlocked_at on meeting start ─────
CREATE OR REPLACE FUNCTION compute_question_unlock_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'live' AND OLD.status != 'live' AND NEW.questions_release_mode = 'live_reveal' THEN
    UPDATE meeting_questions
    SET unlocked_at = NEW.started_at + (COALESCE(unlock_after_minutes, 0) || ' minutes')::INTERVAL
    WHERE meeting_id = NEW.id
      AND unlocked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_unlock_times ON meetings;
CREATE TRIGGER trg_compute_unlock_times
  AFTER UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION compute_question_unlock_times();

-- ── 7. Updated RLS policies for responses ─────────────────────
-- Drop old permissive insert policy
DROP POLICY IF EXISTS "Members can insert responses for meetings they RSVP'd going to" ON responses;

-- New policy: enforce server-side unlock timing
CREATE POLICY "Members can insert responses for unlocked questions"
  ON responses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM meeting_questions mq
      JOIN meetings m ON m.id = mq.meeting_id
      JOIN rsvps ON rsvps.meeting_id = m.id
      WHERE mq.meeting_id = responses.meeting_id
        AND mq.question_id = responses.question_id
        AND rsvps.user_id = auth.uid()
        AND rsvps.status = 'going'
        AND m.status = 'live'
        AND (
          m.questions_release_mode IN ('immediate', 'day_before')
          OR (
            m.questions_release_mode = 'live_reveal'
            AND mq.unlocked_at IS NOT NULL
            AND mq.unlocked_at <= NOW()
          )
        )
    )
  );

-- Updated select: members can view all responses for a meeting they attended
DROP POLICY IF EXISTS "Members can view their own responses" ON responses;
CREATE POLICY "Members can view responses for meetings they attended"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rsvps
      WHERE rsvps.meeting_id = responses.meeting_id
        AND rsvps.user_id = auth.uid()
        AND rsvps.status = 'going'
    )
    OR
    EXISTS (
      SELECT 1 FROM meetings
      JOIN circles ON circles.id = meetings.circle_id
      WHERE meetings.id = responses.meeting_id
        AND circles.shepherd_id = auth.uid()
    )
  );

-- Keep shepherd select policy
-- (already exists: "Shepherds can view all responses for their circle's meetings")

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_responses_circle ON responses(circle_id);
CREATE INDEX IF NOT EXISTS idx_meeting_questions_unlocked ON meeting_questions(meeting_id, unlocked_at);
CREATE INDEX IF NOT EXISTS idx_meetings_release_mode ON meetings(questions_release_mode);
CREATE INDEX IF NOT EXISTS idx_meeting_analytics_circle ON meeting_analytics(circle_id);
