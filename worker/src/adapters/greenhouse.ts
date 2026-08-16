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

/** Aliases that show up in question text but not in the vault's list. */
const COUNTRY_ALIASES: Record<string, string> = {
  "united states": "United States",
  "the united states": "United States",
  "the u.s.": "United States",
  "u.s.": "United States",
  "us": "United States",
  "usa": "United States",
  "america": "United States",
  "united kingdom": "United Kingdom",
  "the uk": "United Kingdom",
  "uk": "United Kingdom",
  "great britain": "United Kingdom",
  "canada": "Canada",
  "australia": "Australia",
  "new zealand": "New Zealand",
  "ireland": "Ireland",
  "switzerland": "Switzerland",
  "european union": "European Union",
  "the eu": "European Union",
  "eu": "European Union",
};

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

/** Pull a country we recognise out of a question's wording. */
function countryInText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const c of KNOWN_COUNTRIES) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  // Longest alias first, so "united states" is not shadowed by "us".
  const aliases = Object.keys(COUNTRY_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (new RegExp(`\\b${alias.replace(/[.]/g, "\\.")}\\b`).test(lower)) {
      return COUNTRY_ALIASES[alias]!;
    }
  }
  return null;
}

type Answer = { value: string } | { skip: true } | { unanswerable: string };

/**
 * Decide what a question should be answered with, using only stored data.
 *
 * Returning `unanswerable` is a normal outcome, not an error — it is how the
 * application ends up with a person instead of a guess.
 */
function answerFor(question: string, c: Candidate): Answer {
  const q = question.toLowerCase();

  // ── Work authorisation ──────────────────────────────────────────────
  if (/(legally )?(authoriz|authoris)ed to work|right to work|work authoriz/.test(q)) {
    const country = countryInText(question);
    if (!country) return { unanswerable: `work authorisation, country unclear: "${question}"` };
    if (!c.authorizedCountries.length) return { unanswerable: "no work authorisation on file" };
    return { value: c.authorizedCountries.includes(country) ? "Yes" : "No" };
  }

  // ── Sponsorship ─────────────────────────────────────────────────────
  if (/sponsor/.test(q)) {
    const country = countryInText(question);
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
async function answerQuestions(form: Locator, c: Candidate): Promise<string[]> {
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

    const answer = answerFor(question, c);
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
      if (!form) {
        await captureEvidence(page, application.id, "no-form");
        return { status: "needs_human", reason: "No application form found on the page" };
      }

      // A login wall or bot check is a verdict, not a failure to retry.
      const bodyText = ((await page.textContent("body").catch(() => "")) ?? "").toLowerCase();
      if (/are you a robot|verify you are human|cloudflare|captcha/.test(bodyText)) {
        await captureEvidence(page, application.id, "blocked");
        return { status: "needs_human", reason: "Bot check on the application page" };
      }

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

      const blocked = await answerQuestions(form, candidate);
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
