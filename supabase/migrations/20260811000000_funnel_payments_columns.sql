-- Columns the payment flows depend on.
--
-- `purpose` and `product_id` are already referenced by initialize-paystack-product
-- and paystack-webhook but were never added by a tracked migration — they exist
-- only if someone applied them by hand. Every statement here is guarded, so this
-- is safe to run whether they are present or not.
--
-- `email_sent_at` is new: it makes the funnel confirmation email idempotent, so a
-- retried Paystack webhook delivery cannot send the same receipt twice.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN purpose TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'product_id'
  ) THEN
    -- UUID to match products.id, which is what initialize-paystack-product
    -- writes here. Funnel orders leave this null and list their slugs in metadata.
    ALTER TABLE public.payments ADD COLUMN product_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Declared in 20260313120000_create_payments_table.sql but absent from the
  -- live table, which is how the funnel insert first failed. Carries the
  -- buyer's name, email and line items through to the receipt email.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- PostgREST caches the schema; without this the new columns stay invisible
-- until the next automatic reload.
NOTIFY pgrst, 'reload schema';

CREATE INDEX IF NOT EXISTS idx_payments_purpose ON public.payments(purpose);

COMMIT;
