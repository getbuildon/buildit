-- Ledger de facturación por proyecto (cargos, pagos, ajustes)

CREATE TABLE public.subscription_billing_entries (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_subscription_id uuid REFERENCES public.project_subscriptions(id) ON DELETE SET NULL,
  entry_type              text NOT NULL CHECK (
    entry_type IN ('proration', 'renewal', 'payment', 'credit', 'adjustment')
  ),
  amount_usd              numeric NOT NULL,
  description             text,
  effective_at            timestamptz NOT NULL DEFAULT now(),
  payment_method          text,
  plan_change_id          uuid REFERENCES public.subscription_plan_changes(id) ON DELETE SET NULL,
  created_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_billing_entries_amount_nonzero CHECK (amount_usd <> 0)
);

CREATE INDEX subscription_billing_entries_project_id_idx
  ON public.subscription_billing_entries (project_id);

CREATE INDEX subscription_billing_entries_effective_at_idx
  ON public.subscription_billing_entries (project_id, effective_at DESC);

CREATE UNIQUE INDEX subscription_billing_entries_plan_change_id_unique
  ON public.subscription_billing_entries (plan_change_id)
  WHERE plan_change_id IS NOT NULL;

COMMENT ON TABLE public.subscription_billing_entries IS
  'Movimientos de facturación. amount_usd positivo = cargo al cliente; negativo = pago o crédito.';

COMMENT ON COLUMN public.subscription_billing_entries.amount_usd IS
  'Saldo firmado: positivo aumenta deuda, negativo la reduce.';

-- Backfill de cargos prorrateados ya registrados
INSERT INTO public.subscription_billing_entries (
  project_id,
  project_subscription_id,
  entry_type,
  amount_usd,
  description,
  effective_at,
  plan_change_id
)
SELECT
  spc.project_id,
  spc.project_subscription_id,
  'proration',
  spc.net_amount_usd,
  spc.note,
  spc.effective_at,
  spc.id
FROM public.subscription_plan_changes spc
WHERE spc.net_amount_usd <> 0;

ALTER TABLE public.subscription_billing_entries ENABLE ROW LEVEL SECURITY;
