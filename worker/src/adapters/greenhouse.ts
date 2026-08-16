import type { Locator, Page } from "playwright";
import type { Adapter, ApplyContext, ApplyOutcome } from "./types.ts";
import { withContext } from "../browser.ts";
import { captureEvidence } from "../evidence.ts";
import { log } from "../log.ts";
import {
  discardResume,
  loadCandidate,
  missingEssentials,
  KNOWN_COUNTRIES,
  type Candidate,
} from "../candidate.ts";

/**
 * Greenhouse job board adapter.
 *
 * Greenhouse first because it asks the least: no account, no login, one page,
 * and field names that barely change between companies. Lever is close enough
 * that most of this carries over.
 *
 * THE RULE THAT SHAPES EVERYTHING BELOW: a required question we cannot answer
 * from the vault parks the application for a human. It never gets a guess.
 * "Are you legally authorised to work in the United States?" is a legal
 * declaration made in the candidate's name — a wrong answer is not a worse
 * application, it is a false statement on a real one.
 *
 * Greenhouse has shipped two form generations and both are live:
 *   boards.greenhouse.io/{board}/jobs/{id}        — older markup
 *   job-boards.greenhouse.io/{board}/jobs/{id}    — current
 * plus an embedded variant that puts the whole form in an iframe. Every
 * selector below is therefore a list of candidates tried in order.
 */

/**
 * Country names, matched case-insensitively. Safe: no ordinary English
 * sentence contains "united kingdom" by accident.
 */
const COUNTRY_NAMES: Record<string, string> = {
  "united states": "United States",
  "america": "United States",
  "united kingdom": "United Kingdom",
  "great britain": "United Kingdom",
  "england": "United Kingdom",
  "scotland": "United Kingdom",
  "wales": "United Kingdom",
  "canada": "Canada",
  "australia": "Australia",
  "new zealand": "New Zealand",
  "ireland": "Ireland",
  "switzerland": "Switzerland",
  "european union": "European Union",
};

/**
 * Abbreviations, matched CASE-SENSITIVELY and only as whole words.
 *
 * This is not fussiness. Lowercased, "us" is one of the commonest words in
 * English — "the right to work for us", "tell us about yourself" — and a
 * case-insensitive match would silently read those as the United States and
 * answer a work-authorisation question from them. Requiring "US" in capitals
 * makes the match mean what it looks like.
 */
const COUNTRY_ABBREVIATIONS: Record<string, string> = {
  "US": "United States",
  "USA": "United States",
  "U.S.": "United States",
  "U.S.A.": "United States",
  "UK": "United Kingdom",
  "U.K.": "United Kingdom",
  "EU": "European Union",
  "NZ": "New Zealand",
};

/**
 * Wordings that mean "the country this job is in" without naming it.
 * Robinhood's form is the example: "Do you have the unrestricted right to
 * work in the country where this role is located?"
 */
const REFERS_TO_JOB_COUNTRY =
  /\b(this|the) country\b|country (where|in which) (this|the) (role|position|job)|country of (the )?(role|position|employment)|where this role is located/i;

const SELECTORS = {
  firstName: ["#first_name", "input[name='job_application[first_name]']", "input[autocomplete='given-name']"],
  lastName: ["#last_name", "input[name='job_application[last_name]']", "input[autocomplete='family-name']"],
  email: ["#email", "input[name='job_application[email]']", "input[type='email']"],
  phone: ["#phone", "input[name='job_application[phone]']", "input[type='tel']"],
  resume: ["input[type='file'][name*='resume']", "#resume", "input[type='file']"],
  coverLetterText: ["#cover_letter_text", "textarea[name*='cover_letter']", "textarea[id*='cover_letter']"],
  submit: ["#submit_app", "button[type='submit']", "input[type='submit']"],
} as const;

/** First selector in the list that actually resolves to something on screen. */
async function find(scope: Page | Locator, selectors: readonly string[]): Promise<Locator | null> {
  for (const sel of selectors) {
    const loc = scope.locator(sel).first();
    if (await loc.count().catch(() => 0)) return loc;
  }
  return null;
}

