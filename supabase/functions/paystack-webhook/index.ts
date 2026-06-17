import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function sha512Hmac(secret: string, payload: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY) {
      return json({ error: "Missing required env vars" }, 500);
    }

    const rawBody = await req.text();
    const receivedSignature = req.headers.get("x-paystack-signature") || "";
    const expectedSignature = await sha512Hmac(PAYSTACK_SECRET_KEY, rawBody);

    if (receivedSignature !== expectedSignature) {
      return json({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(rawBody);

    if (event?.event !== "charge.success") {
      return json({ ok: true, message: "Ignored event type" });
    }

    const reference = event?.data?.reference;
    const paystackStatus = event?.data?.status;
    const transactionId = String(event?.data?.id ?? "");
    const eventAmount = Number(event?.data?.amount ?? 0);

    if (!reference || paystackStatus !== "success") {
      return json({ ok: true, message: "Ignored non-success payload" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .eq("provider", "paystack")
      .single();

    if (paymentError || !paymentRow) {
      return json({ error: "Payment row not found" }, 404);
    }

    if (paymentRow.status === "success") {
      return json({ ok: true, message: "Already processed" });
    }

    // Amount check against what we recorded at checkout.
    if (Number(paymentRow.amount_subunit ?? 0) !== eventAmount) {
      return json({ error: "Amount mismatch" }, 400);
    }

    // Re-verify with Paystack directly (don't trust the webhook body alone).
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    );

    const verifyData = await verifyRes.json().catch(() => null);

    if (!verifyRes.ok || !verifyData?.status || verifyData?.data?.status !== "success") {
      return json({ error: "Paystack verification failed" }, 400);
    }

    const verifiedAmount = Number(verifyData?.data?.amount ?? 0);

    if (verifiedAmount !== Number(paymentRow.amount_subunit ?? 0)) {
      return json({ error: "Verified amount mismatch" }, 400);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  PRODUCT PURCHASE PATH
    //  Self-contained: marks payment success + grants the product. Never
    //  touches profile/credits logic. Returns before the credits path.
    // ─────────────────────────────────────────────────────────────────────
    if (paymentRow.purpose === "product") {
      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({ status: "success", paystack_transaction_id: transactionId })
        .eq("reference", reference)
        .eq("provider", "paystack")
        .neq("status", "success");

      if (updatePaymentError) {
        return json({ error: updatePaymentError.message }, 500);
      }

      const { error: purchaseErr } = await supabase
        .from("purchases")
        .upsert(
          {
            user_id: paymentRow.user_id,
            product_id: paymentRow.product_id,
            payment_reference: reference,
            provider: "paystack",
          },
          { onConflict: "user_id,product_id", ignoreDuplicates: true }
        );

      if (purchaseErr) {
        return json({ error: purchaseErr.message }, 500);
      }

      return json({ ok: true, message: "Product purchase granted" });
    }

    // ─────────────────────────────────────────────────────────────────────
    //  CREDITS / PLAN PATH (unchanged original behavior)
    // ─────────────────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, credits_remaining, total_credits_earned")
      .eq("id", paymentRow.user_id)
      .single();

    if (profileError || !profile) {
      return json({ error: "Profile not found" }, 404);
    }

    const nextPlan = paymentRow.plan === "free" ? "starter" : paymentRow.plan;
    const nextCredits =
      Number(profile.credits_remaining ?? 0) + Number(paymentRow.credits ?? 0);
    const nextTotalCredits =
      Number(profile.total_credits_earned ?? 0) + Number(paymentRow.credits ?? 0);

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "success",
        paystack_transaction_id: transactionId,
      })
      .eq("reference", reference)
      .eq("provider", "paystack")
      .neq("status", "success");

    if (updatePaymentError) {
      return json({ error: updatePaymentError.message }, 500);
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        plan: nextPlan,
        credits_remaining: nextCredits,
        total_credits_earned: nextTotalCredits,
      })
      .eq("id", paymentRow.user_id);

    if (updateProfileError) {
      return json({ error: updateProfileError.message }, 500);
    }

    return json({ ok: true });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});