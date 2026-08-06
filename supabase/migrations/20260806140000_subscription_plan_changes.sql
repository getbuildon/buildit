-- Historial de cambios de plan con prorrateo mid-cycle

CREATE TABLE public.subscription_plan_changes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_subscription_id uuid NOT NULL REFERENCES public.project_subscriptions(id) ON DELETE CASCADE,
  project_id              uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  from_plan_id            uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  to_plan_id              uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  billing_interval        text NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  effective_at            timestamptz NOT NULL DEFAULT now(),
  period_started_at       timestamptz NOT NULL,
  period_ends_at          timestamptz NOT NULL,
  days_remaining          int NOT NULL CHECK (days_remaining >= 0),
  days_in_period          int NOT NULL CHECK (days_in_period > 0),
  from_period_price_usd   numeric,
  to_period_price_usd     numeric,
  credit_usd              numeric NOT NULL DEFAULT 0,
  charge_usd              numeric NOT NULL DEFAULT 0,
  net_amount_usd          numeric NOT NULL DEFAULT 0,
  note                    text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscription_plan_changes_project_id_idx
  ON public.subscription_plan_changes (project_id);

CREATE INDEX subscription_plan_changes_subscription_id_idx
  ON public.subscription_plan_changes (project_subscription_id);

COMMENT ON TABLE public.subscription_plan_changes IS
  'Registro de upgrades/downgrades mid-cycle con prorrateo. net_amount_usd > 0 = cargo al cliente.';

ALTER TABLE public.subscription_plan_changes ENABLE ROW LEVEL SECURITY;
