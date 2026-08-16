// =====================================================================
//  SmartRecruiters Posting API adapter.
//  Deploy path: supabase/functions/_shared/smartrecruiters.ts
//
//  The Posting API is public for published jobs — no key, no auth. (The
//  APPLICATION endpoint is not: posting a candidate needs the employer's
//  credentials or a partner OAuth scope, which is why applying still goes
//  through the browser. See _shared/ats.ts.)
//
//  SHAPE — same as workday.ts, not greenhouse.ts, and for the same reason:
//  the list response carries no job description. `process-job` writes
//  `job.description` straight into the cover-letter prompt, so a job sourced
//  without one produces a hollow letter and wastes the credit. Descriptions
//  therefore come from a second call, made only for jobs a query matched.
//
//    prime() → no HTTP. Loads which companies to query.
//    from()  → ASYNC. Asks each company for THIS query (the API does the
//              searching), then fetches descriptions for the results.
//
//  Nicer than Workday in three ways: pages hold 100 rather than 20, the
//  search is a plain `q` parameter, and the detail response carries an
//  `active` flag so closed requisitions can be dropped before they reach a
//  customer.
//
//  BOARD TOKEN — the SmartRecruiters company identifier, e.g. 'Jobsbridge1'
//  from https://jobs.smartrecruiters.com/Jobsbridge1/...
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const SR_API = "https://api.smartrecruiters.com/v1/companies";

const MAX_BOARDS      = Number(Deno.env.get("SR_MAX_BOARDS") ?? 12);
const SEARCH_LIMIT    = 10;   // results per company per query (API caps at 100)
const PER_QUERY_LIMIT = 12;   // across all companies, before detail fetches

/** Whole-run ceilings. Sourcing must never fail because SmartRecruiters was slow. */
const MAX_SEARCHES_PER_RUN = Number(Deno.env.get("SR_MAX_SEARCHES") ?? 48);
const MAX_DETAILS_PER_RUN  = Number(Deno.env.get("SR_MAX_DETAILS") ?? 40);

const TIMEOUT_MS         = 8_000;
const SEARCH_CONCURRENCY = 4;
const DETAIL_CONCURRENCY = 5;
const CACHE_TTL_MS       = 30 * 60_000;

/** Company id goes into a URL path, so anything outside this is rejected. */
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export interface SmartRecruitersStats {
  boardsRequested: number;
  boardsOk: number;
  boardsMissing: number;
  boardsFailed: number;
  postings: number;
  searches: number;
  detailsFetched: number;
  detailsDropped: number;  // inactive or blank description
  overBudget: number;
  cached: boolean;
}

let stats: SmartRecruitersStats = {
  boardsRequested: 0, boardsOk: 0, boardsMissing: 0, boardsFailed: 0,
  postings: 0, searches: 0, detailsFetched: 0, detailsDropped: 0,
  overBudget: 0, cached: false,
};

let searchBudget = MAX_SEARCHES_PER_RUN;
let detailBudget = MAX_DETAILS_PER_RUN;

export function smartRecruitersStats(): SmartRecruitersStats {
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
  companyId: string;
  company_name: string;
  domain: string | null;
}

interface Hit {
  board: Board;
  id: string;
  title: string;
  location: string;
}

let cache: { key: string; at: number; boards: Board[] } | null = null;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function loadBoards(industries: string[]): Promise<Board[]> {
  try {
    const supabase = admin();
    const base = () =>
      supabase
        .from("ats_companies")
        .select("board_token, company_name, domain")
        .eq("provider", "smartrecruiters")
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
      .filter((r) => {
        if (SAFE_ID.test(String(r.board_token))) return true;
        console.warn(`[smartrecruiters] skipping malformed board_token: ${r.board_token}`);
        return false;
      })
      .map((r) => ({
        companyId: String(r.board_token),
        company_name: r.company_name,
        domain: r.domain ?? null,
      }));
  } catch (err) {
    console.error("[smartrecruiters] could not load ats_companies:", err);
    return [];
  }
}

