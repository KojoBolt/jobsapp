import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription, tone } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, // ← safe, server-side
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a professional cover letter writer.

Generate a compelling cover letter based on:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TONE: ${tone}

Requirements:
- 250-300 words
- Highlight relevant experience from resume
- Address key job requirements
- Use ${tone} tone
- Be specific and concise
- Don't use generic phrases

Write only the cover letter, no preamble.`,
        }],
      }),
    });

    const data = await response.json();
    const coverLetter = data.content[0].text;

    return new Response(JSON.stringify({ coverLetter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to generate cover letter" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});