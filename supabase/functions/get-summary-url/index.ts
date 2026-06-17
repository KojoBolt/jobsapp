import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BUCKET = "client-summaries";
const TTL = 300; // 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    const summaryId = body?.summaryId as string | undefined;
    if (!summaryId) return json({ error: "Missing summaryId" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Caller must own the summary (or be an admin).
    const { data: summary } = await supabase
      .from("application_summaries")
      .select("user_id, storage_path")
      .eq("id", summaryId)
      .single();
    if (!summary) return json({ error: "Summary not found" }, 404);

    let allowed = summary.user_id === user.id;
    if (!allowed) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      allowed = prof?.role === "admin";
    }
    if (!allowed) return json({ error: "Not authorized" }, 403);

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(summary.storage_path, TTL);
    if (signErr || !signed?.signedUrl) return json({ error: "Could not create link" }, 500);

    return json({ url: signed.signedUrl, expires_in: TTL });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});