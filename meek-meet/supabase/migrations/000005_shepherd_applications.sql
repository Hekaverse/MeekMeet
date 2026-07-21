-- ============================================
-- Shepherd Applications
-- ============================================
-- Mobile app submits to this table. Separate from the general
-- `applications` table which handles volunteer/background-check flows.

CREATE TABLE shepherd_applications (
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

-- RLS policies
ALTER TABLE shepherd_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shepherd applications"
  ON shepherd_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shepherd applications"
  ON shepherd_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending shepherd applications"
  ON shepherd_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can read all shepherd applications"
  ON shepherd_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update shepherd applications"
  ON shepherd_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_shepherd_applications_user ON shepherd_applications(user_id);
CREATE INDEX idx_shepherd_applications_status ON shepherd_applications(status);
