-- Admin Campaign Monitor showed "No campaigns yet" while campaigns were running.
--
-- Cause: campaigns was the only table whose SELECT policy lacked the admin
-- clause its sibling tables already carry —
--
--   applications  (auth.uid() = user_id) OR is_admin()   <- admins see all
--   profiles      true                                    <- admins see all
--   campaigns     (auth.uid() = user_id)                  <- admins filtered out
--
-- RLS filtering is silent: Postgres returns an empty set, not an error, so the
-- admin UI could not tell "no campaigns exist" from "you may not see them".
--
-- This mirrors the existing applications policy exactly. is_admin() already
-- exists and is already used by that policy, so nothing new is introduced.

BEGIN;

DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;

CREATE POLICY "Clients view own campaigns, admins view all"
ON public.campaigns
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id)
  OR is_admin()
);

COMMIT;
