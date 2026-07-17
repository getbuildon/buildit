-- Bucket privado para fotos de avance de obra
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS progress_photos_select_member ON storage.objects;
DROP POLICY IF EXISTS progress_photos_insert_member ON storage.objects;

CREATE POLICY progress_photos_select_member
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY progress_photos_insert_member
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  );
