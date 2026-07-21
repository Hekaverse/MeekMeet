-- 1. Meeting analytics extension
ALTER TABLE public.meeting_analytics
  ADD COLUMN IF NOT EXISTS sentiment_summary JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS consensus_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Circle insights
CREATE TABLE IF NOT EXISTS public.circle_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  response_count INTEGER DEFAULT 0,
  meeting_count INTEGER DEFAULT 0,
  time_window TEXT NOT NULL DEFAULT 'all_time', -- 'last_30_days', 'last_90_days', 'all_time'
  top_themes JSONB DEFAULT '[]',
  sentiment_summary JSONB DEFAULT '{}',
  consensus_items JSONB DEFAULT '[]',
  anonymised_quotes JSONB DEFAULT '[]',
  raw_summary TEXT,
  UNIQUE (circle_id, time_window)
);

CREATE INDEX IF NOT EXISTS idx_circle_insights_circle ON public.circle_insights(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_insights_generated ON public.circle_insights(generated_at DESC);

-- 3. Regional insights
CREATE TABLE IF NOT EXISTS public.regional_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  region_type TEXT NOT NULL CHECK (region_type IN ('lga', 'state_electorate', 'federal_electorate', 'state', 'country')),
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  time_window TEXT NOT NULL DEFAULT 'all_time',
  circle_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  top_themes JSONB DEFAULT '[]',
  sentiment_summary JSONB DEFAULT '{}',
  consensus_items JSONB DEFAULT '[]',
  anonymised_quotes JSONB DEFAULT '[]',
  raw_summary TEXT,
  UNIQUE (region_type, region_code, time_window)
);

CREATE INDEX IF NOT EXISTS idx_regional_insights_region ON public.regional_insights(region_type, region_code);
CREATE INDEX IF NOT EXISTS idx_regional_insights_generated ON public.regional_insights(generated_at DESC);

-- 4. Global insights
CREATE TABLE IF NOT EXISTS public.global_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  time_window TEXT NOT NULL DEFAULT 'all_time',
  circle_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  top_themes JSONB DEFAULT '[]',
  sentiment_summary JSONB DEFAULT '{}',
  consensus_items JSONB DEFAULT '[]',
  anonymised_quotes JSONB DEFAULT '[]',
  raw_summary TEXT,
  UNIQUE (time_window)
);

CREATE INDEX IF NOT EXISTS idx_global_insights_generated ON public.global_insights(generated_at DESC);

-- 5. Generated questions
CREATE TABLE IF NOT EXISTS public.generated_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES public.circles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  category TEXT,
  context TEXT,
  generated_by TEXT NOT NULL DEFAULT 'ai_synthesis', -- 'ai_synthesis', 'news', 'manual'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_generated_questions_circle ON public.generated_questions(circle_id);
CREATE INDEX IF NOT EXISTS idx_generated_questions_status ON public.generated_questions(status);

-- 6. Question lineage
CREATE TABLE IF NOT EXISTS public.question_lineage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  generated_question_id UUID REFERENCES public.generated_questions(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('meeting_analytics', 'circle_insights', 'regional_insights', 'global_insights', 'news_question')),
  source_id UUID NOT NULL,
  insight_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_lineage_question ON public.question_lineage(generated_question_id);
CREATE INDEX IF NOT EXISTS idx_question_lineage_source ON public.question_lineage(source_type, source_id);

-- 7. RLS policies
ALTER TABLE public.circle_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_lineage ENABLE ROW LEVEL SECURITY;

-- Circle insights: shepherds and admins can view their own circle's insights
DROP POLICY IF EXISTS "Circle insights viewable by shepherds" ON public.circle_insights;
CREATE POLICY "Circle insights viewable by shepherds"
  ON public.circle_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = circle_insights.circle_id AND cs.user_id = auth.uid()
    )
    OR public.is_app_admin()
  );

-- Regional/global insights: publicly readable
DROP POLICY IF EXISTS "Regional insights are public" ON public.regional_insights;
CREATE POLICY "Regional insights are public"
  ON public.regional_insights FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Global insights are public" ON public.global_insights;
CREATE POLICY "Global insights are public"
  ON public.global_insights FOR SELECT
  USING (true);

-- Generated questions: visible to circle members or shepherds if circle-specific, otherwise public
DROP POLICY IF EXISTS "Generated questions viewable by relevant users" ON public.generated_questions;
CREATE POLICY "Generated questions viewable by relevant users"
  ON public.generated_questions FOR SELECT
  USING (
    circle_id IS NULL
    OR public.is_app_admin()
    OR EXISTS (
      SELECT 1 FROM public.circle_shepherds cs
      WHERE cs.circle_id = generated_questions.circle_id AND cs.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage generated questions" ON public.generated_questions;
CREATE POLICY "Service role can manage generated questions"
  ON public.generated_questions FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "Question lineage viewable by admins" ON public.question_lineage;
CREATE POLICY "Question lineage viewable by admins"
  ON public.question_lineage FOR SELECT
  USING (public.is_app_admin());

-- 8. Helper to get all responses for a meeting
CREATE OR REPLACE FUNCTION public.get_meeting_responses(p_meeting_id UUID)
RETURNS TABLE (
  question_id UUID,
  question_content TEXT,
  response_id UUID,
  response_content TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id AS question_id,
    q.content AS question_content,
    r.id AS response_id,
    r.content AS response_content,
    r.user_id,
    r.created_at
  FROM public.responses r
  JOIN public.circle_questions q ON q.id = r.question_id
  WHERE r.meeting_id = p_meeting_id
  ORDER BY q.order_index, r.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
