import { chromium, type Browser, type BrowserContext } from "playwright";
import { config } from "./config.ts";
import { log } from "./log.ts";

/**
 * One browser for the process, a fresh context per application.
 *
 * Launching Chromium costs seconds and hundreds of megabytes, so it is not
 * done per job. Contexts are cheap and isolated, which is what actually
 * matters here: cookies and storage from one candidate's application must
 * never be visible to the next.
 */
let browser: Browser | null = null;

const LAUNCH_ARGS = [
  // Containers get a very small /dev/shm and Chromium uses it for shared
  // memory. Without this, tabs crash under load — and it surfaces as a
  // generic Playwright timeout rather than anything mentioning memory.
  "--disable-dev-shm-usage",
  // No GPU exists in the container; asking for one only adds startup noise.
  "--disable-gpu",
  // The sandbox needs privileges the container does not grant. This is the
  // standard containerised-Chromium trade-off: we visit employer career
  // pages, not arbitrary user-supplied URLs.
  "--no-sandbox",
];

async function getBrowser(): Promise<Browser> {
  if (browser?.isConnected()) return browser;
  log.info("launching browser");
  browser = await chromium.launch({ headless: true, args: LAUNCH_ARGS });
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (!browser) return;
  await browser.close().catch((e) => log.warn("browser close failed", { error: String(e) }));
  browser = null;
}

/**
 * Run `fn` against a fresh context, and always tear it down.
 *
 * The viewport is a common desktop size on purpose: some boards render a
 * different form below their mobile breakpoint, and debugging a screenshot of
 * a layout no human would see wastes an afternoon.
 */
export async function withContext<T>(fn: (ctx: BrowserContext) => Promise<T>): Promise<T> {
  const b = await getBrowser();
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: config.userAgent,
    locale: "en-US",
    acceptDownloads: false,
  });
  ctx.setDefaultTimeout(config.actionTimeoutMs);
  ctx.setDefaultNavigationTimeout(config.navigationTimeoutMs);

  try {
    return await fn(ctx);
  } finally {
    await ctx.close().catch(() => {});
  }
}
