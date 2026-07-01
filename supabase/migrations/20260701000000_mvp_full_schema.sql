-- =============================================================================
-- Build On — MVP Full Schema
-- Migración aditiva: no rompe tablas ni código existente.
-- Crea companies, profiles, company_members y todas las tablas de operación.
-- Extiende tablas existentes con columnas faltantes del modelo ERD.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'supervisor', 'operator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM ('active', 'invited', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tracking_scope AS ENUM ('project', 'floor', 'unit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.progress_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.progress_state AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.validation_decision AS ENUM ('approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comment_visibility AS ENUM ('internal', 'client_visible');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.comment_type AS ENUM ('comment', 'question', 'claim', 'technical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attachment_entity_type AS ENUM ('progress_entry', 'unit', 'project', 'comment', 'report');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_type AS ENUM ('unit_progress', 'project_progress');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.unit_sale_status AS ENUM ('active', 'reserved', 'sold', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- COMPANIES — entidad raíz del modelo ERD
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.companies (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  legal_name  text,
  country     text,
  tax_id      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- PROFILES — extiende auth.users con datos de perfil
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  text        NOT NULL DEFAULT '',
  last_name   text        NOT NULL DEFAULT '',
  email       text        NOT NULL,
  phone       text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- Auto-crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Crear perfiles para usuarios existentes que aún no tienen uno
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- COMPANY_MEMBERS — membresía y roles a nivel empresa
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.company_members (
  id           uuid                NOT NULL DEFAULT gen_random_uuid(),
  company_id   uuid                NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id      uuid                NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         public.company_role NOT NULL,
  status       public.member_status NOT NULL DEFAULT 'active',
  created_at   timestamptz         NOT NULL DEFAULT now(),
  disabled_at  timestamptz,
  PRIMARY KEY (id),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS company_members_company_id_idx ON public.company_members (company_id);
CREATE INDEX IF NOT EXISTS company_members_user_id_idx    ON public.company_members (user_id);

-- Garantiza un solo owner activo por empresa
CREATE UNIQUE INDEX IF NOT EXISTS company_members_one_owner_idx
  ON public.company_members (company_id)
  WHERE role = 'owner' AND status = 'active';

-- -----------------------------------------------------------------------------
-- EXTENDER TABLA: projects
-- Agrega company_id, description, building_type, estimated_end_date, image_url
-- Amplía los valores válidos de status
-- -----------------------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS company_id         uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS building_type      text,
  ADD COLUMN IF NOT EXISTS estimated_end_date date,
  ADD COLUMN IF NOT EXISTS image_url          text;

CREATE INDEX IF NOT EXISTS projects_company_id_idx ON public.projects (company_id);

-- Ampliar el CHECK de status para incluir paused/completed/archived
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived'));

-- -----------------------------------------------------------------------------
-- EXTENDER TABLA: project_units
-- Agrega code (código comercial), status (venta), name, unit_type (texto libre)
-- -----------------------------------------------------------------------------

ALTER TABLE public.project_units
  ADD COLUMN IF NOT EXISTS code      text,
  ADD COLUMN IF NOT EXISTS name      text,
  ADD COLUMN IF NOT EXISTS unit_type text,
  ADD COLUMN IF NOT EXISTS status    public.unit_sale_status NOT NULL DEFAULT 'active';

-- Código único por proyecto (cuando está definido)
CREATE UNIQUE INDEX IF NOT EXISTS project_units_code_idx
  ON public.project_units (project_id, code)
  WHERE code IS NOT NULL;

-- -----------------------------------------------------------------------------
-- EXTENDER TABLA: rubros (alias work_categories en el ERD)
-- Agrega tracking_scope
-- -----------------------------------------------------------------------------

ALTER TABLE public.rubros
  ADD COLUMN IF NOT EXISTS tracking_scope public.tracking_scope NOT NULL DEFAULT 'unit';

-- -----------------------------------------------------------------------------
-- EXTENDER TABLA: rubro_tasks (alias work_tasks en el ERD)
-- Agrega description, default_weight
-- -----------------------------------------------------------------------------

ALTER TABLE public.rubro_tasks
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS default_weight numeric;

-- -----------------------------------------------------------------------------
-- EXTENDER TABLA: project_invitations
-- Agrega company_id, token_hash, expires_at; amplía status con 'expired'
-- -----------------------------------------------------------------------------

ALTER TABLE public.project_invitations
  ADD COLUMN IF NOT EXISTS company_id  uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS token_hash  text,
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz;

ALTER TABLE public.project_invitations DROP CONSTRAINT IF EXISTS project_invitations_status_check;
ALTER TABLE public.project_invitations ADD CONSTRAINT project_invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'));

CREATE UNIQUE INDEX IF NOT EXISTS project_invitations_token_hash_idx
  ON public.project_invitations (token_hash)
  WHERE token_hash IS NOT NULL;

-- -----------------------------------------------------------------------------
-- UNIT_CLIENTS — clientes asignados a unidades
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.unit_clients (
  id          uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     uuid                 NOT NULL REFERENCES public.project_units(id) ON DELETE CASCADE,
  user_id     uuid                 NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      public.member_status NOT NULL DEFAULT 'active',
  created_at  timestamptz          NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

CREATE INDEX IF NOT EXISTS unit_clients_unit_id_idx ON public.unit_clients (unit_id);
CREATE INDEX IF NOT EXISTS unit_clients_user_id_idx ON public.unit_clients (user_id);

-- -----------------------------------------------------------------------------
-- PROGRESS_ENTRIES — registro central de avances de obra
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.progress_entries (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid                    NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  floor_id        uuid                    REFERENCES public.project_floors(id) ON DELETE SET NULL,
  unit_id         uuid                    REFERENCES public.project_units(id) ON DELETE SET NULL,
  category_id     uuid                    NOT NULL REFERENCES public.rubros(id) ON DELETE RESTRICT,
  task_id         uuid                    NOT NULL REFERENCES public.rubro_tasks(id) ON DELETE RESTRICT,
  created_by      uuid                    NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status          public.progress_status  NOT NULL DEFAULT 'draft',
  progress_state  public.progress_state   NOT NULL DEFAULT 'pending',
  comment         text,
  submitted_at    timestamptz,
  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS progress_entries_project_status_idx ON public.progress_entries (project_id, status);
CREATE INDEX IF NOT EXISTS progress_entries_unit_task_idx      ON public.progress_entries (unit_id, task_id, status);
CREATE INDEX IF NOT EXISTS progress_entries_floor_idx          ON public.progress_entries (floor_id);

-- -----------------------------------------------------------------------------
-- PROGRESS_VALIDATIONS — aprobaciones y rechazos de avances
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.progress_validations (
  id                 uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_entry_id  uuid                      NOT NULL REFERENCES public.progress_entries(id) ON DELETE CASCADE,
  validated_by       uuid                      NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  decision           public.validation_decision NOT NULL,
  comment            text,
  validated_at       timestamptz               NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS progress_validations_entry_idx ON public.progress_validations (progress_entry_id);

-- -----------------------------------------------------------------------------
-- ATTACHMENTS — fotos y documentos asociados a entidades de negocio
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.attachments (
  id           uuid                           PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid                           REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id   uuid                           NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by  uuid                           NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  entity_type  public.attachment_entity_type  NOT NULL,
  entity_id    uuid                           NOT NULL,
  file_url     text                           NOT NULL,
  file_name    text                           NOT NULL,
  file_type    text                           NOT NULL,
  file_size    integer,
  created_at   timestamptz                    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attachments_entity_idx ON public.attachments (project_id, entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- COMMENTS — comentarios internos y visibles al cliente
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.comments (
  id                 uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid                        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_id            uuid                        REFERENCES public.project_units(id) ON DELETE SET NULL,
  progress_entry_id  uuid                        REFERENCES public.progress_entries(id) ON DELETE SET NULL,
  author_id          uuid                        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  visibility         public.comment_visibility   NOT NULL DEFAULT 'internal',
  comment_type       public.comment_type         NOT NULL DEFAULT 'comment',
  body               text                        NOT NULL,
  created_at         timestamptz                 NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_project_unit_idx ON public.comments (project_id, unit_id, created_at);

-- -----------------------------------------------------------------------------
-- REPORTS — reportes de avance generados o subidos
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reports (
  id            uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid                NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_id       uuid                REFERENCES public.project_units(id) ON DELETE SET NULL,
  report_type   public.report_type  NOT NULL,
  title         text                NOT NULL,
  file_url      text,
  generated_by  uuid                REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_project_idx ON public.reports (project_id);

-- -----------------------------------------------------------------------------
-- AUDIT_EVENTS — log de trazabilidad de acciones relevantes
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        REFERENCES public.companies(id) ON DELETE SET NULL,
  project_id   uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  actor_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  action       text        NOT NULL,
  entity_type  text        NOT NULL,
  entity_id    uuid        NOT NULL,
  before_data  jsonb,
  after_data   jsonb,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_company_project_idx ON public.audit_events (company_id, project_id, created_at);
CREATE INDEX IF NOT EXISTS audit_events_action_idx          ON public.audit_events (action);

-- -----------------------------------------------------------------------------
-- UNIT_PROGRESS_SNAPSHOTS — caché de progreso por unidad (opcional MVP)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.unit_progress_snapshots (
  id                      uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                 uuid     NOT NULL REFERENCES public.project_units(id) ON DELETE CASCADE,
  project_id              uuid     NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  progress_percentage     numeric  NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  current_category_id     uuid     REFERENCES public.rubros(id) ON DELETE SET NULL,
  current_task_id         uuid     REFERENCES public.rubro_tasks(id) ON DELETE SET NULL,
  last_approved_entry_id  uuid     REFERENCES public.progress_entries(id) ON DELETE SET NULL,
  last_updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS unit_progress_snapshots_unit_idx ON public.unit_progress_snapshots (unit_id);
CREATE INDEX IF NOT EXISTS unit_progress_snapshots_project_idx ON public.unit_progress_snapshots (project_id);

-- -----------------------------------------------------------------------------
-- TRIGGERS updated_at
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS progress_entries_updated_at ON public.progress_entries;
CREATE TRIGGER progress_entries_updated_at
  BEFORE UPDATE ON public.progress_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Retorna el rol de un usuario en una empresa (NULL si no es miembro)
CREATE OR REPLACE FUNCTION public.user_company_role(
  p_company_id uuid,
  p_user_id    uuid DEFAULT auth.uid()
)
RETURNS public.company_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role
  FROM public.company_members
  WHERE company_id = p_company_id
    AND user_id    = p_user_id
    AND status     = 'active'
  LIMIT 1;
$$;

-- Verifica si un usuario es miembro activo de una empresa
CREATE OR REPLACE FUNCTION public.user_is_company_member(
  p_company_id uuid,
  p_user_id    uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members
    WHERE company_id = p_company_id
      AND user_id    = p_user_id
      AND status     = 'active'
  );
$$;

-- Retorna el slug del rol de un usuario en un proyecto (NULL si no es miembro)
CREATE OR REPLACE FUNCTION public.user_project_role(
  p_project_id uuid,
  p_user_id    uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pr.slug
  FROM public.project_members pm
  JOIN public.project_roles pr ON pr.id = pm.role_id
  WHERE pm.project_id = p_project_id
    AND pm.user_id    = p_user_id
    AND pm.is_active  = true
  LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- RLS — NUEVAS TABLAS
-- -----------------------------------------------------------------------------

ALTER TABLE public.companies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_validations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- companies: visible para miembros activos de esa empresa
CREATE POLICY companies_select_member
  ON public.companies FOR SELECT TO authenticated
  USING (public.user_is_company_member(id));

-- Cualquier usuario autenticado puede crear una empresa (se convierte en owner)
CREATE POLICY companies_insert_authenticated
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- Solo owner/admin puede editar la empresa
CREATE POLICY companies_update_admin
  ON public.companies FOR UPDATE TO authenticated
  USING (public.user_company_role(id) IN ('owner', 'admin'))
  WITH CHECK (public.user_company_role(id) IN ('owner', 'admin'));

-- profiles: propio perfil o compañero de empresa
CREATE POLICY profiles_select_self_or_colleague
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.company_members cm1
      JOIN public.company_members cm2
        ON cm1.company_id = cm2.company_id
       AND cm1.status = 'active'
       AND cm2.status = 'active'
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = profiles.id
    )
  );

CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- company_members: miembros de la empresa se ven entre sí
CREATE POLICY company_members_select_member
  ON public.company_members FOR SELECT TO authenticated
  USING (public.user_is_company_member(company_id));

-- Solo owner/admin puede agregar miembros
CREATE POLICY company_members_insert_admin
  ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (public.user_company_role(company_id) IN ('owner', 'admin'));

-- Solo owner/admin puede modificar miembros
CREATE POLICY company_members_update_admin
  ON public.company_members FOR UPDATE TO authenticated
  USING (public.user_company_role(company_id) IN ('owner', 'admin'))
  WITH CHECK (public.user_company_role(company_id) IN ('owner', 'admin'));

-- unit_clients: miembros del proyecto y el propio cliente
CREATE POLICY unit_clients_select_member_or_self
  ON public.unit_clients FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_has_project_access(
         (SELECT project_id FROM public.project_units WHERE id = unit_id)
       )
  );

CREATE POLICY unit_clients_insert_project_member
  ON public.unit_clients FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_project_access(
      (SELECT project_id FROM public.project_units WHERE id = unit_id)
    )
  );

CREATE POLICY unit_clients_update_project_member
  ON public.unit_clients FOR UPDATE TO authenticated
  USING (
    public.user_has_project_access(
      (SELECT project_id FROM public.project_units WHERE id = unit_id)
    )
  );

-- progress_entries: miembros del proyecto
CREATE POLICY progress_entries_select_member
  ON public.progress_entries FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY progress_entries_insert_member
  ON public.progress_entries FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_project_access(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY progress_entries_update_member
  ON public.progress_entries FOR UPDATE TO authenticated
  USING (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

-- progress_validations: cualquier miembro lee; administrador/supervisor valida
CREATE POLICY progress_validations_select_member
  ON public.progress_validations FOR SELECT TO authenticated
  USING (
    public.user_has_project_access(
      (SELECT project_id FROM public.progress_entries WHERE id = progress_entry_id)
    )
  );

CREATE POLICY progress_validations_insert_supervisor
  ON public.progress_validations FOR INSERT TO authenticated
  WITH CHECK (
    validated_by = auth.uid()
    AND public.user_project_role(
          (SELECT project_id FROM public.progress_entries WHERE id = progress_entry_id)
        ) IN ('administrador', 'director_obra')
  );

-- attachments: miembros del proyecto
CREATE POLICY attachments_select_member
  ON public.attachments FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY attachments_insert_member
  ON public.attachments FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_project_access(project_id)
    AND uploaded_by = auth.uid()
  );

-- comments: miembros del proyecto (visibilidad filtrada en app)
CREATE POLICY comments_select_member
  ON public.comments FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY comments_insert_member
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    public.user_has_project_access(project_id)
    AND author_id = auth.uid()
  );

-- reports: miembros del proyecto
CREATE POLICY reports_select_member
  ON public.reports FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY reports_insert_member
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (public.user_has_project_access(project_id));

-- audit_events: lectura para miembros del proyecto o empresa
CREATE POLICY audit_events_select_member
  ON public.audit_events FOR SELECT TO authenticated
  USING (
    (project_id IS NOT NULL AND public.user_has_project_access(project_id))
    OR (company_id IS NOT NULL AND public.user_is_company_member(company_id))
  );

CREATE POLICY audit_events_insert_member
  ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (
    (project_id IS NOT NULL AND public.user_has_project_access(project_id))
    OR (company_id IS NOT NULL AND public.user_is_company_member(company_id))
  );

-- unit_progress_snapshots: miembros del proyecto
CREATE POLICY unit_progress_snapshots_select_member
  ON public.unit_progress_snapshots FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY unit_progress_snapshots_insert_member
  ON public.unit_progress_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY unit_progress_snapshots_update_member
  ON public.unit_progress_snapshots FOR UPDATE TO authenticated
  USING (public.user_has_project_access(project_id));

-- -----------------------------------------------------------------------------
-- GRANTS
-- -----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.user_company_role(uuid, uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_project_role(uuid, uuid)    TO authenticated;
