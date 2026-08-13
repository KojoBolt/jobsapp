// =====================================================================
//  Shared job-sourcing logic. Imported by BOTH start-campaign and
//  process-batch so the fetching/dedupe/scoring code exists in one place.
//  Deploy path: supabase/functions/_shared/sourcing.ts
//  Folders starting with "_" are not deployed as their own function, but
//  ARE bundled into any function that imports them.
// =====================================================================

import { GROQ_QUALITY_MODELS, GROQ_CHAT_URL, reasoningParams } from "./models.ts";
import { primeGreenhouse, fromGreenhouse, greenhouseStats } from "./greenhouse.ts";

const RAPIDAPI_KEY  = Deno.env.get("RAPIDAPI_KEY")!;
const LINKEDIN_HOST = Deno.env.get("LINKEDIN_HOST")!;
const JSEARCH_HOST  = Deno.env.get("JSEARCH_HOST")!;

/** Per-request ceiling for every board call. Without this a single hung
 *  connection blocks the whole Promise.all below — one stalled source could
 *  consume the entire 150 s edge-function budget and the campaign would
 *  source nothing at all. */
const SOURCE_TIMEOUT_MS = 8_000;

/* ── Per-source telemetry ──────────────────────────────────────────────
   Every fetcher swallows its own errors and returns [], which keeps one
   dead board from killing a campaign — but it also means a source whose
   key expired months ago looks exactly like a source that legitimately
   found nothing. These counters are the difference, and they're printed
   once per sourceJobs() call. */
interface SourceStat { calls: number; ok: number; failed: number; jobs: number }
const STATS: Record<string, SourceStat> = {};

function stat(name: string): SourceStat {
  return (STATS[name] ??= { calls: 0, ok: 0, failed: 0, jobs: 0 });
}
function resetStats() {
  for (const k of Object.keys(STATS)) delete STATS[k];
}

/** fetch() with a hard timeout. Returns null instead of throwing so the
 *  callers keep their existing "on any problem, return []" contract. */
