-- Precios mensual y anual por plan (catálogo) + intervalo elegido por suscripción

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_price_usd numeric,
  ADD COLUMN IF NOT EXISTS annual_monthly_price_usd numeric;

ALTER TABLE public.subscription_plans
  ALTER COLUMN billing_interval DROP NOT NULL;

COMMENT ON COLUMN public.subscription_plans.monthly_price_usd IS
  'Precio USD facturado mes a mes.';
COMMENT ON COLUMN public.subscription_plans.annual_monthly_price_usd IS
  'Precio USD mensual equivalente cuando se factura anualmente (total anual = × 12).';
COMMENT ON COLUMN public.subscription_plans.billing_interval IS
  'Legacy / display. La elección mensual o anual vive en project_subscriptions.billing_interval.';

ALTER TABLE public.project_subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval text;

UPDATE public.project_subscriptions
SET billing_interval = 'monthly'
WHERE billing_interval IS NULL;

ALTER TABLE public.project_subscriptions
  ALTER COLUMN billing_interval SET DEFAULT 'monthly';

ALTER TABLE public.project_subscriptions
  DROP CONSTRAINT IF EXISTS project_subscriptions_billing_interval_check;

ALTER TABLE public.project_subscriptions
  ADD CONSTRAINT project_subscriptions_billing_interval_check
  CHECK (billing_interval IN ('monthly', 'annual'));

ALTER TABLE public.project_subscriptions
  ALTER COLUMN billing_interval SET NOT NULL;

-- Compacto
UPDATE public.subscription_plans SET
  monthly_price_usd = 400,
  annual_monthly_price_usd = 320,
  price_label = 'Desde $320 USD / mes (anual)',
  billing_interval = NULL
WHERE slug = 'compacto-60';

UPDATE public.subscription_plans SET
  monthly_price_usd = 600,
  annual_monthly_price_usd = 480,
  price_label = 'Desde $480 USD / mes (anual)',
  billing_interval = NULL
WHERE slug = 'compacto-120';

UPDATE public.subscription_plans SET
  monthly_price_usd = 800,
  annual_monthly_price_usd = 640,
  price_label = 'Desde $640 USD / mes (anual)',
  billing_interval = NULL
WHERE slug = 'compacto-300';

-- Gran Escala
UPDATE public.subscription_plans SET
  monthly_price_usd = 1000,
  annual_monthly_price_usd = 800,
  price_label = 'Desde $800 USD / mes (anual)',
  billing_interval = NULL
WHERE slug = 'gran-escala-1000';

UPDATE public.subscription_plans SET
  monthly_price_usd = 1300,
  annual_monthly_price_usd = 1040,
  price_label = 'Desde $1.040 USD / mes (anual)',
  billing_interval = NULL
WHERE slug = 'gran-escala-2500';

UPDATE public.subscription_plans SET
  monthly_price_usd = 1600,
  annual_monthly_price_usd = 1280,
  price_label = 'Desde $1.280 USD / mes (anual)',
  billing_interval = NULL
WHERE slug = 'gran-escala-5000';

-- Multiobra (cotización)
UPDATE public.subscription_plans SET
  monthly_price_usd = NULL,
  annual_monthly_price_usd = NULL,
  price_label = 'A cotizar',
  billing_interval = NULL
WHERE slug = 'multiobra';
