-- ============================================
-- Meek Meet Reading Tables
-- ============================================

-- User streaks (referenced by HomeScreen)
CREATE TABLE user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading progress (last position per user)
CREATE TABLE reading_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tradition TEXT NOT NULL,
  book_id TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tradition TEXT NOT NULL,
  book_id TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tradition, book_id, chapter, verse_start)
);

-- Reading history
CREATE TABLE reading_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tradition TEXT NOT NULL,
  book_id TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verses_count INTEGER DEFAULT 0,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  is_daily BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, book_id, chapter, read_at)
);

-- Reading stats
CREATE TABLE reading_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_days_read INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_verses_read INTEGER DEFAULT 0,
  last_read_date DATE,
  daily_reads JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_stats ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own reading data
CREATE POLICY "Users own their streaks"
  ON user_streaks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own their reading progress"
  ON reading_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own their bookmarks"
  ON bookmarks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own their reading history"
  ON reading_history FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own their reading stats"
  ON reading_stats FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_reading_progress_user ON reading_progress(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_reading_history_read_at ON reading_history(read_at);
CREATE INDEX idx_reading_stats_user ON reading_stats(user_id);
