-- RLS por rol (ver docs/plan-etapa-2/fase-0.md).
--
-- Antes casi todas las políticas usaban user_has_project_access(), que devuelve true
-- también para clientes. Desde la API, un cliente u operador podía leer avances de
-- otras unidades, marcar avances como aprobados o asignarse unidades.
--
-- Esta migración replica en SQL la matriz de permisos de la app
-- (lib/project/projectPermissions.ts + lib/project/resolveProjectAccess.ts):
--   * capa del proyecto: tipo de usuario en project_members (owner/admin/supervisor/operador/cliente)
--   * capa de empresa: owner/admin de la empresa = config y lectura, sin acciones de campo
--   * capa de cliente: unit_clients activo = portal y solo sus unidades
--
-- No se cambia la app: la certificación sigue haciendo el UPDATE directo, pero ahora
-- la base exige certifyTasks para pasar un avance a aprobado.

-- ---------------------------------------------------------------------------
-- 1. Funciones nuevas (solo auth.uid(), sin parámetro de usuario)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.project_user_type(p_project_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ut.slug
  FROM public.project_members pm
  JOIN public.user_types ut ON ut.id = pm.user_type_id
  WHERE pm.project_id = p_project_id
    AND pm.user_id = auth.uid()
    AND pm.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_project_company_admin(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects pr
    JOIN public.company_members cm
      ON cm.company_id = pr.company_id
     AND cm.user_id = auth.uid()
     AND cm.status = 'active'
     AND cm.role IN ('owner', 'admin')
    WHERE pr.id = p_project_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_client_unit_ids(p_project_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(uc.unit_id), '{}'::uuid[])
  FROM public.unit_clients uc
  JOIN public.project_units pu ON pu.id = uc.unit_id
  WHERE pu.project_id = p_project_id
    AND uc.user_id = auth.uid()
    AND uc.status = 'active';
$$;

-- Creador de una obra en borrador (antes de que exista su fila en project_members).
CREATE OR REPLACE FUNCTION public.is_draft_project_creator(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id
      AND p.status = 'draft'
      AND p.created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_permission(p_project_id uuid, p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text := public.project_user_type(p_project_id);
  v_company boolean := public.is_project_company_admin(p_project_id);
BEGIN
  CASE p_permission
    WHEN 'addUsers', 'editPermissions', 'configureProject', 'manageClients' THEN
      RETURN v_type IN ('owner', 'admin') OR v_company;
    WHEN 'viewDashboard', 'viewAuditLog' THEN
      RETURN v_type IN ('owner', 'admin', 'supervisor', 'operador') OR v_company;
    WHEN 'loadProgress', 'editTasks' THEN
      RETURN COALESCE(v_type IN ('owner', 'admin', 'supervisor', 'operador'), false);
    WHEN 'certifyTasks' THEN
      RETURN COALESCE(v_type IN ('owner', 'admin', 'supervisor'), false);
    WHEN 'clientPortal' THEN
      RETURN v_type = 'cliente'
        OR cardinality(public.user_client_unit_ids(p_project_id)) > 0;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Equipo de la obra: cualquier tipo menos cliente, owner/admin de la empresa, o el
-- creador mientras la obra es borrador.
CREATE OR REPLACE FUNCTION public.is_project_staff(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.project_user_type(p_project_id) IN ('owner', 'admin', 'supervisor', 'operador'), false)
    OR public.is_project_company_admin(p_project_id)
    OR public.is_draft_project_creator(p_project_id);
$$;

-- Hallazgo 5: si el usuario era miembro del proyecto con otro tipo, el COALESCE no
-- caía a la capa de empresa. La app une las dos capas.
CREATE OR REPLACE FUNCTION public.user_can_configure_project(p_project_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
      SELECT 1
      FROM public.project_members pm
      JOIN public.user_types ut ON ut.id = pm.user_type_id
      WHERE pm.project_id = p_project_id
        AND pm.user_id = p_user_id
        AND pm.is_active = true
        AND ut.slug IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.projects pr
      JOIN public.company_members cm
        ON cm.company_id = pr.company_id
       AND cm.user_id = p_user_id
       AND cm.status = 'active'
       AND cm.role IN ('owner', 'admin')
      WHERE pr.id = p_project_id
    );
$$;

REVOKE EXECUTE ON FUNCTION public.project_user_type(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_company_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_client_unit_ids(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_draft_project_creator(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_project_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.project_user_type(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_company_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_client_unit_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_draft_project_creator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_project_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_staff(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Políticas
-- ---------------------------------------------------------------------------

-- projects ------------------------------------------------------------------
DROP POLICY IF EXISTS projects_select_member_or_creator ON public.projects;
CREATE POLICY projects_select_member_or_creator ON public.projects
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(id)
    OR created_by = (select auth.uid())
    OR cardinality(public.user_client_unit_ids(id)) > 0
    OR public.project_user_type(id) = 'cliente'
  );

-- Hallazgo 2: en borrador alcanzaba con user_has_project_access (incluía clientes).
DROP POLICY IF EXISTS projects_update_configure ON public.projects;
CREATE POLICY projects_update_configure ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.user_can_configure_project(id)
    OR (status = 'draft' AND created_by = (select auth.uid()))
  )
  WITH CHECK (
    public.user_can_configure_project(id)
    OR (status = 'draft' AND created_by = (select auth.uid()))
  );

DROP POLICY IF EXISTS projects_insert_creator ON public.projects;
CREATE POLICY projects_insert_creator ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- progress_entries ----------------------------------------------------------
DROP POLICY IF EXISTS progress_entries_select_member ON public.progress_entries;
CREATE POLICY progress_entries_select_member ON public.progress_entries
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(project_id)
    OR unit_id = ANY (public.user_client_unit_ids(project_id))
  );

-- Cargar avance (y la carga inicial al crear la obra). Nunca se inserta aprobado:
-- eso solo pasa al certificar.
DROP POLICY IF EXISTS progress_entries_insert_member ON public.progress_entries;
CREATE POLICY progress_entries_insert_member ON public.progress_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (select auth.uid())
    AND status <> 'approved'
    AND (
      public.has_project_permission(project_id, 'loadProgress')
      OR public.has_project_permission(project_id, 'configureProject')
      OR public.is_draft_project_creator(project_id)
    )
  );

-- La app solo actualiza avances al certificar (status approved).
DROP POLICY IF EXISTS progress_entries_update_member ON public.progress_entries;
CREATE POLICY progress_entries_update_certify ON public.progress_entries
  FOR UPDATE TO authenticated
  USING (public.has_project_permission(project_id, 'certifyTasks'))
  WITH CHECK (public.has_project_permission(project_id, 'certifyTasks'));

-- progress_validations ------------------------------------------------------
-- Hallazgo 1: usaba el cargo (administrador/director_obra) en vez del tipo de usuario.
DROP POLICY IF EXISTS progress_validations_insert_supervisor ON public.progress_validations;
CREATE POLICY progress_validations_insert_certify ON public.progress_validations
  FOR INSERT TO authenticated
  WITH CHECK (
    validated_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.progress_entries pe
      WHERE pe.id = progress_validations.progress_entry_id
        AND public.has_project_permission(pe.project_id, 'certifyTasks')
    )
  );

DROP POLICY IF EXISTS progress_validations_select_member ON public.progress_validations;
CREATE POLICY progress_validations_select_member ON public.progress_validations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.progress_entries pe
      WHERE pe.id = progress_validations.progress_entry_id
        AND (
          public.is_project_staff(pe.project_id)
          OR pe.unit_id = ANY (public.user_client_unit_ids(pe.project_id))
        )
    )
  );

-- attachments ---------------------------------------------------------------
DROP POLICY IF EXISTS attachments_select_member ON public.attachments;
CREATE POLICY attachments_select_member ON public.attachments
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(project_id)
    OR (
      entity_type = 'progress_entry'
      AND EXISTS (
        SELECT 1 FROM public.progress_entries pe
        WHERE pe.id = attachments.entity_id
          AND pe.unit_id = ANY (public.user_client_unit_ids(attachments.project_id))
      )
    )
  );

DROP POLICY IF EXISTS attachments_insert_member ON public.attachments;
CREATE POLICY attachments_insert_member ON public.attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = (select auth.uid())
    AND (
      public.has_project_permission(project_id, 'loadProgress')
      OR public.has_project_permission(project_id, 'configureProject')
    )
  );

