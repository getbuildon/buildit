-- La app crea empresas solo con create_company_with_owner (ver 20261117120000).
-- Estas dos funciones quedaron sin uso y solo agregan superficie de ataque.
DROP FUNCTION IF EXISTS public.add_user_as_company_owner(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_company_for_user(text, text, text);