async function fillIfPresent(
  scope: Page | Locator,
  selectors: readonly string[],
  value: string,
): Promise<boolean> {
  if (!value) return false;
  const loc = await find(scope, selectors);
  if (!loc) return false;
  await loc.fill(value).catch(() => {});
  return true;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Pull a country we recognise out of some text, or null if none is named. */
export function countryInText(text: string): string | null {
  if (!text) return null;

  // Full names first, longest first so "United States" is not shadowed by a
  // shorter entry that happens to be a substring of it.
  const names = Object.keys(COUNTRY_NAMES).sort((a, b) => b.length - a.length);
  const lower = text.toLowerCase();
  for (const name of names) {
    if (new RegExp(`\\b${escape(name)}\\b`).test(lower)) return COUNTRY_NAMES[name]!;
  }
  // The vault's own spellings, which are already full names.
  for (const c of KNOWN_COUNTRIES) {
    if (new RegExp(`\\b${escape(c.toLowerCase())}\\b`).test(lower)) return c;
  }

  // Abbreviations against the ORIGINAL text, so case still carries meaning.
  const abbrs = Object.keys(COUNTRY_ABBREVIATIONS).sort((a, b) => b.length - a.length);
  for (const abbr of abbrs) {
    if (new RegExp(`(^|[^A-Za-z])${escape(abbr)}([^A-Za-z]|$)`).test(text)) {
      return COUNTRY_ABBREVIATIONS[abbr]!;
    }
  }
  return null;
}

/**
 * Where the job itself is, read off the posting.
 *
 * Needed because plenty of forms ask about work authorisation without naming
 * a country — they mean the one in the header, a few hundred pixels above the
 * question. Without this, every such question parks.
 */
async function readJobCountry(page: Page): Promise<string | null> {
  const candidates = [
    ".job__location",
    "[class*='location']",
    "[data-testid*='location']",
    "div:below(h1)",
  ];
  for (const sel of candidates) {
    const text = await page.locator(sel).first().textContent().catch(() => null);
    const country = countryInText((text ?? "").trim());
    if (country) return country;
  }
  // Last resort: the top of the page, where the header sits. Deliberately not
  // the whole body — a US company's boilerplate would match on any posting.
  const heading = await page.locator("h1, h2").first().textContent().catch(() => null);
  return countryInText(heading ?? "");
}

type Answer = { value: string } | { skip: true } | { unanswerable: string };

/**
 * Decide what a question should be answered with, using only stored data.
 *
 * Returning `unanswerable` is a normal outcome, not an error — it is how the
 * application ends up with a person instead of a guess.
 */
function answerFor(question: string, c: Candidate, jobCountry: string | null): Answer {
  const q = question.toLowerCase();

  /**
   * The country a question is about: named outright, or referred to as "this
   * country" / "the country where this role is located", in which case it is
   * the job's own. Returns null when neither applies — and null must always
   * mean "park", never "assume".
   */
  const subjectCountry = (): string | null =>
    countryInText(question) ?? (REFERS_TO_JOB_COUNTRY.test(question) ? jobCountry : null);

  // ── Acknowledgements ────────────────────────────────────────────────
  // Handled before the question rules because these are not questions: they
  // are a condition of submitting, like a terms box. Confirming that a notice
  // was presented is materially different from declaring a fact about the
  // candidate — nothing here asserts anything about them, so it is inside the
  // remit of "apply to this job on my behalf". Factual claims below still
  // never get an inferred answer.
  if (/acknowledg|privacy (policy|notice)|i (have )?(read|agree)|consent to/.test(q)) {
    return { value: "Yes" };
  }

  // ── Work authorisation ──────────────────────────────────────────────
  if (/(legally )?(authoriz|authoris)ed to work|right to work|work authoriz|eligible to work/.test(q)) {
    if (!c.authorizedCountries.length) return { unanswerable: "no work authorisation on file" };
    const country = subjectCountry();
    if (!country) {
      return { unanswerable: `work authorisation, country unclear: "${question.slice(0, 90)}"` };
    }
    return { value: c.authorizedCountries.includes(country) ? "Yes" : "No" };
  }

  // ── Sponsorship ─────────────────────────────────────────────────────
  if (/sponsor/.test(q)) {
    const country = subjectCountry();
    // Authorised there means no sponsorship needed, whatever the general
    // answer says — this is more specific and therefore more accurate.
    if (country && c.authorizedCountries.includes(country)) return { value: "No" };
    if (c.needsSponsorship === "yes") return { value: "Yes" };
    if (c.needsSponsorship === "no") return { value: "No" };
    return { unanswerable: "sponsorship requirement not on file" };
  }

  if (/notice period|when (can|could) you start|available to start|start date/.test(q)) {
    return c.noticePeriod ? { value: c.noticePeriod } : { unanswerable: "notice period not on file" };
  }

  if (/salary|compensation|expected pay|rate expectation/.test(q)) {
    const range = [c.salaryMin, c.salaryMax].filter(Boolean).join(" - ");
    return range ? { value: range } : { unanswerable: "salary expectation not on file" };
  }

  if (/linkedin/.test(q)) return c.linkedinUrl ? { value: c.linkedinUrl } : { skip: true };
  if (/github/.test(q)) return c.githubUrl ? { value: c.githubUrl } : { skip: true };
  if (/portfolio|website|personal site/.test(q)) {
    return c.portfolioUrl ? { value: c.portfolioUrl } : { skip: true };
  }
  if (/city|where are you (based|located)|current location/.test(q)) {
    return c.city ? { value: [c.city, c.country].filter(Boolean).join(", ") } : { skip: true };
  }
  if (/how did you hear|referr?al source/.test(q)) return { skip: true };

  return { unanswerable: `unrecognised question: "${question.slice(0, 120)}"` };
}

/**
 * Is this page a bot wall?
 *
 * The first version of this asked whether the page text contained the word
 * "cloudflare". A job at Cloudflare therefore looked like a Cloudflare
 * challenge, and the adapter refused to fill a perfectly ordinary form. The
 * lesson generalises: a company's name is not evidence of anything, and a
 * page that merely MENTIONS a security vendor is not one that is blocking you.
 *
 * So detection is now by what is on the page, not what it says:
 *
 *   * an interstitial — a challenge with no application form behind it
 *   * a visible, interactive captcha widget we would have to solve
 *
 * A Turnstile widget sitting inside a working form is explicitly not a block:
 * Greenhouse embeds one on many boards, usually invisible, and the form
 * submits normally. Treating that as a wall would park most of the queue.
 */
async function detectChallenge(page: Page, formFound: boolean): Promise<string | null> {
  const widget = page.locator(
    "iframe[src*='challenges.cloudflare.com'], iframe[title*='challenge' i], " +
      "iframe[src*='recaptcha'], .g-recaptcha, #challenge-form, #cf-challenge-running",
  ).first();

  const present = (await widget.count().catch(() => 0)) > 0;

  if (!formFound) {
    // No form at all. Now the page text is worth consulting, because there is
    // nothing else here — but only phrases that appear on challenge pages and
    // essentially nowhere else.
    const text = ((await page.textContent("body").catch(() => "")) ?? "").toLowerCase();
    const interstitial =
      /checking your browser before|verify (that )?you are (a )?human|please complete the security check|enable javascript and cookies to continue|needs to review the security of your connection/
        .test(text);
    if (present || interstitial) return "Bot challenge interstitial";
    return null;
  }

  // A form exists, so we are on the real page. Only an actually visible
  // widget matters — one a person would have to click.
  if (present && (await widget.isVisible().catch(() => false))) {
    const box = await widget.boundingBox().catch(() => null);
    if (box && box.width > 40 && box.height > 40) return "Interactive captcha on the form";
  }
  return null;
}

/** Gender, ethnicity, veteran and disability questions. */
function isEeo(q: string): boolean {
  return /gender|race|ethnic|hispanic|latino|veteran|disability|disabled|self-?identif|pronoun/i.test(q);
}

/**
 * Put `value` into whichever control this is — select, radio group, or text.
 * Returns false when nothing could be set, which the caller treats as an
 * unanswered question rather than a success.
 */
async function setControl(container: Locator, value: string): Promise<boolean> {
  // <select>
  const select = container.locator("select").first();
  if (await select.count().catch(() => 0)) {
    const options = await select.locator("option").allTextContents().catch(() => [] as string[]);
    const match = options.find((o) => o.trim().toLowerCase() === value.toLowerCase())
      ?? options.find((o) => o.trim().toLowerCase().startsWith(value.toLowerCase()));
    if (!match) return false;
    await select.selectOption({ label: match }).catch(() => {});
    return true;
  }

  // Radio group — click the label whose text is the answer.
  const radios = container.locator("input[type='radio']");
  if (await radios.count().catch(() => 0)) {
    const labels = container.locator("label");
    const count = await labels.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const label = labels.nth(i);
      const text = (await label.textContent().catch(() => "") ?? "").trim().toLowerCase();
      if (text === value.toLowerCase() || text.startsWith(value.toLowerCase())) {
        await label.click().catch(() => {});
        return true;
      }
    }
    return false;
  }

  const textarea = container.locator("textarea").first();
  if (await textarea.count().catch(() => 0)) {
    await textarea.fill(value).catch(() => {});
    return true;
  }

  const input = container.locator("input[type='text'], input:not([type])").first();
  if (await input.count().catch(() => 0)) {
    await input.fill(value).catch(() => {});
    return true;
  }

  return false;
}

