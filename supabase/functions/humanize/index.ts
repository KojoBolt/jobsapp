import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tonePrompts: Record<string, string> = {
  technical: `You are an expert technical writer. Rewrite the following text to sound naturally written by a senior engineer. Use precise terminology, active voice, concise sentences, and a confident but approachable tone. Avoid filler words, clichés, and overly formal language. Make it sound like a real human expert wrote it organically.`,
  
  creative: `You are a seasoned creative writer. Rewrite the following text to sound naturally written by a talented human. Use vivid language, varied sentence structure, unique metaphors, and an engaging rhythm. Avoid generic phrasing and predictable patterns. Make it feel authentic, personal, and unmistakably human.`,
  
  executive: `You are a top-tier executive communications specialist. Rewrite the following text to sound naturally written by a C-suite leader. Use authoritative yet accessible language, strategic framing, clear action-oriented sentences, and measured confidence. Avoid jargon overload and robotic patterns. Make it sound like a seasoned leader communicating with clarity and purpose.`,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { text, tone } = await req.json();

    // Validation
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Text too long. Maximum 5000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tone prompt
    const selectedTone = tone && tonePrompts[tone] ? tone : "technical";
    const systemPrompt = tonePrompts[selectedTone];

    // Get Groq API key from environment
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    console.log(`Humanizing ${text.length} chars with ${selectedTone} tone`);

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: systemPrompt 
          },
          {
            role: "user",
            content: `Rewrite this text to be completely undetectable as AI-generated while preserving the original meaning and key points. Return ONLY the rewritten text, no explanations or preamble:\n\n${text}`,
          },
        ],
        temperature: 0.8, // Higher for more human-like variation
        max_tokens: 2000,
        stream: true, // Enable streaming
      }),
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", response.status, errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream response back to client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Humanize function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});