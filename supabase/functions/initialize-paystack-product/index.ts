import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

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

    // Auth the caller.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) return json({ error: "Unauthorized user" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => null);
    const productId = body?.productId as string | undefined;
    const callbackUrl = body?.callbackUrl as string | undefined;
    if (!productId) return json({ error: "Missing productId" }, 400);
    if (!callbackUrl) return json({ error: "Missing callbackUrl" }, 400);

    // Price comes from the DB, NEVER from the request — this is the anti-tamper guard.
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price_subunit, currency, active")
      .eq("id", productId)
      .single();

    if (productError || !product) return json({ error: "Product not found" }, 404);
    if (!product.active) return json({ error: "Product is not available" }, 400);

    // Don't let someone buy what they already own.
    const { data: alreadyOwned } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();
    if (alreadyOwned) return json({ error: "You already own this product." }, 409);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email;
    if (!email) return json({ error: "User email not found" }, 400);

    const reference = `prod_${user.id}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const amountSubunit = Number(product.price_subunit);

    // payments row tagged as a PRODUCT purchase (credits = 0).
    const { error: insertPaymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      reference,
      plan: profile?.plan ?? "free",   // unchanged for product buys; keep their current plan
      credits: 0,
      amount_subunit: amountSubunit,
      currency: product.currency || "USD",
      status: "pending",
      provider: "paystack",
      purpose: "product",
      product_id: product.id,
    });
    if (insertPaymentError) {
      return json({ error: `Failed to create payment record: ${insertPaymentError.message}` }, 500);
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountSubunit,
        currency: product.currency || "USD",
        reference,
        callback_url: callbackUrl,
        metadata: {
          user_id: user.id,
          purpose: "product",
          product_id: product.id,
          product_title: product.title,
          full_name: profile?.full_name,
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    if (!paystackResponse.ok || !paystackData?.status) {
      await supabase.from("payments").update({ status: "failed" }).eq("reference", reference);
      return json({ error: paystackData?.message || "Paystack initialization failed" }, 400);
    }

    return json({
      message: "Payment initialized successfully",
      reference,
      authorization_url: paystackData?.data?.authorization_url ?? null,
      access_code: paystackData?.data?.access_code ?? null,
      product: { id: product.id, title: product.title, amount_subunit: amountSubunit },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});