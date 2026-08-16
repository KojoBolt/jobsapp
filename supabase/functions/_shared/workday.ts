// =====================================================================
//  Workday career-site adapter.
//  Deploy path: supabase/functions/_shared/workday.ts
//
//  Workday career sites are React apps that call a public JSON endpoint
//  underneath (`/wday/cxs/...`). No key, no auth — `userAuthenticated` comes
//  back false. It is the same data the public careers page shows the public.
//
//  WHY THIS IS SHAPED DIFFERENTLY TO greenhouse.ts / lever.ts
//  ----------------------------------------------------------
//  Those two hand back every posting, with its description, in ONE call. So
//  they prime the whole board into memory and filter it for free. Workday
//  can't be used that way:
//
//    · the list endpoint caps at limit=20 — asking for 50 returns zero — so
//      a 360-job board would be 18 requests just for titles, and
//    · the list carries no description; that needs a second call per job.
//
//  Priming a fixed window is worse than it sounds. Workday returns jobs in
//  its own order, not by relevance: on a 360-job board, the first 60 titles
//  contained no engineering roles at all, so a client-side filter for
//  "frontend engineer" found nothing while the board really had eight.
//
//  But Workday will do the searching itself — the same endpoint takes
//  `searchText`. So the shape here is:
//
//    prime() → no HTTP at all. Just loads which boards to use.
//    from()  → ASYNC. Asks each board for THIS query, then fetches
//              descriptions only for the results, under per-run budgets.
//
//  Requests therefore scale with what we're actually looking for.
//
//  BOARD TOKEN FORMAT — "tenant/datacentre/site", e.g.
//    transperfect/wd5/transperfect
//  from https://transperfect.wd5.myworkdayjobs.com/en-US/transperfect/job/...
//  Site defaults to tenant when omitted; datacentre defaults to wd1.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const MAX_BOARDS   = Number(Deno.env.get("WORKDAY_MAX_BOARDS") ?? 12);
const SEARCH_LIMIT = 10;   // results per board per query (endpoint caps at 20)
const PER_QUERY_LIMIT = 12; // across all boards, before detail fetches

/** Whole-run ceilings. Sourcing must never fail because Workday was slow. */
const MAX_SEARCHES_PER_RUN = Number(Deno.env.get("WORKDAY_MAX_SEARCHES") ?? 48);
const MAX_DETAILS_PER_RUN  = Number(Deno.env.get("WORKDAY_MAX_DETAILS") ?? 40);

const TIMEOUT_MS         = 8_000;
const SEARCH_CONCURRENCY = 4;
const DETAIL_CONCURRENCY = 5;
const CACHE_TTL_MS       = 30 * 60_000;

/** Tenant/site/datacentre go straight into a hostname and path, so anything
 *  outside this set is rejected rather than escaped. */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

export interface WorkdayStats {
  boardsRequested: number;
  boardsOk: number;        // boards that answered at least one search
  boardsMissing: number;   // 404 — tenant/site wrong, board retired
  boardsFailed: number;
  postings: number;        // jobs returned to sourcing this run
  searches: number;
  detailsFetched: number;
  detailsDropped: number;  // closed (canApply false) or blank description
  overBudget: number;      // matches we declined to fetch
  cached: boolean;
}

let stats: WorkdayStats = {
  boardsRequested: 0, boardsOk: 0, boardsMissing: 0, boardsFailed: 0,
  postings: 0, searches: 0, detailsFetched: 0, detailsDropped: 0,
  overBudget: 0, cached: false,
};

let searchBudget = MAX_SEARCHES_PER_RUN;
let detailBudget = MAX_DETAILS_PER_RUN;

export function workdayStats(): WorkdayStats {
  return { ...stats };
}

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

interface Board {
  tenant: string;
  dc: string;
  site: string;
  company_name: string;
  domain: string | null;
  board_token: string;
}

