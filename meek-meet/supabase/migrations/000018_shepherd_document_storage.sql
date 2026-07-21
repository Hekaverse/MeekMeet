-- ============================================
-- Shepherd Document Storage
-- ============================================
-- Creates a Supabase Storage bucket for shepherd verification documents
-- and sets RLS policies so users can upload their own documents and
-- admins can review them.

-- Create the storage bucket (idempotent via IF NOT EXISTS logic)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shepherd-documents',
  'shepherd-documents',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: users can only read their own documents
DROP POLICY IF EXISTS "Users can read own shepherd documents" ON storage.objects;
CREATE POLICY "Users can read own shepherd documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shepherd-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can only upload documents into their own folder
DROP POLICY IF EXISTS "Users can upload own shepherd documents" ON storage.objects;
CREATE POLICY "Users can upload own shepherd documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shepherd-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can only delete their own documents
DROP POLICY IF EXISTS "Users can delete own shepherd documents" ON storage.objects;
CREATE POLICY "Users can delete own shepherd documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shepherd-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: admins can manage all documents in the bucket
DROP POLICY IF EXISTS "Admins can manage all shepherd documents" ON storage.objects;
CREATE POLICY "Admins can manage all shepherd documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'shepherd-documents'
    AND public.is_app_admin()
  )
  WITH CHECK (
    bucket_id = 'shepherd-documents'
    AND public.is_app_admin()
  );
