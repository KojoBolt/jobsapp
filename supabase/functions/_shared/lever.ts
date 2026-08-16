// =====================================================================
//  Lever Postings API adapter.
//  Deploy path: supabase/functions/_shared/lever.ts
//
//  Same shape as greenhouse.ts, and for the same reason: Lever is a BOARD,
//  not a search engine. It only answers "what is open at this company?",
//  addressed by a site slug (e.g. `netflix`). So the company list is data
//  (`ats_companies`, provider = 'lever'), every board is fetched ONCE per
//  run into memory, and each query filters that cache for free.
//
//  Kept as its own module rather than folded into greenhouse.ts so a Lever
//  outage can never take Greenhouse down with it — the two prime and fail
//  independently, exactly as the seven search sources do.
//
//  Response differences worth knowing vs Greenhouse:
//    · the payload is a BARE ARRAY, not { jobs: [...] }
//    · the title field is `text`, not `title`
//    · `descriptionPlain` is already plain text — no entity decoding needed
//    · location/department/team live under `categories`
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const LEVER_API = "https://api.lever.co/v0/postings";

/** Hard ceilings, mirroring greenhouse.ts — sourcing must never fail
 *  because Lever was slow. */
const MAX_BOARDS        = Number(Deno.env.get("LEVER_MAX_BOARDS") ?? 20);
const BOARD_TIMEOUT_MS  = 8_000;
const BOARD_CONCURRENCY = 5;
const PRIME_BUDGET_MS   = 25_000;
const CACHE_TTL_MS      = 30 * 60_000;
const PER_QUERY_LIMIT   = 40;

const STOPWORDS = new Set(["remote", "job", "jobs", "the", "and", "for", "with", "new"]);

export interface LeverStats {
  boardsRequested: number;
  boardsOk: number;
  boardsMissing: number;
  boardsFailed: number;
  postings: number;
  cached: boolean;
}

let stats: LeverStats = {
  boardsRequested: 0, boardsOk: 0, boardsMissing: 0,
  boardsFailed: 0, postings: 0, cached: false,
};

export function leverStats(): LeverStats {
  return { ...stats };
}

/** Fallback only — `descriptionPlain` is normally present and already clean. */
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
  haystack: string;
}

interface BoardRow {
  board_token: string;
  company_name: string;
  domain: string | null;
}

let cache: { key: string; at: number; postings: CachedPosting[] } | null = null;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function loadBoards(industries: string[]): Promise<BoardRow[]> {
  try {
    const supabase = admin();
    const base = () =>
      supabase
        .from("ats_companies")
        .select("board_token, company_name, domain")
        .eq("provider", "lever")
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
    console.error("[lever] could not load ats_companies:", err);
    return [];
  }
}

/** A slug that 404s is wrong forever, not transiently. Only 404 retires. */
function retireBoard(token: string, reason: string) {
  admin()
    .from("ats_companies")
    .update({ is_active: false, last_error: reason, last_fetched_at: new Date().toISOString() })
    .eq("provider", "lever")
    .eq("board_token", token)
    .then(() => {}, (e: unknown) => console.error("[lever] retire failed:", e));
}

async function fetchBoard(row: BoardRow): Promise<CachedPosting[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), BOARD_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${LEVER_API}/${encodeURIComponent(row.board_token)}?mode=json`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );

    if (res.status === 404) {
      stats.boardsMissing++;
      console.warn(`[lever] board not found: ${row.board_token} — retiring`);
      retireBoard(row.board_token, "404 from lever postings api");
      return [];
    }

    if (!res.ok) {
      stats.boardsFailed++;
      console.warn(`[lever] ${row.board_token}: HTTP ${res.status}`);
      return [];
    }

    // Lever returns the postings array at the top level.
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    stats.boardsOk++;

    return jobs
      .filter((j: any) => j?.text && j?.hostedUrl)
      .map((j: any) => {
        const c = j.categories || {};
        const location = c.location || j.workplaceType || "Not specified";
        const department = [c.department, c.team].filter(Boolean).join(" ");

        return {
          job: {
            title: j.text,
            company: row.company_name,
            // hostedUrl is the public posting; the form is one click on from
            // there (applyUrl). Kept consistent with Greenhouse, where the
            // stored URL is likewise the posting page.
            url: j.hostedUrl,
            description: (j.descriptionPlain || htmlToText(j.description || "")).slice(0, 800),
            location,
            source: "lever",
            company_logo: row.domain
              ? `https://icons.duckduckgo.com/ip3/${row.domain}.ico`
              : null,
          },
          haystack: `${j.text} ${location} ${department} ${c.commitment || ""}`.toLowerCase(),
        };
      });
  } catch (err: any) {
    stats.boardsFailed++;
    if (err?.name === "AbortError") {
      console.warn(`[lever] ${row.board_token} timed out after ${BOARD_TIMEOUT_MS}ms`);
    } else {
      console.error(`[lever] ${row.board_token} threw:`, err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch every Lever board once and hold the postings in memory. */
export async function primeLever(industries: string[]): Promise<void> {
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
    if (Date.now() - startedAt > PRIME_BUDGET_MS) {
      console.warn(
        `[lever] prime budget spent after ${i}/${boards.length} boards — ` +
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
    `[lever] primed ${postings.length} posting(s) from ${stats.boardsOk}/${boards.length} board(s) ` +
    `(missing ${stats.boardsMissing}, failed ${stats.boardsFailed})`,
  );
}

/** Keyword filter over the primed cache. No network. */
export function fromLever(query: string): any[] {
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
