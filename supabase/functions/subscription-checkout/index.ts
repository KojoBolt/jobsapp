import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) throw new Error("Payment gateway not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Try to get user from auth header, but allow anonymous checkout
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    const { plan, callbackUrl, email: guestEmail } = await req.json();

    const checkoutEmail = userEmail || guestEmail;
    if (!plan || !callbackUrl || !checkoutEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: plan, callbackUrl, and email (if not signed in)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planConfig = {
      plan_1: { amount: 2999, name: "The Tracker - $29.99/mo" },
      plan_2: { amount: 4999, name: "The Pro Hunter - $49.99/mo" },
    } as Record<string, { amount: number; name: string }>;

    const selected = planConfig[plan];
    if (!selected) {
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: checkoutEmail,
        amount: selected.amount,
        currency: "USD",
        callback_url: callbackUrl,
        metadata: {
          user_id: userId,
          plan,
          plan_name: selected.name,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      throw new Error(`Paystack failed [${paystackResponse.status}]: ${JSON.stringify(paystackData)}`);
    }

    // Update profile with subscription tier (only if user is signed in)
    if (userId) {
      const now = new Date().toISOString();
      await supabase.from("profiles").update({
        subscription_tier: plan,
        subscription_started_at: now,
        monthly_usage_count: 0,
        usage_reset_at: now,
      }).eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Subscription checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
