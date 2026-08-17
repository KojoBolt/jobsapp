export type AtsProvider =
  // Application APIs available
  | "greenhouse" | "lever" | "ashby" | "workable" | "smartrecruiters"
  // Browser automation
  | "workday" | "icims" | "taleo" | "successfactors" | "bamboohr"
  | "jazzhr" | "recruitee" | "personio" | "teamtailor"
  // Terms forbid automated access
  | "linkedin" | "indeed" | "glassdoor" | "ziprecruiter"
  // Not an employer — a search layer that redirects elsewhere
  | "aggregator"
  | "unknown";

export type ApplyStrategy = "api" | "browser" | "human" | "resolve";

export interface AtsMatch {
  provider: AtsProvider;
  strategy: ApplyStrategy;
  /** Board/company slug where the URL carries one — e.g. "stripe" for
   *  boards.greenhouse.io/stripe/jobs/123. Needed to address the API. */
  boardToken: string | null;
  /** The hostname we matched on, for logging and for triaging "unknown". */
  host: string;
}

/**
 * Host suffix → provider. Matched against the hostname, so it covers
 * subdomains too ("stripe.myworkdayjobs.com" matches "myworkdayjobs.com")
 * without regex guesswork.
 */
const HOST_MAP: [string, AtsProvider][] = [
  // ── API tier ──────────────────────────────────────────────────────
  ["greenhouse.io", "greenhouse"],
  ["lever.co", "lever"],
  ["ashbyhq.com", "ashby"],
  ["workable.com", "workable"],
  ["smartrecruiters.com", "smartrecruiters"],

  // ── Browser tier ──────────────────────────────────────────────────
  ["myworkdayjobs.com", "workday"],
  ["myworkdaysite.com", "workday"],
  ["wd1.myworkdayjobs.com", "workday"],
  ["icims.com", "icims"],
  ["taleo.net", "taleo"],
  ["successfactors.com", "successfactors"],
  ["successfactors.eu", "successfactors"],
  ["bamboohr.com", "bamboohr"],
  ["applytojob.com", "jazzhr"],
  ["recruitee.com", "recruitee"],
  ["jobs.personio.de", "personio"],
  ["personio.com", "personio"],
  ["teamtailor.com", "teamtailor"],

  // ── Automation not permitted ──────────────────────────────────────
  ["linkedin.com", "linkedin"],
  ["indeed.com", "indeed"],
  ["glassdoor.com", "glassdoor"],
  ["ziprecruiter.com", "ziprecruiter"],

  // ── Aggregators / search layers we already source from ────────────
  ["adzuna.com", "aggregator"],
  ["adzuna.co.uk", "aggregator"],
  ["themuse.com", "aggregator"],
  ["arbeitnow.com", "aggregator"],
  ["remotive.com", "aggregator"],
  ["remotive.io", "aggregator"],
  ["reed.co.uk", "aggregator"],
  ["findwork.dev", "aggregator"],
  ["jooble.org", "aggregator"],
  ["google.com", "aggregator"], // jsearch falls back to job_google_link
];

const STRATEGY: Record<AtsProvider, ApplyStrategy> = {
  // These vendors DO publish application endpoints, but submission requires
  // the employer's own API key (verified for Greenhouse: "the Basic Auth
  // username is your API key, found on the API Credentials page"). A third
  // party applying for candidates can't obtain that, so the only route is the
  // public form in a browser. The others are presumed the same, unverified.
  greenhouse: "browser",
  lever: "browser",
  ashby: "browser",
  workable: "browser",
  smartrecruiters: "browser",

  workday: "browser",
  icims: "browser",
  taleo: "browser",
  successfactors: "browser",
  bamboohr: "browser",
  jazzhr: "browser",
  recruitee: "browser",
  personio: "browser",
  teamtailor: "browser",

  linkedin: "human",
  indeed: "human",
  glassdoor: "human",
  ziprecruiter: "human",

  aggregator: "resolve",
  // Unrecognised means a company-hosted page we've never seen. A generic
  // form-filling attempt is exactly how wrong data gets submitted, so these
  // go to a person until an adapter is written for them.
  unknown: "human",
};

