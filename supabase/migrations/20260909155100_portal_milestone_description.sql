-- Descripción editable de cada hito del portal de clientes

ALTER TABLE public.project_portal_milestones
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.project_portal_milestones.description IS
  'Texto que se muestra debajo del nombre del hito en el portal de clientes.';
