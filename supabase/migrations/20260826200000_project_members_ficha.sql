-- Ficha del tenant en la membresía de obra.
-- Nombre/apellido/teléfono de Equipo y Clientes viven acá, no en profiles.

ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.project_members.first_name IS
  'Ficha de la obra: nombre de esta persona en el proyecto.';
COMMENT ON COLUMN public.project_members.last_name IS
  'Ficha de la obra: apellido de esta persona en el proyecto.';
COMMENT ON COLUMN public.project_members.phone IS
  'Ficha de la obra: teléfono de contacto en el proyecto.';

-- Snapshot del estado mezclado actual para no dejar listas vacías.
UPDATE public.project_members pm
SET
  first_name = COALESCE(NULLIF(BTRIM(p.first_name), ''), pm.first_name),
  last_name = COALESCE(NULLIF(BTRIM(p.last_name), ''), pm.last_name),
  phone = COALESCE(NULLIF(BTRIM(p.phone), ''), pm.phone)
FROM public.profiles p
WHERE p.id = pm.user_id;
