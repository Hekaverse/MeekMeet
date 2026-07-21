-- ============================================
-- Crowdsourced service times for external places
-- ============================================

CREATE TABLE place_service_times (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  place_id TEXT NOT NULL,
  place_source TEXT NOT NULL DEFAULT 'google', -- 'google' or 'manual'
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

-- Enable RLS
ALTER TABLE place_service_times ENABLE ROW LEVEL SECURITY;

-- Public can read all service times
CREATE POLICY "Service times are viewable by everyone"
  ON place_service_times FOR SELECT
  USING (true);

-- Any authenticated user can submit service times
CREATE POLICY "Authenticated users can submit service times"
  ON place_service_times FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions"
  ON place_service_times FOR UPDATE
  USING (submitted_by = auth.uid());

-- Users can delete their own submissions
CREATE POLICY "Users can delete own submissions"
  ON place_service_times FOR DELETE
  USING (submitted_by = auth.uid());

-- Admins can verify service times
CREATE POLICY "Admins can verify service times"
  ON place_service_times FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_place_service_times_place ON place_service_times(place_id);
CREATE INDEX idx_place_service_times_verified ON place_service_times(is_verified);
