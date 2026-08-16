import { createClient } from "@supabase/supabase-js";
import { config } from "./config.ts";
import { log } from "./log.ts";

export const db = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface ClaimedApplication {
  id: string;
  user_id: string | null;
  company_name: string | null;
  job_title: string | null;
  job_url: string | null;
  status: string;
  resume_id: string | null;
  campaign_id: string | null;
  automation_attempts: number | null;
  [key: string]: unknown;
}

/**
 * Take up to `batchSize` approved applications.
 *
 * The atomicity lives in the SQL function (FOR UPDATE SKIP LOCKED), not here
 * — a read-then-write from the client would let two workers grab the same row
 * and apply twice.
 */
export async function claimBatch(): Promise<ClaimedApplication[]> {
  const { data, error } = await db.rpc("claim_applications", {
    p_worker_id: config.workerId,
    p_limit: config.batchSize,
    p_max_attempts: config.maxAttempts,
  });

  if (error) {
    log.error("claim failed", { error: error.message });
    return [];
  }
  return (data as ClaimedApplication[]) ?? [];
}

/** Hand back rows whose worker died mid-run. */
export async function releaseStaleClaims(): Promise<number> {
  const { data, error } = await db.rpc("release_stale_claims", {
    p_older_than_minutes: config.staleClaimMinutes,
  });
  if (error) {
    log.error("stale claim release failed", { error: error.message });
    return 0;
  }
  return (data as number) ?? 0;
}

/**
 * Point the row at the screenshot taken while working it.
 *
 * Separate from the status writes because it must survive every outcome:
 * the screenshot of a form we could NOT complete is the one worth looking at.
 */
export async function recordEvidence(id: string, key: string): Promise<void> {
  const { error } = await db.from("applications").update({ automation_evidence: key }).eq("id", id);
  if (error) log.warn("evidence path write failed", { applicationId: id, error: error.message });
}

/** Record what we learned about a job without changing its status. */
export async function recordClassification(
  id: string,
  fields: { ats_provider: string; apply_strategy: string; resolved_job_url: string },
): Promise<void> {
  const { error } = await db.from("applications").update(fields).eq("id", id);
  if (error) log.error("classification write failed", { applicationId: id, error: error.message });
}

/**
 * Sentinel owner for rows automation can't help with. It is deliberately not
 * NULL: claim_applications only picks up unclaimed rows, so parking a row this
 * way removes it from the queue without touching its status.
 */
export const PARKED = "parked:human";

/**
 * Park a row for human handling and stop the worker reconsidering it.
 *
 * Clearing the claim instead would put the row straight back in the queue, so
 * a job we can *never* automate (Reed, LinkedIn, an ATS with no adapter) gets
 * re-claimed every cycle until it burns through max_attempts. That both wastes
 * cycles and makes the attempt counter meaningless — three failed submissions
 * and three "not automatable" verdicts would look identical.
 *
 * Attempts reset to 0 so the counter only ever means "real attempts that
 * failed", and an unparked row gets a clean budget once an adapter exists.
 */
export async function parkForHuman(id: string, reason: string): Promise<void> {
  const { error } = await db
    .from("applications")
    .update({
      automation_claimed_by: PARKED,
      automation_claimed_at: new Date().toISOString(),
      automation_attempts: 0,
      automation_error: reason,
    })
    .eq("id", id);

  if (error) log.error("park failed", { applicationId: id, error: error.message });
}

/**
 * Hand a row back for another try — used for transient failures (network,
 * timeout) where retrying is legitimate. Keeps the attempt already counted.
 */
export async function releaseForRetry(id: string, reason: string): Promise<void> {
  const { error } = await db
    .from("applications")
    .update({
      automation_claimed_by: null,
      automation_claimed_at: null,
      automation_error: reason,
    })
    .eq("id", id);

  if (error) log.error("release failed", { applicationId: id, error: error.message });
}

/**
 * Mark an application successfully submitted.
 *
 * Guarded on `status = 'approved'` so a row that changed underneath us — an
 * admin submitting it by hand while we worked — is never overwritten. A zero
 * row count here is a real signal, not a no-op.
 */
export async function markSubmitted(id: string): Promise<boolean> {
  const { data, error } = await db
    .from("applications")
    .update({
      status: "submitted",
      automation_claimed_by: null,
      automation_claimed_at: null,
      automation_error: null,
    })
    .eq("id", id)
    .eq("status", "approved")
    .select("id");

  if (error) {
    log.error("submit write failed", { applicationId: id, error: error.message });
    return false;
  }
  if (!data?.length) {
    log.warn("row changed under us — not marking submitted", { applicationId: id });
    return false;
  }
  return true;
}
