import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { sourceJobs, jobKey } from "../_shared/sourcing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FIRST_PASS_PAGES = 3; // how many board pages the initial click scans

async function appendLog(supabase: any, campaignId: string, msg: string) {
  try {
    await supabase.rpc("append_campaign_log", {
      campaign_id: campaignId,
      log_message: `[${new Date().toISOString()}] ${msg}`,
    });
  } catch (e) { console.error("Log append err:", e); }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  let campaignId: string | null = null;
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const body = await req.json().catch(() => ({}));
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let userId: string;
    if (body.userId) {
      userId = body.userId;
    } else {
      const authClient = createClient(SUPABASE_URL, SERVICE_ROLE, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (error || !user) throw new Error("Unauthorized");
      userId = user.id;
    }

    campaignId = body.campaignId;
    if (!campaignId) throw new Error("campaignId is required");

    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_vault_data, credits_remaining")
      .eq("id", userId)
      .single();
    if (!profile) throw new Error("Profile not found");

    const credits = profile.credits_remaining || 0;
    if (credits < 1) throw new Error("No credits remaining.");

    // The TARGET we'll keep sourcing toward (the worker tops up to this).
    const target = Math.min(body.limit || body.jobsPerDeploy || 200, credits, 200);

    const { data: resume } = await supabase
      .from("resumes")
      .select("id, extracted_text, tone_preference")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!resume) throw new Error("Resume missing.");

    const targetRoles = [...(profile.identity_vault_data?.targeting?.targetRoles || [])];
    const industries  = profile.identity_vault_data?.targeting?.industries || [];
    const skills      = profile.identity_vault_data?.skills || "";

    // Dedupe against anything already in this campaign.
    const { data: existing } = await supabase
      .from("applications")
      .select("job_title, company_name")
      .eq("campaign_id", campaignId);
    const existingKeys = new Set<string>((existing || []).map((a: any) => jobKey(a.company_name, a.job_title)));

    // First sourcing pass (pages 1..FIRST_PASS_PAGES).
    const { jobs, pagesScanned } = await sourceJobs({
      targetRoles, industries, skills, existingKeys,
      startPage: 1, pagesToScan: FIRST_PASS_PAGES, maxJobs: target,
    });

    if (!jobs.length) throw new Error("No fresh matching jobs found.");

    const rows = jobs.map((j: any) => ({
      user_id: userId, campaign_id: campaignId, resume_id: resume.id ?? null,
      company_name: j.company || "Unknown Company",
      job_title:    j.title   || "Unknown Role",
      job_url:      j.url      || `https://jobstack.ai/job-not-found/${crypto.randomUUID()}`,
      job_description: j.description || "",
      match_score: j.match_score || 0,
      source:   j.source   || null, 
      location: j.location || null,
      status: "queued", cover_letter: null,
    }));

    const { error: insErr } = await supabase.from("applications").insert(rows);
    if (insErr && insErr.code !== "23505") throw insErr;

    // total_jobs = TARGET so the progress bar measures against the goal (e.g.
    // 16 of 100), not just what the first pass happened to find.
    await supabase.from("campaigns").update({
      target_jobs:     target,
      total_jobs:      target,
      status:          "running",
      source_cursor:   1 + pagesScanned,        // next top-up starts deeper
      last_sourced_at: new Date().toISOString(),
      next_batch_at:   new Date().toISOString(), // due now
    }).eq("id", campaignId);

    await appendLog(supabase, campaignId, `First pass sourced ${rows.length} of ${target} target jobs.`);

    // Instant kick so the first batch drafts within seconds.
    fetch(`${SUPABASE_URL}/functions/v1/process-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ campaignId }),
    }).catch((e) => console.error("worker kick failed:", e));

    return new Response(
      JSON.stringify({ jobs, jobsFetched: jobs.length, target }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("start-campaign error:", error);
    if (campaignId) {
      try {
        const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
        await sb.from("campaigns").update({ status: "failed", next_batch_at: null }).eq("id", campaignId);
      } catch (_) { /* noop */ }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});