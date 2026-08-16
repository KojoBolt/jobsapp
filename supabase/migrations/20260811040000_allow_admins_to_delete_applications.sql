-- =====================================================================
--  Let admins delete applications.
--
--  The admin Review Queue's delete silently affected zero rows: Postgres
--  ran the DELETE, RLS filtered every row out, and PostgREST returned an
--  empty array with no error. That is what a missing DELETE policy looks
--  like from the client — not a permission error, just nothing happening.
--
--  Users can already delete their own (the client dashboard does it), so
--  the owner policy exists. Only the admin clause was missing.
--
--  Note: the other applications policies were created outside migrations,
--  so they are not in this repo. This adds one policy and leaves every
--  existing policy untouched.
-- =====================================================================

BEGIN;

-- Idempotent: safe to re-run, and safe if a policy of this name was added
-- by hand in the dashboard.
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;

CREATE POLICY "Admins can delete applications"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;
