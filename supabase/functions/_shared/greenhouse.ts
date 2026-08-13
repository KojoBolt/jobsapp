// =====================================================================
//  Greenhouse Job Board API adapter.
//  Deploy path: supabase/functions/_shared/greenhouse.ts
//
//  WHY THIS IS NOT JUST ANOTHER FETCHER IN sourcing.ts
//  ---------------------------------------------------
//  Every other source is a SEARCH ENGINE: you hand it a keyword and it
//  searches the whole world. Greenhouse is a BOARD: it only answers
//  "what is open at this one company?", addressed by a board token
//  (e.g. `stripe`). There is no global search across Greenhouse boards.
//
//  So the shape is inverted:
//    · the company list is data, not code  → `ats_companies` table
//    · one HTTP call per company, not per query
//    · keyword filtering happens client-side, after the fetch
//
//  Calling it once per (query × page) like the search sources would mean
//  companies × queries × pages requests and would blow the edge function's
//  time budget. Instead every board is fetched ONCE per run into an
//  in-memory cache, and each query filters that cache for free.
//
//  Trade-off worth knowing: Greenhouse is the canonical employer listing,
//  so `url` is the real application form rather than an aggregator
//  redirect — better for auto-apply than anything else in the pool. But
//  postings vanish the instant they're filled, with no tombstone, so
//  anything cached here is only as fresh as CACHE_TTL_MS.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const GH_API = "https://boards-api.greenhouse.io/v1/boards";

/** Hard ceilings. These exist to protect the 150 s edge-function budget —
 *  sourcing must never fail because Greenhouse was slow. */
const MAX_BOARDS        = Number(Deno.env.get("GREENHOUSE_MAX_BOARDS") ?? 20);
const BOARD_TIMEOUT_MS  = 8_000;   // per company
const BOARD_CONCURRENCY = 5;       // companies in flight at once
const PRIME_BUDGET_MS   = 35_000;  // stop priming past this, keep what we have
const CACHE_TTL_MS      = 30 * 60_000;
const PER_QUERY_LIMIT   = 40;      // matches every other source's slice

/** Tokens too generic to narrow a title. "remote" is dropped because
 *  buildQueryPool appends it to roles, and it describes a location. */
const STOPWORDS = new Set(["remote", "job", "jobs", "the", "and", "for", "with", "new"]);

export interface GreenhouseStats {
  boardsRequested: number;
  boardsOk: number;
  boardsMissing: number;   // 404 — token is wrong or the board was deleted
  boardsFailed: number;    // timeout / network / 5xx
  postings: number;        // total cached postings across all boards
  cached: boolean;         // true when this run reused a warm cache
}

let stats: GreenhouseStats = {
  boardsRequested: 0, boardsOk: 0, boardsMissing: 0,
  boardsFailed: 0, postings: 0, cached: false,
};

export function greenhouseStats(): GreenhouseStats {
  return { ...stats };
}

/* ── HTML → text ───────────────────────────────────────────────────────
   Greenhouse returns `content` as ENTITY-ENCODED HTML — the markup itself
   arrives as &lt;p&gt;. So entities must be decoded BEFORE tags are
   stripped, or the strip finds no tags to remove and the letter-writing
   prompt ends up full of raw markup. &amp; is decoded last so "&amp;lt;"
   doesn't turn into a live tag. */
function htmlToText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface CachedPosting {
  job: Record<string, unknown>;
  /** Lower-cased title + location + departments, matched against queries. */
  haystack: string;
}

interface BoardRow {
  board_token: string;
  company_name: string;
  /** Hand-curated in ats_companies. Null is fine and means "we don't know",
   *  which shows initials rather than risking the wrong company's mark. */
  domain: string | null;
}

let cache: { key: string; at: number; postings: CachedPosting[] } | null = null;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Which company boards to crawl for this candidate.
 *
 * Narrowed by the user's Identity Vault industries so a fintech candidate
 * isn't costing us 20 requests to healthcare boards. Falls back to the
 * unfiltered list when the vault has no industries or the tags match
 * nothing — returning zero companies here would silently remove a source.
 */
async function loadBoards(industries: string[]): Promise<BoardRow[]> {
  try {
    const supabase = admin();
    const base = () =>
      supabase
        .from("ats_companies")
        .select("board_token, company_name, domain")
        .eq("provider", "greenhouse")
        .eq("is_active", true);

    if (industries.length) {
      const { data, error } = await base().overlaps("industries", industries).limit(MAX_BOARDS);
      if (error) throw error;
      if (data?.length) return data as BoardRow[];
    }

    const { data, error } = await base().limit(MAX_BOARDS);
    if (error) throw error;
    return (data || []) as BoardRow[];
  } catch (err) {
    // Table missing or unreachable. Greenhouse contributes nothing this run;
    // the other seven sources carry the campaign as they did before.
    console.error("[greenhouse] could not load ats_companies:", err);
    return [];
  }
}

