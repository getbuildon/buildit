-- Planes alineados con la landing (Compacto, Gran Escala, Multiobra)
-- Cada tier de superficie es un plan independiente.

INSERT INTO public.subscription_plans (
  slug,
  name,
  surface_max_m2,
  surface_label,
  max_admins,
  max_supervisors,
  max_operators,
  max_clients,
  price_label,
  billing_interval,
  sort_order,
  is_active
) VALUES
  (
    'compacto-60',
    'Compacto',
    60,
    'Superficie hasta 60 m²',
    1,
    2,
    15,
    20,
    '$400 USD / Mensual',
    'monthly',
    10,
    true
  ),
  (
    'compacto-120',
    'Compacto',
    120,
    'Superficie hasta 120 m²',
    1,
    2,
    15,
    20,
    '$600 USD / Mensual',
    'monthly',
    11,
    true
  ),
  (
    'compacto-300',
    'Compacto',
    300,
    'Superficie hasta 300 m²',
    1,
    2,
    15,
    20,
    '$800 USD / Mensual',
    'monthly',
    12,
    true
  ),
  (
    'gran-escala-1000',
    'Gran Escala',
    1000,
    'Superficie hasta 1.000 m²',
    3,
    5,
    50,
    100,
    '$1.000 USD / Mensual',
    'monthly',
    20,
    true
  ),
  (
    'gran-escala-2500',
    'Gran Escala',
    2500,
    'Superficie hasta 2.500 m²',
    3,
    5,
    50,
    100,
    '$1.300 USD / Mensual',
    'monthly',
    21,
    true
  ),
  (
    'gran-escala-5000',
    'Gran Escala',
    5000,
    'Superficie hasta 5.000 m²',
    3,
    5,
    50,
    100,
    '$1.600 USD / Mensual',
    'monthly',
    22,
    true
  ),
  (
    'multiobra',
    'Multiobra',
    NULL,
    'Superficie +5.000 m²',
    9999,
    9999,
    9999,
    9999,
    'A cotizar',
    'monthly',
    30,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  surface_max_m2 = EXCLUDED.surface_max_m2,
  surface_label = EXCLUDED.surface_label,
  max_admins = EXCLUDED.max_admins,
  max_supervisors = EXCLUDED.max_supervisors,
  max_operators = EXCLUDED.max_operators,
  max_clients = EXCLUDED.max_clients,
  price_label = EXCLUDED.price_label,
  billing_interval = EXCLUDED.billing_interval,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- Migrar suscripciones existentes al tier equivalente más cercano
UPDATE public.project_subscriptions ps
SET plan_id = mapped.plan_id
FROM public.projects p
JOIN LATERAL (
  SELECT sp.id AS plan_id
  FROM public.subscription_plans sp
  WHERE sp.slug = CASE
    WHEN p.total_surface_m2 IS NULL OR p.total_surface_m2 <= 60 THEN 'compacto-60'
    WHEN p.total_surface_m2 <= 120 THEN 'compacto-120'
    WHEN p.total_surface_m2 <= 300 THEN 'compacto-300'
    WHEN p.total_surface_m2 <= 1000 THEN 'gran-escala-1000'
    WHEN p.total_surface_m2 <= 2500 THEN 'gran-escala-2500'
    WHEN p.total_surface_m2 <= 5000 THEN 'gran-escala-5000'
    ELSE 'multiobra'
  END
) mapped ON true
WHERE ps.project_id = p.id
  AND ps.plan_id IN (
    SELECT id
    FROM public.subscription_plans
    WHERE slug IN ('starter-s', 'growth-m')
  );

-- Retirar planes legacy del catálogo activo
UPDATE public.subscription_plans
SET is_active = false
WHERE slug IN ('starter-s', 'growth-m');
