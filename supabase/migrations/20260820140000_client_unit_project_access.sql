-- Clientes asignados a unidades pueden leer el proyecto (portal / mi-unidad).
CREATE OR REPLACE FUNCTION public.user_has_project_access(
  p_project_id uuid,
  p_user_id    uuid DEFAULT auth.uid()
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
      AND pm.user_id    = p_user_id
      AND pm.is_active  = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.projects pr
    JOIN public.company_members cm
      ON cm.company_id = pr.company_id
     AND cm.user_id    = p_user_id
     AND cm.status     = 'active'
     AND cm.role       IN ('owner', 'admin')
    WHERE pr.id = p_project_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.unit_clients uc
    JOIN public.project_units pu ON pu.id = uc.unit_id
    WHERE pu.project_id = p_project_id
      AND uc.user_id = p_user_id
      AND uc.status = 'active'
  );
$$;
