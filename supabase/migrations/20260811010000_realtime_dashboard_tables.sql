-- Let the client dashboard react to admin actions in real time.
--
-- The dashboard subscribes to `applications` and `campaigns` so that approving
-- or confirming a submission in the admin console shows up without a reload.
-- A subscription to a table that isn't in the supabase_realtime publication
-- fails silently — it connects, and simply never receives an event — so this
-- has to be explicit.
--
-- Guarded: adding a table that's already published raises, so check first.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaigns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
  END IF;
END $$;

COMMIT;
