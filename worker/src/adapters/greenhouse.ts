import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { BrowserContext, Locator, Page } from "playwright";
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
  location: [
    "input[id*='location' i]:not([type='hidden'])",
    "input[name*='location' i]:not([type='hidden'])",
    "input[aria-label*='location' i]",
    "input[autocomplete='address-level2']",
  ],
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
async function readJobLocation(page: Page): Promise<string> {
  const candidates = [
    ".job__location",
    "[class*='location']",
    "[data-testid*='location']",
    "div:below(h1)",
  ];
  for (const sel of candidates) {
    const text = ((await page.locator(sel).first().textContent().catch(() => null)) ?? "").trim();
    // Kept only when it names somewhere we recognise — "[class*='location']"
    // also matches navigation and footers on some boards.
    if (text && countryInText(text)) return text.replace(/\s+/g, " ").slice(0, 200);
  }
  const heading = ((await page.locator("h1, h2").first().textContent().catch(() => null)) ?? "").trim();
  return countryInText(heading) ? heading.replace(/\s+/g, " ").slice(0, 200) : "";
}

/**
 * Relocation options, matched by intent.
 *
 * Order and negation both matter here. Cloudflare's third option reads "I do
 * not live and not willing to relocate to this job's location" — it contains
 * the exact phrase "willing to relocate", so a positive-only match would
 * select the refusal when the candidate said yes. Every test therefore checks
 * for negation first.
 */
