-- Endurecimiento general (fase-0, hallazgos 7, 8 y 12).

-- 7. anon no necesita tablas: la app no lee nada sin sesión (las políticas son todas
--    TO authenticated). Se revoca también para las tablas que se creen en el futuro.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 8. Funciones SECURITY DEFINER: solo usuarios con sesión. handle_new_user es trigger.
REVOKE EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_access_project(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_configure_project(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_company_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_company_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_project_role(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_company_with_owner(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_project(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_configure_project(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_company_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_company_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_project_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company_with_owner(text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.latest_progress_entries(uuid, uuid, public.progress_status[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.latest_progress_entries(uuid, uuid, public.progress_status[]) TO authenticated;

-- 12. search_path fijo en los triggers de updated_at.
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_projects_updated_at() SET search_path = public;
