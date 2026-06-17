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

// The PRIVATE storage bucket holding ebooks/videos. Create it in Supabase
// Storage with "Public" UNCHECKED, then upload files into it.
const PRIVATE_BUCKET = "products-private";
const SIGNED_URL_TTL = 300; // seconds the download link stays valid (5 min)

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Supabase environment variables are missing" }, 500);
    }

    // 1. Identify the caller from their JWT (same pattern as your initiators).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // 2. What product are they asking for?
    const body = await req.json().catch(() => null);
    const productId = body?.productId as string | undefined;
    if (!productId) return json({ error: "Missing productId" }, 400);

    // 3. Service-role client for the ownership check + signing.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4. Ownership gate — the whole anti-piracy model lives here.
    const { data: owned, error: ownErr } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (ownErr) return json({ error: ownErr.message }, 500);
    if (!owned) return json({ error: "You don't own this product." }, 403);

    // 5. Look up the file path (kept server-side; never exposed to the client).
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("storage_path, title, type")
      .eq("id", productId)
      .single();

    if (prodErr || !product) return json({ error: "Product not found" }, 404);

    // 6. Hand back a short-lived signed URL.
    const { data: signed, error: signErr } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(product.storage_path, SIGNED_URL_TTL);

    if (signErr || !signed?.signedUrl) {
      return json({ error: signErr?.message || "Could not create download link" }, 500);
    }

    return json({
      url: signed.signedUrl,
      title: product.title,
      type: product.type,
      expires_in: SIGNED_URL_TTL,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});