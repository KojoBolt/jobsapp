-- =====================================================================
--  Don't let the reaper un-park applications that need a human.
--
--  The worker marks rows it can never automate — Reed, LinkedIn, an ATS
--  with no adapter yet — with the sentinel owner 'parked:human'. That
--  keeps them out of claim_applications, which only takes unclaimed rows.
--
--  release_stale_claims previously cleared ANY claim older than the
--  timeout, so it handed parked rows straight back to the queue. The
--  worker then re-claimed them, reached the same verdict, and burnt an
--  attempt — three cycles later the row was stuck at max_attempts and
--  indistinguishable from one that had genuinely failed three times.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.release_stale_claims(p_older_than_minutes INTEGER DEFAULT 15)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released INTEGER;
BEGIN
  UPDATE public.applications
     SET automation_claimed_by = NULL,
         automation_claimed_at = NULL
   WHERE automation_claimed_by IS NOT NULL
     AND automation_claimed_by <> 'parked:human'   -- parked on purpose
     AND status = 'approved'
     AND automation_claimed_at < now() - (p_older_than_minutes || ' minutes')::INTERVAL;

  GET DIAGNOSTICS released = ROW_COUNT;
  RETURN released;
END;
$$;

REVOKE ALL ON FUNCTION public.release_stale_claims(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_stale_claims(INTEGER) TO service_role;

-- Unpark everything and give it a clean budget, so rows parked under the old
-- behaviour (and rows stuck at max_attempts because of it) get reclassified
-- once with the corrected logic.
UPDATE public.applications
   SET automation_claimed_by = NULL,
       automation_claimed_at = NULL,
       automation_attempts   = 0
 WHERE status = 'approved';

NOTIFY pgrst, 'reload schema';

COMMIT;
