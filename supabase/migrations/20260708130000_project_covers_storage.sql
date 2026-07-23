-- Portadas de proyectos (bucket público para mostrar en cards y dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-covers',
  'project-covers',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS project_covers_select_public ON storage.objects;
DROP POLICY IF EXISTS project_covers_insert_member ON storage.objects;
DROP POLICY IF EXISTS project_covers_update_member ON storage.objects;

CREATE POLICY project_covers_select_public
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'project-covers');

CREATE POLICY project_covers_insert_member
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-covers'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY project_covers_update_member
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-covers'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'project-covers'
    AND public.user_has_project_access(((storage.foldername(name))[1])::uuid)
  );
