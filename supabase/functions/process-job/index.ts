import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { GROQ_FAST_MODELS, GROQ_CHAT_URL, reasoningParams } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateCoverLetterWithGroq(
  resumeText: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  tone: string,
  userInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
  }
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
    console.log(`Trying model: ${model}`);

    // 3 attempts per model; backoff 3 s / 6 s / 9 s → max 18 s per model.
    // 3 models × 18 s = 54 s worst-case, well within the 150 s edge-function limit.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // 25 s hard timeout per Groq call so a stalled connection can't
        // consume the full edge-function budget on its own.
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25_000);

        let response: Response;
        try {
          response = await fetch(GROQ_CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              // Budget covers thinking + writing. The old 1024 was sized for a
              // 300-word letter with no reasoning, so it would truncate here.
              max_completion_tokens: 4096,
              // Chain-of-thought must never reach message.content — this letter
              // goes straight to an employer.
              ...reasoningParams(model),
              messages: [{ role: "user", content: prompt }],
            }),
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        console.log(`Groq [${model}] attempt ${attempt}: status ${response.status}`);

        if (response.status === 429) {
          const waitTime = attempt * 3000;
          console.log(`Rate limited on ${model}. Waiting ${waitTime}ms...`);
          await new Promise(r => setTimeout(r, waitTime));
          // On last attempt switch to next model instead of one more retry.
          if (attempt === 3) {
            console.warn(`${model} exhausted after ${attempt} attempts — switching model`);
            break;
          }
          continue;
        }

        if (response.status === 503 || response.status === 500) {
          console.warn(`Server error on ${model} attempt ${attempt}`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          console.error(`Groq error on ${model}:`, err);
          break;
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;

        if (text && text.trim().length > 50) {
          console.log(`✓ Cover letter generated using ${model}`);
          return { text: text.trim(), usedFallback: false };
        }

        console.warn(`Empty response from ${model}`);
        break;

      } catch (err: any) {
        // AbortError means the 25 s timeout fired — treat it like a server error.
        if (err?.name === "AbortError") {
          console.warn(`Groq [${model}] timed out on attempt ${attempt} — moving on`);
          break;
        }
        console.error(`Network error on ${model} attempt ${attempt}:`, err);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.error(
    `All Groq models failed (${GROQ_FAST_MODELS.join(", ")}) — falling back to the ` +
    `generic template. This letter is NOT tailored to the resume or the job.`
  );
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
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

async function appendLog(supabase: any, campaignId: string, message: string) {
  try {
    await supabase.rpc("append_campaign_log", {
      campaign_id: campaignId,
      log_message: `[${new Date().toISOString()}] ${message}`,
    });
  } catch (err) {
    console.error("appendLog error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { campaignId, userId, job, resumeText, tone } = body;

  try {
    if (!campaignId || !userId || !job || !resumeText) {
      throw new Error("Missing required fields: campaignId, userId, job, resumeText");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Safety check — verify userId matches campaign owner ───────────────
    // Prevents applications being saved to the wrong user if userId is
    // incorrect or mismatched between drip-batch and process-job calls.
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("user_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.user_id !== userId) {
      console.error(
        `userId mismatch! campaign.user_id=${campaign.user_id} but received userId=${userId}`
      );
      throw new Error("userId does not match campaign owner — aborting to prevent data leak");
    }

    console.log(`✅ userId verified: ${userId} matches campaign owner`);

    // ── Fetch user profile for cover letter personalisation ───────────────
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("identity_vault_data, email")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Failed to fetch profile:", profileError);
    }

    const personalInfo = profileData?.identity_vault_data?.personalInfo ?? {};

    const userInfo = {
      fullName: personalInfo.fullName
        || personalInfo.full_name
        || personalInfo.name
        || "Candidate",
      email: personalInfo.email
        || profileData?.email
        || "",
      phone: personalInfo.phone
        || personalInfo.phoneNumber
        || personalInfo.phone_number
        || "",
      location: [personalInfo.city, personalInfo.country]
        .filter(Boolean)
        .join(", ") || personalInfo.location || "",
    };

    console.log("userInfo resolved:", userInfo);

    // ── Generate cover letter ─────────────────────────────────────────────
    const { text: coverLetter, usedFallback } = await generateCoverLetterWithGroq(
      resumeText,
      job.title       || "Unknown Role",
      job.company     || "Unknown Company",
      job.description || "",
      tone            || "professional",
      userInfo,
    );

    console.log("Cover letter ready for:", job.title, "at", job.company);

    // Surface template letters in the campaign log — an untailored letter that
    // reads as a normal success is worse than a visible failure.
    if (usedFallback) {
      await appendLog(
        supabase,
        campaignId,
        `⚠️ AI unavailable — generic template used for "${job.title}" at ${job.company}. Regenerate this one before it goes out.`,
      );
    }

    // ── Insert application ────────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id:         userId,       // always the verified campaign owner
        campaign_id:     campaignId,
        company_name:    job.company     || "Unknown Company",
        job_title:       job.title       || "Unknown Role",
        job_url:         job.url         || "https://jobstack.ai/job-not-found",
        job_description: job.description || "No description provided",
        cover_letter:    coverLetter,
        status:          "queued",
        match_score:     job.match_score || 0,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // ── Notify Admin ──────────────────────────────────────────────────────
    try {
      await supabase.from("admin_notifications").insert({
        type: "new_application",
        title: "New Job Application Deployed",
        message: `User ${userInfo.fullName} applied for ${job.title} at ${job.company}`,
        user_id: userId,
      });
      console.log("Admin notification sent");
    } catch (adminErr) {
      console.error("Failed to notify admin:", adminErr);
      // Don't throw, as the app was already inserted
    }

    // ── Increment campaign progress ───────────────────────────────────────
    await supabase.rpc("increment_campaign_progress", {
      campaign_id: campaignId,
    });

    await appendLog(
      supabase,
      campaignId,
      `Cover letter generated for ${job.title} at ${job.company}`
    );

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("process-job error:", error);

    // LOG ERROR TO CAMPAIGN LOGS
    if (campaignId) {
      await appendLog(
        supabase,
        campaignId,
        `Error processing job ${job?.title || "Unknown"}: ${error.message}`
      );
    }
    if (campaignId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase.rpc("increment_campaign_progress", {
          campaign_id: campaignId,
        });
        console.log("Progress incremented despite error for campaign:", campaignId);
      } catch (fallbackErr) {
        console.error("Fallback increment failed:", fallbackErr);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});