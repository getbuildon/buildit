ALTER TABLE public.project_floors
  ADD COLUMN IF NOT EXISTS identifier text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'unit-plans',
  'unit-plans',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS unit_plans_select_public ON storage.objects;
DROP POLICY IF EXISTS unit_plans_insert_member ON storage.objects;
DROP POLICY IF EXISTS unit_plans_update_member ON storage.objects;

CREATE POLICY unit_plans_select_public
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'unit-plans');

CREATE POLICY unit_plans_insert_member
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'unit-plans'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY unit_plans_update_member
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'unit-plans'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'unit-plans'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  );
