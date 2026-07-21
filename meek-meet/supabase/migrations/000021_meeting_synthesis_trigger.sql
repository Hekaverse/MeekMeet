-- Trigger automatic meeting synthesis when a meeting is marked as completed.
-- Uses pg_net to invoke the synthesize-meeting Edge Function asynchronously.

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function called by the trigger
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
    project_ref := current_setting('app.settings.supabase_project_ref', true);
    service_key := current_setting('app.settings.supabase_service_role_key', true);

    IF project_ref IS NULL OR service_key IS NULL THEN
      RAISE NOTICE 'Meeting synthesis skipped: missing app.settings.supabase_project_ref or supabase_service_role_key';
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

-- Attach trigger for both insert and update
DROP TRIGGER IF EXISTS meeting_synthesis_on_completed ON public.meetings;
CREATE TRIGGER meeting_synthesis_on_completed
  AFTER INSERT OR UPDATE OF status ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_meeting_synthesis();
