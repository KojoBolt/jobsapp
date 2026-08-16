import type { Page } from "playwright";
import { config } from "./config.ts";
import { db } from "./queue.ts";
import { log } from "./log.ts";

/**
 * Screenshot the form and keep it.
 *
 * Three reasons this is not optional. It proves to a customer that an
 * application was actually sent. It makes a failure debuggable without
 * reproducing it — which, against a live job board, often cannot be done at
 * all because the posting has closed. And during the dry run it is the entire
 * deliverable: nobody can tell whether the adapter filled the form correctly
 * except by looking at it.
 *
 * Failing to store evidence never fails the application. Losing a screenshot
 * is a smaller problem than abandoning a submission that already went out.
 */
export async function captureEvidence(
  page: Page,
  applicationId: string,
  label: string,
): Promise<string | null> {
  try {
    const shot = await page.screenshot({ fullPage: true, type: "png" });
    const path = `${applicationId}/${label}.png`;

    const { error } = await db.storage
      .from(config.evidenceBucket)
      .upload(path, shot, { contentType: "image/png", upsert: true });

    if (error) {
      log.warn("evidence upload failed", { applicationId, path, error: error.message });
      return null;
    }
    return path;
  } catch (err) {
    log.warn("evidence capture failed", {
      applicationId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