interface Hit {
  board: Board;
  title: string;
  externalPath: string;
  location: string;
}

let cache: { key: string; at: number; boards: Board[] } | null = null;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** "tenant/dc/site" → Board. Returns null for anything malformed. */
function parseToken(token: string, company_name: string, domain: string | null): Board | null {
  const parts = String(token).split("/").map((s) => s.trim()).filter(Boolean);
  const tenant = parts[0];
  const dc = parts[1] || "wd1";
  const site = parts[2] || tenant;

  if (!tenant || ![tenant, dc, site].every((s) => SAFE_SEGMENT.test(s))) {
    console.warn(`[workday] skipping malformed board_token: ${token}`);
    return null;
  }
  return { tenant, dc, site, company_name, domain, board_token: token };
}

const cxsBase = (b: Board) =>
  `https://${b.tenant}.${b.dc}.myworkdayjobs.com/wday/cxs/${b.tenant}/${b.site}`;

/** Public posting URL, matching the `externalUrl` Workday returns itself. */
const publicUrl = (b: Board, externalPath: string) =>
  `https://${b.tenant}.${b.dc}.myworkdayjobs.com/${b.site}${externalPath}`;

async function loadBoards(industries: string[]): Promise<Board[]> {
  try {
    const supabase = admin();
    const base = () =>
      supabase
        .from("ats_companies")
        .select("board_token, company_name, domain")
        .eq("provider", "workday")
        .eq("is_active", true);

    let rows: any[] = [];
    if (industries.length) {
      const { data, error } = await base().overlaps("industries", industries).limit(MAX_BOARDS);
      if (error) throw error;
      rows = data || [];
    }
    if (!rows.length) {
      const { data, error } = await base().limit(MAX_BOARDS);
      if (error) throw error;
      rows = data || [];
    }

    return rows
      .map((r) => parseToken(r.board_token, r.company_name, r.domain))
      .filter((b): b is Board => b !== null);
  } catch (err) {
    console.error("[workday] could not load ats_companies:", err);
    return [];
  }
}

function retireBoard(token: string, reason: string) {
  admin()
    .from("ats_companies")
    .update({ is_active: false, last_error: reason, last_fetched_at: new Date().toISOString() })
    .eq("provider", "workday")
    .eq("board_token", token)
    .then(() => {}, (e: unknown) => console.error("[workday] retire failed:", e));
}

/**
 * Load which boards to query. No HTTP — unlike the other two board sources,
 * nothing is fetched until a query arrives.
 */
export async function primeWorkday(industries: string[]): Promise<void> {
  const key = [...industries].sort().join("|");

  searchBudget = MAX_SEARCHES_PER_RUN;
  detailBudget = MAX_DETAILS_PER_RUN;
  stats = {
    boardsRequested: 0, boardsOk: 0, boardsMissing: 0, boardsFailed: 0,
    postings: 0, searches: 0, detailsFetched: 0, detailsDropped: 0,
    overBudget: 0, cached: false,
  };

  if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL_MS) {
    stats.boardsRequested = cache.boards.length;
    stats.cached = true;
    return;
  }

  const boards = await loadBoards(industries);
  cache = { key, at: Date.now(), boards };
  stats.boardsRequested = boards.length;
}

