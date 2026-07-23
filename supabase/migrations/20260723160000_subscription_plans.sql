-- Catálogo de planes y suscripción por proyecto (límites de miembros y clientes)

CREATE TABLE public.subscription_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  name             text NOT NULL,
  surface_max_m2   numeric,
  surface_label    text NOT NULL,
  max_admins       int  NOT NULL CHECK (max_admins > 0),
  max_supervisors  int  NOT NULL CHECK (max_supervisors >= 0),
  max_operators    int  NOT NULL CHECK (max_operators >= 0),
  max_clients      int  NOT NULL CHECK (max_clients >= 0),
  price_label      text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  sort_order       int  NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  plan_id               uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  started_at            timestamptz NOT NULL DEFAULT now(),
  renews_at             timestamptz,
  billing_note          text,
  payment_method_label  text NOT NULL DEFAULT 'Tarjeta de Crédito',
  card_last4            text NOT NULL DEFAULT '1234',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_subscriptions_plan_id_idx ON public.project_subscriptions (plan_id);

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
  sort_order
) VALUES
  (
    'starter-s',
    'Plan Starter S',
    60,
    'Hasta 60m²',
    1,
    2,
    15,
    20,
    '4.800usd / Anual',
    'annual',
    10
  ),
  (
    'growth-m',
    'Plan Growth M',
    2500,
    'Hasta 2.500m²',
    3,
    5,
    50,
    100,
    '1.300usd / Mensual',
    'monthly',
    20
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.project_subscriptions (
  project_id,
  plan_id,
  billing_note,
  renews_at
)
SELECT
  p.id,
  CASE
    WHEN p.total_surface_m2 IS NULL OR p.total_surface_m2 <= 60 THEN starter.id
    ELSE growth.id
  END,
  CASE
    WHEN p.total_surface_m2 IS NULL OR p.total_surface_m2 <= 60 THEN 'Se renueva automáticamente el 01/03/2027'
    ELSE 'Próxima facturación 05/07/2026'
  END,
  CASE
    WHEN p.total_surface_m2 IS NULL OR p.total_surface_m2 <= 60 THEN timestamptz '2027-03-01'
    ELSE timestamptz '2026-07-05'
  END
FROM public.projects p
CROSS JOIN LATERAL (
  SELECT id FROM public.subscription_plans WHERE slug = 'starter-s'
) starter
CROSS JOIN LATERAL (
  SELECT id FROM public.subscription_plans WHERE slug = 'growth-m'
) growth
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_subscriptions ps WHERE ps.project_id = p.id
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_select_authenticated
  ON public.subscription_plans FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY project_subscriptions_select_member
  ON public.project_subscriptions FOR SELECT TO authenticated
  USING (public.user_has_project_access(project_id));

CREATE POLICY project_subscriptions_select_company_admin
  ON public.project_subscriptions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND public.user_company_role(p.company_id) IN ('owner', 'admin')
    )
  );

CREATE POLICY project_subscriptions_insert_company_admin
  ON public.project_subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid()
          OR public.user_company_role(p.company_id) IN ('owner', 'admin')
        )
    )
  );

CREATE POLICY project_subscriptions_update_company_admin
  ON public.project_subscriptions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND public.user_company_role(p.company_id) IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND public.user_company_role(p.company_id) IN ('owner', 'admin')
    )
  );