/** Greenhouse marks required fields several different ways. */
async function isRequired(container: Locator, questionText: string): Promise<boolean> {
  if (/\*\s*$/.test(questionText.trim())) return true;
  const flagged = container.locator("[required], [aria-required='true']");
  return (await flagged.count().catch(() => 0)) > 0;
}

/**
 * Walk every question on the form and answer what we can.
 * Anything required and unanswerable is returned for the caller to park on.
 */
async function answerQuestions(
  form: Locator,
  c: Candidate,
  jobCountry: string | null,
): Promise<string[]> {
  const blocked: string[] = [];

  // Greenhouse wraps each question in its own div; both generations expose a
  // label, which is the only stable handle across them.
  const fields = form.locator("div:has(> label), div.field, div[class*='question']");
  const count = Math.min(await fields.count().catch(() => 0), 80);

  for (let i = 0; i < count; i++) {
    const container = fields.nth(i);
    const label = container.locator("label").first();
    if (!(await label.count().catch(() => 0))) continue;

    const question = ((await label.textContent().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
    if (!question) continue;

    // Already handled by the core-field pass.
    if (/^(first name|last name|email|phone|resume|cv|cover letter)/i.test(question)) continue;

    const required = await isRequired(container, question);

    if (isEeo(question)) {
      // Voluntary, and declining is a normal answer. Whoever asked to handle
      // these personally gets the application held back instead.
      if (c.eeoHandling === "manual") {
        if (required) blocked.push(`EEO question held for manual answer: "${question.slice(0, 80)}"`);
        continue;
      }
      const declined =
        (await setControl(container, "Decline To Self Identify")) ||
        (await setControl(container, "I don't wish to answer")) ||
        (await setControl(container, "Prefer not to say")) ||
        (await setControl(container, "Decline"));
      if (!declined && required) {
        blocked.push(`could not decline EEO question: "${question.slice(0, 80)}"`);
      }
      continue;
    }

    const answer = answerFor(question, c, jobCountry);
    if ("skip" in answer) continue;
    if ("unanswerable" in answer) {
      if (required) blocked.push(answer.unanswerable);
      continue;
    }

    const ok = await setControl(container, answer.value);
    if (!ok && required) {
      blocked.push(`could not set an answer for: "${question.slice(0, 80)}"`);
    }
  }

  return blocked;
}

/** Required controls still empty after everything above. */
async function emptyRequiredFields(form: Locator): Promise<number> {
  return form
    .locator("input[required]:not([type='hidden']):not([type='file']), select[required], textarea[required]")
    // Structural cast rather than HTMLInputElement: this callback is
    // serialised into the page, but it is type-checked here, where tsconfig's
    // lib is Node-only and has no DOM globals.
    .evaluateAll((els) => els.filter((e) => !(e as { value?: string }).value).length)
    .catch(() => 0);
}

/**
 * The form lives either on the page or inside Greenhouse's embed iframe.
 * Returning the right scope up front means nothing below has to care.
 */
async function locateForm(page: Page): Promise<Locator | null> {
  const direct = page.locator("form#application_form, form[id*='application'], form:has(input[type='file'])").first();
  if (await direct.count().catch(() => 0)) return direct;

  const frame = page.frameLocator("#grnhse_iframe, iframe[src*='greenhouse']");
  const embedded = frame.locator("form").first();
  if (await embedded.count().catch(() => 0)) return embedded;

  return null;
}

async function applyToGreenhouse(ctx: ApplyContext): Promise<ApplyOutcome> {
  const { application, resolvedUrl, dryRun } = ctx;
  const base = { applicationId: application.id, company: application.company_name };

  const candidate = await loadCandidate(application);
  if (!candidate) return { status: "needs_human", reason: "Could not load candidate profile" };

  const gaps = missingEssentials(candidate);
  if (gaps.length) {
    await discardResume(candidate.resumePath);
    // A vault gap fails identically on every retry, so this is a park.
    return { status: "needs_human", reason: `Vault incomplete: ${gaps.join(", ")}` };
  }

  try {
    return await withContext(async (browserCtx) => {
      const page = await browserCtx.newPage();
      await page.goto(resolvedUrl, { waitUntil: "domcontentloaded" });

      // Some boards put the form behind an Apply button.
      const applyBtn = page.getByRole("button", { name: /apply( for this job)?/i }).first();
      if (await applyBtn.count().catch(() => 0)) {
        await applyBtn.click().catch(() => {});
      }

      const form = await locateForm(page);

      // Runs whether or not a form was found — it needs to know which, because
      // a challenge widget means something different in each case.
      const challenge = await detectChallenge(page, form !== null);
      if (challenge) {
        const shot = await captureEvidence(page, application.id, "blocked");
        return { status: "needs_human", reason: challenge, ...(shot ? { evidence: shot } : {}) };
      }

      if (!form) {
        const shot = await captureEvidence(page, application.id, "no-form");
        return {
          status: "needs_human",
          reason: "No application form found on the page",
          ...(shot ? { evidence: shot } : {}),
        };
      }

      // Read once, before anything is filled: several questions ask about
      // work authorisation "in the country where this role is located" without
      // ever naming it.
      const jobCountry = await readJobCountry(page);
      log.info("job country", { ...base, jobCountry });

      await fillIfPresent(form, SELECTORS.firstName, candidate.firstName);
      await fillIfPresent(form, SELECTORS.lastName, candidate.lastName);
      await fillIfPresent(form, SELECTORS.email, candidate.email);
      await fillIfPresent(form, SELECTORS.phone, candidate.phone);
      await fillIfPresent(form, SELECTORS.coverLetterText, candidate.coverLetter);

      const resumeInput = await find(form, SELECTORS.resume);
      if (!resumeInput) {
        await captureEvidence(page, application.id, "no-resume-input");
        return { status: "needs_human", reason: "No resume upload field found" };
      }
      await resumeInput.setInputFiles(candidate.resumePath!);

      const blocked = await answerQuestions(form, candidate, jobCountry);
      if (blocked.length) {
        const evidence = await captureEvidence(page, application.id, "blocked-questions");
        log.info("parking on unanswerable questions", { ...base, blocked });
        return {
          status: "needs_human",
          reason: `Needs a person: ${blocked.slice(0, 3).join("; ")}`,
          ...(evidence ? { evidence } : {}),
        };
      }

      const stillEmpty = await emptyRequiredFields(form);
      if (stillEmpty > 0) {
        await captureEvidence(page, application.id, "incomplete");
        return { status: "needs_human", reason: `${stillEmpty} required field(s) still empty` };
      }

      const evidence = await captureEvidence(page, application.id, dryRun ? "dry-run" : "before-submit");

      if (dryRun) {
        // The form is complete and would submit. process.ts turns this into a
        // parked "dry run" row rather than a submission — the adapter's job is
        // to report readiness, not to decide policy.
        log.info("dry run: form completed, not submitting", { ...base });
        return { status: "submitted", ...(evidence ? { evidence } : {}) };
      }

      const submit = await find(form, SELECTORS.submit);
      if (!submit) return { status: "needs_human", reason: "No submit button found" };
      await submit.click();

      // ── Past this point the application may already be with the employer.
      // Nothing below may return "failed", because that hands the row back for
      // a retry and a retry would apply twice. Ambiguity goes to a human.
      const confirmed = await page
        .waitForSelector(
          "text=/application submitted|thank you for applying|we.ve received your application|submitted successfully/i",
          { timeout: 20_000 },
        )
        .then(() => true)
        .catch(() => false);

      const after = await captureEvidence(page, application.id, "after-submit");

      if (!confirmed) {
        return {
          status: "needs_human",
          reason: "Clicked submit but saw no confirmation — verify before resending",
          ...(after ? { evidence: after } : {}),
        };
      }

      log.info("submitted", { ...base });
      return { status: "submitted", ...(after ? { evidence: after } : {}) };
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    log.error("greenhouse adapter threw", { ...base, error: reason });
    // Reached only before the submit click — everything after it is handled
    // above — so a retry here cannot double-apply.
    return { status: "failed", reason: `Greenhouse: ${reason}` };
  } finally {
    await discardResume(candidate.resumePath);
  }
}

export const greenhouseAdapter: Adapter = {
  provider: "greenhouse",
  canHandle: (url) => /(^|\.)(job-)?boards\.greenhouse\.io|greenhouse\.io/i.test(url),
  apply: applyToGreenhouse,
};