-- unit_clients --------------------------------------------------------------
-- Antes cualquiera con acceso a la obra (clientes incluidos) podía crear o mover filas.
DROP POLICY IF EXISTS unit_clients_select_member_or_self ON public.unit_clients;
CREATE POLICY unit_clients_select_member_or_self ON public.unit_clients
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.has_project_permission(
      (SELECT pu.project_id FROM public.project_units pu WHERE pu.id = unit_clients.unit_id),
      'manageClients'
    )
  );

DROP POLICY IF EXISTS unit_clients_insert_project_member ON public.unit_clients;
CREATE POLICY unit_clients_insert_manage ON public.unit_clients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_project_permission(
      (SELECT pu.project_id FROM public.project_units pu WHERE pu.id = unit_clients.unit_id),
      'manageClients'
    )
  );

-- Hallazgo 4: no tenía WITH CHECK (se podía mover una fila a otra obra).
DROP POLICY IF EXISTS unit_clients_update_project_member ON public.unit_clients;
CREATE POLICY unit_clients_update_manage ON public.unit_clients
  FOR UPDATE TO authenticated
  USING (
    public.has_project_permission(
      (SELECT pu.project_id FROM public.project_units pu WHERE pu.id = unit_clients.unit_id),
      'manageClients'
    )
  )
  WITH CHECK (
    public.has_project_permission(
      (SELECT pu.project_id FROM public.project_units pu WHERE pu.id = unit_clients.unit_id),
      'manageClients'
    )
  );

