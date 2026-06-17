import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// 2 concurrent process-job calls per batch keeps Groq requests well under the
// 30 req/min free-tier limit when combined with the 4 s inter-batch delay below.
const FANOUT_BATCH = 2;

interface DueCampaign {
  id: string;
  user_id: string;
  current_batch_index: number;
  batch_size: number;
  interval_hours: number;
  total_jobs: number;
}

async function appendLog(supabase: any, campaignId: string, msg: string) {
  try {
    await supabase.rpc("append_campaign_log", {
      campaign_id: campaignId,
      log_message: `[${new Date().toISOString()}] ${msg}`,
    });
  } catch (err) {
    console.error("appendLog error:", err);
  }
}

async function fanOutProcessJob(
  campaignId: string,
  userId: string,
  jobs: any[],
  resumeText: string,
  tone: string,
) {
  const batches: any[][] = [];
  for (let i = 0; i < jobs.length; i += FANOUT_BATCH) {
    batches.push(jobs.slice(i, i + FANOUT_BATCH));
  }

  for (const batch of batches) {
    // allSettled so a single failing job never blocks the rest of the batch.
    await Promise.allSettled(
      batch.map((job: any) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 45_000);
        return fetch(`${SUPABASE_URL}/functions/v1/process-job`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_ROLE}`,
          },
          body: JSON.stringify({ campaignId, userId, job, resumeText, tone }),
          signal: ctrl.signal,
        })
          .catch((err) => console.error("process-job error:", err))
          .finally(() => clearTimeout(timer));
      })
    );
    // 4 s gap between batches respects Groq's 30 req/min free-tier limit.
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

async function runBatchForCampaign(
  supabase: any,
  campaign: DueCampaign,
): Promise<{ ok: boolean; reason: string }> {
  // 1. Check credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_remaining")
    .eq("id", campaign.user_id)
    .single();

  const credits = profile?.credits_remaining || 0;
  if (credits < 1) {
    await supabase
      .from("campaigns")
      .update({ status: "exhausted", next_batch_at: null })
      .eq("id", campaign.id);
    await appendLog(supabase, campaign.id, "Campaign exhausted — no credits remaining");
    return { ok: false, reason: "exhausted" };
  }

  // 2. Call start-campaign
try {
  // 2. Trigger start-campaign
  const { data: result, error: invokeError } = await supabase.functions.invoke("start-campaign", {
    body: {
      campaignId:     campaign.id,
      userId:         campaign.user_id,
      batchIndex:     campaign.current_batch_index,
      limit:          campaign.batch_size,
      alreadyFetched: campaign.total_jobs,
    },
  });

  if (invokeError) {
    const errorMessage = invokeError.message || "unknown invoke error";
    await appendLog(supabase, campaign.id, `Drip batch invoke failed: ${errorMessage}`);
    return { ok: false, reason: errorMessage };
  }

  // Check if start-campaign marked the campaign as exhausted
  const { data: updatedCampaign } = await supabase
    .from("campaigns")
    .select("status")
    .eq("id", campaign.id)
    .single();

  if (updatedCampaign?.status === "exhausted" || updatedCampaign?.status === "completed") {
    return { ok: true, reason: `batch complete — campaign ${updatedCampaign.status}` };
  }

  return { ok: true, reason: `triggered ${result?.jobsFetched || 0} jobs` };
} catch (err: any) {
  await appendLog(supabase, campaign.id, `Drip batch network error: ${err.message}`);
  return { ok: false, reason: err.message };
}
} 

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const now = new Date().toISOString();

    // ── 1. Find due campaigns ─────────────────────────────────────────────
    const { data: dueCampaigns, error } = await supabase
      .from("campaigns")
      .select("id, user_id, current_batch_index, batch_size, interval_hours, total_jobs")
      .eq("status", "running")
      .lte("next_batch_at", now)
      .not("next_batch_at", "is", null);

    if (error) throw error;

    if (!dueCampaigns?.length) {
      console.log("No campaigns due");
      return new Response(
        JSON.stringify({ processed: 0, message: "No campaigns due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`drip-batch: ${dueCampaigns.length} campaign(s) due`);

    // ── 2. Process each campaign serially ─────────────────────────────────
    const results: any[] = [];
    for (const campaign of dueCampaigns as DueCampaign[]) {
      const claimedNext = new Date(
        Date.now() + 5 * 60 * 1000
      ).toISOString();

      const { data: claimed } = await supabase
        .from("campaigns")
        .update({ next_batch_at: claimedNext })
        .eq("id", campaign.id)
        .lte("next_batch_at", now)
        .select()
        .single();

      if (!claimed) {
        console.log(`Campaign ${campaign.id} already claimed — skipping`);
        continue;
      }

      const result = await runBatchForCampaign(supabase, campaign);
      results.push({ campaignId: campaign.id, ...result });

      if (result.ok) {
      await supabase.from("campaign_notifications").insert({
        user_id:     campaign.user_id,
        campaign_id: campaign.id,
        message:     `✅ ${result.reason} — your campaign auto-deployed a new batch successfully!`,
        read:        false,
  });    
      }

    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("drip-batch error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});