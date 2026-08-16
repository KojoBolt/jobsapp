import type { AtsProvider } from "../../../supabase/functions/_shared/ats.ts";
import type { ClaimedApplication } from "../queue.ts";

export interface ApplyContext {
  application: ClaimedApplication;
  /** The URL after aggregator redirects — always apply against this one. */
  resolvedUrl: string;
  /** When true, fill everything but stop short of clicking Submit. */
  dryRun: boolean;
}

/**
 * `evidence` is on every variant on purpose: the screenshot of a form the
 * adapter could NOT complete is the one worth looking at, so it must survive
 * a needs_human or a failure just as much as a success.
 */
export type ApplyOutcome =
  | { status: "submitted"; evidence?: string }
  /** Adapter reached the form but can't finish — captcha, login wall, a
   *  required question we have no answer for. A person takes it from here. */
  | { status: "needs_human"; reason: string; evidence?: string }
  | { status: "failed"; reason: string; evidence?: string };

export interface Adapter {
  provider: AtsProvider;
  /** Cheap check so the registry can pick without instantiating a browser. */
  canHandle(url: string): boolean;
  apply(ctx: ApplyContext): Promise<ApplyOutcome>;
}
