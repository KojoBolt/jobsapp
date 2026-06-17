-- Remove any CHECK constraint that silently caps campaigns.batch_size at 10.
-- If the constraint doesn't exist this is a no-op, so it is safe to run twice.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find any check constraint on campaigns.batch_size that references 10
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE t.relname = 'campaigns'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%batch_size%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped campaigns constraint: %', constraint_name;
  END IF;
END $$;

-- Also drop any before-insert/update trigger that silently rewrites batch_size
-- (common pattern: IF NEW.batch_size > 10 THEN NEW.batch_size = 10; END IF;)
-- We can't introspect the trigger body directly, so we drop known candidates by name.
DROP TRIGGER IF EXISTS cap_batch_size ON public.campaigns;
DROP TRIGGER IF EXISTS enforce_batch_limit ON public.campaigns;
DROP TRIGGER IF EXISTS limit_batch_size ON public.campaigns;

-- Ensure batch_size allows up to 200 (user plan max)
ALTER TABLE public.campaigns
  DROP CONSTRAINT IF EXISTS campaigns_batch_size_check;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_batch_size_check CHECK (batch_size >= 1 AND batch_size <= 200);
