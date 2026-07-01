-- =============================================================================
-- Fix user_has_project_access to grant access to company owner/admin
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_has_project_access(
  p_project_id uuid,
  p_user_id    uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
  );
$$;
