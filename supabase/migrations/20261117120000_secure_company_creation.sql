-- =============================================================================
-- Creación de empresa segura
--
-- Problema: add_user_as_company_owner(p_company_id, p_user_id) es SECURITY
-- DEFINER, no valida nada y la pueden ejecutar anon y authenticated. Cualquiera
-- podía hacerse owner de cualquier empresa llamando a la RPC.
--
-- 1. Nueva RPC atómica create_company_with_owner: crea la empresa y agrega al
--    usuario actual (auth.uid()) como owner en la misma transacción.
-- 2. Las dos funciones viejas quedan restringidas mientras se despliega la app
--    nueva (por si hay una versión vieja corriendo). Se borran en una migración
--    posterior, una vez desplegada la app.
-- =============================================================================

-- 1. RPC nueva --------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_company_with_owner(
  p_name text,
  p_legal_name text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF coalesce(btrim(p_name), '') = '' THEN
    RAISE EXCEPTION 'company name is required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.companies (name, legal_name, country)
  VALUES (btrim(p_name), nullif(btrim(p_legal_name), ''), nullif(btrim(p_country), ''))
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (v_company_id, v_user_id, 'owner', 'active');

  RETURN v_company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_company_with_owner(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_company_with_owner(text, text, text) TO authenticated;

-- 2. Funciones viejas, restringidas durante la transición --------------------

-- Solo el propio usuario, solo sobre una empresa sin miembros y creada hace
-- menos de 10 minutos (el flujo viejo de la app la llama justo después de
-- create_company_for_user). Así no se puede reclamar ninguna empresa existente.
CREATE OR REPLACE FUNCTION public.add_user_as_company_owner(
  p_company_id uuid,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = p_company_id
      AND c.created_at > now() - interval '10 minutes'
  ) OR EXISTS (
    SELECT 1 FROM public.company_members WHERE company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (p_company_id, p_user_id, 'owner', 'active')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_user_as_company_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_company_for_user(text, text, text) FROM PUBLIC, anon;
