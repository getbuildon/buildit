-- =============================================================================
-- CMS del portal de clientes (novedades + hitos de construcción)
-- =============================================================================

CREATE TABLE public.project_portal_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_portal_news_project_id_idx
  ON public.project_portal_news (project_id, sort_order);

CREATE TABLE public.project_portal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  estimated_date date,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_portal_milestones_project_id_idx
  ON public.project_portal_milestones (project_id, sort_order);

ALTER TABLE public.project_portal_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_portal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_portal_news_select_member
  ON public.project_portal_news FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY project_portal_news_insert_configure
  ON public.project_portal_news FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_portal_news_update_configure
  ON public.project_portal_news FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_portal_news_delete_configure
  ON public.project_portal_news FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

CREATE POLICY project_portal_milestones_select_member
  ON public.project_portal_milestones FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY project_portal_milestones_insert_configure
  ON public.project_portal_milestones FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_portal_milestones_update_configure
  ON public.project_portal_milestones FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_portal_milestones_delete_configure
  ON public.project_portal_milestones FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

-- Imágenes de novedades (bucket público, hasta 10 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-portal-news',
  'project-portal-news',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/webp', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS project_portal_news_select_public ON storage.objects;
DROP POLICY IF EXISTS project_portal_news_insert_configure ON storage.objects;
DROP POLICY IF EXISTS project_portal_news_update_configure ON storage.objects;
DROP POLICY IF EXISTS project_portal_news_delete_configure ON storage.objects;

CREATE POLICY project_portal_news_select_public
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'project-portal-news');

CREATE POLICY project_portal_news_insert_configure
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-portal-news'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY project_portal_news_update_configure
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-portal-news'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'project-portal-news'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY project_portal_news_delete_configure
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-portal-news'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );
