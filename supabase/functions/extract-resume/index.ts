import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64 safely
    let binary = "";
    const chunkSize = 1024;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...Array.from(chunk));
    }
    const base64 = btoa(binary);

    console.log("File size:", uint8Array.length);
    console.log("Base64 length:", base64.length);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64,
                  },
                },
                {
                  text: "Extract all text from this resume PDF. Return only the plain text content, preserving the structure. No commentary.",
                },
              ],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();
    console.log("Gemini status:", geminiRes.status);
    console.log("Gemini response:", JSON.stringify(geminiData).slice(0, 500));

    if (!geminiRes.ok) {
      throw new Error(geminiData.error?.message || "Gemini API failed");
    }

    const extractedText =
      geminiData?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || "")
        .join("")
        .trim();

    if (!extractedText) {
      throw new Error(`Unexpected response: ${JSON.stringify(geminiData)}`);
    }

    console.log("Extracted text length:", extractedText.length);

    return new Response(
      JSON.stringify({ extractedText }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("extract-resume error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});