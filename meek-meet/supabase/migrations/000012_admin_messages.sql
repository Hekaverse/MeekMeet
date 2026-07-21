-- ============================================
-- Admin Messages / Support Inbox
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Index for fast inbox queries
CREATE INDEX IF NOT EXISTS idx_admin_messages_status ON public.admin_messages(status);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON public.admin_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert their own messages
CREATE POLICY "Users can create their own messages"
  ON public.admin_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own messages
CREATE POLICY "Users can read their own messages"
  ON public.admin_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all messages
CREATE POLICY "Admins can read all messages"
  ON public.admin_messages FOR SELECT
  USING (public.is_app_admin());

-- Admins can update messages (mark resolved)
CREATE POLICY "Admins can update messages"
  ON public.admin_messages FOR UPDATE
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- Enable realtime for admin messages (guarded: 000014 also adds it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;
  END IF;
END $$;