/** A board token that 404s is wrong forever, not transiently — retiring it
 *  stops us burning a request slot on it every single run. Only 404 does
 *  this; a 5xx or timeout is left active to retry. */
function retireBoard(token: string, reason: string) {
  admin()
    .from("ats_companies")
    .update({ is_active: false, last_error: reason, last_fetched_at: new Date().toISOString() })
    .eq("provider", "greenhouse")
    .eq("board_token", token)
    .then(() => {}, (e: unknown) => console.error("[greenhouse] retire failed:", e));
}

async function fetchBoard(row: BoardRow): Promise<CachedPosting[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BOARD_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${GH_API}/${encodeURIComponent(row.board_token)}/jobs?content=true`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );

    if (res.status === 404) {
      stats.boardsMissing++;
      console.warn(`[greenhouse] board not found: ${row.board_token} — retiring`);
      retireBoard(row.board_token, "404 from boards-api");
      return [];
    }

    if (!res.ok) {
      stats.boardsFailed++;
      console.warn(`[greenhouse] ${row.board_token}: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
    stats.boardsOk++;

    return jobs
      .filter((j: any) => j?.title && j?.absolute_url)
      .map((j: any) => {
        const location = j.location?.name || "Not specified";
        const departments = (j.departments || [])
          .map((d: any) => d?.name)
          .filter(Boolean)
          .join(" ");

        return {
          job: {
            title: j.title,
            company: row.company_name,
            url: j.absolute_url,
            // Same 800-char cap as every other source so one Greenhouse
            // posting can't dominate the scoring prompt.
            description: htmlToText(j.content || "").slice(0, 800),
            location,
            source: "greenhouse",
            // Built from the curated domain, never inferred from the name.
            company_logo: row.domain
              ? `https://icons.duckduckgo.com/ip3/${row.domain}.ico`
              : null,
          },
          haystack: `${j.title} ${location} ${departments}`.toLowerCase(),
        };
      });
  } catch (err: any) {
    stats.boardsFailed++;
    if (err?.name === "AbortError") {
      console.warn(`[greenhouse] ${row.board_token} timed out after ${BOARD_TIMEOUT_MS}ms`);
    } else {
      console.error(`[greenhouse] ${row.board_token} threw:`, err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch every board once and hold the postings in memory.
 *
 * Safe to call repeatedly — a warm cache within CACHE_TTL_MS is reused, so
 * a second campaign landing on the same warm function instance costs zero
 * Greenhouse requests. Cache is keyed by industry set because that decides
 * which boards were crawled.
 */
export async function primeGreenhouse(industries: string[]): Promise<void> {
  const key = [...industries].sort().join("|");

  if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL_MS) {
    stats = {
      boardsRequested: 0, boardsOk: 0, boardsMissing: 0, boardsFailed: 0,
      postings: cache.postings.length, cached: true,
    };
    return;
  }

  stats = {
    boardsRequested: 0, boardsOk: 0, boardsMissing: 0,
    boardsFailed: 0, postings: 0, cached: false,
  };

  const boards = await loadBoards(industries);
  stats.boardsRequested = boards.length;
  if (!boards.length) {
    cache = { key, at: Date.now(), postings: [] };
    return;
  }

  const startedAt = Date.now();
  const postings: CachedPosting[] = [];

  for (let i = 0; i < boards.length; i += BOARD_CONCURRENCY) {
    // Budget guard: keep whatever we've collected rather than pushing the
    // whole campaign past the function's wall clock.
    if (Date.now() - startedAt > PRIME_BUDGET_MS) {
      console.warn(
        `[greenhouse] prime budget spent after ${i}/${boards.length} boards — ` +
        `continuing with ${postings.length} posting(s)`,
      );
      break;
    }

    const chunk = boards.slice(i, i + BOARD_CONCURRENCY);
    const results = await Promise.all(chunk.map(fetchBoard));
    for (const r of results) postings.push(...r);
  }

  stats.postings = postings.length;
  cache = { key, at: Date.now(), postings };

  console.log(
    `[greenhouse] primed ${postings.length} posting(s) from ${stats.boardsOk}/${boards.length} board(s) ` +
    `(missing ${stats.boardsMissing}, failed ${stats.boardsFailed})`,
  );
}

/**
 * Keyword filter over the primed cache. No network — call it as often as
 * the query pool needs.
 *
 * Deliberately loose: one significant token matching title, location or
 * department is enough. Greenhouse has no relevance ranking of its own, and
 * the Groq scoring pass downstream is what actually enforces fit. Being
 * strict here would starve the pool; being loose only costs scoring tokens.
 */
export function fromGreenhouse(query: string): any[] {
  if (!cache?.postings.length) return [];

  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  if (!tokens.length) {
    return cache.postings.slice(0, PER_QUERY_LIMIT).map((p) => p.job);
  }

  const out: any[] = [];
  for (const p of cache.postings) {
    if (tokens.some((t) => p.haystack.includes(t))) {
      out.push(p.job);
      if (out.length >= PER_QUERY_LIMIT) break;
    }
  }
  return out;
}
