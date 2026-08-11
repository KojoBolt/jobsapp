import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveOrder, FUNNEL_GRANT_PLAN } from "../_shared/funnelCatalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Funnel checkout initializer.
 *
 * Unlike initialize-paystack-product this accepts an ANONYMOUS caller — funnel
 * buyers have no session yet. It creates (or reuses) their auth user from the
 * email captured in the quiz so the `payments` row has a real user_id, which
 * payments.user_id requires (NOT NULL REFERENCES auth.users).
 *
 * The main app checkout is untouched and still uses its own functions.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Supabase environment variables are missing" }, 500);
    }
    if (!PAYSTACK_SECRET_KEY) {
      return json({ error: "PAYSTACK_SECRET_KEY is not configured" }, 500);
    }

    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const firstName = String(body?.firstName ?? "").trim();
    const callbackUrl = body?.callbackUrl as string | undefined;

    if (!EMAIL_RE.test(email)) return json({ error: "A valid email is required" }, 400);
    if (!callbackUrl) return json({ error: "Missing callbackUrl" }, 400);

    // Prices come from the server-side catalog, NEVER from the request.
    let order;
    try {
      order = resolveOrder(body?.itemIds);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Invalid order" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Record the pending payment ──────────────────────────────────────
    // No account is created here. This is an advert funnel: the buyer is a
    // stranger who found a link, and nothing about account plumbing should be
    // able to stop them paying. The webhook resolves (or creates) their user
    // once the money is confirmed, then emails them an activation link.
    //
    // References read as funnel_blitz-001, numbered per product. The counter is
    // seeded from the newest matching row, and `payments.reference` is UNIQUE —
    // so if two checkouts race for the same number, the database rejects the
    // loser and we simply take the next one. The constraint is the arbiter, not
    // the read, which is what makes this safe without a sequence or a lock.
    const slug = order.items[0].refSlug;

    const { data: lastRow } = await supabase
      .from("payments")
      .select("reference")
      .like("reference", `funnel_${slug}-%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let seq = 1;
    const lastSeq = String(lastRow?.reference ?? "").match(/-(\d+)$/);
    if (lastSeq) seq = Number(lastSeq[1]) + 1;

    let reference = "";
    let insertPaymentError = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      // padStart keeps the usual 3 digits but never truncates past 999.
      reference = `funnel_${slug}-${String(seq).padStart(3, "0")}`;

      const { error } = await supabase.from("payments").insert({
        user_id: null,
        reference,
        provider: "paystack",
        purpose: "funnel",
        // No product_id: the column is uuid (it points at products.id) and funnel
        // items are slugs like "200-app-blitz". The full line-up lives in metadata.
        // Only meaningful when the order carries credits; the webhook decides
        // whether to actually move the buyer onto this plan.
        plan: order.credits > 0 ? FUNNEL_GRANT_PLAN : "free",
        credits: order.credits,
        amount_usd: order.amountUsd,
        // The canonical amount — this is what the webhook verifies against Paystack.
        amount_subunit: order.amountSubunit,
        currency: "USD",
        status: "pending",
        // No `metadata` column on this table. The buyer's details ride along in
        // Paystack's own metadata below, which the webhook reads back off
        // /transaction/verify. Nothing here depends on schema we don't have.
      });

      if (!error) {
        insertPaymentError = null;
        break;
      }

      insertPaymentError = error;
      if (error.code !== "23505") break; // not a unique violation — a real failure
      seq += 1;
    }

    if (insertPaymentError) {
      // Log the full PostgREST error — `message` alone often omits the column
      // or constraint name that actually identifies the problem.
      console.error("payments insert failed:", JSON.stringify(insertPaymentError));
      return json({ error: `Failed to create payment record: ${insertPaymentError.message}` }, 500);
    }

    // ── Hand off to Paystack ────────────────────────────────────────────
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: order.amountSubunit,
        currency: "USD",
        reference,
        callback_url: callbackUrl,
        // The webhook reads these back off /transaction/verify — they are how
        // an anonymous order is tied to a person at fulfilment time.
        metadata: {
          purpose: "funnel",
          buyer_email: email,
          first_name: firstName,
          items: order.items.map((i) => i.id).join(","),
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    if (!paystackResponse.ok || !paystackData?.status) {
      await supabase.from("payments").update({ status: "failed" }).eq("reference", reference);
      return json({ error: paystackData?.message || "Paystack initialization failed" }, 400);
    }

    return json({
      reference,
      authorization_url: paystackData?.data?.authorization_url ?? null,
      access_code: paystackData?.data?.access_code ?? null,
      amount_subunit: order.amountSubunit,
    });
  } catch (error) {
    console.error("initialize-paystack-funnel threw:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
