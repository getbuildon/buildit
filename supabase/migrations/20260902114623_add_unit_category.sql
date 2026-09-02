ALTER TABLE public.project_units
  ADD COLUMN IF NOT EXISTS unit_category text;

UPDATE public.project_units
SET unit_category = CASE
  WHEN unit_type IN (
    'Lobby',
    'Piscina',
    'Patio',
    'Terraza',
    'Ascensor',
    'Palier',
    'Porche'
  ) THEN 'area-comun'
  ELSE 'unidad-funcional'
END
WHERE unit_category IS NULL;

ALTER TABLE public.project_units
  ALTER COLUMN unit_category SET DEFAULT 'unidad-funcional';

ALTER TABLE public.project_units
  ALTER COLUMN unit_category SET NOT NULL;

ALTER TABLE public.project_units
  DROP CONSTRAINT IF EXISTS project_units_unit_category_check;

ALTER TABLE public.project_units
  ADD CONSTRAINT project_units_unit_category_check
  CHECK (unit_category IN ('unidad-funcional', 'area-comun'));

CREATE INDEX IF NOT EXISTS project_units_project_category_idx
  ON public.project_units (project_id, unit_category);
