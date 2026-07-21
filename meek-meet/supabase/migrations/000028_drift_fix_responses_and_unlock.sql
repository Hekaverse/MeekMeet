-- ============================================
-- 000028 Drift Fix: responses.circle_id + unlock-times trigger
-- ============================================
-- Two more pieces of 000008 that production never received:
--   1. responses.circle_id (denormalized for cross-meeting analytics)
--   2. compute_question_unlock_times() + trg_compute_unlock_times,
--      which releases live_reveal questions when a meeting goes live.
-- All statements are idempotent; fresh databases already have both
-- from 000008, so re-application is a no-op there.

-- ── 1. responses.circle_id + backfill + index ───────────────────
ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES public.circles(id);

UPDATE public.responses
SET circle_id = m.circle_id
FROM public.meetings m
WHERE public.responses.meeting_id = m.id
  AND public.responses.circle_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_responses_circle ON public.responses(circle_id);

-- ── 2. Unlock-times function + trigger ──────────────────────────
CREATE OR REPLACE FUNCTION public.compute_question_unlock_times()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'live' AND OLD.status != 'live' AND NEW.questions_release_mode = 'live_reveal' THEN
    UPDATE public.meeting_questions
    SET unlocked_at = NEW.started_at + (COALESCE(unlock_after_minutes, 0) || ' minutes')::INTERVAL
    WHERE meeting_id = NEW.id
      AND unlocked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_unlock_times ON public.meetings;
CREATE TRIGGER trg_compute_unlock_times
  AFTER UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_question_unlock_times();
