CREATE INDEX IF NOT EXISTS progress_entries_project_unit_task_occurred_idx
  ON public.progress_entries (
    project_id,
    unit_id,
    task_id,
    (COALESCE(submitted_at, created_at)) DESC
  );

CREATE OR REPLACE FUNCTION public.latest_progress_entries(
  p_project_id uuid,
  p_unit_id uuid DEFAULT NULL,
  p_statuses public.progress_status[] DEFAULT NULL
)
RETURNS SETOF public.progress_entries
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (pe.unit_id, pe.task_id)
    pe.*
  FROM public.progress_entries pe
  WHERE pe.project_id = p_project_id
    AND (p_unit_id IS NULL OR pe.unit_id = p_unit_id)
    AND (p_statuses IS NULL OR pe.status = ANY (p_statuses))
  ORDER BY
    pe.unit_id,
    pe.task_id,
    COALESCE(pe.submitted_at, pe.created_at) DESC,
    pe.created_at DESC
$$;

COMMENT ON FUNCTION public.latest_progress_entries(uuid, uuid, public.progress_status[]) IS
  'Última progress_entry por (unit_id, task_id). El avance y las listas de obra solo necesitan esa fila.';

REVOKE ALL ON FUNCTION public.latest_progress_entries(uuid, uuid, public.progress_status[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.latest_progress_entries(uuid, uuid, public.progress_status[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.latest_progress_entries(uuid, uuid, public.progress_status[]) TO service_role;
