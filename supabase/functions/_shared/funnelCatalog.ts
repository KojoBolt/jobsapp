// Server-side price list for the ad-funnel products.
//
// This is the ONLY source of truth for what a funnel item costs. The browser
// sends item IDs, never amounts — otherwise anyone could POST {amount: 1} and
// buy the Blitz for a dollar. Same anti-tamper principle as the DB lookup in
// initialize-paystack-product; a constant is used here because the funnel
// products are not rows in `products`.
//
// Keep the ids in sync with src/components/funnel/checkout/*.jsx.

export type FunnelItem = {
  id: string;
  name: string;
  priceUsd: number;
  /** Application credits granted on successful payment. */
  credits: number;
  /** Short token used in the human-readable payment reference, e.g. funnel_blitz-001. */
  refSlug: string;
};

export const FUNNEL_CATALOG: Record<string, FunnelItem> = {
  "200-app-blitz": {
    id: "200-app-blitz",
    name: "200-App Blitz",
    priceUsd: 99,
    credits: 200,
    refSlug: "blitz",
  },
  "interview-prep-bump": {
    id: "interview-prep-bump",
    name: "48-Hour Interview Prep Crash Course",
    priceUsd: 19,
    credits: 0,
    refSlug: "prep",
  },
  "salary-negotiation-upsell": {
    id: "salary-negotiation-upsell",
    name: "Salary Negotiation Masterclass",
    priceUsd: 47,
    credits: 0,
    refSlug: "salary",
  },
  "interview-qa-downsell": {
    id: "interview-qa-downsell",
    name: "100 Interview Questions & Answers",
    priceUsd: 12,
    credits: 0,
    refSlug: "interviewqa",
  },
};

// Plan granted when a funnel order includes application credits.
// `payments.plan` is CHECK-constrained to 'free' | 'starter' | 'pro'.
export const FUNNEL_GRANT_PLAN = "pro";

export type ResolvedOrder = {
  items: FunnelItem[];
  amountUsd: number;
  amountSubunit: number;
  credits: number;
};

/** Resolve client-supplied IDs against the catalog. Throws on anything unknown. */
export function resolveOrder(itemIds: unknown): ResolvedOrder {
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new Error("itemIds must be a non-empty array");
  }

  const seen = new Set<string>();
  const items: FunnelItem[] = [];

  for (const raw of itemIds) {
    const id = String(raw);
    if (seen.has(id)) continue; // ignore duplicates rather than double-charge
    const item = FUNNEL_CATALOG[id];
    if (!item) throw new Error(`Unknown funnel product: ${id}`);
    seen.add(id);
    items.push(item);
  }

  const amountUsd = items.reduce((sum, i) => sum + i.priceUsd, 0);

  return {
    items,
    amountUsd,
    // USD has 100 subunits; round to avoid float drift (99.1 * 100 = 9909.999…)
    amountSubunit: Math.round(amountUsd * 100),
    credits: items.reduce((sum, i) => sum + i.credits, 0),
  };
}
