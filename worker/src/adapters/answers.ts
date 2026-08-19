/**
 * How to answer an application question from the Identity Vault.
 *
 * Shared by every ATS adapter deliberately. What a question MEANS does not
 * change between Greenhouse and Lever — only the markup does. These rules cost
 * several real bugs to get right: "us" matching inside "tell us about",
 * "No" matching inside "I do NOt want to answer", and a refusal option that
 * contains the exact phrase "willing to relocate". A second copy would drift
 * away from those fixes quietly.
 *
 * THE RULE THEY ALL SERVE: a required question we cannot answer from stored
 * data parks the application for a human. It never gets a guess — a wrong
 * answer is not a worse application, it is a false statement on a real one.
 */

import { KNOWN_COUNTRIES, type Candidate } from "../candidate.ts";

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
  /\b(this|the) country\b|country (where|in which) (this|the) (role|position|job)|country of (the )?(role|position|employment)|where this role is located|country in which you are applying|country you are applying|stated location of this role|location of this (role|position)/i;

export const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
 * Relocation options, matched by intent.
 *
 * Order and negation both matter here. Cloudflare's third option reads "I do
 * not live and not willing to relocate to this job's location" — it contains
 * the exact phrase "willing to relocate", so a positive-only match would
 * select the refusal when the candidate said yes. Every test therefore checks
 * for negation first.
 */
