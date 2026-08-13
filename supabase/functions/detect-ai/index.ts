import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Contract confirmed by probing the live API:
 *   POST https://api.zerogpt.com/api/detect/detectText
 *   header: ApiKey: <key>            (x-api-key is silently ignored)
 *   body:   { "input_text": "..." }
 *
 * Two things to know about its error handling:
 *  - A bad or absent key returns HTTP 401 {"detail":"Invalid API Key"}.
 *  - Business errors return HTTP **200** with {success:false, code:403, message}.
 *    So res.ok is not a success test — `success`/`code` in the body is.
 */
const ZEROGPT_URL = "https://api.zerogpt.com/api/detect/detectText";

/** Detectors need a reasonable sample, and each call is billed. */
const MIN_CHARS = 250;

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Normalises ZeroGPT's `data` object into the shape the UI renders.
 *
 * Field names are read through a fallback chain rather than assumed — a paid key
 * is needed to observe a real success payload, so `rawKeys` is logged on the
 * first live call. Check it and tighten this once the true shape is known.
 */
// deno-lint-ignore no-explicit-any
function normalise(data: any) {
  // fakePercentage is the documented "% AI" figure. is_human has been seen as
  // both a 0–100 percentage and a boolean, so it is only trusted when numeric
  // and in range.
  const aiPct =
    typeof data?.fakePercentage === "number"
      ? data.fakePercentage
      : typeof data?.isHuman === "number" && data.isHuman >= 0 && data.isHuman <= 100
      ? 100 - data.isHuman
      : typeof data?.is_human === "number" && data.is_human >= 0 && data.is_human <= 100
      ? 100 - data.is_human
      : null;

  const aiWords = typeof data?.aiWords === "number" ? data.aiWords : null;
  const textWords = typeof data?.textWords === "number" ? data.textWords : null;

  // Last resort: the word counts imply a ratio even if no percentage came back.
  const aiProbability =
    aiPct !== null
      ? clampPct(aiPct)
      : aiWords !== null && textWords
      ? clampPct((aiWords / textWords) * 100)
      : null;

  const sentences = Array.isArray(data?.sentences) ? data.sentences : [];

  return {
    provider: "ZeroGPT",
    humanScore: aiProbability === null ? null : clampPct(100 - aiProbability),
    aiProbability,
    feedback: typeof data?.feedback === "string" ? data.feedback : null,
    aiWords,
    textWords,
    flaggedSentences: sentences.length,
    language: typeof data?.detected_language === "string" ? data.detected_language : null,
    rawKeys: data && typeof data === "object" ? Object.keys(data) : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const ZEROGPT_API_KEY = Deno.env.get("ZEROGPT_API_KEY");

    // 501 rather than 500: the caller distinguishes "not configured" from
    // "broken" and falls back to its local estimate.
    if (!ZEROGPT_API_KEY) {
      return json({ error: "ZEROGPT_API_KEY is not configured", code: "not_configured" }, 501);
    }

    const body = await req.json().catch(() => null);
    const text = String(body?.text ?? "").trim();

    if (!text) return json({ error: "No text supplied", code: "empty" }, 400);
    if (text.length < MIN_CHARS) {
      return json(
        {
          error: `Needs at least ${MIN_CHARS} characters for a reliable verdict.`,
          code: "too_short",
        },
        400,
      );
    }

    const res = await fetch(ZEROGPT_URL, {
      method: "POST",
      headers: {
        ApiKey: ZEROGPT_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ input_text: text }),
    });

    const raw = await res.text();
    // deno-lint-ignore no-explicit-any
    let payload: any = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      console.error("ZeroGPT returned non-JSON:", res.status, raw.slice(0, 400));
      return json({ error: "ZeroGPT returned an unreadable response", code: "upstream" }, 502);
    }

    // Gateway-level rejection: HTTP 401 {"detail":"Invalid API Key"}.
    if (res.status === 401 || payload?.detail === "Invalid API Key") {
      console.error("ZeroGPT rejected the key:", JSON.stringify(payload));
      return json({ error: "ZeroGPT rejected the API key", code: "bad_key" }, 502);
    }

    // Business-level failure arrives as HTTP 200 — this is why res.ok is not used.
    if (payload?.success === false || (payload?.code && payload.code !== 200)) {
      console.error("ZeroGPT error body:", JSON.stringify(payload));
      return json(
        {
          error: payload?.message || "ZeroGPT declined the request",
          code: payload?.code === 403 ? "no_credit" : "upstream",
        },
        502,
      );
    }

    if (!payload?.data) {
      console.error("Unexpected ZeroGPT payload:", raw.slice(0, 800));
      return json({ error: "Unexpected response from ZeroGPT", code: "unexpected" }, 502);
    }

    const result = normalise(payload.data);

    // Reveals the real field names on the first successful call so the fallback
    // chain above can be replaced with the exact keys this account returns.
    console.log("ZeroGPT data keys:", result.rawKeys.join(", "));

    if (result.humanScore === null) {
      return json(
        { error: "ZeroGPT response carried no recognisable score", code: "unexpected", ...result },
        502,
      );
    }

    return json(result);
  } catch (error) {
    console.error("detect-ai threw:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
