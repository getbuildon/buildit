-- Tipos de unidad usados en formularios de estructura (Build On)
INSERT INTO public.unit_types (slug, label, sort_order) VALUES
  ('sum', 'SUM', 15),
  ('piscina', 'Piscina', 25),
  ('terraza', 'Terraza', 35),
  ('estacionamiento', 'Estacionamiento', 45),
  ('otro', 'Otro', 99)
ON CONFLICT (slug) DO NOTHING;
