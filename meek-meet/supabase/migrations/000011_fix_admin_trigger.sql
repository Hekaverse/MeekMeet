-- ============================================
-- Fix Admin Auto-Promotion Trigger
-- ============================================
-- The original trigger (000010_admin_setup.sql) used UPDATE only.
-- Since PostgreSQL fires same-event triggers in name order,
-- on_auth_user_admin (a..) runs BEFORE on_auth_user_created (o..),
-- so the profiles row doesn't exist yet at UPDATE time.
-- This migration replaces it with an UPSERT that works regardless.

-- 1. Drop old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_admin();

-- 2. Create robust upsert function
CREATE OR REPLACE FUNCTION public.handle_new_user_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'meekmeets@gmail.com' THEN
    -- NOTE: no email column here — profiles.email is only added in 000025,
    -- which also rewrites this function to capture it.
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
      'admin',
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate trigger
CREATE TRIGGER on_auth_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin();
