import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { sourceJobs, jobKey } from "../_shared/sourcing.ts";
import { GROQ_FAST_MODELS, GROQ_CHAT_URL, reasoningParams } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── PACING / LIMITS (tune freely) ────────────────────────────────────────────
const MAX_PER_RUN     = 8;          // cover letters drafted per run
const CONCURRENCY      = 2;          // Groq calls in parallel
const SUBBATCH_GAP_MS  = 4_000;
// FAST cadence: while productive (queue draining OR sourcing finding new jobs).
const FAST_MIN_MS      = 3 * 60_000;
const FAST_MAX_MS      = 9 * 60_000;
// SLOW cadence: tapped out — hunt for newly-posted jobs every few hours.
const SLOW_SOURCE_MS   = 6 * 60 * 60_000;   // 6 hours
// Stop hunting entirely after this long.
const CAMPAIGN_MAX_AGE_MS = 7 * 24 * 60 * 60_000;  // 7 days
// Top-up sourcing.
const PAGES_PER_TOPUP  = 2;
const MAX_SOURCE_PAGE  = 20;        // past this, reset cursor to 1 (front pages = fresh posts)
const STALE_DRAFT_MS   = 10 * 60_000;

function fastDelayMs(): number {
  return Math.floor(FAST_MIN_MS + Math.random() * (FAST_MAX_MS - FAST_MIN_MS));
}

async function appendLog(supabase: any, campaignId: string, msg: string) {
  try {
    await supabase.rpc("append_campaign_log", {
      campaign_id: campaignId,
      log_message: `[${new Date().toISOString()}] ${msg}`,
    });
  } catch (err) { console.error("appendLog error:", err); }
}

async function notify(supabase: any, userId: string, campaignId: string, message: string) {
  await supabase.from("campaign_notifications")
    .insert({ user_id: userId, campaign_id: campaignId, message, read: false })
    .then(() => {}, () => {}); // ignore if table differs
}

async function countApps(supabase: any, campaignId: string, build: (q: any) => any): Promise<number> {
  let q = supabase.from("applications").select("*", { count: "exact", head: true }).eq("campaign_id", campaignId);
  q = build(q);
  const { count } = await q;
  return count || 0;
}

// ─── Cover-letter generation ──────────────────────────────────────────────────
async function generateCoverLetter(
  resumeText: string, jobTitle: string, company: string, jobDescription: string, tone: string,
  userInfo: { fullName: string; email: string; phone: string; location: string },
): Promise<{ text: string; usedFallback: boolean }> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
  const prompt = `You are a professional cover letter writer.
Write a compelling, complete cover letter using ONLY the real data provided below.
NEVER use placeholders like [Your Name], [Date], [Company Address], or any bracketed text.
NEVER invent or omit any of the candidate's details — use exactly what is given.

CANDIDATE DETAILS:
Full Name: ${userInfo.fullName}
Email: ${userInfo.email}
Phone: ${userInfo.phone}
Location: ${userInfo.location}
Today's Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

RESUME:
${resumeText}

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION: ${jobDescription}

TONE: ${tone}

Requirements:
- 250-300 words
- Open with candidate's real contact block (name, email, phone, location, date)
- Address the hiring manager professionally (use "Dear Hiring Manager," if no name is known)
- Highlight relevant experience from the resume
- Address key job requirements from the description
- Use ${tone} tone
- Be specific and concise
- Do NOT use generic filler phrases
- Do NOT use any placeholder brackets whatsoever

Write only the cover letter, nothing else.`;

  for (const model of GROQ_FAST_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25_000);
        let response: Response;
        try {
          response = await fetch(GROQ_CHAT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
              model,
              // Budget covers thinking + writing; 1024 would truncate a letter.
              max_completion_tokens: 4096,
              // Chain-of-thought must never reach the letter an employer reads.
              ...reasoningParams(model),
              messages: [{ role: "user", content: prompt }],
            }),
            signal: ctrl.signal,
          });
        } finally { clearTimeout(timer); }

        if (response.status === 429) { await new Promise(r => setTimeout(r, attempt * 3000)); if (attempt === 3) break; continue; }
        if (response.status === 503 || response.status === 500) { await new Promise(r => setTimeout(r, 2000)); continue; }
        if (!response.ok) break;
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 50) return { text: text.trim(), usedFallback: false };
        break;
      } catch (err: any) {
        if (err?.name === "AbortError") break;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.error(
    `All Groq models failed (${GROQ_FAST_MODELS.join(", ")}) — falling back to the ` +
    `generic template. This letter is NOT tailored to the resume or the job.`
  );
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return { usedFallback: true, text: `${userInfo.fullName}
${userInfo.email}
${userInfo.phone}
${userInfo.location}
${today}

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. Having reviewed the job requirements, I am confident that my background and skills make me an excellent candidate for this role.

Throughout my career, I have developed expertise that directly aligns with what ${company} is looking for. My experience has equipped me with the technical and interpersonal skills necessary to make an immediate and meaningful contribution to your team.

What particularly excites me about this opportunity at ${company} is the chance to bring my skills to a forward-thinking organization. I am eager to leverage my background to help drive results and contribute to the team's success.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for considering my application — I look forward to the possibility of speaking with you.

Sincerely,
${userInfo.fullName}
${userInfo.email} | ${userInfo.phone}` };
}

