import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function makeMd5(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);

  return Array.from(new Uint8Array(hashBuffer))
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
    const CRYPTOMUS_PAYMENT_API_KEY = Deno.env.get("CRYPTOMUS_PAYMENT_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CRYPTOMUS_PAYMENT_API_KEY) {
      return json({ error: "Missing required env vars" }, 500);
    }

    const rawBody = await req.text();
    const receivedSignature = req.headers.get("sign") || "";
    const expectedSignature = await makeMd5(btoa(rawBody) + CRYPTOMUS_PAYMENT_API_KEY);

    if (receivedSignature !== expectedSignature) {
      return json({ error: "Invalid signature" }, 401);
    }

    const payload = JSON.parse(rawBody);
    const result = payload?.result ?? payload;

    const reference = result?.order_id;
    const cryptomusUuid = result?.uuid;
    const paymentStatus = result?.payment_status;

    if (!reference) {
      return json({ error: "Missing order_id" }, 400);
    }

    const successStatuses = new Set(["paid", "paid_over"]);

    if (!successStatuses.has(paymentStatus)) {
      return json({ ok: true, message: "Ignored non-success status" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .eq("provider", "cryptomus")
      .single();

    if (paymentError || !paymentRow) {
      return json({ error: "Payment row not found" }, 404);
    }

    if (paymentRow.status === "success") {
      return json({ ok: true, message: "Already processed" });
    }

    if (paymentRow.cryptomus_uuid && cryptomusUuid && paymentRow.cryptomus_uuid !== cryptomusUuid) {
      return json({ error: "UUID mismatch" }, 400);
    }

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
      })
      .eq("reference", reference)
      .eq("provider", "cryptomus")
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