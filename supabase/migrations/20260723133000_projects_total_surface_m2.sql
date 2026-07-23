ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS total_surface_m2 numeric(12, 2);
