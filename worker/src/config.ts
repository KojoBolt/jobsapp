import "dotenv/config";
import { hostname } from "node:os";

/** Fail loudly at boot rather than with a confusing error mid-run. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. Copy worker/.env.example to worker/.env for local runs, ` +
        `or set it in the Railway dashboard under the service's Variables tab.`,
    );
  }
  return v;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  supabaseUrl: required("SUPABASE_URL"),
  // Service role: the worker acts on every user's rows and calls RPCs that
  // bypass RLS. This key must never reach the browser.
  supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),

  /**
   * Identifies which worker holds a claim. Handy when several run at once.
   * Railway injects RAILWAY_REPLICA_ID per replica, which is what makes a
   * stuck claim traceable to a specific container rather than just "a worker".
   */
  workerId:
    process.env.WORKER_ID ||
    process.env.RAILWAY_REPLICA_ID ||
    `worker-${hostname()}-${process.pid}`,

  pollIntervalMs: num("POLL_INTERVAL_MS", 15_000),
  batchSize: num("BATCH_SIZE", 5),
  maxAttempts: num("MAX_ATTEMPTS", 3),
  staleClaimMinutes: num("STALE_CLAIM_MINUTES", 15),

  /**
   * When true (the default) the worker classifies and reports but never
   * submits anything. Turning this off is the moment real applications start
   * going out, so it is opt-in, explicitly, via env.
   */
  dryRun: process.env.DRY_RUN !== "false",

  // ── Browser ───────────────────────────────────────────────────────────
  /** Per-action ceiling: clicking, typing, waiting for one element. */
  actionTimeoutMs: num("ACTION_TIMEOUT_MS", 15_000),
  /** Page loads get longer — career sites are not fast. */
  navigationTimeoutMs: num("NAVIGATION_TIMEOUT_MS", 45_000),

  /**
   * A current, ordinary desktop Chrome string. Playwright's default announces
   * HeadlessChrome, which some boards refuse outright — and a refusal we
   * caused ourselves is indistinguishable in the logs from one we didn't.
   */
  userAgent: process.env.USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",

  /** Where screenshots of completed forms go. */
  evidenceBucket: process.env.EVIDENCE_BUCKET || "application-evidence",
} as const;
