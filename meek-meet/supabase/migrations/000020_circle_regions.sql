-- Add geographic authority fields to circles for regional aggregation and advocacy.

ALTER TABLE public.circles
  ADD COLUMN IF NOT EXISTS lga_code TEXT,
  ADD COLUMN IF NOT EXISTS lga_name TEXT,
  ADD COLUMN IF NOT EXISTS state_electorate TEXT,
  ADD COLUMN IF NOT EXISTS federal_electorate TEXT,
  ADD COLUMN IF NOT EXISTS state_code TEXT,
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'AU',
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

CREATE INDEX IF NOT EXISTS idx_circles_lga ON public.circles(lga_code);
CREATE INDEX IF NOT EXISTS idx_circles_state ON public.circles(state_code);
CREATE INDEX IF NOT EXISTS idx_circles_country ON public.circles(country_code);
