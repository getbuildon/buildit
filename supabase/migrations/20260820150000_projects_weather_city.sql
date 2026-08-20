ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS weather_city text;