/** Pull the board/company slug out of the URLs that carry one. */
function extractBoardToken(provider: AtsProvider, u: URL): string | null {
  const seg = u.pathname.split("/").filter(Boolean);
  switch (provider) {
    // boards.greenhouse.io/stripe/jobs/123  ·  job-boards.greenhouse.io/stripe/jobs/123
    case "greenhouse":
      return seg[0] && seg[0] !== "embed" ? seg[0] : null;
    // jobs.lever.co/netflix/uuid
    case "lever":
      return seg[0] || null;
    // jobs.ashbyhq.com/ramp/uuid
    case "ashby":
      return seg[0] || null;
    // apply.workable.com/acme/j/ABC123
    case "workable":
      return seg[0] || null;
    // jobs.smartrecruiters.com/Acme/123-title
    case "smartrecruiters":
      return seg[0] || null;
    // acme.myworkdayjobs.com/en-US/External/job/...
    case "workday":
      return u.hostname.split(".")[0] || null;
    default:
      return null;
  }
}

/**
 * Classify a job URL. Never throws — a malformed URL is "unknown", which
 * routes to a human rather than blowing up a batch run.
 */
export function detectAts(rawUrl: string | null | undefined): AtsMatch {
  if (!rawUrl) {
    return { provider: "unknown", strategy: "human", boardToken: null, host: "" };
  }

  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return { provider: "unknown", strategy: "human", boardToken: null, host: "" };
  }

  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  // Longest suffix wins, so "jobs.personio.de" beats a bare "personio.com"
  // style entry and subdomains can't shadow a more specific rule.
  let best: AtsProvider = "unknown";
  let bestLen = -1;
  for (const [suffix, provider] of HOST_MAP) {
    if ((host === suffix || host.endsWith(`.${suffix}`)) && suffix.length > bestLen) {
      best = provider;
      bestLen = suffix.length;
    }
  }

  return {
    provider: best,
    strategy: STRATEGY[best],
    boardToken: extractBoardToken(best, u),
    host,
  };
}

/**
 * Follow an aggregator link to wherever it actually lands.
 *
 * Adzuna and JSearch hand us their own redirect URLs, so classifying the
 * stored `job_url` alone would report "aggregator" for most of the pipeline
 * and tell us nothing about the real ATS mix.
 *
 * Returns the original URL unchanged on any failure — callers get a usable
 * string back in every case and can re-classify to decide what to do.
 */
