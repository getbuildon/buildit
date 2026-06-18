-- Build It — esquema inicial (tenant = obra / project_id)
-- Aplicar en Supabase (SQL editor o MCP apply_migration).
-- RLS por obra; roles de permiso fino se agregan en una iteración posterior.

-- ---------------------------------------------------------------------------
-- Catálogos (solo lectura para usuarios autenticados)
-- ---------------------------------------------------------------------------

CREATE TABLE public.unit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.task_tracking_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  badge text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tenant (obra)
-- ---------------------------------------------------------------------------

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  start_date date,
  end_date date,
  cover_url text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX projects_created_by_idx ON public.projects (created_by);

-- ---------------------------------------------------------------------------
-- Estructura del edificio
-- ---------------------------------------------------------------------------

CREATE TABLE public.project_floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  level text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_floors_project_id_idx ON public.project_floors (project_id);

CREATE TABLE public.project_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  floor_id uuid NOT NULL REFERENCES public.project_floors (id) ON DELETE CASCADE,
  unit_type_id uuid NOT NULL REFERENCES public.unit_types (id) ON DELETE RESTRICT,
  square_meters numeric(12, 2),
  room_count integer,
  plan_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_units_project_id_idx ON public.project_units (project_id);
CREATE INDEX project_units_floor_id_idx ON public.project_units (floor_id);

-- ---------------------------------------------------------------------------
-- Rubros y tareas (plan de trabajo por obra)
-- ---------------------------------------------------------------------------

CREATE TABLE public.rubro_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rubro_groups_project_id_idx ON public.rubro_groups (project_id);

CREATE TABLE public.rubros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.rubro_groups (id) ON DELETE CASCADE,
  name text NOT NULL,
  tracking_type_id uuid NOT NULL REFERENCES public.task_tracking_types (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rubros_project_id_idx ON public.rubros (project_id);
CREATE INDEX rubros_group_id_idx ON public.rubros (group_id);

CREATE TABLE public.rubro_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  rubro_id uuid NOT NULL REFERENCES public.rubros (id) ON DELETE CASCADE,
  name text NOT NULL,
  weight_percent numeric(5, 2),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rubro_tasks_project_id_idx ON public.rubro_tasks (project_id);
CREATE INDEX rubro_tasks_rubro_id_idx ON public.rubro_tasks (rubro_id);

-- ---------------------------------------------------------------------------
-- Equipo (membresía + invitaciones)
-- ---------------------------------------------------------------------------

CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.project_roles (id) ON DELETE RESTRICT,
  user_type_id uuid REFERENCES public.user_types (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX project_members_project_id_idx ON public.project_members (project_id);
CREATE INDEX project_members_user_id_idx ON public.project_members (user_id);

CREATE TABLE public.project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  user_type_id uuid NOT NULL REFERENCES public.user_types (id) ON DELETE RESTRICT,
  role_id uuid NOT NULL REFERENCES public.project_roles (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE INDEX project_invitations_project_id_idx ON public.project_invitations (project_id);
CREATE UNIQUE INDEX project_invitations_pending_email_idx
  ON public.project_invitations (project_id, lower(email))
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- Acceso RLS (solo tenant = project_id)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_project_access(
  p_project_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = p_user_id
      AND pm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_project(
  p_project_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_project_access(p_project_id, p_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = p_project_id
        AND p.created_by = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.set_projects_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_projects_updated_at();

-- ---------------------------------------------------------------------------
-- Seeds (catálogos hardcodeados)
-- ---------------------------------------------------------------------------

INSERT INTO public.unit_types (slug, label, sort_order) VALUES
  ('departamento', 'Departamento', 10),
  ('cochera', 'Cochera', 20),
  ('local', 'Local', 30),
  ('bodega', 'Bodega', 40),
  ('oficina', 'Oficina', 50),
  ('gimnasio', 'Gimnasio', 60),
  ('patio', 'Patio', 70)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.task_tracking_types (slug, label, sort_order) VALUES
  ('porcentaje', 'Porcentaje', 10),
  ('checklist', 'Lista de verificación', 20),
  ('por_unidad', 'Por unidad', 30)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.user_types (slug, label, sort_order) VALUES
  ('interno', 'Interno', 10),
  ('externo', 'Externo', 20),
  ('cliente', 'Cliente', 30),
  ('contratista', 'Contratista', 40)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.project_roles (slug, label, badge, sort_order) VALUES
  ('administrador', 'Administrador', 'Admin', 10),
  ('director_obra', 'Director de Obra', 'Supervisor', 20),
  ('residente_obra', 'Residente de Obra', 'Residente', 30),
  ('arquitecto', 'Arquitecto', 'Arquitecto', 40),
  ('cliente', 'Cliente', 'Cliente', 50)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tracking_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubro_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubro_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY unit_types_select_authenticated
  ON public.unit_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY task_tracking_types_select_authenticated
  ON public.task_tracking_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY user_types_select_authenticated
  ON public.user_types FOR SELECT TO authenticated
  USING (true);

CREATE POLICY project_roles_select_authenticated
  ON public.project_roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY projects_select_member_or_creator
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.user_has_project_access(id)
    OR created_by = auth.uid()
  );

CREATE POLICY projects_insert_creator
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY projects_update_member
  ON public.projects FOR UPDATE TO authenticated
  USING (public.user_has_project_access(id))
  WITH CHECK (public.user_has_project_access(id));

CREATE POLICY projects_delete_member
  ON public.projects FOR DELETE TO authenticated
  USING (public.user_has_project_access(id));

CREATE POLICY project_floors_all_member
  ON public.project_floors FOR ALL TO authenticated
  USING (public.user_can_access_project(project_id))
  WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY project_units_all_member
  ON public.project_units FOR ALL TO authenticated
  USING (public.user_can_access_project(project_id))
  WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY rubro_groups_all_member
  ON public.rubro_groups FOR ALL TO authenticated
  USING (public.user_can_access_project(project_id))
  WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY rubros_all_member
  ON public.rubros FOR ALL TO authenticated
  USING (public.user_can_access_project(project_id))
  WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY rubro_tasks_all_member
  ON public.rubro_tasks FOR ALL TO authenticated
  USING (public.user_can_access_project(project_id))
  WITH CHECK (public.user_can_access_project(project_id));

CREATE POLICY project_members_select_member
  ON public.project_members FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY project_members_insert_self_or_member
  ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = project_id
          AND p.created_by = auth.uid()
      )
      OR public.user_has_project_access(project_id)
    )
  );

CREATE POLICY project_members_update_member
  ON public.project_members FOR UPDATE TO authenticated
  USING (public.user_has_project_access(project_id))
  WITH CHECK (public.user_has_project_access(project_id));

CREATE POLICY project_members_delete_member
  ON public.project_members FOR DELETE TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY project_invitations_all_member
  ON public.project_invitations FOR ALL TO authenticated
  USING (public.user_can_access_project(project_id))
  WITH CHECK (public.user_can_access_project(project_id));

GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_project(uuid, uuid) TO authenticated;
