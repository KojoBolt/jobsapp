import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GROQ_FAST_MODELS, GROQ_CHAT_URL, reasoningParams } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
}

// Contact block only when we actually have the details — inventing a
// "[Your Name]" placeholder is worse than omitting the header entirely.
function buildContactSection(userInfo: UserInfo | undefined, today: string): string {
  const lines = [userInfo?.fullName, userInfo?.email, userInfo?.phone, userInfo?.location]
    .filter(Boolean);

  if (!lines.length) {
    return `CANDIDATE DETAILS: not provided.
Do NOT open with a contact block and do NOT invent one — start at the greeting.`;
  }

  return `CANDIDATE DETAILS:
${lines.join("\n")}
Today's Date: ${today}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription, tone, jobTitle, company, userInfo } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return new Response(
        JSON.stringify({ error: "resumeText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
    const selectedTone = tone || "professional";

    const prompt = `You are a professional cover letter writer.
Write a compelling, complete cover letter using ONLY the real data provided below.
NEVER use placeholders like [Your Name], [Date], [Company Address], or any bracketed text.
NEVER invent or omit any of the candidate's details — use exactly what is given.

${buildContactSection(userInfo, today)}

RESUME:
${resumeText}

JOB TITLE: ${jobTitle || "the advertised role"}
COMPANY: ${company || "the company"}
JOB DESCRIPTION: ${jobDescription || ""}

TONE: ${selectedTone}

Requirements:
- 250-300 words
- Address the hiring manager professionally (use "Dear Hiring Manager," if no name is known)
- Highlight relevant experience from the resume
- Address key job requirements from the description
- Use ${selectedTone} tone
- Be specific and concise
- Do NOT use generic filler phrases
- Do NOT use any placeholder brackets whatsoever

Write only the cover letter, nothing else.`;

    // Walk the shared fallback chain rather than depending on one model.
    let coverLetter: string | undefined;
    const failures: string[] = [];

    for (const model of GROQ_FAST_MODELS) {
      const response = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          // Budget covers thinking + writing for a 300-word letter.
          max_completion_tokens: 4096,
          // Chain-of-thought must never reach the letter an employer reads.
          ...reasoningParams(model),
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const reason = data?.error?.message || `HTTP ${response.status}`;
        console.error(`Groq [${model}] failed: ${reason}`);
        failures.push(`${model}: ${reason}`);
        continue;
      }

      const text = data?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim().length > 50) {
        coverLetter = text.trim();
        break;
      }

      console.error(`Groq [${model}] returned no usable content`);
      failures.push(`${model}: empty content`);
    }

    // No silent template here — this endpoint is called on demand, so the
    // caller should know it failed rather than receive filler.
    if (!coverLetter) {
      throw new Error(`All Groq models failed — ${failures.join(" | ")}`);
    }

    return new Response(JSON.stringify({ coverLetter }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-cover-letter error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate cover letter",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
