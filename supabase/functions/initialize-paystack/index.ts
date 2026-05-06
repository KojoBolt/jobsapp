import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type UserPlan = "free" | "starter" | "pro";
type PackageKey = "activation" | "starter" | "pro";

type PackageConfig = {
  plan: UserPlan;
  label: string;
  credits: number;
  amountUsd: number;
  currency: "USD";
};

const PACKAGE_CONFIG: Record<PackageKey, PackageConfig> = {
  activation: {
    plan: "free",
    label: "Basic Activation",
    credits: 200,
    amountUsd: 99.00,
    currency: "USD",
  },
  starter: {
    plan: "starter",
    label: "Starter Top-up",
    credits: 100,
    amountUsd: 29,
    currency: "USD",
  },
  pro: {
    plan: "pro",
    label: "Pro Top-up",
    credits: 200,
    amountUsd: 299,
    currency: "USD",
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Supabase environment variables are missing" }, 500);
    }

    if (!PAYSTACK_SECRET_KEY) {
      return json({ error: "PAYSTACK_SECRET_KEY is not configured" }, 500);
    }

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
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return json({ error: "Unauthorized user" }, 401);
    }

    // ✅ Separate service role client for all DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const packageKey = body?.packageKey as PackageKey | undefined;
    const callbackUrl = body?.callbackUrl as string | undefined;

    if (!packageKey || !(packageKey in PACKAGE_CONFIG)) {
      return json({ error: "Invalid packageKey" }, 400);
    }

    if (!callbackUrl) {
      return json({ error: "Missing callbackUrl" }, 400);
    }

    const selectedPackage = PACKAGE_CONFIG[packageKey];

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

    const reference = `jobapp_${user.id}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const amountSubunit = Math.round(selectedPackage.amountUsd * 100);

    const metadata = {
      user_id: user.id,
      package_key: packageKey,
      plan: selectedPackage.plan,
      credits: selectedPackage.credits,
      package_label: selectedPackage.label,
      full_name: profile.full_name,
    };

    const { error: insertPaymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      reference,
      plan: selectedPackage.plan,
      credits: selectedPackage.credits,
      amount_usd: selectedPackage.amountUsd,
      amount_subunit: amountSubunit,
      currency: selectedPackage.currency,
      status: "pending",
      provider: "paystack",
    });

    if (insertPaymentError) {
      return json(
        { error: `Failed to create payment record: ${insertPaymentError.message}` },
        500
      );
    }

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountSubunit,
          currency: selectedPackage.currency,
          reference,
          callback_url: callbackUrl,
          metadata,
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData?.status) {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("reference", reference);

      return json(
        {
          error: paystackData?.message || "Paystack transaction initialization failed",
        },
        400
      );
    }

    return json({
      message: "Payment initialized successfully",
      reference,
      access_code: paystackData?.data?.access_code ?? null,
      authorization_url: paystackData?.data?.authorization_url ?? null,
      package: {
        key: packageKey,
        label: selectedPackage.label,
        credits: selectedPackage.credits,
        amountUsd: selectedPackage.amountUsd,
        currency: selectedPackage.currency,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});