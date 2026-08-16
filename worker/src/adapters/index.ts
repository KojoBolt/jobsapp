import type { Adapter } from "./types.ts";
import type { AtsProvider } from "../../../supabase/functions/_shared/ats.ts";
import { greenhouseAdapter } from "./greenhouse.ts";

/**
 * Adapter registry.
 *
 * Anything without an entry here parks for a human, which is the correct
 * default — an ATS we have not written for is one we cannot fill in.
 * Lever is next: its form is close enough to Greenhouse's that most of that
 * adapter carries over.
 */
const ADAPTERS: Adapter[] = [greenhouseAdapter];

export function findAdapter(provider: AtsProvider, url: string): Adapter | null {
  return ADAPTERS.find((a) => a.provider === provider && a.canHandle(url)) ?? null;
}

export const adapterCount = () => ADAPTERS.length;
