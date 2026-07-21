-- ============================================
-- News-Driven Questions
-- Generated daily by Edge Function from AU headlines
-- ============================================

CREATE TABLE news_questions (
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

-- Index for fast fetching of fresh questions
CREATE INDEX idx_news_questions_fresh ON news_questions(generated_at DESC)
  WHERE expires_at > NOW();

-- RLS: everyone can read fresh news questions
ALTER TABLE news_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read news questions"
  ON news_questions FOR SELECT
  USING (expires_at > NOW());

-- Only service role / Edge Function can insert/update
CREATE POLICY "Service role can manage news questions"
  ON news_questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
