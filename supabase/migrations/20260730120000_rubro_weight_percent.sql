-- Peso de incidencia del rubro en el avance total de obra (null = automático)
ALTER TABLE public.rubros
  ADD COLUMN IF NOT EXISTS weight_percent numeric(5, 2);

COMMENT ON COLUMN public.rubros.weight_percent IS
  'Porcentaje de incidencia del rubro en el avance total de obra. NULL = distribución automática del resto hasta 100%.';