function resolveUserInfo(profileData: any) {
  const p = profileData?.identity_vault_data?.personalInfo ?? {};
  return {
    fullName: p.fullName || p.full_name || p.name || profileData?.full_name || "Candidate",
    email: p.email || profileData?.email || "",
    phone: p.phone || p.phoneNumber || p.phone_number || "",
    location: [p.city, p.country].filter(Boolean).join(", ") || p.location || "",
  };
}

// ─── One campaign pass: source if short → draft a batch → schedule next ───────
async function processCampaignBatch(supabase: any, campaign: any) {
  const campaignId = campaign.id;
  const userId     = campaign.user_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("identity_vault_data, email, full_name, credits_remaining")
    .eq("id", userId)
    .single();
  const credits = profile?.credits_remaining || 0;

  // Target can change mid-flight (e.g. user buys +100 credits → target bumped).
  let target = campaign.target_jobs || 0;
  const draftedCount = await countApps(supabase, campaignId, (q) => q.not("cover_letter", "is", null));
  if (target <= 0) target = Math.max(draftedCount, await countApps(supabase, campaignId, (q) => q.neq("status", "failed")));

  // ── STOP CONDITIONS ──────────────────────────────────────────────────
  const age = Date.now() - new Date(campaign.created_at).getTime();

  if (target > 0 && draftedCount >= target) {
    await supabase.from("campaigns").update({ status: "completed", next_batch_at: null }).eq("id", campaignId);
    await notify(supabase, userId, campaignId, `🎉 All ${draftedCount} applications are ready for review.`);
    return { campaignId, reason: "target-met", drafted: draftedCount };
  }

  if (age > CAMPAIGN_MAX_AGE_MS) {
    await supabase.from("campaigns").update({ status: "completed", next_batch_at: null }).eq("id", campaignId);
    await notify(supabase, userId, campaignId, `Campaign finished: found ${draftedCount} of your ${target} target jobs.`);
    return { campaignId, reason: "expired", drafted: draftedCount };
  }

  if (credits < 1) {
    // Pause, but resumable: a credit top-up purchase sets status=running + next_batch_at=now.
    await supabase.from("campaigns").update({ status: "exhausted", next_batch_at: null }).eq("id", campaignId);
    await notify(supabase, userId, campaignId, `Out of credits at ${draftedCount} applications. Buy more to continue.`);
    return { campaignId, reason: "no-credits", drafted: draftedCount };
  }

  // ── TOP-UP SOURCING (only if short and the queue is running low) ─────
  let producedNew = 0;
  const sourcedActive = await countApps(supabase, campaignId, (q) => q.neq("status", "failed"));
  const queuedBefore  = await countApps(supabase, campaignId, (q) => q.eq("status", "queued"));

  if (sourcedActive < target && queuedBefore < MAX_PER_RUN) {
    const { data: existing } = await supabase
      .from("applications").select("job_title, company_name").eq("campaign_id", campaignId);
    const existingKeys = new Set<string>((existing || []).map((a: any) => jobKey(a.company_name, a.job_title)));

    const startPage = (campaign.source_cursor && campaign.source_cursor <= MAX_SOURCE_PAGE) ? campaign.source_cursor : 1;
    const { jobs: newJobs, pagesScanned } = await sourceJobs({
      targetRoles: [...(profile?.identity_vault_data?.targeting?.targetRoles || [])],
      industries:  profile?.identity_vault_data?.targeting?.industries || [],
      skills:      profile?.identity_vault_data?.skills || "",
      existingKeys, startPage, pagesToScan: PAGES_PER_TOPUP, maxJobs: target - sourcedActive,
    });

    if (newJobs.length) {
      const rows = newJobs.map((j: any) => ({
        user_id: userId, campaign_id: campaignId,
        company_name: j.company || "Unknown Company",
        job_title:    j.title   || "Unknown Role",
        job_url:      j.url      || `https://jobstack.ai/job-not-found/${crypto.randomUUID()}`,
        job_description: j.description || "",
        source:   j.source   || null,
        location: j.location || null,
        match_score: j.match_score || 0, status: "queued", cover_letter: null,
      }));
      const { error: insErr } = await supabase.from("applications").insert(rows);
      if (insErr && insErr.code !== "23505") console.error("topup insert error:", insErr);
      producedNew = rows.length;
    }

    const nextCursor = newJobs.length ? (startPage + pagesScanned) : 1; // reset to front when tapped out
    await supabase.from("campaigns").update({
      source_cursor: nextCursor > MAX_SOURCE_PAGE ? 1 : nextCursor,
      last_sourced_at: new Date().toISOString(),
    }).eq("id", campaignId);

    await appendLog(supabase, campaignId, producedNew
      ? `Top-up sourced ${producedNew} new job(s) (page ${startPage}).`
      : `Top-up found no new jobs (page ${startPage}); will slow-hunt for fresh postings.`);
  }

  // ── DRAFT A BATCH ────────────────────────────────────────────────────
  const limit = Math.min(campaign.batch_size || MAX_PER_RUN, MAX_PER_RUN, credits);
  const { data: claimed } = await supabase.rpc("claim_jobs_for_drafting", { p_campaign_id: campaignId, p_limit: limit });

  let drafted = 0;
  let templated = 0;   // drafted, but with the generic fallback — needs regeneration
  if (claimed?.length) {
    const { data: resume } = await supabase
      .from("resumes").select("extracted_text, tone_preference")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();
    const resumeText = resume?.extracted_text || "";
    const tone       = resume?.tone_preference || "professional";
    const userInfo   = resolveUserInfo(profile);

    for (let i = 0; i < claimed.length; i += CONCURRENCY) {
      const sub = claimed.slice(i, i + CONCURRENCY);
      await Promise.allSettled(sub.map(async (app: any) => {
        try {
          const { text: letter, usedFallback } = await generateCoverLetter(
            resumeText, app.job_title || "Unknown Role", app.company_name || "Unknown Company",
            app.job_description || "", tone, userInfo,
          );
          await supabase.rpc("complete_application", { p_app_id: app.id, p_cover_letter: letter });
          drafted++;
          if (usedFallback) templated++;
        } catch (err: any) {
          await supabase.rpc("fail_application", { p_app_id: app.id });
          await appendLog(supabase, campaignId, `Failed to draft "${app.job_title}": ${err?.message || "error"}`);
        }
      }));
      if (i + CONCURRENCY < claimed.length) await new Promise(r => setTimeout(r, SUBBATCH_GAP_MS));
    }
    if (drafted) await appendLog(supabase, campaignId, `Drafted ${drafted} cover letter(s) this batch.`);
    // Surface template letters — untailored drafts that read as normal successes
    // are worse than a visible failure. One line per batch, not per letter.
    if (templated) {
      await appendLog(
        supabase, campaignId,
        `⚠️ AI unavailable for ${templated} of ${drafted} letter(s) — generic template used. Regenerate before they go out.`,
      );
    }
    await notify(supabase, userId, campaignId, `✅ ${drafted} new application(s) ready for review.`);
  }

  // ── DECIDE COMPLETION / NEXT CADENCE ─────────────────────────────────
  const draftedNow = await countApps(supabase, campaignId, (q) => q.not("cover_letter", "is", null));
  if (target > 0 && draftedNow >= target) {
    await supabase.from("campaigns").update({ status: "completed", next_batch_at: null }).eq("id", campaignId);
    await notify(supabase, userId, campaignId, `🎉 All ${draftedNow} applications are ready for review.`);
    return { campaignId, reason: "target-met", drafted: draftedNow };
  }

  const queuedRemain = await countApps(supabase, campaignId, (q) => q.eq("status", "queued"));
  let delay: number;
  if (queuedRemain > 0)      delay = fastDelayMs();      // still letters to write → stay fast
  else if (producedNew > 0)  delay = fastDelayMs();      // sourcing is productive → stay fast
  else                       delay = SLOW_SOURCE_MS;     // tapped out → slow hunt for new postings

  await supabase.from("campaigns").update({
    status: "running",
    next_batch_at: new Date(Date.now() + delay).toISOString(),
  }).eq("id", campaignId);

  return { campaignId, reason: "running", drafted, producedNew, slow: delay === SLOW_SOURCE_MS };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const now = new Date().toISOString();

    // Reaper: free rows stuck in 'drafting' from a crashed run.
    const staleCutoff = new Date(Date.now() - STALE_DRAFT_MS).toISOString();
    await supabase.from("applications").update({ status: "queued" })
      .eq("status", "drafting").lt("updated_at", staleCutoff);

    const body = await req.json().catch(() => ({}));
    let dueCampaigns: any[] = [];

    if (body?.campaignId) {
      const { data } = await supabase
        .from("campaigns")
        .select("id, user_id, batch_size, status, target_jobs, source_cursor, created_at")
        .eq("id", body.campaignId).eq("status", "running").maybeSingle();
      if (data) dueCampaigns = [data];
    } else {
      const { data } = await supabase
        .from("campaigns")
        .select("id, user_id, batch_size, status, target_jobs, source_cursor, created_at")
        .eq("status", "running").lte("next_batch_at", now).not("next_batch_at", "is", null);
      dueCampaigns = data || [];
    }

    if (!dueCampaigns.length) {
      return new Response(JSON.stringify({ processed: 0, message: "No campaigns due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    for (const campaign of dueCampaigns) {
      // Lease so overlapping cron ticks don't double-run the same campaign.
      const lease = new Date(Date.now() + 5 * 60_000).toISOString();
      const { data: leased } = await supabase
        .from("campaigns").update({ next_batch_at: lease })
        .eq("id", campaign.id).eq("status", "running").lte("next_batch_at", now)
        .select().maybeSingle();
      if (!leased && !body?.campaignId) continue;

      try {
        results.push(await processCampaignBatch(supabase, campaign));
      } catch (err: any) {
        console.error(`campaign ${campaign.id} error:`, err);
        await appendLog(supabase, campaign.id, `Batch error: ${err?.message || "unknown"}`);
        await supabase.from("campaigns").update({ next_batch_at: new Date(Date.now() + fastDelayMs()).toISOString() })
          .eq("id", campaign.id).eq("status", "running");
        results.push({ campaignId: campaign.id, reason: err?.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("process-batch error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});