-- client_invitation_units ---------------------------------------------------
DROP POLICY IF EXISTS client_invitation_units_all_member ON public.client_invitation_units;
CREATE POLICY client_invitation_units_all_manage ON public.client_invitation_units
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_invitations pi
      WHERE pi.id = client_invitation_units.invitation_id
        AND public.has_project_permission(pi.project_id, 'manageClients')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_invitations pi
      WHERE pi.id = client_invitation_units.invitation_id
        AND public.has_project_permission(pi.project_id, 'manageClients')
    )
  );

-- project_members -----------------------------------------------------------
-- Un cliente veía todo el equipo; ahora solo su propia fila.
DROP POLICY IF EXISTS project_members_select_member ON public.project_members;
CREATE POLICY project_members_select_member ON public.project_members
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_project_staff(project_id)
  );

DROP POLICY IF EXISTS project_members_insert_creator_or_configure ON public.project_members;
CREATE POLICY project_members_insert_creator_or_configure ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    public.user_can_configure_project(project_id)
    OR (
      user_id = (select auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_members.project_id
          AND p.created_by = (select auth.uid())
      )
    )
  );

-- project_invitations -------------------------------------------------------
-- user_can_access_project incluía clientes: veían mails de otros invitados.
DROP POLICY IF EXISTS project_invitations_select_member ON public.project_invitations;
CREATE POLICY project_invitations_select_member ON public.project_invitations
  FOR SELECT TO authenticated
  USING (public.is_project_staff(project_id));

-- project_subscriptions -----------------------------------------------------
-- Hallazgo 3: la dejaba ver a cualquier miembro, clientes incluidos. Ahora solo el
-- equipo (los contadores de lugares del plan se muestran en Equipo y Clientes).
DROP POLICY IF EXISTS project_subscriptions_select_member ON public.project_subscriptions;
DROP POLICY IF EXISTS project_subscriptions_select_company_admin ON public.project_subscriptions;
CREATE POLICY project_subscriptions_select_staff ON public.project_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_project_staff(project_id));

DROP POLICY IF EXISTS project_subscriptions_insert_company_admin ON public.project_subscriptions;
CREATE POLICY project_subscriptions_insert_company_admin ON public.project_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_subscriptions.project_id
        AND (
          p.created_by = (select auth.uid())
          OR public.user_company_role(p.company_id) IN ('owner', 'admin')
        )
    )
  );