export const NEGATED = (o: string) =>
  /\b(do not|don't|doesn'?t|not|unable|unwilling|cannot|can'?t|no longer)\b/i.test(o);

/**
 * Bare yes/no options.
 *
 * Employers word this question two completely different ways. Cloudflare
 * offers whole sentences — "I am willing to relocate to this job's location."
 * Stripe offers plain Yes / No. Matching only the sentence form left Stripe's
 * dropdown empty and blocked the application, so each intent below also
 * accepts the bare answer that means the same thing.
 */
const BARE_YES = (o: string) => /^\s*yes\b/i.test(o);
const BARE_NO = (o: string) => /^\s*no\b/i.test(o);

/** However a form words "yes, I have seen this notice". */
export const ACKNOWLEDGE_OPTION = (o: string): boolean =>
  !NEGATED(o) &&
  /^\s*(yes|i acknowledge|acknowledge|i agree|agree|i confirm|confirm|i consent|consent|i have read|understood|i understand|accept)\b/i
    .test(o.trim());

export const RELOCATION_OPTION = {
  livesThere: (o: string) =>
    (!NEGATED(o) && /(currently|already)\s+(live|reside|located|based)|^i live\b/i.test(o)) || BARE_YES(o),
  willRelocate: (o: string) =>
    (!NEGATED(o) &&
      /willing to relocate|open to relocat|would relocate|able to relocate|happy to relocate/i.test(o)) ||
    BARE_YES(o),
  wontRelocate: (o: string) => (NEGATED(o) && /relocat|live/i.test(o)) || BARE_NO(o),
};

export type Answer =
  | { value: string }
  /** Several answers at once — a checkbox group where more than one applies. */
  | { values: string[] }
  | { matcher: (optionText: string) => boolean; label: string }
  | { skip: true }
  | { unanswerable: string };

/**
 * Decide what a question should be answered with, using only stored data.
 *
 * Returning `unanswerable` is a normal outcome, not an error — it is how the
 * application ends up with a person instead of a guess.
 */
export function answerFor(
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
  // Marketing consent is NOT an acknowledgement, whatever words it borrows.
  // Lever's forms carry "Yes, {company} can contact me about future job
  // opportunities… Privacy policy" — which mentions a privacy policy and would
  // otherwise be ticked. Signing someone up for marketing they never asked for
  // is not inside "apply to this job on my behalf". Left unticked, which is
  // both the neutral state and the lawful default.
  // Marketing and messaging opt-ins. Answered "No" rather than skipped:
  // Stripe's "Do you opt in to receive WhatsApp messages from Stripe
  // Recruiting?" is REQUIRED, so skipping it left the field blank and blocked
  // an otherwise complete application. Declining is truthful, respects the
  // candidate, and unblocks the form — silence does neither.
  if (
    /contact me about|future (job )?opportunit|marketing|job alerts|newsletter|talent (community|network)|opt ?in to receive|whatsapp|sms|text messages/
      .test(q)
  ) {
    return { value: "No" };
  }

  if (/acknowledg|privacy (policy|notice)|i (have )?(read|agree)|consent to|confirm receipt/.test(q)) {
    // A matcher, not the literal "Yes": Robinhood's dropdown offers
    // "I acknowledge", Brex's offers "I consent", and answering those with
    // the word "Yes" matched nothing at all.
    return { matcher: ACKNOWLEDGE_OPTION, label: "acknowledged" };
  }

  // ── Employment history ──────────────────────────────────────────────
  const latestJob = c.employment[0];

  /**
   * Bare labels as well as questions.
   *
   * Coinbase's Employment section is labelled "Company name" and "Title" —
   * no sentence, no question mark. Matching only the conversational phrasings
   * left both blank on a form that clearly wanted the history we now hold.
   */
  if (
    /who is your (current|previous|most recent)|current or previous employer|name of (your )?(current|previous|last) employer|current company|^company name\b|^employer\b|^organi[sz]ation\b/
      .test(q)
  ) {
    return latestJob?.employer
      ? { value: latestJob.employer }
      : { unanswerable: "employment history not on file" };
  }

  if (
    /current or previous job title|what is your (current|previous|most recent) (job )?title|your job title|^title\b|^job title\b|^position title\b|^role title\b/
      .test(q)
  ) {
    return latestJob?.title
      ? { value: latestJob.title }
      : { unanswerable: "employment history not on file" };
  }

  // The "Current role" checkbox beside the dates. Answered from the flag the
  // candidate ticked, so it cannot contradict the end date beside it.
  if (/^current role\b|^i currently work here\b|^current position\b/.test(q)) {
    if (!latestJob) return { unanswerable: "employment history not on file" };
    return { value: latestJob.current ? "Yes" : "No" };
  }

  /**
   * "Have you ever been employed by Stripe?" — asked by five different
   * employers in the measured data, so it earns a rule rather than a park.
   *
   * "No" is only returned when we actually hold a history to check against.
   * With an empty list we do not know, and answering "No" would be a claim
   * about someone's past we cannot support — so it parks instead.
   */
  if (/have you (ever )?(been employed|worked)( for| at| by)|do you currently or have you previously work|previously been employed/.test(q)) {
    if (!c.employment.length) return { unanswerable: "employment history not on file" };

    const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const asked = normalise(question);
    const worked = c.employment.some((e) => {
      const name = normalise(e.employer);
      // Two words minimum: a one-word employer like "Box" would match almost
      // any sentence containing it.
      return name.length > 3 && asked.includes(name);
    });
    return { value: worked ? "Yes" : "No" };
  }

  /**
   * Employment dates, asked one dropdown at a time.
   *
   * Greenhouse splits a single date across "Start date month" and "Start date
   * year", so the stored month and year are handed over separately — which is
   * why the vault keeps them apart rather than as one string.
   */
  if (/^(start|end) date (month|year)\b|^(start|end) (month|year)\b/.test(q)) {
    if (!latestJob) return { unanswerable: "employment history not on file" };

    const isEnd = /^end/.test(q);
    // A current role has no leaving date, and inventing one would contradict
    // the "I currently work here" the candidate ticked.
    if (isEnd && latestJob.current) return { skip: true };

    const value = /month/.test(q)
      ? (isEnd ? latestJob.endMonth : latestJob.startMonth)
      : (isEnd ? latestJob.endYear : latestJob.startYear);

    return value ? { value } : { unanswerable: `employment ${isEnd ? "end" : "start"} date not on file` };
  }

  // ── Age ─────────────────────────────────────────────────────────────
  // Asked on plenty of forms and always required. It is a fact about the
  // candidate, so it comes from something they stated — never assumed from
  // the fact that they are applying for work.
  if (/at least 18|18 years of age|over 18|of legal working age|are you 18/.test(q)) {
    if (c.atLeast18 === "yes") return { value: "Yes" };
    if (c.atLeast18 === "no") return { value: "No" };
    return { unanswerable: "age confirmation not on file" };
  }

  // ── Education ───────────────────────────────────────────────────────
  const topEducation = c.education[0];

  // \binstitution\b, not a bare substring: "institutional client" appears in
  // conflict-of-interest questions, and this rule matched one — it was about
  // to put a school name into "were you referred by a senior leader at a
  // prospective institutional client?". Same class as "capacity"/"city".
  if (/^school\b|\buniversity\b|\bcollege\b|\binstitution\b|where did you study/.test(q)) {
    return topEducation?.school
      ? { value: topEducation.school }
      : { unanswerable: "education not on file" };
  }

  if (/^degree\b|highest (level of )?(education|degree)|level of (education|study)/.test(q)) {
    return topEducation?.degree
      ? { value: topEducation.degree }
      : { unanswerable: "education not on file" };
  }

  if (/^discipline\b|field of study|major|course of study|subject/.test(q)) {
    return topEducation?.discipline
      ? { value: topEducation.discipline }
      : { unanswerable: "education not on file" };
  }

  // ── "…in the location(s) you selected in your previous response" ────
  // A question about an answer we just gave. We only ever tick countries from
  // the authorised list, so by construction the candidate is authorised in
  // every one of them — which makes this answerable rather than a park, and
  // truthfully so. If nothing is on file we never ticked anything either, and
  // it stays unanswerable.
  if (
    /(authoriz|authoris)ed to work/.test(q) &&
    /you selected|previous response|previously selected|selected above/.test(q)
  ) {
    return c.authorizedCountries.length
      ? { value: "Yes" }
      : { unanswerable: "no work authorisation on file" };
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

  // ── "Do you currently live there?" — a FACT, not a preference ───────
  // Separated from relocation and checked first. "Do you currently live in
  // the job's location?" was being answered from willingness to relocate,
  // which with a plain Yes/No dropdown produces "Yes" for a candidate in
  // Chicago applying to Toronto. That is not a worse answer, it is an untrue
  // one — so it is only answered when the posting actually names their city,
  // and parks otherwise.
  if (/do you (currently )?(live|reside)\b/.test(q) && !/relocat|willing|move/.test(q)) {
    if (!c.city || !jobLocation) {
      return { unanswerable: `cannot verify where they live for: "${question.slice(0, 70)}"` };
    }
    return { value: jobLocation.toLowerCase().includes(c.city.toLowerCase()) ? "Yes" : "No" };
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

  // "start date" is deliberately NOT matched on its own here. Employment
  // history asks "Start date month" and "Start date year", and this rule was
  // claiming those first — putting a notice period of "1 week" into a month
  // dropdown. Only phrasings that unambiguously mean availability qualify.
  if (/notice period|when (can|could) you start|available to start|earliest start date|how soon (can|could) you start/.test(q)) {
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
  // ── Where the candidate lives ───────────────────────────────────────
  // Split from the city rule below because Stripe asks "Please select the
  // country where you currently reside" as a country dropdown — answering it
  // with "Chicago, United States" would match no option at all.
  if (/country (where|in which) you (currently )?(reside|live)|country of residence|which country do you (live|reside)|what country are you based in|country you (are )?based in/.test(q)) {
    return c.country ? { value: c.country } : { unanswerable: "country of residence not on file" };
  }

  // \bcity\b, never a bare substring: "capacity" contains "city", and
  // "Have you previously been employed by Coinbase in any capacity?" was
  // matching this rule and being answered with a city name.
  if (/\bcity\b|where are you (based|located)|current location/.test(q)) {
    return c.city ? { value: [c.city, c.country].filter(Boolean).join(", ") } : { skip: true };
  }

  // ── Where they may work ─────────────────────────────────────────────
  // "Please select the country or countries you anticipate working in for the
  // role in which you are applying" — that is the authorised-countries list,
  // which is already stored. Returned as a list because these render as
  // checkbox groups where more than one answer is expected.
  if (/countr(y|ies) you (anticipate|expect|plan|intend|would be) work|countr(y|ies) (you are|of) (applying|work)/.test(q)) {
    return c.authorizedCountries.length
      ? { values: c.authorizedCountries }
      : { unanswerable: "no work authorisation on file" };
  }

  // ── Remote preference ───────────────────────────────────────────────
  if (/would you (like|prefer|want) to work remotely|prefer(ence)? for remote|work remotely/.test(q)) {
    if (!c.roleTypes.length) return { unanswerable: "remote preference not on file" };
    return { value: c.roleTypes.some((r) => /remote/i.test(r)) ? "Yes" : "No" };
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
/**
 * Bot-challenge widgets. Shared because every board uses one — Greenhouse
 * leans on reCAPTCHA and Cloudflare Turnstile, Lever on hCaptcha — and the
 * rule for reading them is identical: only a VISIBLE, sizeable widget is a
 * blocker. The invisible variants sit on forms that submit perfectly well.
 */
export const CHALLENGE_SELECTOR =
  "iframe[src*='challenges.cloudflare.com'], iframe[title*='challenge' i], " +
  "iframe[src*='recaptcha'], .g-recaptcha, #challenge-form, #cf-challenge-running, " +
  // Lever's forms carry hCaptcha — usually invisible, which the size and
  // visibility checks downstream are there to tolerate.
  "iframe[src*='hcaptcha'], .h-captcha, [data-hcaptcha-widget-id]";

/**
 * Voluntary demographic questions.
 *
 * Wider than the classic US EEO four. Robinhood's form alone asks about
 * military status (not the word "veteran") and LGBTQ+ identity, and neither
 * matched the first version — so both fell through to the general question
 * rules, came back unanswerable, and parked an application over questions
 * that are optional by law and answerable with "decline".
 */
export function isEeo(q: string): boolean {
  return /gender|race|ethnic|hispanic|latino|veteran|military|disabilit|disabled|self-?identif|pronoun|lgbtq|sexual orientation|transgender|demographic|\bage range\b|\bage group\b|\byour age\b|caring responsibilit|social(-| )?mobility/i
    .test(q);
}

/** What a control is, and what it is being asked. Resolved in one page call. */

/**
 * "I would rather not say", however this particular form words it.
 *
 * A list of exact phrases does not survive contact with real boards. Cloudflare
 * offers "I do not want to answer"; Discord offers "I don't wish to answer";
 * others say "Decline To Self Identify" or "Prefer not to say". Enumerating
 * them means silently missing the next variant — which is what happened here.
 * Matching the intent covers wordings nobody has written yet.
 */
export const DECLINE_OPTION = (option: string): boolean =>
  /decline|prefer not|choose not|opt out|no response|(do not|don't|do ?n'?t)\s+(want|wish|care|choose)\s+to\s+(answer|say|disclose|identify|specify|respond)|not\s+to\s+(answer|disclose|identify)|rather not/i
    .test(option);
