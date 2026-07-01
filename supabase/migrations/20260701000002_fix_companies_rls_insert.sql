-- =============================================================================
-- Fix companies RLS INSERT policy
-- Crear una función que inserte en companies sin problemas de RLS
-- usando SECURITY DEFINER para bypassear las políticas
-- =============================================================================

-- Crear función que permite insertar compañía
CREATE OR REPLACE FUNCTION public.create_company_for_user(
  p_name text,
  p_legal_name text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.companies (name, legal_name, country)
  VALUES (p_name, p_legal_name, p_country)
  RETURNING id;
$$;

-- Crear función que agrega usuario como owner de una compañía
CREATE OR REPLACE FUNCTION public.add_user_as_company_owner(
  p_company_id uuid,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (p_company_id, p_user_id, 'owner', 'active')
  RETURNING id;
$$;
