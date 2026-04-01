import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  retries = 3
): Promise<string> {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a professional cover letter writer.
Generate a compelling cover letter based on:

RESUME:
${resumeText}

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION: ${jobDescription}

TONE: ${tone}

Requirements:
- 250-300 words
- Highlight relevant experience from resume
- Address key job requirements
- Use ${tone} tone
- Be specific and concise
- Don't use generic phrases

Write only the cover letter, no preamble.`
        }],
      }),
    });

    const data = await response.json();
    console.log(`Groq status (attempt ${attempt}):`, response.status);

    if (response.status === 429) {
      if (attempt < retries) {
        const waitTime = attempt * 5000;
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw new Error(`Rate limit exceeded after ${retries} attempts`);
    }

    if (!response.ok) {
      throw new Error(`Groq error: ${JSON.stringify(data)}`);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No text in Groq response");
    return text;
  }

  throw new Error("Failed to generate cover letter after retries");
}

async function appendLog(supabase: any, campaignId: string, message: string) {
  await supabase.rpc("append_campaign_log", {
    campaign_id: campaignId,
    log_message: `[${new Date().toISOString()}] ${message}`,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { campaignId, userId, job, resumeText, tone } = await req.json();

    if (!campaignId || !userId || !job || !resumeText) {
      throw new Error("Missing required fields: campaignId, userId, job, resumeText");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const coverLetter = await generateCoverLetterWithGroq(
      resumeText,
      job.title || "Unknown Role",
      job.company || "Unknown Company",
      job.description || "",
      tone || "professional"
    );

    console.log("Cover letter generated for:", job.title, "at", job.company);

    const { error: insertError } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        campaign_id: campaignId,
        company_name: job.company || "Unknown Company",
        job_title: job.title || "Unknown Role",
        job_url: job.url || null,
        job_description: job.description || null,
        cover_letter: coverLetter,
        status: "queued",
        match_score: job.match_score || 0,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

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
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});