-- unit_task_assignments -----------------------------------------------------
DROP POLICY IF EXISTS unit_task_assignments_select_member ON public.unit_task_assignments;
CREATE POLICY unit_task_assignments_select_member ON public.unit_task_assignments
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(project_id)
    OR unit_id = ANY (public.user_client_unit_ids(project_id))
  );

-- comments (la app hoy no los usa) -------------------------------------------
DROP POLICY IF EXISTS comments_select_member ON public.comments;
CREATE POLICY comments_select_member ON public.comments
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(project_id)
    OR (
      visibility = 'client_visible'
      AND unit_id = ANY (public.user_client_unit_ids(project_id))
    )
  );

DROP POLICY IF EXISTS comments_insert_member ON public.comments;
CREATE POLICY comments_insert_member ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (select auth.uid())
    AND public.is_project_staff(project_id)
  );

-- reports (la app hoy no los usa) --------------------------------------------
DROP POLICY IF EXISTS reports_select_member ON public.reports;
CREATE POLICY reports_select_member ON public.reports
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(project_id)
    OR unit_id = ANY (public.user_client_unit_ids(project_id))
  );

DROP POLICY IF EXISTS reports_insert_member ON public.reports;
CREATE POLICY reports_insert_member ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_staff(project_id));

-- unit_progress_snapshots (la app hoy no los usa) ----------------------------
DROP POLICY IF EXISTS unit_progress_snapshots_select_member ON public.unit_progress_snapshots;
CREATE POLICY unit_progress_snapshots_select_member ON public.unit_progress_snapshots
  FOR SELECT TO authenticated
  USING (
    public.is_project_staff(project_id)
    OR unit_id = ANY (public.user_client_unit_ids(project_id))
  );

DROP POLICY IF EXISTS unit_progress_snapshots_insert_member ON public.unit_progress_snapshots;
CREATE POLICY unit_progress_snapshots_insert_member ON public.unit_progress_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_staff(project_id));

DROP POLICY IF EXISTS unit_progress_snapshots_update_member ON public.unit_progress_snapshots;
CREATE POLICY unit_progress_snapshots_update_member ON public.unit_progress_snapshots
  FOR UPDATE TO authenticated
  USING (public.is_project_staff(project_id))
  WITH CHECK (public.is_project_staff(project_id));

-- audit_events (la app hoy no los usa) ---------------------------------------
DROP POLICY IF EXISTS audit_events_select_member ON public.audit_events;
CREATE POLICY audit_events_select_member ON public.audit_events
  FOR SELECT TO authenticated
  USING (
    (project_id IS NOT NULL AND public.has_project_permission(project_id, 'viewAuditLog'))
    OR (project_id IS NULL AND company_id IS NOT NULL AND public.user_is_company_member(company_id))
  );

DROP POLICY IF EXISTS audit_events_insert_member ON public.audit_events;
CREATE POLICY audit_events_insert_member ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (select auth.uid())
    AND (
      (project_id IS NOT NULL AND public.is_project_staff(project_id))
      OR (project_id IS NULL AND company_id IS NOT NULL AND public.user_is_company_member(company_id))
    )
  );

-- profiles: (select auth.uid()) por performance ------------------------------
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- storage: fotos de avance ----------------------------------------------------
-- Subir: quien carga avance. Ver: equipo de la obra o cliente de esa obra (las URLs
-- firmadas se generan en el servidor después de filtrar por unidad).
DROP POLICY IF EXISTS progress_photos_insert_member ON storage.objects;
CREATE POLICY progress_photos_insert_member ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (
      public.has_project_permission(((storage.foldername(name))[1])::uuid, 'loadProgress')
      OR public.has_project_permission(((storage.foldername(name))[1])::uuid, 'configureProject')
    )
  );

DROP POLICY IF EXISTS progress_photos_select_member ON storage.objects;
CREATE POLICY progress_photos_select_member ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (
      public.is_project_staff(((storage.foldername(name))[1])::uuid)
      OR cardinality(public.user_client_unit_ids(((storage.foldername(name))[1])::uuid)) > 0
    )
  );