const NEGATED = (o: string) =>
  /\b(do not|don't|doesn'?t|not|unable|unwilling|cannot|can'?t|no longer)\b/i.test(o);

const RELOCATION_OPTION = {
  livesThere: (o: string) =>
    !NEGATED(o) && /(currently|already)\s+(live|reside|located|based)|^i live\b/i.test(o),
  willRelocate: (o: string) =>
    !NEGATED(o) && /willing to relocate|open to relocat|would relocate|able to relocate|happy to relocate/i.test(o),
  wontRelocate: (o: string) => NEGATED(o) && /relocat|live/i.test(o),
};

type Answer =
  | { value: string }
  | { matcher: (optionText: string) => boolean; label: string }
  | { skip: true }
  | { unanswerable: string };

/**
 * Decide what a question should be answered with, using only stored data.
 *
 * Returning `unanswerable` is a normal outcome, not an error — it is how the
 * application ends up with a person instead of a guess.
 */
function answerFor(
  question: string,
  c: Candidate,
  jobCountry: string | null,
  jobLocation = "",
): Answer {
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

  // ── Relocation ──────────────────────────────────────────────────────
  if (/relocat|currently live|willing to move|open to moving/.test(q)) {
    // "I currently live in this job's location" is a claim about where they
    // are, not a preference — so it is only made when the posting actually
    // names their city. A country match is not enough: this role lists
    // Austin, New York and San Francisco, and a candidate in Chicago lives in
    // none of them while sharing a country with all three.
    const livesThere =
      !!c.city && !!jobLocation && jobLocation.toLowerCase().includes(c.city.toLowerCase());

    if (livesThere) {
      return { matcher: RELOCATION_OPTION.livesThere, label: "already lives there" };
    }
    if (c.willingToRelocate === "yes") {
      return { matcher: RELOCATION_OPTION.willRelocate, label: "willing to relocate" };
    }
    if (c.willingToRelocate === "no") {
      return { matcher: RELOCATION_OPTION.wontRelocate, label: "not willing to relocate" };
    }
    return { unanswerable: "relocation preference not on file" };
  }

  if (/how did you hear|referr?al source|where did you (hear|find)/.test(q)) {
    return c.hearAboutUs ? { value: c.hearAboutUs } : { skip: true };
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

  // "Are you willing to work from the office(s) listed on the job
  // description?" — answerable, because the candidate already told us which
  // arrangements they want. Answered truthfully even when the truthful answer
  // is the one less likely to get them an interview; the alternative is
  // putting a preference in their mouth they did not express.
  if (/willing to work (from|at|in) the office|work on-?site|commute to the office|in-?office/.test(q)) {
    if (!c.roleTypes.length) return { unanswerable: "office/remote preference not on file" };
    const willing = c.roleTypes.some((r) => /on-?site|hybrid/i.test(r));
    return { value: willing ? "Yes" : "No" };
  }
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
const CHALLENGE_SELECTOR =
  "iframe[src*='challenges.cloudflare.com'], iframe[title*='challenge' i], " +
  "iframe[src*='recaptcha'], .g-recaptcha, #challenge-form, #cf-challenge-running";

/**
 * Is there a challenge widget a person would actually have to solve?
 *
 * The exclusions matter more than the selector. Google's invisible reCAPTCHA
 * renders a floating badge — roughly 256x60, visible, and present on a large
 * share of Greenhouse forms that submit perfectly well without anyone
 * touching it. A naive "visible and bigger than 40x40" test calls that a
 * blocker, and because the badge loads lazily, whether it is on screen when
 * we look depends on network timing. That is worse than a consistent bug: the
 * same job would park or fill at random.
 */
async function hasBlockingWidget(scope: Page | Locator): Promise<boolean> {
  const widgets = scope.locator(CHALLENGE_SELECTOR);
  const total = Math.min(await widgets.count().catch(() => 0), 10);

  for (let i = 0; i < total; i++) {
    const w = widgets.nth(i);

    // The floating badge, by Google's own class name.
    const isBadge = await w
      .evaluate((el) => !!(el as unknown as { closest(s: string): unknown }).closest(".grecaptcha-badge"))
      .catch(() => false);
    if (isBadge) continue;

    // An invisible reCAPTCHA says so in its own iframe URL.
    const src = (await w.getAttribute("src").catch(() => null)) ?? "";
    if (/size=invisible/.test(src)) continue;

    if (!(await w.isVisible().catch(() => false))) continue;

    const box = await w.boundingBox().catch(() => null);
    if (box && box.width > 40 && box.height > 40) return true;
  }
  return false;
}

async function detectChallenge(page: Page, form: Locator | null): Promise<string | null> {
  const formFound = form !== null;

  if (!formFound) {
    // No form at all. Now the page text is worth consulting, because there is
    // nothing else here — but only phrases that appear on challenge pages and
    // essentially nowhere else.
    const text = ((await page.textContent("body").catch(() => "")) ?? "").toLowerCase();
    const interstitial =
      /checking your browser before|verify (that )?you are (a )?human|please complete the security check|enable javascript and cookies to continue|needs to review the security of your connection/
        .test(text);
    if (interstitial || (await hasBlockingWidget(page))) return "Bot challenge interstitial";
    return null;
  }

  // A form exists, so we are on the real page. Scoped to the form on purpose:
  // a widget elsewhere on the page — a badge, a newsletter signup's captcha —
  // is not standing between us and this application.
  if (await hasBlockingWidget(form!)) return "Interactive captcha on the form";
  return null;
}

/**
 * Voluntary demographic questions.
 *
 * Wider than the classic US EEO four. Robinhood's form alone asks about
 * military status (not the word "veteran") and LGBTQ+ identity, and neither
 * matched the first version — so both fell through to the general question
 * rules, came back unanswerable, and parked an application over questions
 * that are optional by law and answerable with "decline".
 */
function isEeo(q: string): boolean {
  return /gender|race|ethnic|hispanic|latino|veteran|military|disabilit|disabled|self-?identif|pronoun|lgbtq|sexual orientation|transgender|demographic/i
    .test(q);
}

/** What a control is, and what it is being asked. Resolved in one page call. */
interface FieldMeta {
  tag: string;
  type: string;
  name: string;
  /** Used to re-find the control by attribute rather than by position. */
  id: string;
  /** "combobox" marks the search input of a React dropdown. */
  role: string;
  question: string;
  required: boolean;
  filled: boolean;
}

/**
 * Read every answerable control and the question attached to it.
 *
 * The first version walked *containers* — `div:has(> label)` and friends — and
 * that is why the last run declined the disability question but left gender,
 * ethnicity and veteran status untouched: those three sit in markup where the
 * label is not a direct child, so the container never matched and the question
 * was never seen. Nothing reported a problem, because as far as the adapter
 * knew there was nothing there.
 *
 * Starting from the controls instead means every control is considered exactly
 * once, and the label is resolved the way a browser does it: aria-label, then
 * `label[for]`, then the nearest enclosing label text.
 */
async function readFields(form: Locator): Promise<FieldMeta[]> {
  return form
    .locator(ANSWERABLE_CONTROLS)
    .evaluateAll((els) =>
      els.map((el) => {
        const e = el as unknown as {
          tagName: string;
          type?: string;
          name?: string;
          id?: string;
          value?: string;
          checked?: boolean;
          required?: boolean;
          getAttribute(a: string): string | null;
          ownerDocument: { querySelectorAll(s: string): ArrayLike<{ getAttribute(a: string): string | null; textContent: string | null }> };
          parentElement: unknown;
        };

        let question = e.getAttribute("aria-label") ?? "";

        // label[for="id"] — matched by walking labels rather than building a
        // selector, so ids containing brackets (job_application[answers][0])
        // do not need escaping.
        if (!question && e.id) {
          const labels = e.ownerDocument.querySelectorAll("label");
          for (let i = 0; i < labels.length; i++) {
            if (labels[i]!.getAttribute("for") === e.id) {
              question = labels[i]!.textContent ?? "";
              break;
            }
          }
        }

        if (!question) {
          let node: unknown = e.parentElement;
          for (let depth = 0; node && depth < 4; depth++) {
            const n = node as {
              querySelector(s: string): { textContent: string | null } | null;
              parentElement: unknown;
            };
            const found = n.querySelector("label");
            if (found?.textContent) {
              question = found.textContent;
              break;
            }
            node = n.parentElement;
          }
        }

        question = question.replace(/\s+/g, " ").trim();

        return {
          tag: e.tagName.toLowerCase(),
          type: (e.type ?? "").toLowerCase(),
          name: e.name ?? "",
          id: e.id ?? "",
          role: e.getAttribute("role") ?? "",
          question,
          // The visible asterisk and the real `required` attribute, but NOT
          // aria-required: measured against a live board, aria-required is
          // "true" on fields the form marks optional — Phone and "Why do you
          // want to work here?" among them. Trusting it reported optional
          // questions as blockers and parked applications that were complete.
          required: e.required === true || /\*/.test(question),
          filled: e.type === "checkbox" || e.type === "radio" ? !!e.checked : !!e.value,
        };
      }),
    )
    .catch(() => [] as FieldMeta[]);
}

const ANSWERABLE_CONTROLS =
  "select, textarea, input:not([type='hidden']):not([type='file'])" +
  ":not([type='submit']):not([type='button'])";

/**
 * Re-find a control from its metadata.
 *
 * By id or name, falling back to position only when it has neither. Position
 * alone is not safe here: Greenhouse forms reveal conditional follow-ups when
 * a question is answered — Robinhood's has two of them, "If you answered Yes
 * to the above question…" — and every field after the newly inserted one
 * shifts by a slot. Index-addressed, the loop would answer question N+1 with
 * question N's answer and never notice.
 *
 * Attribute selectors, not `#id`: Greenhouse ids look like
 * job_application[answers_attributes][0][text_value], and the brackets are
 * CSS syntax.
 */
function locateField(form: Locator, f: FieldMeta, index: number): Locator {
  const quote = (v: string) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  if (f.id) return form.locator(`[id="${quote(f.id)}"]`).first();
  if (f.name) return form.locator(`[name="${quote(f.name)}"]`).first();
  return form.locator(ANSWERABLE_CONTROLS).nth(index);
}

/**
 * Core fields, handled by their own pass — skipped here by label.
 *
 * Matched against the label with its required-marker stripped. "Country*" was
 * not matching `^country$`, so it fell through to the question rules, came
 * back unrecognised, and blocked every single application on these boards.
 *
 * Country is skipped rather than answered on purpose: on Greenhouse it is the
 * phone widget's country selector, already set by the phone number itself.
 * Writing the vault's country into it would rewrite the dialling code and
 * corrupt a phone number that was correct.
 */
const CORE_FIELD =
  /^(first|last|preferred first|legal|full)?\s*name\b|^email|^phone|^resume|^cv\b|^cover letter|^location\b|^country\b/i;

/** Strip the required marker and tidy whitespace before matching. */
const bareLabel = (q: string) => q.replace(/[\s*·:]+$/, "").replace(/\s+/g, " ").trim();

async function answerQuestions(
  form: Locator,
  c: Candidate,
  jobCountry: string | null,
  jobLocation: string,
): Promise<string[]> {
  const blocked: string[] = [];
  const fields = await readFields(form);
  const handledRadioGroups = new Set<string>();
  const handledQuestions = new Set<string>();

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]!;
    const label = bareLabel(f.question);
    if (!label || CORE_FIELD.test(label)) continue;

    // Every react-select contributes TWO matching inputs — the visible search
    // box and a hidden one carrying the value — so each question was being
    // answered twice and reported twice. That is why the same complaint
    // appeared twice in a row in automation_error. The first is the one that
    // takes a value; the duplicate is skipped.
    if (handledQuestions.has(label)) continue;
    handledQuestions.add(label);

    // A radio group is one question spread over several inputs.
    if (f.type === "radio") {
      if (handledRadioGroups.has(f.name)) continue;
      handledRadioGroups.add(f.name);
    }

    const control = locateField(form, f, i);

    if (isEeo(label)) {
      // Voluntary, and declining is a normal answer. Whoever asked to handle
      // these personally gets the application held back instead.
      if (c.eeoHandling === "manual") {
        if (f.required) {
          blocked.push(`EEO question held for manual answer: "${label.slice(0, 80)}"`);
        }
        continue;
      }
      const declined = await setValue(control, f, [], DECLINE_OPTION);
      if (!declined && f.required) {
        blocked.push(`could not decline EEO question: "${label.slice(0, 80)}"`);
      }
      continue;
    }

    const answer = answerFor(label, c, jobCountry, jobLocation);
    if ("skip" in answer) continue;
    if ("unanswerable" in answer) {
      if (f.required) blocked.push(answer.unanswerable);
      continue;
    }

    // A matcher describes the answer rather than naming it — needed wherever
    // the options are whole sentences that differ per employer.
    const ok =
      "matcher" in answer
        ? await setValue(control, f, [], answer.matcher)
        : await setValue(control, f, [answer.value]);

    if (!ok && f.required) {
      const wanted = "matcher" in answer ? answer.label : answer.value;
      blocked.push(`could not set "${wanted}" for: "${label.slice(0, 70)}"`);
    }
  }

  return blocked;
}

/**
 * Options belonging to the dropdown that is currently open.
 *
 * Scoped to `.select__menu` rather than searching the page for [role=option],
 * and that distinction is the whole bug: Greenhouse's phone field keeps a
 * 244-entry country list in the DOM at all times. A page-wide option search
 * finds Afghanistan long before it finds the menu that just opened, then
 * reports that no option matched. Only one react-select menu is open at a
 * time, so "the visible .select__menu" is unambiguous.
 */
/**
 * "I would rather not say", however this particular form words it.
 *
 * A list of exact phrases does not survive contact with real boards. Cloudflare
 * offers "I do not want to answer"; Discord offers "I don't wish to answer";
 * others say "Decline To Self Identify" or "Prefer not to say". Enumerating
 * them means silently missing the next variant — which is what happened here.
 * Matching the intent covers wordings nobody has written yet.
 */
const DECLINE_OPTION = (option: string): boolean =>
  /decline|prefer not|choose not|opt out|no response|(do not|don't|do ?n'?t)\s+(want|wish|care|choose)\s+to\s+(answer|say|disclose|identify|specify|respond)|not\s+to\s+(answer|disclose|identify)|rather not/i
    .test(option);

const MENU_SELECTOR = ".select__menu, [class*='select__menu']";
const OPTION_SELECTOR = ".select__option, [class*='select__option'], [role='option']";

/**
 * Read what a control is actually showing.
 *
 * The whole point of this function is that "the call did not throw" is not
 * evidence a value was set. Typing into a React combobox throws nothing and
 * selects nothing — which is exactly how three runs in a row reported success
 * while every dropdown on the page stayed on "Select...".
 */
export async function readDisplayedValue(control: Locator): Promise<string> {
  return control
    .evaluate((el) => {
      const e = el as unknown as {
        value?: string;
        closest(s: string): { querySelector(s: string): { textContent?: string | null } | null } | null;
      };

      // Inside a react-select, `value` is whatever was typed into the search
      // box — non-empty even when nothing was chosen. Reading it would call
      // "typed three characters, selected nothing" a success. The chosen
      // option lives in .select__single-value and nowhere else.
      const shell = e.closest(".select__control");
      if (shell) {
        const chosen =
          shell.querySelector(".select__single-value") ??
          shell.querySelector("[class*='singleValue']") ??
          shell.querySelector("[class*='multi-value']");
        return (chosen?.textContent ?? "").trim();
      }

      return (e.value ?? "").trim();
    })
    .catch(() => "");
}

/**
 * Set a React dropdown by clicking, exactly as a person would.
 *
 * Open the control, wait for the option list to render, click the option whose
 * visible text is the answer. There is no API to call here — the markup is
 * divs, and selectOption() only understands a native <select>.
 */
export async function setComboboxValue(
  control: Locator,
  value: string,
  prefer?: string,
  matcher?: (optionText: string) => boolean,
): Promise<boolean> {
  const page = control.page();

  // Click the control shell, not the input: react-select opens its menu from
  // the control's own click handler.
  const shell = control.locator("xpath=ancestor::*[contains(@class,'select__control')][1]");
  const opener = (await shell.count().catch(() => 0)) ? shell.first() : control;
  await opener.click().catch(() => {});

  const menu = page.locator(MENU_SELECTOR).first();
  const opened = await menu
    .waitFor({ state: "visible", timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  if (!opened) return false;

  // Typing filters the list, which matters: some of these have hundreds of
  // entries and scanning them one locator at a time is unusably slow.
  // With a matcher there is nothing sensible to type — the whole list has to
  // be read and judged, because the wording is what we are searching for.
  if (!matcher) await control.fill(value).catch(() => {});

  // Poll rather than sleep once. Most of these filter an in-memory list and
  // are ready immediately, but the location field fetches its suggestions
  // from a server — a fixed short wait reads the "Loading..." placeholder as
  // the option list and concludes nothing matched.
  const options = menu.locator(OPTION_SELECTOR);
  // 24 x 250ms = 6s. Measured against a live board, the location field's
  // suggestions arrive around 2s — comfortably inside this, and deliberately
  // so: at 3s it was landing on attempt 8 of 12, close enough to the ceiling
  // that a slow response would look like "no match" rather than "not yet".
  let texts: string[] = [];
  for (let attempt = 0; attempt < 24; attempt++) {
    texts = (await options.allTextContents().catch(() => [] as string[])).map((t) =>
      t.replace(/\s+/g, " ").trim(),
    );
    const stillWorking =
      texts.length === 0 || (texts.length === 1 && /^(loading|searching)/i.test(texts[0]!));
    if (!stillWorking) break;
    await page.waitForTimeout(250);
  }

  const wanted = value.toLowerCase();
  const hint = prefer?.toLowerCase();
  const lower = texts.map((t) => t.toLowerCase());

  // Ranked, most specific first, so a plain "Yes" is never satisfied by
  // "Yes, I will require sponsorship" while a bare "Yes" is on the list.
  // The `prefer` rung disambiguates results that share a prefix: a search for
  // "Accra" returns both "Accra, Greater Accra, Ghana" and "Accra, Western,
  // Ghana", and for cities that exist in several countries the difference is
  // not cosmetic.
  // Word-boundary, never raw substring. "No" appears inside "I do NOt want to
  // answer", and a substring match would answer a disability question with
  // the wrong option and call it a success. This is the mechanism that makes
  // automated answers read like a bot rather than a person.
  const whole = (haystack: string, needle: string) =>
    new RegExp(`(^|[^a-z0-9])${escape(needle)}([^a-z0-9]|$)`, "i").test(haystack);

  const rules: Array<(t: string) => boolean> = [
    (t) => t === wanted,
    // Punctuation-insensitive exact: "Yes." and "Yes," are the same answer.
    (t) => t.replace(/[^a-z0-9]+$/i, "") === wanted,
    ...(hint ? [(t: string) => whole(t, wanted) && whole(t, hint)] : []),
    (t) => t.startsWith(wanted),
    (t) => whole(t, wanted),
  ];

  let index = -1;
  if (matcher) {
    // Judged on the option's own wording, exactly as displayed.
    index = texts.findIndex((t) => matcher(t));
  } else {
    for (const rule of rules) {
      index = lower.findIndex(rule);
      if (index !== -1) break;
    }
  }

  if (index === -1) {
    // Leave nothing open to cover the next field.
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }

  await options.nth(index).click().catch(() => {});
  return true;
}

/**
 * Put the first workable candidate value into a control.
 *
 * Several candidates because forms word the same answer differently —
 * "Decline To Self Identify" here, "I don't wish to answer" there.
 *
 * Every branch verifies by reading the control back. A silent no-op is the
 * failure mode that matters: it produces a form that looks filled to the
 * adapter, passes every check, and arrives at the employer half empty.
 */
async function setValue(
  control: Locator,
  f: FieldMeta,
  candidates: string[],
  matcher?: (optionText: string) => boolean,
): Promise<boolean> {
  // A matcher describes the answer we want rather than naming it, which is how
  // "decline to say" is found across boards that all word it differently.
  if (matcher) {
    if (f.tag === "select") {
      const options = await control.locator("option").allTextContents().catch(() => [] as string[]);
      const match = options.find((o) => matcher(o.trim()));
      if (!match) return false;
      await control.selectOption({ label: match }).catch(() => {});
      return (await readDisplayedValue(control)).length > 0;
    }
    const before = await readDisplayedValue(control);
    if (await setComboboxValue(control, "", undefined, matcher)) {
      const after = await readDisplayedValue(control);
      return !!after && after !== before;
    }
    return false;
  }

  for (const value of candidates) {
    if (f.tag === "select") {
      const options = await control.locator("option").allTextContents().catch(() => [] as string[]);
      const match =
        options.find((o) => o.trim().toLowerCase() === value.toLowerCase()) ??
        options.find((o) => o.trim().toLowerCase().startsWith(value.toLowerCase())) ??
        options.find((o) => o.trim().toLowerCase().includes(value.toLowerCase()));
      if (!match) continue;
      const ok = await control.selectOption({ label: match }).then(() => true).catch(() => false);
      if (ok) return true;
      continue;
    }

    // A combobox: an <input> that is really the search box of a React
    // dropdown. Greenhouse renders every "Select..." on these forms this way.
    if (f.tag === "input" && (f.type === "text" || f.type === "" || f.role === "combobox")) {
      const before = await readDisplayedValue(control);
      if (await setComboboxValue(control, value)) {
        const after = await readDisplayedValue(control);
        if (after && after !== before) return true;
      }
      // Not a dropdown after all — fall through to plain typing below.
    }

    if (f.type === "checkbox") {
      // Only ever ticked for an affirmative — never cleared, since an unticked
      // box is already the safe state.
      if (/^(yes|true|i agree|i acknowledge)$/i.test(value)) {
        const ok = await control.check().then(() => true).catch(() => false);
        if (ok) return true;
      }
      continue;
    }

    if (f.type === "radio") {
      const group = control.page().locator(`input[type='radio'][name="${f.name}"]`);
      const total = await group.count().catch(() => 0);
      for (let i = 0; i < total; i++) {
        const radio = group.nth(i);
        const radioValue = (await radio.getAttribute("value").catch(() => "")) ?? "";
        if (radioValue.trim().toLowerCase() === value.toLowerCase()) {
          const ok = await radio.check().then(() => true).catch(() => false);
          if (ok) return true;
        }
      }
      continue;
    }

    // Plain text box. Verified by reading back, same as everything else.
    await control.fill(value).catch(() => {});
    if ((await readDisplayedValue(control)).trim()) return true;
  }
  return false;
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
 * Fill "Location (City)" from the vault.
 *
 * It had been falling between two stools: the question pass skipped it as a
 * core field, and the core pass had no selector for it — so it was never
 * filled by anything, despite being required on forms like Robinhood's.
 *
 * It is usually a typeahead rather than a plain text box. Typing alone leaves
 * some of them without the internal value they need, so if a suggestion list
 * appears the first entry is chosen. If none appears, the typed text stands.
 */
async function fillLocation(form: Locator, c: Candidate): Promise<boolean> {
  if (!c.city) return false;

  const input = await find(form, SELECTORS.location);
  if (!input) return false;

  // Searched by city alone, with the country as a tie-breaker. Searching
  // "Accra, Ghana" matches nothing: the options read "Accra, Greater Accra,
  // Ghana", so the region in the middle defeats any literal comparison.
  await setComboboxValue(input, c.city, c.country || undefined);

  let shown = await readDisplayedValue(input);

  // Not a dropdown on this board — a plain text box will take the lot.
  if (!shown) {
    await input.fill([c.city, c.country].filter(Boolean).join(", ")).catch(() => {});
    shown = await readDisplayedValue(input);
  }

  // VERIFY, because a wrong answer here is worse than a blank one. A form
  // showing "Chicago, Illinois, United States" for a candidate in Accra is
  // not a cosmetic error — it is a false statement about where they live,
  // sent to an employer under their name. These fields prefill from IP
  // geolocation and keep whatever they were given, so an unchecked write can
  // silently leave the wrong city standing.
  if (shown && !shown.toLowerCase().includes(c.city.toLowerCase())) {
    log.warn("location did not take the candidate's city", { wanted: c.city, shown });
    await input.fill("").catch(() => {});
    return false;
  }

  return !!shown;
}

/**
 * Reveal a section's free-text box.
 *
 * Greenhouse offers Attach / Dropbox / Google Drive / Enter manually, and the
 * textarea does not exist until "Enter manually" is clicked. Looking for a
 * textarea first and giving up when it is absent — which is what the first
 * version did — silently skipped every cover letter on a form of this shape.
 *
 * Both the résumé and cover letter sections carry an identical button, so the
 * right one is found by walking up from each button until a container mentions
 * the section we want.
 */
async function clickManualEntry(form: Locator, sectionText: string): Promise<boolean> {
  const buttons = form.getByRole("button", { name: /enter manually|paste|type/i });
  const total = Math.min(await buttons.count().catch(() => 0), 6);

  for (let i = 0; i < total; i++) {
    const btn = buttons.nth(i);
    const belongsHere = await btn
      .evaluate((el, needle) => {
        let node: unknown = (el as unknown as { parentElement: unknown }).parentElement;
        for (let depth = 0; node && depth < 6; depth++) {
          const n = node as { textContent?: string | null; parentElement?: unknown };
          if ((n.textContent ?? "").toLowerCase().includes(needle)) return true;
          node = n.parentElement;
        }
        return false;
      }, sectionText.toLowerCase())
      .catch(() => false);

    if (belongsHere) {
      await btn.click().catch(() => {});
      return true;
    }
  }
  return false;
}

/**
 * Render the cover letter as a PDF using the browser already running.
 *
 * Chosen over a PDF library because it adds no dependency, no bundled fonts
 * and no layout code to maintain — and over a plain .txt because a recruiter
 * opening a raw text file next to a designed CV notices.
 *
 * page.pdf() is headless-Chromium only, so this returns null under a headed
 * run and the caller falls back to .txt. A slightly plainer attachment while
 * debugging is a fair price for not maintaining a typesetter.
 */
async function renderCoverLetter(
  browserCtx: BrowserContext,
  text: string,
  candidateName: string,
): Promise<string | null> {
  const dir = await fs.mkdtemp(join(tmpdir(), "cl-"));
  const safeName = candidateName.replace(/[^\w\s-]/g, "").trim() || "Candidate";
  const pdfPath = join(dir, `Cover Letter - ${safeName}.pdf`);

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const page = await browserCtx.newPage();
  try {
    await page.setContent(
      `<html><head><meta charset="utf-8"><style>
         @page { margin: 25mm 20mm; }
         body { font: 11pt/1.6 Georgia, "Times New Roman", serif; color: #111; }
         p { margin: 0 0 1em; white-space: pre-wrap; }
       </style></head><body>${escaped
         .split(/\n{2,}/)
         .map((para) => `<p>${para}</p>`)
         .join("")}</body></html>`,
      { waitUntil: "load" },
    );
    await page.pdf({ path: pdfPath, format: "A4", printBackground: false });
    return pdfPath;
  } catch (err) {
    log.warn("cover letter PDF failed, will fall back to text", { error: String(err) });
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

/** Same folder, plain text — the fallback when a PDF cannot be produced. */
async function writeCoverLetterTxt(text: string, candidateName: string): Promise<string> {
  const dir = await fs.mkdtemp(join(tmpdir(), "cl-"));
  const safeName = candidateName.replace(/[^\w\s-]/g, "").trim() || "Candidate";
  const path = join(dir, `Cover Letter - ${safeName}.txt`);
  await fs.writeFile(path, text, "utf8");
  return path;
}

/**
 * Attach the cover letter however this particular form allows.
 *
 * Manual text is preferred where it exists: it lands in the ATS as a
 * searchable field rather than a binary the recruiter has to download. A file
 * is the fallback, and no cover letter at all is better than no application —
 * it is rarely required, so this never blocks.
 */
async function attachCoverLetter(
  form: Locator,
  browserCtx: BrowserContext,
  c: Candidate,
): Promise<{ how: string; tempPath: string | null }> {
  if (!c.coverLetter) return { how: "none-drafted", tempPath: null };

  // 1. A textarea already on the page.
  if (await fillIfPresent(form, SELECTORS.coverLetterText, c.coverLetter)) {
    return { how: "text", tempPath: null };
  }

  // 2. One hidden behind "Enter manually".
  if (await clickManualEntry(form, "cover letter")) {
    await form.page().waitForTimeout(400); // the textarea animates in
    if (await fillIfPresent(form, SELECTORS.coverLetterText, c.coverLetter)) {
      return { how: "text-after-reveal", tempPath: null };
    }
  }

  // 3. Upload instead.
  const fileInput = await findCoverLetterFileInput(form);
  if (!fileInput) return { how: "no-field", tempPath: null };

  const name = c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ");
  const pdf = await renderCoverLetter(browserCtx, c.coverLetter, name);
  const path = pdf ?? (await writeCoverLetterTxt(c.coverLetter, name));
  await fileInput.setInputFiles(path).catch(() => {});
  return { how: pdf ? "pdf" : "txt", tempPath: path };
}

/**
 * The cover letter's own file input — never the résumé's.
 *
 * Both are `input[type=file]`, so picking "the first one" would overwrite the
 * CV with the cover letter, which is the kind of mistake nobody notices until
 * a candidate asks why they were rejected.
 */
async function findCoverLetterFileInput(form: Locator): Promise<Locator | null> {
  const named = form.locator(
    "input[type='file'][name*='cover' i], input[type='file'][id*='cover' i]",
  ).first();
  if (await named.count().catch(() => 0)) return named;

  const inputs = form.locator("input[type='file']");
  const total = Math.min(await inputs.count().catch(() => 0), 6);
  for (let i = 0; i < total; i++) {
    const input = inputs.nth(i);
    const nearCoverLetter = await input
      .evaluate((el) => {
        let node: unknown = (el as unknown as { parentElement: unknown }).parentElement;
        for (let depth = 0; node && depth < 6; depth++) {
          const n = node as { textContent?: string | null; parentElement?: unknown };
          if ((n.textContent ?? "").toLowerCase().includes("cover letter")) return true;
          node = n.parentElement;
        }
        return false;
      })
      .catch(() => false);
    if (nearCoverLetter) return input;
  }
  return null;
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

  /** Set only when a cover letter file was generated, so `finally` can bin it. */
  let coverLetterTemp: string | null = null;

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
      const challenge = await detectChallenge(page, form);
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
      const jobLocation = await readJobLocation(page);
      const jobCountry = countryInText(jobLocation);
      log.info("job location", { ...base, jobLocation, jobCountry });

      await fillIfPresent(form, SELECTORS.firstName, candidate.firstName);
      await fillIfPresent(form, SELECTORS.lastName, candidate.lastName);
      await fillIfPresent(form, SELECTORS.email, candidate.email);
      await fillIfPresent(form, SELECTORS.phone, candidate.phone);
      const locationOk = await fillLocation(form, candidate);

      const resumeInput = await find(form, SELECTORS.resume);
      if (!resumeInput) {
        await captureEvidence(page, application.id, "no-resume-input");
        return { status: "needs_human", reason: "No resume upload field found" };
      }
      await resumeInput.setInputFiles(candidate.resumePath!);

      // After the résumé, so a form with two file inputs already has the CV in
      // the first one and cannot confuse the two.
      const cover = await attachCoverLetter(form, browserCtx, candidate);
      coverLetterTemp = cover.tempPath;
      log.info("cover letter", { ...base, how: cover.how });

      const blocked = await answerQuestions(form, candidate, jobCountry, jobLocation);

      // A required location we could not set correctly is a park, not a
      // shrug: the field is cleared above, so submitting would either fail
      // validation or send a blank where an address was asked for.
      if (!locationOk && candidate.city) {
        const required = await form
          .locator("label")
          .filter({ hasText: /location.*\*|location \(city\)/i })
          .count()
          .catch(() => 0);
        if (required) blocked.push(`could not set location to "${candidate.city}"`);
      }
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
    await discardResume(coverLetterTemp);
  }
}

export const greenhouseAdapter: Adapter = {
  provider: "greenhouse",
  canHandle: (url) => /(^|\.)(job-)?boards\.greenhouse\.io|greenhouse\.io/i.test(url),
  apply: applyToGreenhouse,
};
