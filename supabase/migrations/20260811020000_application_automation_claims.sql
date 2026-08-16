-- =====================================================================
--  Work-queue plumbing for the automation worker.
--
--  The worker claims `approved` applications, drives the submission, and
--  writes the result back. Two things make that safe:
--
--   1. Claiming is atomic. `FOR UPDATE SKIP LOCKED` means two workers can
--      poll the same instant and never take the same row — the second one
--      walks past locked rows instead of blocking or duplicating.
--   2. Claims expire. A worker that dies mid-run leaves its rows claimed;
--      the reaper hands them back rather than stranding them forever.
--
--  Deliberately NOT adding a 'submitting' status: `applications.status` is
--  a Postgres enum (app_status), and adding a value to an enum is a
--  heavier, harder-to-reverse change than adding nullable columns.
--  Claim state lives in its own columns instead.
-- =====================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='automation_claimed_by') THEN
    ALTER TABLE public.applications ADD COLUMN automation_claimed_by TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='automation_claimed_at') THEN
    ALTER TABLE public.applications ADD COLUMN automation_claimed_at TIMESTAMPTZ;
  END IF;

  -- Attempt counter, so a job that fails forever stops being retried.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='automation_attempts') THEN
    ALTER TABLE public.applications ADD COLUMN automation_attempts INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Why the last attempt failed — surfaced in the admin Submission Queue.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='automation_error') THEN
    ALTER TABLE public.applications ADD COLUMN automation_error TEXT;
  END IF;

  -- Detected ATS + how we intend to apply, filled in by the worker.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='ats_provider') THEN
    ALTER TABLE public.applications ADD COLUMN ats_provider TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='apply_strategy') THEN
    ALTER TABLE public.applications ADD COLUMN apply_strategy TEXT;
  END IF;

  -- The URL the aggregator redirect actually landed on.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='applications'
                   AND column_name='resolved_job_url') THEN
    ALTER TABLE public.applications ADD COLUMN resolved_job_url TEXT;
  END IF;
END $$;

-- Only ever scanned for unclaimed approved rows, so index exactly that.
CREATE INDEX IF NOT EXISTS idx_applications_automation_claim
  ON public.applications (status, automation_claimed_by, created_at);

-- ── Claim ────────────────────────────────────────────────────────────
-- Returns the rows it claimed. Empty result simply means no work.
CREATE OR REPLACE FUNCTION public.claim_applications(
  p_worker_id  TEXT,
  p_limit      INTEGER DEFAULT 5,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS SETOF public.applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.applications a
     SET automation_claimed_by = p_worker_id,
         automation_claimed_at = now(),
         automation_attempts   = COALESCE(a.automation_attempts, 0) + 1
   WHERE a.id IN (
     SELECT c.id
       FROM public.applications c
      WHERE c.status = 'approved'
        AND c.automation_claimed_by IS NULL
        AND COALESCE(c.automation_attempts, 0) < p_max_attempts
      ORDER BY c.created_at
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING a.*;
END;
$$;

-- ── Reaper ───────────────────────────────────────────────────────────
-- Hands back rows whose worker died. Only touches rows still `approved`;
-- anything already moved on is left alone.
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
     AND status = 'approved'
     AND automation_claimed_at < now() - (p_older_than_minutes || ' minutes')::INTERVAL;

  GET DIAGNOSTICS released = ROW_COUNT;
  RETURN released;
END;
$$;

-- Service role only. These bypass RLS by design, so nothing browser-side
-- should ever be able to call them.
REVOKE ALL ON FUNCTION public.claim_applications(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_stale_claims(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_applications(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stale_claims(INTEGER) TO service_role;

COMMIT;
