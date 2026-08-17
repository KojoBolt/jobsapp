import type { Adapter } from "./types.ts";
import type { AtsProvider } from "../../../supabase/functions/_shared/ats.ts";
import { greenhouseAdapter } from "./greenhouse.ts";
import { leverAdapter } from "./lever.ts";

/**
 * Adapter registry.
 *
 * Anything without an entry here parks for a human, which is the correct
 * default — an ATS we have not written for is one we cannot fill in.
 *
 * The two share their answering rules (adapters/answers.ts) and differ only
 * in markup: what a question MEANS is the same everywhere, and a second copy
 * of those rules would quietly drift from the fixes that shaped them.
 * SmartRecruiters is next; Workday last, because it needs accounts and
 * structured work history the vault does not hold yet.
 */
const ADAPTERS: Adapter[] = [greenhouseAdapter, leverAdapter];

export function findAdapter(provider: AtsProvider, url: string): Adapter | null {
  return ADAPTERS.find((a) => a.provider === provider && a.canHandle(url)) ?? null;
}

export const adapterCount = () => ADAPTERS.length;
