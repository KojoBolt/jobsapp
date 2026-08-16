/**
 * One-off: follow every aggregator link and record where it actually goes.
 *
 * Most stored job_urls point at Adzuna / Arbeitnow / Remotive, which are
 * doorways rather than job pages. Until each is followed we can't say which
 * ATS hosts the job, and therefore can't say what share of the pipeline is
 * automatable at all.
 *
 * Writes only the three classification columns. Never touches status, claims
 * or anything a user sees.
 *
 *   npm run backfill              # unresolved rows only
 *   npm run backfill -- --limit 10   # try a handful first
 *   npm run backfill -- --all     # re-resolve everything
 *   npm run backfill -- --dry     # report without writing
 */
import { detectAts, resolveFinalUrl } from "../../supabase/functions/_shared/ats.ts";
import { db } from "./queue.ts";
import { log } from "./log.ts";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string): number | null => {
  const i = args.indexOf(`--${name}`);
  const raw = i >= 0 ? args[i + 1] : undefined;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
};

const DRY = flag("dry");
const ALL = flag("all");
const LIMIT = value("limit");

/** Politeness: these all hit a handful of hosts, so keep it gentle. */
const CONCURRENCY = 3;
const DELAY_MS = 250;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Row {
  id: string;
  job_url: string | null;
  company_name: string | null;
}

interface Result {
  provider: string;
  strategy: string;
  hopped: boolean;
  failed: boolean;
}

async function classifyOne(row: Row): Promise<Result | null> {
  if (!row.job_url) return null;

  const first = detectAts(row.job_url);

  // Already a real destination — nothing to follow.
  if (first.strategy !== "resolve") {
    if (!DRY) await write(row.id, first.provider, first.strategy, row.job_url);
    return { provider: first.provider, strategy: first.strategy, hopped: false, failed: false };
  }

  const hop = await resolveFinalUrl(row.job_url);
  const second = detectAts(hop.url);

  // Landed back on an aggregator, or the fetch failed: a person decides.
  const stillAggregator = second.strategy === "resolve";
  const provider = second.provider;
  const strategy = stillAggregator ? "human" : second.strategy;

  if (!DRY) await write(row.id, provider, strategy, hop.url);

  return {
    provider,
    strategy,
    hopped: hop.redirected,
    failed: Boolean(hop.error) || stillAggregator,
  };
}

async function write(id: string, provider: string, strategy: string, url: string) {
  const { error } = await db
    .from("applications")
    .update({ ats_provider: provider, apply_strategy: strategy, resolved_job_url: url })
    .eq("id", id);
  if (error) log.error("write failed", { applicationId: id, error: error.message });
}

async function main() {
  let q = db
    .from("applications")
    .select("id, job_url, company_name")
    .not("job_url", "is", null)
    .order("created_at", { ascending: false });

  if (!ALL) q = q.is("resolved_job_url", null);
  if (LIMIT) q = q.limit(LIMIT);

  const { data, error } = await q;
  if (error) {
    log.error("could not read applications", { error: error.message });
    process.exit(1);
  }

  const rows = (data as Row[]) ?? [];
  log.info("backfill starting", { rows: rows.length, dryRun: DRY, all: ALL });

  if (!rows.length) {
    console.log("\nNothing to do — every row already has a resolved URL. Use --all to redo.\n");
    return;
  }

  const tally = new Map<string, number>();
  let done = 0;
  let failures = 0;
  let hops = 0;

  // Fixed-size pool: workers pull from a shared cursor, so a slow request
  // can't hold up the rest of the batch.
  let cursor = 0;
  const runner = async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      if (!row) break;

      try {
        const r = await classifyOne(row);
        if (r) {
          const key = `${r.provider} → ${r.strategy}`;
          tally.set(key, (tally.get(key) ?? 0) + 1);
          if (r.failed) failures++;
          if (r.hopped) hops++;
        }
      } catch (e) {
        failures++;
        log.warn("classify threw", {
          applicationId: row.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }

      done++;
      if (done % 25 === 0) log.info("progress", { done, total: rows.length });
      await sleep(DELAY_MS);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, runner));

  // ── Summary ────────────────────────────────────────────────────────
  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const width = Math.max(...sorted.map(([k]) => k.length), 20);

  console.log(`\n  ATS mix across ${done} applications${DRY ? "  (dry run — nothing written)" : ""}\n`);
  for (const [key, count] of sorted) {
    const pct = ((count / done) * 100).toFixed(1).padStart(5);
    console.log(`  ${key.padEnd(width)}  ${String(count).padStart(4)}  ${pct}%`);
  }

  const automatable = sorted
    .filter(([k]) => k.includes("→ browser"))
    .reduce((s, [, c]) => s + c, 0);

  console.log(`\n  followed a redirect : ${hops}`);
  console.log(`  unresolved / failed : ${failures}`);
  console.log(`  automatable (browser): ${automatable}  (${((automatable / done) * 100).toFixed(1)}%)\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    log.error("backfill failed", { error: e instanceof Error ? e.message : String(e) });
    process.exit(1);
  });