/** Ask one board for one query. Workday does the matching. */
async function searchBoard(b: Board, query: string): Promise<Hit[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${cxsBase(b)}/jobs`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        appliedFacets: {},
        limit: SEARCH_LIMIT,
        offset: 0,
        searchText: query,
      }),
    });

    if (res.status === 404) {
      stats.boardsMissing++;
      console.warn(`[workday] board not found: ${b.board_token} — retiring`);
      retireBoard(b.board_token, "404 from workday cxs");
      return [];
    }
    if (!res.ok) {
      stats.boardsFailed++;
      console.warn(`[workday] ${b.board_token}: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const postings = Array.isArray(data?.jobPostings) ? data.jobPostings : [];
    stats.boardsOk++;

    return postings
      .filter((j: any) => j?.title && j?.externalPath)
      .map((j: any) => ({
        board: b,
        title: j.title,
        externalPath: j.externalPath,
        location: j.locationsText || "Not specified",
      }));
  } catch (err: any) {
    stats.boardsFailed++;
    if (err?.name === "AbortError") {
      console.warn(`[workday] ${b.board_token} timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error(`[workday] ${b.board_token} threw:`, err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch one job's description.
 *
 * Also honours `canApply`: Workday keeps closed requisitions addressable, and
 * applying to one burns a credit for nothing. Returns null when the job can't
 * be applied to, has no description, or the call fails — the caller drops it
 * rather than shipping a posting that would produce a hollow cover letter.
 */
async function fetchDetail(h: Hit): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${cxsBase(h.board)}${h.externalPath}`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const info = (await res.json())?.jobPostingInfo;
    if (!info || info.canApply === false) return null;

    const description = htmlToText(info.jobDescription || "").slice(0, 800);
    if (!description) return null;

    return {
      title: info.title || h.title,
      company: h.board.company_name,
      url: info.externalUrl || publicUrl(h.board, h.externalPath),
      description,
      location: info.location || h.location,
      source: "workday",
      company_logo: h.board.domain
        ? `https://icons.duckduckgo.com/ip3/${h.board.domain}.ico`
        : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Search every configured board for this query, then fetch descriptions for
 * the results.
 *
 * ASYNC, unlike the Greenhouse and Lever equivalents — all the network cost
 * lives here so it tracks what we're looking for rather than what exists.
 */
export async function fromWorkday(query: string): Promise<any[]> {
  const boards = cache?.boards ?? [];
  if (!boards.length || !query.trim()) return [];

  // ── Search ──────────────────────────────────────────────────────────
  const affordableBoards = Math.min(boards.length, searchBudget);
  if (affordableBoards <= 0) return [];

  const hits: Hit[] = [];
  const toSearch = boards.slice(0, affordableBoards);
  searchBudget -= toSearch.length;
  stats.searches += toSearch.length;

  for (let i = 0; i < toSearch.length; i += SEARCH_CONCURRENCY) {
    const chunk = toSearch.slice(i, i + SEARCH_CONCURRENCY);
    const results = await Promise.all(chunk.map((b) => searchBoard(b, query)));
    for (const r of results) hits.push(...r);
  }
  if (!hits.length) return [];

  // Interleave by board so one large employer can't crowd out the rest.
  const byBoard = new Map<string, Hit[]>();
  for (const h of hits) {
    const list = byBoard.get(h.board.board_token) ?? [];
    list.push(h);
    byBoard.set(h.board.board_token, list);
  }
  const ordered: Hit[] = [];
  for (let i = 0; ordered.length < hits.length; i++) {
    let progressed = false;
    for (const list of byBoard.values()) {
      const item = list[i];
      if (item) { ordered.push(item); progressed = true; }
    }
    if (!progressed) break;
  }

  // ── Details ─────────────────────────────────────────────────────────
  const wanted = ordered.slice(0, PER_QUERY_LIMIT);
  const affordable = Math.max(0, Math.min(wanted.length, detailBudget));
  stats.overBudget += wanted.length - affordable;
  if (!affordable) return [];

  const take = wanted.slice(0, affordable);
  detailBudget -= take.length;

  const jobs: any[] = [];
  for (let i = 0; i < take.length; i += DETAIL_CONCURRENCY) {
    const chunk = take.slice(i, i + DETAIL_CONCURRENCY);
    const results = await Promise.all(chunk.map(fetchDetail));
    for (const r of results) {
      if (r) jobs.push(r);
      else stats.detailsDropped++;
    }
  }

  stats.detailsFetched += jobs.length;
  stats.postings += jobs.length;
  return jobs;
}
