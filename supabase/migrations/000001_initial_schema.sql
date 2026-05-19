-- ============================================
-- Meek Meet Initial Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Profiles (extends Supabase Auth users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'shepherd', 'admin')),
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Circles (communities/gatherings)
-- ============================================
CREATE TABLE circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  meeting_place TEXT,
  meeting_address TEXT,
  image_url TEXT,
  shepherd_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Circle Questions (editable by shepherd)
-- ============================================
CREATE TABLE circle_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Circle Routines (editable by shepherd)
-- ============================================
CREATE TABLE circle_routines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Scheduled Meetings
-- ============================================
CREATE TABLE meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  location_name TEXT,
  location_address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RSVPs
-- ============================================
CREATE TABLE rsvps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- ============================================
-- Shepherd Applications
-- ============================================
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  denomination TEXT,
  wwcc_number TEXT,
  wwcc_expiry DATE,
  police_check_date DATE,
  first_aid_expiry DATE,
  emergency_name TEXT,
  emergency_phone TEXT,
  reference_name TEXT,
  reference_contact TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Profiles: read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Circles: public read, shepherd/admin write
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circles are viewable by everyone"
  ON circles FOR SELECT
  USING (true);

CREATE POLICY "Shepherds can insert circles"
  ON circles FOR INSERT
  WITH CHECK (auth.uid() = shepherd_id);

CREATE POLICY "Shepherds can update own circles"
  ON circles FOR UPDATE
  USING (auth.uid() = shepherd_id);

CREATE POLICY "Shepherds can delete own circles"
  ON circles FOR DELETE
  USING (auth.uid() = shepherd_id);

-- Circle Questions: public read, shepherd write
ALTER TABLE circle_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by everyone"
  ON circle_questions FOR SELECT
  USING (true);

CREATE POLICY "Shepherds can manage questions for their circles"
  ON circle_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_questions.circle_id
      AND circles.shepherd_id = auth.uid()
    )
  );

-- Circle Routines: public read, shepherd write
ALTER TABLE circle_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routines are viewable by everyone"
  ON circle_routines FOR SELECT
  USING (true);

CREATE POLICY "Shepherds can manage routines for their circles"
  ON circle_routines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_routines.circle_id
      AND circles.shepherd_id = auth.uid()
    )
  );

-- Meetings: public read, shepherd write
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Meetings are viewable by everyone"
  ON meetings FOR SELECT
  USING (true);

CREATE POLICY "Shepherds can manage meetings for their circles"
  ON meetings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = meetings.circle_id
      AND circles.shepherd_id = auth.uid()
    )
  );

-- RSVPs: users manage own, shepherds read circle RSVPs
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own RSVPs"
  ON rsvps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Shepherds can view RSVPs for their meetings"
  ON rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN circles ON circles.id = meetings.circle_id
      WHERE meetings.id = rsvps.meeting_id
      AND circles.shepherd_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own RSVPs"
  ON rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVPs"
  ON rsvps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- Applications: users read own, admins read all
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_circles_shepherd ON circles(shepherd_id);
CREATE INDEX idx_circles_location ON circles(location);
CREATE INDEX idx_circle_questions_circle ON circle_questions(circle_id);
CREATE INDEX idx_circle_routines_circle ON circle_routines(circle_id);
CREATE INDEX idx_meetings_circle ON meetings(circle_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_rsvps_meeting ON rsvps(meeting_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
