-- Registro de descuento e interés en cada movimiento de facturación

ALTER TABLE public.subscription_billing_entries
  ADD COLUMN IF NOT EXISTS discount_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_usd numeric NOT NULL DEFAULT 0;

ALTER TABLE public.subscription_billing_entries
  DROP CONSTRAINT IF EXISTS subscription_billing_entries_discount_nonnegative,
  DROP CONSTRAINT IF EXISTS subscription_billing_entries_interest_nonnegative;

ALTER TABLE public.subscription_billing_entries
  ADD CONSTRAINT subscription_billing_entries_discount_nonnegative
    CHECK (discount_usd >= 0),
  ADD CONSTRAINT subscription_billing_entries_interest_nonnegative
    CHECK (interest_usd >= 0);

COMMENT ON COLUMN public.subscription_billing_entries.discount_usd IS
  'Descuento en USD asociado al movimiento. No altera amount_usd; es registro.';

COMMENT ON COLUMN public.subscription_billing_entries.interest_usd IS
  'Interés en USD asociado al movimiento. No altera amount_usd; es registro.';
