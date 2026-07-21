-- ============================================
-- Meeting Questions
-- ============================================
-- Links revolutionary questions to specific meetings.
-- Shepherds select questions per meeting, not just per circle.

-- Add status tracking to meetings
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

CREATE INDEX idx_meetings_status ON meetings(status);

-- Meeting questions table
CREATE TABLE meeting_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  unlock_after_minutes INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE meeting_questions ENABLE ROW LEVEL SECURITY;

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

-- Indexes
CREATE INDEX idx_meeting_questions_meeting ON meeting_questions(meeting_id);
CREATE INDEX idx_meeting_questions_order ON meeting_questions(order_index);
