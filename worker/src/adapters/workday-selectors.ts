/**
 * Workday selectors, read from a live tenant rather than guessed at.
 *
 * Probed against transperfect.wd5.myworkdayjobs.com. Workday tags almost
 * everything with `data-automation-id`, which is a genuine gift after fighting
 * react-select's per-board class names on Greenhouse: these are semantic,
 * stable, and the same across tenants because they come from Workday's own
 * component library rather than from each employer's theme.
 *
 * Kept in their own file because the apply flow is seven pages, and a single
 * adapter file holding both the selectors and the step machine would be a
 * thousand lines before it did anything.
 */

/** The apply URL is deterministic — no need to click through the popup. */
export const applyUrl = (jobUrl: string): string =>
  jobUrl.replace(/\/+$/, "") + "/apply/applyManually";

/**
 * The seven steps, in order, as Workday's own progress bar names them.
 * Read from `[data-automation-id='progressBar']`, so the adapter can tell
 * which step it is on rather than counting clicks and hoping.
 */
export const STEPS = [
  "Create Account/Sign In",
  "My Information",
  "My Experience",
  "Application Questions",
  "Voluntary Disclosures",
  "Self Identify",
  "Review",
] as const;

export const FLOW = {
  progressBar: "[data-automation-id='progressBar']",
  activeStep: "[data-automation-id='progressBarActiveStep']",
  backToPosting: "[data-automation-id='backToJobPosting']",
} as const;

/** Step 1. Workday opens on Create Account; Sign In is behind a link. */
export const ACCOUNT = {
  email: "[data-automation-id='email']",
  password: "[data-automation-id='password']",
  verifyPassword: "[data-automation-id='verifyPassword']",
  consent: "[data-automation-id='createAccountCheckbox']",
  submit: "[data-automation-id='createAccountSubmitButton']",
  signInLink: "[data-automation-id='signInLink']",
  forgotPassword: "[data-automation-id='forgotPasswordLink']",
} as const;

/**
 * A HONEYPOT. Leave it empty, always.
 *
 * Its own label says so: "Enter website. This input is for robots only, do not
 * enter if you're human." It is a visible, ordinary-looking `<input type=text>`
 * that exists purely to catch anything filling every field it can find.
 *
 * Our adapters fill by label rather than by sweeping the DOM, so this would
 * probably have been skipped anyway — but "probably" is not a safeguard, and
 * tripping it means the application is silently discarded while the form
 * reports success. Excluded by name, deliberately.
 */
export const HONEYPOT = "[data-automation-id='beecatcher']";

/**
 * Workday's buttons sit UNDER a transparent overlay div that takes the click.
 *
 * Measured: clicking `createAccountSubmitButton` fails six retries with
 * "<div data-automation-id='click_filter'> intercepts pointer events". The
 * button is visible, enabled and stable — Playwright's usual checks all pass —
 * and the click still never lands. The overlay carries `role="button"` and an
 * `aria-label` matching the button's text, so it is the real target.
 *
 * This is why clicking Workday buttons goes through a helper rather than
 * `locator.click()`.
 */
export const CLICK_FILTER = "[data-automation-id='click_filter']";

/**
 * Password rules, quoted from the account form:
 *   An uppercase character · An alphabetic character · A lowercase character
 *   A special character · A numeric character · A minimum of 8 characters
 *
 * generatePassword() in ../credentials.ts satisfies every one of these, and its
 * test asserts each class independently — a generated password rejected by the
 * signup form is a dead end the worker cannot reason its way out of.
 */
export const PASSWORD_RULES =
  "upper, lower, alphabetic, numeric, special, min 8 — see generatePassword()";
