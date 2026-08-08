// ─── Groq model configuration ─────────────────────────────────────────────────
// Single source of truth for every Groq model ID used by the edge functions.
// When Groq deprecates a model, change it HERE — not in five separate files.
//
// Deprecation history that got us here (groq.com/docs/deprecations):
//   08/16/26  llama-3.1-8b-instant     → openai/gpt-oss-20b
//   08/16/26  llama-3.3-70b-versatile  → openai/gpt-oss-120b | qwen/qwen3.6-27b
//
// EMERGENCY OVERRIDE: set the Supabase secrets below and redeploy — no code
// change, no review, works at 2am.
//   supabase secrets set GROQ_FAST_MODELS="model-a,model-b"
//   supabase secrets set GROQ_QUALITY_MODELS="model-a,model-b"

/**
 * Reads a comma-separated model chain from the environment, falling back to the
 * hardcoded default. Blank entries are dropped so a trailing comma is harmless.
 */
function chainFromEnv(envVar: string, fallback: string[]): string[] {
  const raw = Deno.env.get(envVar);
  if (!raw) return fallback;
  const parsed = raw.split(",").map((m: string) => m.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

// Fallback chains are deliberately cross-family (gpt-oss + qwen) so a single
// vendor deprecation or outage can't take out every entry at once — the old
// chain was three legacy Llama-family models that all died on the same date.
//
// ─── Why a Preview model sits in a production chain ───────────────────────────
// qwen/qwen3.6-27b is Preview tier, which Groq says may be pulled at short
// notice. It is here on purpose. After 08/16/26 the ENTIRE production text tier
// on Groq is openai/gpt-oss-120b and openai/gpt-oss-20b — one vendor. A
// "production-only" chain would be two models from the same family, which is
// precisely the concentration that caused this migration.
//
// The risk is bounded by POSITION, not by tier: qwen is never first and never
// last. If it disappears, that entry errors, the loop logs it and moves to the
// next production model — one wasted round-trip on a request whose primary had
// already failed. Never worse than a gpt-oss-only chain; better during a
// family-wide gpt-oss incident.
//
// It sits at slot 2 rather than 3 so the first fallback leaves the gpt-oss
// family immediately. The failure this migration exists to survive was an
// entire model family retiring on one day.
//
// Groq lists qwen/qwen3.6-27b as a recommended replacement for the retiring
// llama-3.3-70b-versatile. If it graduates to Production, delete this note.
// To drop it in a hurry, no code change is needed — set the env override:
//   supabase secrets set GROQ_FAST_MODELS="openai/gpt-oss-20b,openai/gpt-oss-120b"

/** Small/fast tier — cover letters, chat support. Replaces llama-3.1-8b-instant. */
export const GROQ_FAST_MODELS = chainFromEnv("GROQ_FAST_MODELS", [
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
]);

/** Higher-capability tier — job ranking, humanize. Replaces llama-3.3-70b-versatile. */
export const GROQ_QUALITY_MODELS = chainFromEnv("GROQ_QUALITY_MODELS", [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
]);

export const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─── Reasoning parameters ─────────────────────────────────────────────────────
// The models replacing our Llama ones are REASONING models — they think before
// they answer, and that thinking must never reach the user. A cover letter with
// visible chain-of-thought would go straight to an employer.
//
// The two families take DIFFERENT parameters (verified against the live docs) —
// gpt-oss does not support `reasoning_format` at all, so a one-size-fits-all
// body would 400 half the chain:
//
//   openai/gpt-oss-*   include_reasoning: false   (+ reasoning_effort low/medium/high)
//   qwen/qwen3*        reasoning_format: "hidden"
//
// Anything unrecognised gets no reasoning params — an unknown param is a 400,
// so silence is the safe default for a model set via env override.
export function reasoningParams(
  model: string,
  effort: "low" | "medium" | "high" = "low",
): Record<string, unknown> {
  if (model.startsWith("openai/gpt-oss")) {
    return { include_reasoning: false, reasoning_effort: effort };
  }
  if (model.startsWith("qwen/qwen3")) {
    return { reasoning_format: "hidden" };
  }
  return {};
}

// NOTE: these models use `max_completion_tokens`, NOT `max_tokens`. The budget
// covers thinking + output, so limits sized for the old non-reasoning models are
// now too tight and will truncate mid-response.