export async function resolveFinalUrl(
  rawUrl: string,
  timeoutMs = 8000,
): Promise<{ url: string; redirected: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // GET rather than HEAD: a number of these hosts answer HEAD with 405 or
    // skip the redirect entirely.
    const res = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "JobAppBot/1.0 (+https://thejobapp.online)" },
    });
    const finalUrl = res.url || rawUrl;
    return { url: finalUrl, redirected: finalUrl !== rawUrl };
  } catch (e) {
    return {
      url: rawUrl,
      redirected: false,
      error: e instanceof Error ? e.message : "fetch failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ATS fingerprints left in a company's own careers URL.
 *
 * Large employers front their ATS with their own domain — Stripe serves
 * stripe.com/jobs/search?gh_jid=7557899 — so the hostname says "stripe.com"
 * and the job gets parked as unknown even though it is an ordinary Greenhouse
 * posting. The job id is right there in the query string; only the board slug
 * is missing, and that is guessable from the domain.
 *
 * Verified against the live site: for gh_jid 7557899,
 *   job-boards.greenhouse.io/embed/job_app?for=stripe&token=7557899
 * returns the complete application form the Greenhouse adapter already fills.
 */
const FINGERPRINTS: { param: string; provider: AtsProvider }[] = [
  { param: "gh_jid", provider: "greenhouse" },
];

/** "stripe.com" → "stripe". The registrable label, minus any www. */
function domainLabel(host: string): string | null {
  const parts = host.replace(/^www\./, "").split(".");
  if (parts.length < 2) return null;
  // Handles co.uk-style suffixes: take the label before the public suffix.
  const label = parts.length > 2 && parts[parts.length - 2]!.length <= 3
    ? parts[parts.length - 3]
    : parts[parts.length - 2];
  return label && /^[a-z0-9-]+$/i.test(label) ? label.toLowerCase() : null;
}

/**
 * Turn a fingerprinted careers URL into the real application form.
 *
 * The board slug is a GUESS derived from the domain, so it is verified before
 * being used: the rebuilt URL must respond 200 AND its page must mention the
 * job id. Applying to the wrong company's job is far worse than parking, so
 * anything short of both checks passing falls back to "unknown".
 */
async function resolveFingerprint(
  u: URL,
  timeoutMs: number,
): Promise<(AtsMatch & { resolvedUrl: string }) | null> {
  for (const { param, provider } of FINGERPRINTS) {
    const jobId = u.searchParams.get(param);
    if (!jobId || !/^\d+$/.test(jobId)) continue;

    const board = domainLabel(u.hostname);
    if (!board) continue;

    const candidate =
      `https://job-boards.greenhouse.io/embed/job_app` +
      `?for=${encodeURIComponent(board)}&token=${encodeURIComponent(jobId)}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(candidate, { signal: ctrl.signal, redirect: "follow" });
      if (!res.ok) continue;

      // A 200 proves nothing here. Measured against the live endpoint, a wrong
      // board or a nonexistent job id BOTH return 200 with the board's job
      // list ("Jobs at Stripe", 102KB, no form); a real one returns the
      // application page ("Job Application for …", 115KB). So the test is
      // whether an actual form came back — which is also precisely what the
      // adapter needs in order to do anything.
      //
      // Checking that the job id appears in the body was the obvious idea and
      // is worthless: "1" occurs in essentially every HTML document, so a
      // bogus gh_jid=1 sailed through it.
      const body = await res.text();
      const hasForm = body.includes("first_name") && body.includes("Job Application for");
      if (!hasForm) continue;

      return {
        provider,
        strategy: STRATEGY[provider],
        boardToken: board,
        host: u.hostname,
        resolvedUrl: candidate,
      };
    } catch {
      // Network failure means we simply do not know — fall through to unknown.
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/**
 * Classify, following one aggregator hop when needed. This is what callers
 * should use in the pipeline; `detectAts` alone is for already-resolved URLs.
 */
export async function classifyJobUrl(rawUrl: string): Promise<AtsMatch & { resolvedUrl: string }> {
  const first = detectAts(rawUrl);
  if (first.strategy !== "resolve") {
    // A recognised host wins outright. Only an unknown one is worth probing
    // for a fingerprint, and only then is the extra request justified.
    if (first.provider !== "unknown") return { ...first, resolvedUrl: rawUrl };

    try {
      const found = await resolveFingerprint(new URL(rawUrl), 8000);
      if (found) return found;
    } catch {
      // Unparseable URL — detectAts already returned unknown/human.
    }
    return { ...first, resolvedUrl: rawUrl };
  }

  const { url } = await resolveFinalUrl(rawUrl);
  const second = detectAts(url);

  // The aggregator may well have landed us on a company's own careers page,
  // which is exactly where fingerprints live.
  if (second.provider === "unknown") {
    try {
      const found = await resolveFingerprint(new URL(url), 8000);
      if (found) return found;
    } catch { /* fall through */ }
  }

  // Still an aggregator after the hop (or the fetch failed): a person decides.
  if (second.strategy === "resolve") {
    return { ...second, strategy: "human", resolvedUrl: url };
  }
  return { ...second, resolvedUrl: url };
}
