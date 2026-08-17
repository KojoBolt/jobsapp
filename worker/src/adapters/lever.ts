import type { Locator, Page } from "playwright";
import type { Adapter, ApplyContext, ApplyOutcome } from "./types.ts";
import {
  answerFor,
  CHALLENGE_SELECTOR,
  countryInText,
  DECLINE_OPTION,
  isEeo,
} from "./answers.ts";
import { withContext } from "../browser.ts";
import { captureEvidence } from "../evidence.ts";
import { log } from "../log.ts";
import { discardResume, loadCandidate, missingEssentials, type Candidate } from "../candidate.ts";

/**
 * Lever job board adapter.
 *
 * Structurally far kinder than Greenhouse, and the probe of a live form says
 * why:
 *
 *   nativeSelects: 0   comboboxes: 0   radios: 11   checkboxes: 10
 *
 * There are no dropdowns at all. Custom questions are radio groups, checkbox
 * groups, text inputs and textareas — plain HTML, none of the React widget
 * machinery Greenhouse needed. The core fields carry stable, semantic `name`
 * attributes rather than generated ids, so they are addressed directly.
 *
 * Four things about Lever that Greenhouse does not have, each handled below:
 *
 *   1. The résumé is PARSED on upload and can overwrite fields, so it is
 *      attached first and the text fields are filled afterwards.
 *   2. Required is marked with "✱" (U+2731), not an asterisk.
 *   3. The visible submit button is #btn-submit with type="button". A hidden
 *      #hcaptchaSubmitBtn carries type="submit" — clicking that instead does
 *      nothing useful.
 *   4. Full name is ONE field, not first + last.
 */

/** Lever's own field names, which are stable across every board. */
const F = {
  resume: "input[type='file'][name='resume']",
  name: "input[name='name']",
  email: "input[name='email']",
  phone: "input[name='phone']",
  location: "input[name='location']",
  org: "input[name='org']",
  linkedin: "input[name='urls[LinkedIn]']",
  other: "input[name='urls[Other]']",
  github: "input[name='urls[GitHub]']",
  portfolio: "input[name='urls[Portfolio]']",
  submit: "#btn-submit",
} as const;

/**
 * Lever marks required with "✱" (U+2731 HEAVY ASTERISK), not "*".
 * Both are accepted so one adapter's convention cannot silently become the
 * other's bug.
 */
const REQUIRED_MARK = /[*✱]/;
const bareLabel = (q: string) => q.replace(/[\s*✱·:]+$/, "").replace(/\s+/g, " ").trim();

/** Core fields filled by name above — skipped by the question pass. */
const CORE_FIELD =
  /^(full )?name\b|^email\b|^phone\b|^current location\b|^location\b|^current company\b|^resume|^cv\b|^cover letter|^linkedin|^other website|^github|^portfolio|^website/i;

async function fill(scope: Page | Locator, selector: string, value: string): Promise<boolean> {
  if (!value) return false;
  const loc = scope.locator(selector).first();
  if (!(await loc.count().catch(() => 0))) return false;
  await loc.fill(value).catch(() => {});
  return true;
}

/**
 * One question and the controls that answer it.
 *
 * Radio and checkbox groups share a `name`, so the group is the unit of
 * meaning — not the individual input. Grouping by name is what stops the
 * adapter treating "Prefer not to say" as a question of its own.
 */
interface DomInput {
  type?: string;
  name?: string;
  value?: string;
  required?: boolean;
  parentElement: DomNode | null;
  getAttribute(a: string): string | null;
}

interface DomNode {
  tagName: string;
  textContent: string | null;
  parentElement: DomNode | null;
  querySelector(s: string): { textContent: string | null } | null;
}

interface Group {
  name: string;
  kind: "radio" | "checkbox" | "text";
  question: string;
  required: boolean;
  options: string[];
}

async function readGroups(form: Locator): Promise<Group[]> {
  return form
    .locator("input:not([type='hidden']):not([type='file']):not([type='submit']):not([type='button']), textarea")
    .evaluateAll((els) => {
      const byName: Record<string, {
        name: string;
        kind: string;
        question: string;
        required: boolean;
        options: string[];
      }> = {};

      for (let i = 0; i < els.length; i++) {
        // Structural casts: this callback is serialised into the page but type-
        // checked here, where tsconfig lib is Node-only and has no DOM globals.
        const e = els[i] as unknown as DomInput;
        const type = (e.type || "").toLowerCase();
        const kind = type === "radio" || type === "checkbox" ? type : "text";
        const key = e.name || `anon-${i}`;

        if (!byName[key]) {
          // Lever puts the question in `.application-label` / `.application-question`
          // above the group; the <label> nearest an option is the OPTION's own
          // text, which is why walking up for a label first gives "18-20"
          // rather than "What is your age?".
          let question = "";
          let n: DomNode | null = e.parentElement;
          for (let d = 0; n && d < 7; d++) {
            const q = n.querySelector(".application-question .text, .application-label, .text");
            if (q && q.textContent && q.textContent.trim().length > 3) {
              question = q.textContent;
              break;
            }
            n = n.parentElement;
          }
          if (!question) question = e.getAttribute("aria-label") || e.name || "";

          byName[key] = {
            name: e.name || key,
            kind,
            question: question.replace(/\s+/g, " ").trim().slice(0, 200),
            required: false,
            options: [],
          };
        }

        if (e.required) byName[key]!.required = true;

        if (kind !== "text") {
          // The option's own words live in its wrapping <label>.
          let text = "";
          let p: DomNode | null = e.parentElement;
          for (let d = 0; p && d < 3; d++) {
            if (p.tagName === "LABEL" && p.textContent) { text = p.textContent; break; }
            p = p.parentElement;
          }
          byName[key]!.options.push(text.replace(/\s+/g, " ").trim() || (e.value ?? ""));
        }
      }

      return Object.keys(byName).map((k) => byName[k]!);
    })
    .then((rows) => rows as Group[])
    .catch(() => [] as Group[]);
}