function retireBoard(token: string, reason: string) {
  admin()
    .from("ats_companies")
    .update({ is_active: false, last_error: reason, last_fetched_at: new Date().toISOString() })
    .eq("provider", "smartrecruiters")
    .eq("board_token", token)
    .then(() => {}, (e: unknown) => console.error("[smartrecruiters] retire failed:", e));
}

/** Load which companies to query. No HTTP until a query arrives. */
export async function primeSmartRecruiters(industries: string[]): Promise<void> {
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

/** Ask one company for one query. SmartRecruiters does the matching. */
async function searchBoard(b: Board, query: string): Promise<Hit[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const url =
      `${SR_API}/${encodeURIComponent(b.companyId)}/postings` +
      `?q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`;

    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });

    if (res.status === 404) {
      stats.boardsMissing++;
      console.warn(`[smartrecruiters] company not found: ${b.companyId} — retiring`);
      retireBoard(b.companyId, "404 from posting api");
      return [];
    }
    if (!res.ok) {
      stats.boardsFailed++;
      console.warn(`[smartrecruiters] ${b.companyId}: HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const content = Array.isArray(data?.content) ? data.content : [];
    stats.boardsOk++;

    return content
      .filter((p: any) => p?.id && p?.name)
      .map((p: any) => ({
        board: b,
        id: String(p.id),
        title: p.name,
        location: p.location?.fullLocation ||
          [p.location?.city, p.location?.region, p.location?.country].filter(Boolean).join(", ") ||
          "Not specified",
      }));
  } catch (err: any) {
    stats.boardsFailed++;
    if (err?.name === "AbortError") {
      console.warn(`[smartrecruiters] ${b.companyId} timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.error(`[smartrecruiters] ${b.companyId} threw:`, err);
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch one posting's description.
 *
 * Drops anything `active: false` — a closed requisition stays addressable and
 * applying to one burns a credit for nothing — and anything with no
 * description, which would produce a hollow cover letter.
 */
async function fetchDetail(h: Hit): Promise<Record<string, unknown> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${SR_API}/${encodeURIComponent(h.board.companyId)}/postings/${encodeURIComponent(h.id)}`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;

    const d = await res.json();
    if (d?.active === false) return null;

    // The ad is split across labelled sections; the job's own text is the
    // useful part, with the boilerplate company blurb last.
    const s = d?.jobAd?.sections ?? {};
    const description = htmlToText(
      [s.jobDescription?.text, s.qualifications?.text, s.additionalInformation?.text]
        .filter(Boolean)
        .join(" "),
    ).slice(0, 800);

    if (!description) return null;

    return {
      title: d.name || h.title,
      company: h.board.company_name,
      url: d.postingUrl || d.applyUrl,
      description,
      location: d.location?.fullLocation || h.location,
      source: "smartrecruiters",
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
 * Search every configured company for this query, then fetch descriptions.
 * ASYNC — all network cost lives here so it tracks what we're looking for.
 */
export async function fromSmartRecruiters(query: string): Promise<any[]> {
  const boards = cache?.boards ?? [];
  if (!boards.length || !query.trim()) return [];

  const affordableBoards = Math.min(boards.length, searchBudget);
  if (affordableBoards <= 0) return [];

  const toSearch = boards.slice(0, affordableBoards);
  searchBudget -= toSearch.length;
  stats.searches += toSearch.length;

  const hits: Hit[] = [];
  for (let i = 0; i < toSearch.length; i += SEARCH_CONCURRENCY) {
    const chunk = toSearch.slice(i, i + SEARCH_CONCURRENCY);
    const results = await Promise.all(chunk.map((b) => searchBoard(b, query)));
    for (const r of results) hits.push(...r);
  }
  if (!hits.length) return [];

  // Interleave by company so one high-volume agency can't crowd out the rest.
  const byBoard = new Map<string, Hit[]>();
  for (const h of hits) {
    const list = byBoard.get(h.board.companyId) ?? [];
    list.push(h);
    byBoard.set(h.board.companyId, list);
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