async function timedFetch(
  source: string,
  url: string,
  init: RequestInit = {},
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SOURCE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.warn(`[${source}] timed out after ${SOURCE_TIMEOUT_MS}ms`);
    } else {
      console.error(`[${source}] network error:`, err?.message || err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ── Company logo ──────────────────────────────────────────────────────
   Only ever derived from something the SOURCE told us. The dashboard used
   to guess a domain from the company name, which quietly rendered parked
   domains' favicons next to real employers — a valid image comes back, so
   nothing downstream can tell it's wrong. Anything uncertain returns null
   and the UI falls back to initials. */
function safeHost(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch { return null; }
}

function logoFrom(logoUrl?: string, website?: string): string | null {
  // A logo the employer publishes is the best answer.
  if (typeof logoUrl === "string" && /^https?:\/\//i.test(logoUrl)) return logoUrl;
  // Otherwise the employer's own site — a known domain, not an inferred one.
  const host = safeHost(website);
  return host ? `https://icons.duckduckgo.com/ip3/${host}.ico` : null;
}

// ─── Source Fetchers ──────────────────────────────────────────────────────────
async function fromAdzuna(query: string, page: number, country = "us"): Promise<any[]> {
  const s = stat("adzuna");
  s.calls++;
  try {
    const id  = Deno.env.get("ADZUNA_APP_ID")!;
    const key = Deno.env.get("ADZUNA_APP_KEY")!;
    const res = await timedFetch("adzuna",
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${id}&app_key=${key}&results_per_page=40&what=${encodeURIComponent(query)}`
    );
    if (!res) { s.failed++; return []; }
    if (!res.ok) { s.failed++; console.warn(`[adzuna] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const jobs = (d?.results || []).map((j: any) => ({
      title: j.title, company: j.company?.display_name || "Unknown",
      url: j.redirect_url, description: j.description?.slice(0, 800) || "",
      location: j.location?.display_name || "United States", source: "adzuna",
    }));
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[adzuna] threw:", err); return []; }
}

async function fromRemotive(query: string): Promise<any[]> {
  const s = stat("remotive");
  s.calls++;
  try {
    const res = await timedFetch("remotive",
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=40`);
    if (!res) { s.failed++; return []; }
    if (!res.ok) { s.failed++; console.warn(`[remotive] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const list = Array.isArray(d) ? d : (d?.jobs || []);
    const jobs = list.slice(0, 40).map((j: any) => ({
      title: j.title, company: j.company_name, url: j.url,
      description: j.description?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: "Remote", source: "remotive",
      company_logo: logoFrom(j.company_logo || j.company_logo_url),
    }));
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[remotive] threw:", err); return []; }
}

async function fromJSearch(query: string, page: number, retries = 2): Promise<any[]> {
  const s = stat("jsearch");
  // Guard matches how reed/findwork already behave — an unset host builds a
  // bogus "https://undefined/search" URL and burns a request slot.
  if (!RAPIDAPI_KEY || !JSEARCH_HOST) return [];
  s.calls++;
  try {
    const res = await timedFetch("jsearch",
      `https://${JSEARCH_HOST}/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1&date_posted=month`,
      { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": JSEARCH_HOST } }
    );
    if (!res) { s.failed++; return []; }
    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, 4000));
      return fromJSearch(query, page, retries - 1);
    }
    if (!res.ok) { s.failed++; console.warn(`[jsearch] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const jobs = (d?.data || []).slice(0, 40).map((j: any) => ({
      title: j.job_title, company: j.employer_name,
      url: j.job_apply_link || j.job_google_link,
      description: j.job_description?.slice(0, 800) || "",
      location: j.job_city || j.job_country || "United States", source: "jsearch",
      company_logo: logoFrom(j.employer_logo, j.employer_website),
    }));
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[jsearch] threw:", err); return []; }
}

async function fromTheMuse(categories: string[], page: number): Promise<any[]> {
  if (!categories.length) return [];
  const s = stat("themuse");
  s.calls++;
  try {
    const categoryParams = categories.map(c => `category=${encodeURIComponent(c)}`).join("&");
    const res = await timedFetch("themuse",
      `https://www.themuse.com/api/public/jobs?descending=true&page=${page}&level=Mid%20Level&level=Senior%20Level&${categoryParams}`);
    if (!res) { s.failed++; return []; }
    if (!res.ok) { s.failed++; console.warn(`[themuse] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const jobs = (d?.results || []).filter((j: any) => j.refs?.landing_page).slice(0, 40).map((j: any) => ({
      title: j.name, company: j.company?.name || "Unknown", url: j.refs.landing_page,
      description: j.contents?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: j.locations?.[0]?.name || "United States", source: "themuse",
    }));
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[themuse] threw:", err); return []; }
}

async function fromArbeitnow(query: string, page: number): Promise<any[]> {
  const s = stat("arbeitnow");
  s.calls++;
  try {
    const res = await timedFetch("arbeitnow",
      `https://www.arbeitnow.com/api/job-board-api?page=${page}&search=${encodeURIComponent(query)}`);
    if (!res) { s.failed++; return []; }
    if (!res.ok) { s.failed++; console.warn(`[arbeitnow] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const jobs = (d?.data || []).filter((j: any) => j.url).slice(0, 40).map((j: any) => ({
      title: j.title, company: j.company_name || "Unknown", url: j.url,
      description: j.description?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: j.location || "Remote", source: "arbeitnow",
    }));
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[arbeitnow] threw:", err); return []; }
}

async function fromReed(query: string, page: number): Promise<any[]> {
  const s = stat("reed");
  try {
    const apiKey = Deno.env.get("REED_API_KEY");
    if (!apiKey) return [];
    s.calls++;
    const credentials = btoa(`${apiKey}:`);
    const res = await timedFetch("reed",
      `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(query)}&resultsToTake=40&resultsToSkip=${page * 40}`,
      { headers: { "Authorization": `Basic ${credentials}` } }
    );
    if (!res) { s.failed++; return []; }
    if (!res.ok) { s.failed++; console.warn(`[reed] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const jobs = (d?.results || []).map((j: any) => ({
      title: j.jobTitle, company: j.employerName || "Unknown",
      url: j.jobUrl || `https://www.reed.co.uk/jobs/${j.jobId}`,
      description: j.jobDescription?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: j.locationName || "United Kingdom", source: "reed",
    })).filter((j: any) => j.url);
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[reed] threw:", err); return []; }
}

async function fromFindwork(query: string): Promise<any[]> {
  const s = stat("findwork");
  try {
    const apiKey = Deno.env.get("FINDWORK_API_KEY");
    if (!apiKey) return [];
    s.calls++;
    const res = await timedFetch("findwork",
      `https://findwork.dev/api/jobs/?search=${encodeURIComponent(query)}&order_by=-date`,
      { headers: { "Authorization": `Token ${apiKey}` } }
    );
    if (!res) { s.failed++; return []; }
    if (!res.ok) { s.failed++; console.warn(`[findwork] HTTP ${res.status}`); return []; }
    const d = await res.json();
    const jobs = (d?.results || []).slice(0, 40).map((j: any) => ({
      title: j.role, company: j.company_name || "Unknown", url: j.url,
      description: `${j.text || ""} Keywords: ${(j.keywords || []).join(", ")}`.slice(0, 800),
      location: j.location || "Remote", source: "findwork",
      company_logo: logoFrom(j.logo, j.company_url || j.company_website),
    })).filter((j: any) => j.url);
    s.ok++; s.jobs += jobs.length;
    return jobs;
  } catch (err) { s.failed++; console.error("[findwork] threw:", err); return []; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function interleave(sources: any[][]): any[] {
  const nonEmpty = sources.filter(s => s.length > 0);
  if (!nonEmpty.length) return [];
  const indices = new Array(nonEmpty.length).fill(0);
  const result: any[] = [];
  const maxLen = Math.max(...nonEmpty.map(s => s.length));
  for (let round = 0; round < maxLen; round++) {
    const order = [...Array(nonEmpty.length).keys()].sort(() => Math.random() - 0.5);
    for (const si of order) {
      const job = nonEmpty[si][indices[si]];
      if (job) { result.push(job); indices[si]++; }
    }
  }
  return result;
}

export function jobKey(company?: string, title?: string): string {
  return `${company?.toLowerCase()}-${title?.toLowerCase()}`;
}

function dedupe(jobs: any[], existingKeys: Set<string>): any[] {
  const seen = new Set<string>(existingKeys);
  return jobs.filter(j => {
    if (!j.title || !j.url) return false;
    const k = jobKey(j.company, j.title);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function scoreJobsChunk(jobs: any[], candidateProfile: any): Promise<any[]> {
  if (!jobs.length) return [];
  const GROQ_KEY = Deno.env.get("GROQ_API_KEY")!;
  const list = jobs.map((j, i) => `${i + 1}. ${j.title} @ ${j.company} | ${j.description?.slice(0, 120)}`).join("\n");
  const content = `Score these ${jobs.length} jobs 0-100 for fit. Only return JSON array: [score1, score2, ...].
Candidate Roles: ${candidateProfile.targetRoles.join(", ")} | Skills: ${candidateProfile.skills}
JOBS:
${list}`;

  for (const model of GROQ_QUALITY_MODELS) {
    try {
      const res = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model,
          // Reasoning is charged against this budget, so the old 256 — already
          // tight for a 50-element array — would now return nothing at all.
          max_completion_tokens: 2048,
          temperature: 0.1,
          ...reasoningParams(model),
          messages: [{ role: "user", content }],
        }),
      });

      // Without this check an error response fell straight through to all-50s:
      // d.choices is undefined, the regex yields "[]", and every job scores 50.
      // Scoring silently stopped working and nothing said so.
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        console.error(`Job scoring [${model}] failed: HTTP ${res.status} ${err.slice(0, 200)}`);
        continue;
      }

      const d = await res.json();
      const scores = JSON.parse(d?.choices?.[0]?.message?.content?.match(/\[.*\]/s)?.[0] || "[]");
      if (Array.isArray(scores) && scores.length) {
        return jobs.map((j, i) => ({ ...j, match_score: scores[i] ?? 50 }));
      }
      console.error(`Job scoring [${model}] returned no usable scores`);
    } catch (err) {
      console.error(`Job scoring [${model}] threw:`, err);
    }
  }

  // Every model failed. Neutral 50 clears the default floor of 25, so the
  // campaign keeps running on UNRANKED jobs rather than stalling — the safer
  // failure, but the user is applying to poorly-matched roles until it's fixed.
  console.error(
    `Job scoring unavailable (${GROQ_QUALITY_MODELS.join(", ")}) — ` +
    `${jobs.length} job(s) passed through unranked at the neutral score of 50.`
  );
  return jobs.map(j => ({ ...j, match_score: 50 }));
}

const MUSE_CATEGORY_MAP: Record<string, string> = {
  "UX Designer": "Design & UX", "UI Designer": "Design & UX", "Video Editor": "Design & UX",
  "Full-stack": "Software Engineer", "Backend": "Software Engineer", "Frontend": "Software Engineer",
  "WordPress Developer": "Software Engineer", "Mobile Developer": "Software Engineer",
};
function getMuseCategories(targetRoles: string[]): string[] {
  const categories = new Set<string>();
  for (const role of targetRoles) {
    const mapped = MUSE_CATEGORY_MAP[role];
    if (mapped) categories.add(mapped);
  }
  return [...categories];
}

/** "Other" is the vault's UI sentinel for "let me type my own", not a job
 *  title. Searching for it literally is what sent non-standard candidates
 *  hunting the word "Other" across all eight boards. */
const isSentinelRole = (r: string) => r.trim().toLowerCase() === "other";

function cleanRoles(roles: string[]): string[] {
  return roles
    .map((r) => String(r ?? "").trim())
    .filter((r) => r && !isSentinelRole(r))
    .filter((r, i, a) => a.indexOf(r) === i);
}

/**
 * The candidate's real target roles, read from the whole vault rather than
 * one branch of it.
 *
 * The vault writes free-text roles to `identity_vault_data.customRoles` — a
 * SIBLING of `targeting`, not a member of it (see the vaultData literal in
 * src/pages/IdentityVault.tsx). Sourcing only ever read
 * `targeting.targetRoles`, so a candidate who picked "Other" and typed
 * "Physician" was sourced as if their target role were the string "Other".
 *
 * Only merged while "Other" is actually selected: the vault never clears
 * customRoles when "Other" is deselected, so without that gate a role the
 * user abandoned months ago would come back as a live search term.
 */
export function resolveTargetRoles(vault: any): string[] {
  const targeting = vault?.targeting ?? {};
  const picked: string[] = Array.isArray(targeting.targetRoles) ? targeting.targetRoles : [];

  const usesOther = picked.some((r) => isSentinelRole(String(r ?? "")));
  const customSource = Array.isArray(vault?.customRoles)
    ? vault.customRoles
    : (Array.isArray(targeting.customRoles) ? targeting.customRoles : []);
  const custom: string[] = usesOther ? customSource : [];

  // Typed roles lead: the user went out of their way to write them, and
  // buildQueryPool only takes the first few.
  return cleanRoles([...custom, ...picked]);
}

/* The broad "Software Engineer" sweep is real extra supply for a developer
   and pure noise for a nurse. These two checks decide who gets it: the fixed
   set covers the vault's own tech options (targetRoleOptions in
   src/pages/IdentityVault.tsx), the hints catch free-text roles like
   "Golang Developer" that the dropdown never offered. */
const SOFTWARE_ROLES = new Set([
  "full-stack", "backend", "frontend", "wordpress developer", "devops",
  "qa engineer", "mobile developer", "cloud architect", "ai/ml engineer",
  "security specialist",
]);
const SOFTWARE_HINTS = ["engineer", "developer", "programmer", "software"];

function wantsSoftwareSweep(roles: string[]): boolean {
  return roles.some((r) => {
    const k = r.toLowerCase();
    return SOFTWARE_ROLES.has(k) || SOFTWARE_HINTS.some((h) => k.includes(h));
  });
}

function buildQueryPool(targetRoles: string[], industries: string[]): string[] {
  const roles = cleanRoles(targetRoles);

  const pool = [
    ...roles.slice(0, 3),
    ...roles.slice(0, 2).map((r) => industries.length ? `${r} ${industries[0]}` : r),
    ...roles.slice(0, 2).map((r) => `${r} remote`),
    // Was appended to EVERY pool unconditionally, which handed a doctor or a
    // teacher a guaranteed set of irrelevant engineering results on top of
    // their own searches — and, when Groq scoring was down and everything
    // scored a flat 50, filled their whole campaign with them.
    ...(wantsSoftwareSweep(roles) ? ["Software Engineer"] : []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  if (pool.length) return pool;

  // Nothing usable in the vault at all. Try the industries the candidate did
  // pick before falling back to a hardcoded trade.
  if (industries.length) {
    console.warn(`[sourcing] no usable target roles — falling back to industries: ${industries.slice(0, 3).join(", ")}`);
    return industries.slice(0, 3);
  }
  console.warn("[sourcing] vault has neither target roles nor industries — falling back to 'Software Engineer'");
  return ["Software Engineer"];
}

// ─── The one sourcing entry point both functions call ─────────────────────────
export interface SourceParams {
  targetRoles: string[];
  industries: string[];
  skills: string;
  existingKeys: Set<string>;   // company-title keys already in the campaign
  startPage: number;           // which board page to begin at (the cursor)
  pagesToScan: number;         // how many pages this pass should cover
  maxJobs: number;             // stop once this many fresh jobs are collected
  scoreFloor?: number;         // minimum match_score to keep (default 25)
}

export async function sourceJobs(p: SourceParams): Promise<{ jobs: any[]; pagesScanned: number }> {
  resetStats();

  const museCategories = getMuseCategories(p.targetRoles);
  const queryPool = buildQueryPool(p.targetRoles, p.industries);
  const floor = p.scoreFloor ?? 25;

  // Greenhouse is a BOARD source, not a search engine — it's addressed by
  // company, not keyword, so it can't take (query, page) like the others.
  // Every configured board is pulled ONCE here into memory; fromGreenhouse()
  // below then filters that cache per query at zero network cost. Failure is
  // contained inside primeGreenhouse — the seven search sources are untouched.
  await primeGreenhouse(p.industries);

  const collected: any[] = [];
  let pagesScanned = 0;

  outer: for (let i = 0; i < p.pagesToScan; i++) {
    const pageNum = p.startPage + i;
    pagesScanned++;
    for (const q of queryPool) {
      if (collected.length >= p.maxJobs) break outer;
      const [adzuna, remotive, jsearch, muse, arb, reed, findwork] = await Promise.all([
        fromAdzuna(q, pageNum),
        fromRemotive(q),
        fromJSearch(q, pageNum),
        fromTheMuse(museCategories, pageNum),
        fromArbeitnow(q, pageNum),
        fromReed(q, pageNum),
        fromFindwork(q),
      ]);

      // Greenhouse has no pagination — the cache is identical on every page
      // pass, so anything it yields after the first pass is a guaranteed
      // duplicate that dedupe would drop. Only offer it on the first pass.
      const greenhouse = i === 0 ? fromGreenhouse(q) : [];

      const fresh = dedupe(
        interleave([adzuna, remotive, jsearch, muse, arb, reed, findwork, greenhouse]),
        p.existingKeys,
      );
      for (const job of fresh) {
        if (collected.length >= p.maxJobs) break;
        collected.push(job);
        p.existingKeys.add(jobKey(job.company, job.title));
      }
    }
  }

  // One line per source, per run. Without it a source that has been broken
  // for months is indistinguishable from one that found nothing today.
  const gh = greenhouseStats();
  console.log(
    "[sourcing] " +
    Object.entries(STATS)
      .map(([name, s]) => `${name}: ${s.jobs}j/${s.ok}ok/${s.failed}fail of ${s.calls}`)
      .join(" | ") +
    ` | greenhouse: ${gh.postings}p from ${gh.boardsOk}/${gh.boardsRequested} boards` +
    `${gh.cached ? " (cached)" : ""}${gh.boardsMissing ? ` ${gh.boardsMissing} missing` : ""}` +
    `${gh.boardsFailed ? ` ${gh.boardsFailed} failed` : ""}` +
    ` — collected ${collected.length}/${p.maxJobs}`
  );

  if (!collected.length) return { jobs: [], pagesScanned };

  const candidateProfile = { targetRoles: p.targetRoles, industries: p.industries, skills: p.skills };
  const scored: any[] = [];
  for (let i = 0; i < collected.length; i += 50) {
    scored.push(...await scoreJobsChunk(collected.slice(i, i + 50), candidateProfile));
  }
  const jobs = scored.filter((j) => j.match_score >= floor).sort((a, b) => b.match_score - a.match_score);
  return { jobs, pagesScanned };
}