/** Tick the option in a radio/checkbox group whose text matches. */
async function chooseOption(
  form: Locator,
  group: Group,
  matcher: (optionText: string) => boolean,
): Promise<boolean> {
  const inputs = form.locator(`input[name="${group.name.replace(/"/g, '\\"')}"]`);
  const total = Math.min(await inputs.count().catch(() => 0), 40);

  for (let i = 0; i < total; i++) {
    const text = group.options[i] ?? "";
    if (!text || !matcher(text)) continue;

    const input = inputs.nth(i);
    // Lever hides the real input behind a styled label, so the label is what
    // takes the click. check() on a visually hidden input throws.
    const label = input.locator("xpath=ancestor::label[1]");
    if (await label.count().catch(() => 0)) {
      await label.first().click().catch(() => {});
    } else {
      await input.check().catch(() => {});
    }
    if (await input.isChecked().catch(() => false)) return true;
  }
  return false;
}

async function answerGroups(
  form: Locator,
  c: Candidate,
  jobCountry: string | null,
  jobLocation: string,
): Promise<string[]> {
  const blocked: string[] = [];
  const groups = await readGroups(form);

  for (const g of groups) {
    const label = bareLabel(g.question);
    if (!label || CORE_FIELD.test(label)) continue;

    const required = g.required || REQUIRED_MARK.test(g.question);

    if (isEeo(label)) {
      if (c.eeoHandling === "manual") {
        if (required) blocked.push(`EEO question held for manual answer: "${label.slice(0, 70)}"`);
        continue;
      }
      if (g.kind === "text") continue; // a free-text demographic question: leave it
      const declined = await chooseOption(form, g, DECLINE_OPTION);
      if (!declined && required) blocked.push(`could not decline: "${label.slice(0, 70)}"`);
      continue;
    }

    const answer = answerFor(label, c, jobCountry, jobLocation);
    if ("skip" in answer) continue;
    if ("unanswerable" in answer) {
      if (required) blocked.push(answer.unanswerable);
      continue;
    }

    let ok: boolean;
    if (g.kind === "text") {
      ok = "value" in answer
        ? await fill(form, `[name="${g.name}"]`, answer.value)
        : "values" in answer
          ? await fill(form, `[name="${g.name}"]`, answer.values.join(", "))
          : false;
    } else if ("matcher" in answer) {
      ok = await chooseOption(form, g, answer.matcher);
      // Same as Greenhouse: a consent checkbox has no options to match — the
      // tick is the answer. Its label reads "By checking this box, I consent
      // to…", which no option matcher will ever accept.
      if (!ok && g.kind === "checkbox" && answer.label === "acknowledged") {
        ok = await chooseOption(form, g, () => true);
      }
    } else if ("values" in answer) {
      // A checkbox group with several applicable answers.
      const wantedSet = answer.values.map((v) => v.toLowerCase());
      ok = await chooseOption(form, g, (o) => wantedSet.includes(o.trim().toLowerCase()));
    } else {
      const value = answer.value;
      const wanted = value.toLowerCase();
      ok = await chooseOption(form, g, (o) => o.trim().toLowerCase() === wanted)
        || await chooseOption(form, g, (o) => o.trim().toLowerCase().startsWith(wanted));

      // "No" on a single checkbox is an unticked box — already the state we
      // want, so it counts as answered rather than as a failure.
      if (!ok && g.kind === "checkbox" && /^(no|false|decline)$/i.test(value)) ok = true;
    }

    if (!ok && required) {
      const wanted =
        "matcher" in answer ? answer.label : "values" in answer ? answer.values.join(", ") : answer.value;
      blocked.push(`could not set "${wanted}" for: "${label.slice(0, 60)}"`);
    }
  }

  return blocked;
}

/** Only a visible, sizeable challenge widget blocks anything. */
async function blockingChallenge(scope: Page | Locator): Promise<boolean> {
  const widgets = scope.locator(CHALLENGE_SELECTOR);
  const total = Math.min(await widgets.count().catch(() => 0), 10);
  for (let i = 0; i < total; i++) {
    const w = widgets.nth(i);
    if (!(await w.isVisible().catch(() => false))) continue;
    const box = await w.boundingBox().catch(() => null);
    if (box && box.width > 40 && box.height > 40) return true;
  }
  return false;
}

