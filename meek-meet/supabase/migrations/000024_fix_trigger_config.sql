-- Fix meeting synthesis trigger to read config from a table
-- instead of app.settings, which requires superuser permissions.

CREATE TABLE IF NOT EXISTS public.meek_meet_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE public.meek_meet_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage config" ON public.meek_meet_config;
CREATE POLICY "Admins can manage config"
  ON public.meek_meet_config FOR ALL
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Update trigger function to read from config table
CREATE OR REPLACE FUNCTION public.trigger_meeting_synthesis()
RETURNS TRIGGER AS $$
DECLARE
  project_ref TEXT;
  service_key TEXT;
  function_url TEXT;
  payload TEXT;
BEGIN
  -- Only run on transition to completed
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT value INTO project_ref FROM public.meek_meet_config WHERE key = 'supabase_project_ref';
    SELECT value INTO service_key FROM public.meek_meet_config WHERE key = 'supabase_service_role_key';

    IF project_ref IS NULL OR service_key IS NULL THEN
      RAISE NOTICE 'Meeting synthesis skipped: missing config in meek_meet_config';
      RETURN NEW;
    END IF;

    function_url := 'https://' || project_ref || '.supabase.co/functions/v1/synthesize-meeting';
    payload := json_build_object('meeting_id', NEW.id)::text;

    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_key,
        'Content-Type', 'application/json'
      ),
      body := payload
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
