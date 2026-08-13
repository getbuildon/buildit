-- =============================================================================
-- RLS: restringir configuración de obra a Owner/Admin (matriz configureProject)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_can_configure_project(
  p_project_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT ut.slug IN ('owner', 'admin')
      FROM public.project_members pm
      JOIN public.user_types ut ON ut.id = pm.user_type_id
      WHERE pm.project_id = p_project_id
        AND pm.user_id = p_user_id
        AND pm.is_active = true
      LIMIT 1
    ),
    (
      SELECT EXISTS (
        SELECT 1
        FROM public.projects pr
        JOIN public.company_members cm
          ON cm.company_id = pr.company_id
         AND cm.user_id = p_user_id
         AND cm.status = 'active'
         AND cm.role IN ('owner', 'admin')
        WHERE pr.id = p_project_id
      )
    ),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_can_configure_project(uuid, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- projects: lectura para miembros; escritura de obra activa solo Owner/Admin;
-- borradores (status = draft) siguen editables por creador o miembros.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS projects_update_member ON public.projects;
DROP POLICY IF EXISTS projects_delete_member ON public.projects;

CREATE POLICY projects_update_configure
  ON public.projects FOR UPDATE TO authenticated
  USING (
    public.user_can_configure_project(id)
    OR (
      status = 'draft'
      AND (
        created_by = auth.uid()
        OR public.user_has_project_access(id)
      )
    )
  )
  WITH CHECK (
    public.user_can_configure_project(id)
    OR (
      status = 'draft'
      AND (
        created_by = auth.uid()
        OR public.user_has_project_access(id)
      )
    )
  );

CREATE POLICY projects_delete_configure
  ON public.projects FOR DELETE TO authenticated
  USING (public.user_can_configure_project(id));

-- -----------------------------------------------------------------------------
-- Estructura, rubros y asignaciones: lectura miembros; mutaciones Owner/Admin
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS project_floors_all_member ON public.project_floors;

CREATE POLICY project_floors_select_member
  ON public.project_floors FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY project_floors_insert_configure
  ON public.project_floors FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_floors_update_configure
  ON public.project_floors FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_floors_delete_configure
  ON public.project_floors FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

DROP POLICY IF EXISTS project_units_all_member ON public.project_units;

CREATE POLICY project_units_select_member
  ON public.project_units FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY project_units_insert_configure
  ON public.project_units FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_units_update_configure
  ON public.project_units FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_units_delete_configure
  ON public.project_units FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

DROP POLICY IF EXISTS rubro_groups_all_member ON public.rubro_groups;

CREATE POLICY rubro_groups_select_member
  ON public.rubro_groups FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY rubro_groups_insert_configure
  ON public.rubro_groups FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY rubro_groups_update_configure
  ON public.rubro_groups FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY rubro_groups_delete_configure
  ON public.rubro_groups FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

DROP POLICY IF EXISTS rubros_all_member ON public.rubros;

CREATE POLICY rubros_select_member
  ON public.rubros FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY rubros_insert_configure
  ON public.rubros FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY rubros_update_configure
  ON public.rubros FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY rubros_delete_configure
  ON public.rubros FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

DROP POLICY IF EXISTS rubro_tasks_all_member ON public.rubro_tasks;

CREATE POLICY rubro_tasks_select_member
  ON public.rubro_tasks FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY rubro_tasks_insert_configure
  ON public.rubro_tasks FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY rubro_tasks_update_configure
  ON public.rubro_tasks FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY rubro_tasks_delete_configure
  ON public.rubro_tasks FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

DROP POLICY IF EXISTS unit_task_assignments_insert_member ON public.unit_task_assignments;
DROP POLICY IF EXISTS unit_task_assignments_delete_member ON public.unit_task_assignments;

CREATE POLICY unit_task_assignments_insert_configure
  ON public.unit_task_assignments FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY unit_task_assignments_delete_configure
  ON public.unit_task_assignments FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

-- -----------------------------------------------------------------------------
-- Equipo e invitaciones: lectura miembros; altas/bajas Owner/Admin
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS project_members_insert_self_or_member ON public.project_members;
DROP POLICY IF EXISTS project_members_update_member ON public.project_members;
DROP POLICY IF EXISTS project_members_delete_member ON public.project_members;

CREATE POLICY project_members_insert_creator_or_configure
  ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (
    public.user_can_configure_project(project_id)
    OR (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = project_id
          AND p.created_by = auth.uid()
      )
    )
  );

CREATE POLICY project_members_update_configure
  ON public.project_members FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_members_delete_configure
  ON public.project_members FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

DROP POLICY IF EXISTS project_invitations_all_member ON public.project_invitations;

CREATE POLICY project_invitations_select_member
  ON public.project_invitations FOR SELECT TO authenticated
  USING (public.user_can_access_project(project_id));

CREATE POLICY project_invitations_insert_configure
  ON public.project_invitations FOR INSERT TO authenticated
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_invitations_update_configure
  ON public.project_invitations FOR UPDATE TO authenticated
  USING (public.user_can_configure_project(project_id))
  WITH CHECK (public.user_can_configure_project(project_id));

CREATE POLICY project_invitations_delete_configure
  ON public.project_invitations FOR DELETE TO authenticated
  USING (public.user_can_configure_project(project_id));

-- -----------------------------------------------------------------------------
-- Storage: portadas y planos de unidad solo Owner/Admin
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS unit_plans_insert_member ON storage.objects;
DROP POLICY IF EXISTS unit_plans_update_member ON storage.objects;

CREATE POLICY unit_plans_insert_configure
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'unit-plans'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY unit_plans_update_configure
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'unit-plans'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'unit-plans'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY unit_plans_delete_configure
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'unit-plans'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS project_covers_insert_member ON storage.objects;
DROP POLICY IF EXISTS project_covers_update_member ON storage.objects;

CREATE POLICY project_covers_insert_configure
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-covers'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY project_covers_update_configure
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-covers'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'project-covers'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY project_covers_delete_configure
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-covers'
    AND public.user_can_configure_project(((storage.foldername(name))[1])::uuid)
  );
