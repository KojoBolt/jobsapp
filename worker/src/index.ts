import { config } from "./config.ts";
import { log } from "./log.ts";
import { closeBrowser } from "./browser.ts";
import { adapterCount } from "./adapters/index.ts";
import { processApplication } from "./process.ts";
import { claimBatch, releaseStaleClaims } from "./queue.ts";

let running = true;
let inFlight = false;

async function tick(): Promise<void> {
  inFlight = true;
  try {
    const reclaimed = await releaseStaleClaims();
    if (reclaimed > 0) log.warn("released stale claims", { count: reclaimed });

    const batch = await claimBatch();
    if (!batch.length) return;

    log.info("claimed batch", { count: batch.length });

    // Sequential on purpose. Concurrency arrives with the browser, where it
    // has to be bounded by memory anyway; adding it now would only add ways
    // to be wrong.
    const tally: Record<string, number> = {};
    for (const app of batch) {
      if (!running) break;
      const outcome = await processApplication(app);
      tally[outcome] = (tally[outcome] ?? 0) + 1;
    }

    log.info("batch done", tally);
  } finally {
    inFlight = false;
  }
}

async function main(): Promise<void> {
  log.info("worker starting", {
    workerId: config.workerId,
    dryRun: config.dryRun,
    adapters: adapterCount(),
    pollIntervalMs: config.pollIntervalMs,
  });

  if (adapterCount() === 0) {
    log.warn("no adapters registered — every application will be routed to a human");
  }

  while (running) {
    try {
      await tick();
    } catch (err) {
      // Never let a bad cycle kill the process; Railway would just restart it
      // into the same failure, and a crash loop burns through the restart
      // budget without producing a readable log.
      log.error("tick failed", { error: err instanceof Error ? err.message : String(err) });
    }
    if (!running) break;
    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }

  await closeBrowser();
  log.info("worker stopped");
}

/**
 * Railway sends SIGTERM on every deploy, then SIGKILLs shortly after. Finish
 * the application in hand rather than dying mid-submission with a claim held —
 * a half-finished form is the one state we can't reason about afterwards.
 *
 * Anything not finished in time is still recovered: the claim goes stale and
 * releaseStaleClaims() picks it up. This handler exists to make that the
 * exception rather than the routine outcome of a deploy.
 */
for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    if (!running) process.exit(1); // second signal: go now
    log.info("shutdown signal — finishing current item", { signal: sig });
    running = false;
    const wait = setInterval(() => {
      if (inFlight) return;
      clearInterval(wait);
      // Exiting here skips the close in main(), and an orphaned Chromium
      // holds hundreds of megabytes on a platform that bills for memory.
      void closeBrowser().finally(() => process.exit(0));
    }, 200);
  });
}

main().catch((err) => {
  log.error("fatal", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
