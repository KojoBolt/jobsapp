import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type UserPlan = "free" | "starter" | "pro";
type PackageKey = "activation" | "starter" | "pro";

type PackageConfig = {
  plan: UserPlan;
  label: string;
  credits: number;
  amountUsd: number;
};

const PACKAGE_CONFIG: Record<PackageKey, PackageConfig> = {
  activation: {
    plan: "free",
    label: "Basic Activation",
    credits: 200,
    amountUsd: 99,
  },
  starter: {
    plan: "starter",
    label: "Starter Top-up",
    credits: 100,
    amountUsd: 29,
  },
  pro: {
    plan: "pro",
    label: "Pro Top-up",
    credits: 200,
    amountUsd: 299,
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

async function makeMd5(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const CRYPTOMUS_MERCHANT_ID = Deno.env.get("CRYPTOMUS_MERCHANT_ID");
    const CRYPTOMUS_PAYMENT_API_KEY = Deno.env.get("CRYPTOMUS_PAYMENT_API_KEY");
    const WEBHOOK_CALLBACK_URL = Deno.env.get("WEBHOOK_CALLBACK_URL");
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Missing Supabase env vars" }, 500);
    }

    if (!CRYPTOMUS_MERCHANT_ID || !CRYPTOMUS_PAYMENT_API_KEY) {
      return json({ error: "Missing Cryptomus env vars" }, 500);
    }

    if (!WEBHOOK_CALLBACK_URL || !APP_BASE_URL) {
      return json({ error: "Missing URL env vars" }, 500);
    }

    const safeAppBaseUrl = normalizeBaseUrl(APP_BASE_URL);
    const safeWebhookUrl = normalizeBaseUrl(WEBHOOK_CALLBACK_URL);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // ✅ Use anon key client to verify the user's JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(token);

    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    // ✅ Separate service role client for all DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    const packageKey = body?.packageKey as PackageKey | undefined;

    if (!packageKey || !(packageKey in PACKAGE_CONFIG)) {
      return json({ error: "Invalid packageKey" }, 400);
    }

    const pkg = PACKAGE_CONFIG[packageKey];

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, credits_remaining")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return json({ error: "Profile not found" }, 404);
    }

    const email = profile.email || user.email;
    if (!email) {
      return json({ error: "User email not found" }, 400);
    }

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("payments")
      .select("reference, status")
      .eq("user_id", user.id)
      .eq("plan", pkg.plan)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPaymentError) {
      return json({ error: existingPaymentError.message }, 500);
    }

    if (existingPayment) {
      return json(
        {
          error:
            "You already have a pending payment for this package. Complete or cancel it first.",
        },
        409
      );
    }

    const reference = `jobapp_${user.id}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const amount = pkg.amountUsd.toFixed(2);

    const cryptomusBody = {
      amount,
      currency: "USD",
      order_id: reference,
      url_callback: safeWebhookUrl,
      url_return: `${safeAppBaseUrl}/checkout-success`,
      url_success: `${safeAppBaseUrl}/checkout-success`,
      url_cancel: `${safeAppBaseUrl}/checkout-cancel`,
      is_payment_multiple: false,
      lifetime: 3600,
      to_currency: "USDT",
      additional_data: JSON.stringify({
        user_id: user.id,
        package_key: packageKey,
        plan: pkg.plan,
        credits: pkg.credits,
        package_label: pkg.label,
      }),
    };

    const payload = JSON.stringify(cryptomusBody);
    const base64Payload = btoa(payload);
    const sign = await makeMd5(base64Payload + CRYPTOMUS_PAYMENT_API_KEY);

    const res = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: CRYPTOMUS_MERCHANT_ID,
        sign,
      },
      body: payload,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.result?.uuid || !data?.result?.url) {
      return json(
        {
          error: data?.message || "Failed to create Cryptomus invoice",
          provider_response: data ?? null,
        },
        400
      );
    }

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      reference,
      plan: pkg.plan,
      credits: pkg.credits,
      amount_usd: pkg.amountUsd,
      currency: "USD",
      status: "pending",
      provider: "cryptomus",
      cryptomus_uuid: data.result.uuid,
    });

    if (insertError) {
      console.error(
        `CRITICAL: Cryptomus invoice created (uuid: ${data.result.uuid}) but local insert failed: ${insertError.message}`
      );
      return json(
        { error: "Payment created but failed to record. Contact support." },
        500
      );
    }

    return json({
      reference,
      payment_url: data.result.url,
      uuid: data.result.uuid,
      package: pkg,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});