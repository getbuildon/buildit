ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS setup_draft jsonb;

COMMENT ON COLUMN public.projects.setup_draft IS
  'Estado serializado del wizard de creación mientras status = draft.';
