import { classifyJobUrl } from "../../supabase/functions/_shared/ats.ts";
import { findAdapter } from "./adapters/index.ts";
import { config } from "./config.ts";
import { log } from "./log.ts";
import {
  markSubmitted,
  parkForHuman,
  recordClassification,
  recordEvidence,
  releaseForRetry,
  type ClaimedApplication,
} from "./queue.ts";

/**
 * One application, start to finish.
 *
 * Always returns — a thrown error here would abandon the claim and strand the
 * row until the reaper runs, so everything is caught and turned into a
 * release with a reason attached.
 */
export async function processApplication(app: ClaimedApplication): Promise<string> {
  const base = { applicationId: app.id, company: app.company_name };

  if (!app.job_url) {
    await parkForHuman(app.id, "No job URL on the application");
    return "no_url";
  }

  try {
    // Follows one aggregator hop, so an Adzuna link is classified by where it
    // actually lands rather than by Adzuna itself.
    const match = await classifyJobUrl(app.job_url);

    await recordClassification(app.id, {
      ats_provider: match.provider,
      apply_strategy: match.strategy,
      resolved_job_url: match.resolvedUrl,
    });

    log.info("classified", { ...base, provider: match.provider, strategy: match.strategy });

    if (match.strategy === "human") {
      await parkForHuman(app.id, `Manual: ${match.provider} (${match.host})`);
      return "human";
    }

    const adapter = findAdapter(match.provider, match.resolvedUrl);
    if (!adapter) {
      await parkForHuman(app.id, `No adapter yet for ${match.provider}`);
      return "no_adapter";
    }

    const outcome = await adapter.apply({
      application: app,
      resolvedUrl: match.resolvedUrl,
      dryRun: config.dryRun,
    });

    // Before the branch below, so it is recorded whatever the verdict — the
    // screenshot of a form we could not finish is the useful one.
    if (outcome.evidence) await recordEvidence(app.id, outcome.evidence);

    if (outcome.status === "submitted") {
      // Dry run means we filled the form but never pressed Submit — recording
      // it as submitted would be a lie the customer pays for.
      if (config.dryRun) {
        await parkForHuman(app.id, "Dry run: form completed but not submitted");
        return "dry_run";
      }
      const ok = await markSubmitted(app.id);
      return ok ? "submitted" : "conflict";
    }

    // needs_human is a verdict, not a fault — a captcha or an unanswerable
    // question won't resolve itself, so park it. A plain failure may well be
    // transient (network, a slow page), so that one keeps its retry budget.
    if (outcome.status === "needs_human") {
      await parkForHuman(app.id, outcome.reason);
    } else {
      await releaseForRetry(app.id, outcome.reason);
    }
    return outcome.status;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    log.error("processing threw", { ...base, error: reason });
    await releaseForRetry(app.id, `Worker error: ${reason}`);
    return "error";
  }
}
