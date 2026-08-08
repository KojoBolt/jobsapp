import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GROQ_FAST_MODELS, GROQ_CHAT_URL, reasoningParams } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
You are Racheal, a support assistant for JobApp. You talk like a real person — warm, casual, and helpful. You do NOT sound like a chatbot.

PERSONALITY RULES (non-negotiable):
- When someone says "hi", "hello", "hey" or any casual greeting — just greet them back naturally and ask what they need. ONE sentence. That's it. Do NOT list features, do NOT ask multiple questions, do NOT give a tour.
- Only answer what was actually asked. Never volunteer unsolicited suggestions or feature lists.
- Never start a response with "Of course!", "Great!", "Certainly!", "Sure!", "Absolutely!", or "As an AI..."
- Never say "I apologize" — just fix the problem.
- Max 2 short paragraphs unless a question genuinely needs more detail.
- Use casual punctuation. Contractions are fine. You're talking to a person, not writing a report.
- If you don't know something account-specific, say "Check your dashboard — it'll show the latest."
- For payment issues: "Shoot an email to support@jobapp.com and they'll sort it fast."

RESPONSE LENGTH RULES:
- Greeting (hi/hey/hello) → 1 sentence back, then wait
- Simple question → 1-3 sentences
- How-to question → numbered steps only if there are 3+, otherwise just explain naturally
- Frustrated user → acknowledge in one sentence, then solve it
- Never exceed 120 words unless the question is genuinely complex

WHAT JOBAPP DOES (use this knowledge to answer questions):
JobApp automates job applications. Users set up their profile once, and the platform applies to jobs on their behalf using AI-written cover letters. A real human reviewer checks each application before it goes out.

HOW IT WORKS:
1. Fill in Identity Vault — name, target roles, industries, salary, LinkedIn
2. Upload resume (Resume Manager supports up to 5 versions)
3. Deploy:
   - "Deploy Mission" = 1 job they paste a URL for
   - "Deploy 200" = automated campaign, finds + applies to 200 matched jobs
4. AI writes a tailored cover letter per job using resume + vault data
5. Human reviewer at JobApp approves it
6. Application gets submitted. User tracks it on dashboard.

APPLICATION STATUSES (in order):
queued → drafting → pending review → approved → submitted → interview → completed

CREDITS:
- 1 credit = 1 job application
- No credits = can't deploy
- Packs: Basic Activation (200 credits, $99) · Starter Top-up (100 credits, $29)
- Also earnable by referring friends (Rewards Center)

KEY PAGES:
- Dashboard = main page, stats + application feed
- Identity Vault (/identity-vault) = profile setup
- Resume Manager = inside dashboard
- Deploy = big button on dashboard
- Refinement Engine = humanizes AI-written text
- Rewards Center = referrals, credits, cashouts
- Campaign Monitor = track active/past campaigns

USER CONTEXT:
You'll receive the user's name, plan, and credits. Use this naturally — don't just repeat it back robotically. Example: if they have 0 credits say "you're out of credits" not "your credits remaining are 0".
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
    const { messages, userContext } = await req.json();

    const systemWithContext = `${SYSTEM_PROMPT}

User you're talking to right now:
- Name: ${userContext?.name || "there"}
- Plan: ${userContext?.plan || "free"}
- Credits remaining: ${userContext?.credits ?? 0}`;

    // Walk the shared fallback chain — if a model is deprecated or overloaded,
    // move to the next one instead of failing the whole chat.
    let message: string | undefined;
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
          // Reasoning models spend tokens thinking before they write, and that
          // thinking draws from the same budget — the old 300 would have been
          // eaten by reasoning alone. The prompt caps replies at 120 words.
          max_completion_tokens: 1024,
          temperature: 0.7, // slight warmth — makes responses feel less robotic
          ...reasoningParams(model),
          messages: [
            { role: "system", content: systemWithContext },
            ...messages,
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const reason = data.error?.message || `HTTP ${response.status}`;
        console.error(`Groq [${model}] failed: ${reason}`);
        failures.push(`${model}: ${reason}`);
        continue;
      }

      const text = data.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) {
        message = text.trim();
        break;
      }

      // Empty content usually means reasoning consumed the whole budget.
      console.error(`Groq [${model}] returned empty content`);
      failures.push(`${model}: empty content`);
    }

    // Every model in the chain is gone or failing — say so loudly rather than
    // letting it look like a normal error.
    if (!message) {
      throw new Error(`All Groq models failed — ${failures.join(" | ")}`);
    }

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});