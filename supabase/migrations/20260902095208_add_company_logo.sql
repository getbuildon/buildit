ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS logo_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS company_logos_select_public ON storage.objects;
DROP POLICY IF EXISTS company_logos_insert_admin ON storage.objects;
DROP POLICY IF EXISTS company_logos_update_admin ON storage.objects;
DROP POLICY IF EXISTS company_logos_delete_admin ON storage.objects;

CREATE POLICY company_logos_select_public
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'company-logos');

CREATE POLICY company_logos_insert_admin
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND public.user_company_role(((storage.foldername(name))[1])::uuid) IN ('owner', 'admin')
  );

CREATE POLICY company_logos_update_admin
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND public.user_company_role(((storage.foldername(name))[1])::uuid) IN ('owner', 'admin')
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND public.user_company_role(((storage.foldername(name))[1])::uuid) IN ('owner', 'admin')
  );

CREATE POLICY company_logos_delete_admin
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND public.user_company_role(((storage.foldername(name))[1])::uuid) IN ('owner', 'admin')
  );
