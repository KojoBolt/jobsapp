// =====================================================================
//  Shared job-sourcing logic. Imported by BOTH start-campaign and
//  process-batch so the fetching/dedupe/scoring code exists in one place.
//  Deploy path: supabase/functions/_shared/sourcing.ts
//  Folders starting with "_" are not deployed as their own function, but
//  ARE bundled into any function that imports them.
// =====================================================================

import { GROQ_QUALITY_MODELS, GROQ_CHAT_URL, reasoningParams } from "./models.ts";

const RAPIDAPI_KEY  = Deno.env.get("RAPIDAPI_KEY")!;
const LINKEDIN_HOST = Deno.env.get("LINKEDIN_HOST")!;
const JSEARCH_HOST  = Deno.env.get("JSEARCH_HOST")!;

// ─── Source Fetchers ──────────────────────────────────────────────────────────
async function fromAdzuna(query: string, page: number, country = "us"): Promise<any[]> {
  try {
    const id  = Deno.env.get("ADZUNA_APP_ID")!;
    const key = Deno.env.get("ADZUNA_APP_KEY")!;
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${id}&app_key=${key}&results_per_page=40&what=${encodeURIComponent(query)}`
    );
    const d = await res.json();
    return (d?.results || []).map((j: any) => ({
      title: j.title, company: j.company?.display_name || "Unknown",
      url: j.redirect_url, description: j.description?.slice(0, 800) || "",
      location: j.location?.display_name || "United States", source: "adzuna",
    }));
  } catch { return []; }
}

async function fromRemotive(query: string): Promise<any[]> {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=40`);
    const d = await res.json();
    const jobs = Array.isArray(d) ? d : (d?.jobs || []);
    return jobs.slice(0, 40).map((j: any) => ({
      title: j.title, company: j.company_name, url: j.url,
      description: j.description?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: "Remote", source: "remotive",
    }));
  } catch { return []; }
}

async function fromJSearch(query: string, page: number, retries = 2): Promise<any[]> {
  try {
    const res = await fetch(
      `https://${JSEARCH_HOST}/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1&date_posted=month`,
      { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": JSEARCH_HOST } }
    );
    if (res.status === 429 && retries > 0) {
      await new Promise(r => setTimeout(r, 4000));
      return fromJSearch(query, page, retries - 1);
    }
    if (!res.ok) return [];
    const d = await res.json();
    return (d?.data || []).slice(0, 40).map((j: any) => ({
      title: j.job_title, company: j.employer_name,
      url: j.job_apply_link || j.job_google_link,
      description: j.job_description?.slice(0, 800) || "",
      location: j.job_city || j.job_country || "United States", source: "jsearch",
    }));
  } catch { return []; }
}

async function fromTheMuse(categories: string[], page: number): Promise<any[]> {
  if (!categories.length) return [];
  try {
    const categoryParams = categories.map(c => `category=${encodeURIComponent(c)}`).join("&");
    const res = await fetch(`https://www.themuse.com/api/public/jobs?descending=true&page=${page}&level=Mid%20Level&level=Senior%20Level&${categoryParams}`);
    const d = await res.json();
    return (d?.results || []).filter((j: any) => j.refs?.landing_page).slice(0, 40).map((j: any) => ({
      title: j.name, company: j.company?.name || "Unknown", url: j.refs.landing_page,
      description: j.contents?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: j.locations?.[0]?.name || "United States", source: "themuse",
    }));
  } catch { return []; }
}

async function fromArbeitnow(query: string, page: number): Promise<any[]> {
  try {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}&search=${encodeURIComponent(query)}`);
    const d = await res.json();
    return (d?.data || []).filter((j: any) => j.url).slice(0, 40).map((j: any) => ({
      title: j.title, company: j.company_name || "Unknown", url: j.url,
      description: j.description?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: j.location || "Remote", source: "arbeitnow",
    }));
  } catch { return []; }
}

async function fromReed(query: string, page: number): Promise<any[]> {
  try {
    const apiKey = Deno.env.get("REED_API_KEY");
    if (!apiKey) return [];
    const credentials = btoa(`${apiKey}:`);
    const res = await fetch(
      `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(query)}&resultsToTake=40&resultsToSkip=${page * 40}`,
      { headers: { "Authorization": `Basic ${credentials}` } }
    );
    if (!res.ok) return [];
    const d = await res.json();
    return (d?.results || []).map((j: any) => ({
      title: j.jobTitle, company: j.employerName || "Unknown",
      url: j.jobUrl || `https://www.reed.co.uk/jobs/${j.jobId}`,
      description: j.jobDescription?.replace(/<[^>]*>/g, "").slice(0, 800) || "",
      location: j.locationName || "United Kingdom", source: "reed",
    })).filter((j: any) => j.url);
  } catch { return []; }
}

async function fromFindwork(query: string): Promise<any[]> {
  try {
    const apiKey = Deno.env.get("FINDWORK_API_KEY");
    if (!apiKey) return [];
    const res = await fetch(`https://findwork.dev/api/jobs/?search=${encodeURIComponent(query)}&order_by=-date`, {
      headers: { "Authorization": `Token ${apiKey}` }
    });
    if (!res.ok) return [];
    const d = await res.json();
    return (d?.results || []).slice(0, 40).map((j: any) => ({
      title: j.role, company: j.company_name || "Unknown", url: j.url,
      description: `${j.text || ""} Keywords: ${(j.keywords || []).join(", ")}`.slice(0, 800),
      location: j.location || "Remote", source: "findwork",
    })).filter((j: any) => j.url);
  } catch { return []; }
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

function buildQueryPool(targetRoles: string[], industries: string[]): string[] {
  return [
    ...targetRoles.slice(0, 3),
    ...targetRoles.slice(0, 2).map((r) => industries.length ? `${r} ${industries[0]}` : r),
    ...targetRoles.slice(0, 2).map((r) => `${r} remote`),
    "Software Engineer",
  ].filter((v, i, a) => v && a.indexOf(v) === i);
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
  const museCategories = getMuseCategories(p.targetRoles);
  const queryPool = buildQueryPool(p.targetRoles, p.industries);
  const floor = p.scoreFloor ?? 25;

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
      const fresh = dedupe(interleave([adzuna, remotive, jsearch, muse, arb, reed, findwork]), p.existingKeys);
      for (const job of fresh) {
        if (collected.length >= p.maxJobs) break;
        collected.push(job);
        p.existingKeys.add(jobKey(job.company, job.title));
      }
    }
  }

  if (!collected.length) return { jobs: [], pagesScanned };

  const candidateProfile = { targetRoles: p.targetRoles, industries: p.industries, skills: p.skills };
  const scored: any[] = [];
  for (let i = 0; i < collected.length; i += 50) {
    scored.push(...await scoreJobsChunk(collected.slice(i, i + 50), candidateProfile));
  }
  const jobs = scored.filter((j) => j.match_score >= floor).sort((a, b) => b.match_score - a.match_score);
  return { jobs, pagesScanned };
}