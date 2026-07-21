-- ============================================
-- Synthesis trigger configuration (manual step)
-- ============================================
-- NOTE: This replaces the old app.settings approach (which required
-- superuser privileges unavailable on Supabase cloud) and the later
-- meek_meet_config service-key storage (removed in migration 000025
-- for security: the key was readable by any admin over PostgREST).
--
-- The trigger_meeting_synthesis() function reads:
--   - the project ref  -> public.meek_meet_config (non-secret, admin read-only)
--   - the service key  -> Supabase Vault (never in a table)
--
-- Run in the Supabase SQL Editor, replacing the placeholders:

INSERT INTO public.meek_meet_config (key, value)
VALUES ('supabase_project_ref', '<your-project-ref>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT vault.create_secret('<your-service-role-key>', 'supabase_service_role_key');

-- To rotate the key later:
--   SELECT vault.update_secret((SELECT id FROM vault.secrets WHERE name = 'supabase_service_role_key'), '<new-key>');

-- Verify:
SELECT value FROM public.meek_meet_config WHERE key = 'supabase_project_ref';
SELECT name FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key';
