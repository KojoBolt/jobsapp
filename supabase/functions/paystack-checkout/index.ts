import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is not configured");
      throw new Error("Payment gateway not configured");
    }

    const { email, amount, productId, productTitle, callbackUrl } = await req.json();

    console.log("Initializing Paystack transaction:", { email, amount, productId, productTitle });

    if (!email || !amount || !productId || !callbackUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, amount, productId, callbackUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Paystack expects amount in kobo (smallest currency unit)
    // We receive amount in dollars, convert to cents (USD uses 100 subunits)
    const amountInSubunit = Math.round(amount * 100);

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInSubunit,
        currency: "USD",
        callback_url: callbackUrl,
        metadata: {
          product_id: productId,
          product_title: productTitle,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.error("Paystack API error:", paystackData);
      throw new Error(`Paystack initialization failed [${paystackResponse.status}]: ${JSON.stringify(paystackData)}`);
    }

    console.log("Paystack transaction initialized successfully:", paystackData.data?.reference);

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        access_code: paystackData.data.access_code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error initializing Paystack transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
