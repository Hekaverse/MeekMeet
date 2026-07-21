-- ============================================
-- Responses
-- ============================================
-- Members submit answers to meeting questions.
-- Shepherds analyse responses for patterns.

CREATE TABLE responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Members can view their own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id);

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

-- Indexes
CREATE INDEX idx_responses_meeting ON responses(meeting_id);
CREATE INDEX idx_responses_question ON responses(meeting_id, question_id);
CREATE INDEX idx_responses_user ON responses(user_id);
