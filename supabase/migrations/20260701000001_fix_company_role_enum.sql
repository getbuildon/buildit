-- =============================================================================
-- Fix company_role enum - cambiar de (owner, admin, supervisor, operator)
-- a (owner, admin, billing, member)
-- supervisor y operator son roles de PROJECT, no de company
-- =============================================================================

-- Crear nuevo enum con los valores correctos
DO $$ BEGIN
  CREATE TYPE public.company_role_v2 AS ENUM ('owner', 'admin', 'billing', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Convertir la columna company_members.role al nuevo enum
ALTER TABLE public.company_members
  ALTER COLUMN role TYPE public.company_role_v2
  USING CASE
    WHEN role::text = 'owner' THEN 'owner'::public.company_role_v2
    WHEN role::text = 'admin' THEN 'admin'::public.company_role_v2
    WHEN role::text = 'supervisor' THEN 'member'::public.company_role_v2
    WHEN role::text = 'operator' THEN 'member'::public.company_role_v2
    ELSE 'member'::public.company_role_v2
  END;

-- Dropear el viejo enum
DROP TYPE public.company_role CASCADE;

-- Renombrar el nuevo enum al nombre original
ALTER TYPE public.company_role_v2 RENAME TO company_role;
