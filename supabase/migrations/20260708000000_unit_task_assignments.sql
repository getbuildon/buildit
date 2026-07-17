-- -----------------------------------------------------------------------------
-- unit_task_assignments
-- Registro positivo: si existe la fila, la tarea aplica a esa unidad.
-- Si no existe, la tarea NO aplica. Esto permite control granular por unidad
-- sin depender de exclusiones implícitas.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.unit_task_assignments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id)      ON DELETE CASCADE,
  unit_id       uuid        NOT NULL REFERENCES public.project_units(id) ON DELETE CASCADE,
  rubro_task_id uuid        NOT NULL REFERENCES public.rubro_tasks(id)   ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unit_task_assignments_unique UNIQUE (unit_id, rubro_task_id)
);

CREATE INDEX IF NOT EXISTS unit_task_assignments_project_id_idx  ON public.unit_task_assignments (project_id);
CREATE INDEX IF NOT EXISTS unit_task_assignments_unit_id_idx     ON public.unit_task_assignments (unit_id);
CREATE INDEX IF NOT EXISTS unit_task_assignments_task_id_idx     ON public.unit_task_assignments (rubro_task_id);

ALTER TABLE public.unit_task_assignments ENABLE ROW LEVEL SECURITY;

-- Cualquier miembro activo del proyecto puede leer las asignaciones
CREATE POLICY unit_task_assignments_select_member
  ON public.unit_task_assignments FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

-- Cualquier miembro activo puede crear asignaciones
CREATE POLICY unit_task_assignments_insert_member
  ON public.unit_task_assignments FOR INSERT TO authenticated
  WITH CHECK (public.user_has_project_access(project_id));

-- Cualquier miembro activo puede eliminar asignaciones
CREATE POLICY unit_task_assignments_delete_member
  ON public.unit_task_assignments FOR DELETE TO authenticated
  USING (public.user_has_project_access(project_id));