/** Lever posting pages show the location in the header. */
async function readJobLocation(page: Page): Promise<string> {
  for (const sel of [".posting-categories .location", ".location", "[class*='location']"]) {
    const text = ((await page.locator(sel).first().textContent().catch(() => null)) ?? "").trim();
    if (text && countryInText(text)) return text.replace(/\s+/g, " ").slice(0, 200);
  }
  return "";
}

async function applyToLever(ctx: ApplyContext): Promise<ApplyOutcome> {
  const { application, resolvedUrl, dryRun } = ctx;
  const base = { applicationId: application.id, company: application.company_name };

  const candidate = await loadCandidate(application);
  if (!candidate) return { status: "needs_human", reason: "Could not load candidate profile" };

  const gaps = missingEssentials(candidate);
  if (gaps.length) {
    await discardResume(candidate.resumePath);
    return { status: "needs_human", reason: `Vault incomplete: ${gaps.join(", ")}` };
  }

  try {
    return await withContext(async (browserCtx) => {
      const page = await browserCtx.newPage();

      // Lever serves the form at /apply; a posting URL without it shows the
      // advert and an Apply button instead.
      const url = /\/apply\/?$/.test(resolvedUrl)
        ? resolvedUrl
        : resolvedUrl.replace(/\/$/, "") + "/apply";
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const form = page.locator("form[action*='apply'], form#application-form, form").first();
      if (!(await form.count().catch(() => 0)) || !(await page.locator(F.name).count().catch(() => 0))) {
        const shot = await captureEvidence(page, application.id, "no-form");
        return {
          status: "needs_human",
          reason: "No Lever application form on the page",
          ...(shot ? { evidence: shot } : {}),
        };
      }

      if (await blockingChallenge(page)) {
        const shot = await captureEvidence(page, application.id, "blocked");
        return {
          status: "needs_human",
          reason: "Interactive captcha on the form",
          ...(shot ? { evidence: shot } : {}),
        };
      }

      const jobLocation = await readJobLocation(page);
      const jobCountry = countryInText(jobLocation);
      log.info("job location", { ...base, jobLocation, jobCountry });

      // ── Résumé FIRST ────────────────────────────────────────────────
      // Lever parses the CV and writes what it finds into name, email, phone
      // and company. Uploading after filling would overwrite good values with
      // whatever the parser guessed.
      await page.locator(F.resume).first().setInputFiles(candidate.resumePath!);
      await page
        .waitForSelector("text=/success|analyz|couldn.t auto-read/i", { timeout: 20_000 })
        .catch(() => {});
      await page.waitForTimeout(800);

      // Filled after the parse, so these win over anything it inferred.
      await fill(page, F.name, candidate.fullName);
      await fill(page, F.email, candidate.email);
      await fill(page, F.phone, candidate.phone);
      await fill(page, F.location, [candidate.city, candidate.country].filter(Boolean).join(", "));
      await fill(page, F.linkedin, candidate.linkedinUrl);
      await fill(page, F.github, candidate.githubUrl);
      await fill(page, F.portfolio, candidate.portfolioUrl);
      await fill(page, F.other, candidate.portfolioUrl || candidate.githubUrl);
      // `org` (current company) is deliberately left alone: the vault does not
      // hold it, and the résumé parser fills it more accurately than a guess.

      const blocked = await answerGroups(form, candidate, jobCountry, jobLocation);
      if (blocked.length) {
        const shot = await captureEvidence(page, application.id, "blocked-questions");
        log.info("parking on unanswerable questions", { ...base, blocked });
        return {
          status: "needs_human",
          reason: `Needs a person (${blocked.length}): ${blocked.slice(0, 3).join("; ")}`,
          blocked,
          ...(shot ? { evidence: shot } : {}),
        };
      }

      const evidence = await captureEvidence(page, application.id, dryRun ? "dry-run" : "before-submit");

      if (dryRun) {
        log.info("dry run: form completed, not submitting", { ...base });
        return { status: "submitted", ...(evidence ? { evidence } : {}) };
      }

      // #btn-submit, never button[type=submit] — the hidden hCaptcha button
      // carries that type and clicking it accomplishes nothing.
      const submit = page.locator(F.submit).first();
      if (!(await submit.isVisible().catch(() => false))) {
        return { status: "needs_human", reason: "Submit button not visible" };
      }
      await submit.click();

      // ── Past here the application may already be with the employer, so
      // nothing below may return "failed": a retry would apply twice.
      const confirmed = await page
        .waitForSelector(
          "text=/thank you|application (has been )?(received|submitted)|we.ve received|successfully submitted/i",
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
    log.error("lever adapter threw", { ...base, error: reason });
    return { status: "failed", reason: `Lever: ${reason}` };
  } finally {
    await discardResume(candidate.resumePath);
  }
}

export const leverAdapter: Adapter = {
  provider: "lever",
  canHandle: (url) => /(^|\.)jobs\.lever\.co|lever\.co\//i.test(url),
  apply: applyToLever,
};
