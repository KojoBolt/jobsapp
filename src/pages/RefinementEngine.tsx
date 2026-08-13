import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ShieldCheck, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { scoreText, type HumanScore } from "@/lib/humanScore";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

type Tone = "technical" | "creative" | "executive";

/** Normalised verdict from the detect-ai function (ZeroGPT). */
type Verdict = {
  provider: string;
  humanScore: number;
  aiProbability: number | null;
  feedback: string | null;
  aiWords: number | null;
  textWords: number | null;
  flaggedSentences: number;
  language: string | null;
};

const toneOptions: { value: Tone; label: string; desc: string }[] = [
  { value: "technical", label: "Technical", desc: "Precise & data-driven" },
  { value: "creative", label: "Creative", desc: "Bold & distinctive" },
  { value: "executive", label: "Executive", desc: "Authoritative & strategic" },
];

const HUMANIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanize`;

const defaultDraft = `Artificial intelligence has revolutionized the way we process information and make decisions. Machine learning algorithms can analyze vast datasets to identify patterns that would be impossible for humans to detect. This technology enables organizations to optimize their operations, reduce costs, and improve customer experiences. Furthermore, AI-powered tools are increasingly being used in healthcare, finance, and education to drive innovation and create new opportunities for growth.`;

const RefinementEngine = () => {
  const { dark } = useRamp();
  const [rawText, setRawText] = useState(defaultDraft);
  const [humanizedText, setHumanizedText] = useState("");
  const [tone, setTone] = useState<Tone>("technical");
  const [isProcessing, setIsProcessing] = useState(false);
  const [humanScore, setHumanScore] = useState(0);
  /** Local stylometric estimate for the humanized output. */
  const [outputScore, setOutputScore] = useState<HumanScore | null>(null);
  /** The detector's verdict — authoritative when present. */
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verdictState, setVerdictState] = useState<"idle" | "checking" | "unavailable">("idle");
  const [verdictNote, setVerdictNote] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "done">("idle");
  const { toast } = useToast();
  const scoreRafRef = useRef<number | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    return () => {
      if (scoreRafRef.current !== null) {
        cancelAnimationFrame(scoreRafRef.current);
      }

      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
      }
    };
  }, []);

  const animateScore = useCallback((target: number) => {
    if (scoreRafRef.current !== null) {
      cancelAnimationFrame(scoreRafRef.current);
    }

    let current = 0;

    const step = () => {
      current += 1;

      if (current >= target) {
        setHumanScore(target);
        scoreRafRef.current = null;
        return;
      }

      setHumanScore(current);
      scoreRafRef.current = requestAnimationFrame(step);
    };

    scoreRafRef.current = requestAnimationFrame(step);
  }, []);

  /**
   * Asks the detect-ai function for the detector's verdict. Never throws: an
   * outage must not look like a failed refinement, so it degrades to the local
   * estimate with a note saying which number is on screen.
   */
  const runDetection = useCallback(
    async (text: string) => {
      setVerdictState("checking");
      setVerdictNote(null);

      try {
        const { data, error } = await supabase.functions.invoke("detect-ai", { body: { text } });

        if (error) {
          const body = await (error as any).context?.json?.().catch(() => null);
          setVerdictState("unavailable");
          setVerdictNote(
            body?.code === "not_configured"
              ? "AI detection isn't configured, so this is our own estimate."
              : body?.code === "too_short"
              ? "Too short for the detector — showing our estimate instead."
              : body?.code === "no_credit"
              ? "The detector account is out of credit — showing our estimate."
              : body?.code === "bad_key"
              ? "The detector rejected our API key — showing our estimate."
              : body?.error || "The detector was unreachable — showing our estimate.",
          );
          return;
        }

        setVerdict(data as Verdict);
        setVerdictState("idle");
        animateScore((data as Verdict).humanScore);
      } catch (err) {
        console.error("detect-ai failed:", err);
        setVerdictState("unavailable");
        setVerdictNote("The detector was unreachable — showing our estimate.");
      }
    },
    [animateScore],
  );

  const humanize = useCallback(async () => {
    if (!rawText.trim()) {
      toast({
        title: "Empty text",
        description: "Please enter some text to humanize.",
        variant: "destructive",
      });
      return;
    }

    if (scoreRafRef.current !== null) {
      cancelAnimationFrame(scoreRafRef.current);
      scoreRafRef.current = null;
    }

    setIsProcessing(true);
    setScanPhase("scanning");
    setHumanizedText("");
    setHumanScore(0);
    setOutputScore(null);
    setVerdict(null);
    setVerdictNote(null);
    setVerdictState("idle");

    let accumulated = "";

    try {
      const resp = await fetch(HUMANIZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: rawText, tone }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Processing failed" }));
        throw new Error(err.error || "Processing failed");
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      readerRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();

        if (done) {
          streamDone = true;
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();

          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;

            if (content) {
              accumulated += content;
              setHumanizedText(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;

          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;

            if (content) {
              accumulated += content;
              setHumanizedText(accumulated);
            }
          } catch {
            // ignore
          }
        }
      }

      setScanPhase("idle");
      setIsProcessing(false);

      // Local estimate first: instant, free, and the fallback if the detector is
      // unreachable. Replaced the previous hardcoded animateScore(100), which
      // made the meter a decoration.
      const measured = scoreText(accumulated);
      setOutputScore(measured);
      animateScore(measured.score);

      toast({
        title: "Refinement complete",
        description: "Checking it against the detector…",
      });

      void runDetection(accumulated);
    } catch (err) {
      console.error(err);
      setScanPhase("idle");
      setIsProcessing(false);

      toast({
        title: "Processing Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          // ignore
        }
        readerRef.current = null;
      }
    }
  }, [rawText, tone, toast, animateScore, runDetection]);

  const accent = dark ? CHART.accentDark : CHART.accent;

  /** The input's own score, so the meter is live before anything is refined. */
  const draftScore = useMemo(() => scoreText(rawText), [rawText]);

  const shown = outputScore ?? draftScore;
  const displayScore = outputScore || verdict ? humanScore : draftScore.score;
  const delta =
    outputScore && !verdict && draftScore.signals.length
      ? outputScore.score - draftScore.score
      : null;

  const toneFor = (n: number) =>
    n < 40
      ? (dark ? CHART.criticalDark : CHART.critical)
      : n < 70
      ? CHART.warning
      : (dark ? CHART.goodDark : CHART.good);

  const scoreTone = toneFor(displayScore);
  const scoreLabel =
    displayScore < 40 ? "Machine-like" : displayScore < 70 ? "Mixed" : "Reads human";

  const isDisabled = isProcessing || !rawText.trim();

  const PanelHead = ({ title, right }: { title: string; right?: React.ReactNode }) => (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className={`text-[13px] font-bold ${T.ink}`}>{title}</p>
      {right}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Refinement Engine</h1>
          <p className={`text-[12px] ${T.muted}`}>
            Turn AI-generated text into writing that reads like a person wrote it.
          </p>
        </div>

        {/* ── Tone ─────────────────────────────────────────────────────── */}
        <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
          <PanelHead title="Industry tone" />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {toneOptions.map((t) => {
              const active = tone === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  disabled={isProcessing}
                  aria-pressed={active}
                  className={`rounded-xl border px-3.5 py-3 text-left transition-colors
                              disabled:cursor-not-allowed disabled:opacity-50 ${
                                active ? "" : `${T.hairline} hover:bg-[#F4F4F2] dark:hover:bg-white/5`
                              }`}
                  style={active ? { backgroundColor: `${accent}14`, borderColor: accent } : undefined}
                >
                  <p className="text-[13px] font-bold" style={active ? { color: accent } : undefined}>
                    <span className={active ? "" : T.ink}>{t.label}</span>
                  </p>
                  <p className={`mt-0.5 text-[11.5px] ${T.muted}`}>{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Split editor ─────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
            <PanelHead
              title="AI generated text"
              right={
                <span className={`rounded-md border ${T.hairline} px-2 py-0.5 text-[10.5px] font-semibold ${T.muted}`}>
                  Input
                </span>
              }
            />
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your AI-generated text here…"
              disabled={isProcessing}
              className={`min-h-[280px] w-full resize-y rounded-xl border ${T.hairline} bg-transparent
                          p-3.5 text-[12.5px] leading-relaxed ${T.ink} placeholder:text-[#9A9995]
                          focus:outline-none focus:ring-2 focus:ring-[#2a78d6]/30 disabled:opacity-60`}
            />
            <p className={`mt-2 text-[11px] ${T.muted}`}>
              {rawText.trim() ? `${rawText.trim().split(/\s+/).length} words` : "No text yet"}
            </p>
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl border ${T.hairline} bg-white p-4
                        dark:bg-[#1A1A19]`}
          >
            {/* Scanning sweep, recoloured to the validated accent. */}
            <AnimatePresence>
              {scanPhase === "scanning" && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  exit={{ opacity: 0, transition: { duration: 0.3, repeat: 0 } }}
                  className="pointer-events-none absolute left-0 right-0 z-10 h-0.5"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    boxShadow: `0 0 18px 3px ${accent}80`,
                  }}
                />
              )}
            </AnimatePresence>

            <PanelHead
              title="Humanized version"
              right={
                humanizedText ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold"
                    style={{
                      backgroundColor: `${dark ? CHART.goodDark : CHART.good}1F`,
                      color: dark ? CHART.goodDark : CHART.good,
                    }}
                  >
                    <ShieldCheck size={11} />
                    Refined
                  </span>
                ) : (
                  <span className={`rounded-md border ${T.hairline} px-2 py-0.5 text-[10.5px] font-semibold ${T.muted}`}>
                    Output
                  </span>
                )
              }
            />

            <div
              className={`min-h-[280px] rounded-xl border ${T.hairline} p-3.5`}
              style={{ backgroundColor: dark ? "rgba(255,255,255,0.02)" : "#FAFAF8" }}
            >
              {humanizedText ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`whitespace-pre-wrap text-[12.5px] leading-relaxed ${T.ink}`}
                >
                  {humanizedText}
                </motion.p>
              ) : (
                <p className={`text-[12.5px] ${T.muted}`}>
                  {isProcessing ? "Refining your text…" : "Your humanized text will appear here."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Action ───────────────────────────────────────────────────── */}
        <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: `${accent}1A`, color: accent }}
              >
                <Sparkles size={16} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className={`text-[13.5px] font-bold leading-tight ${T.ink}`}>
                  Humanize this draft
                </p>
                <p className={`mt-0.5 text-[11.5px] ${T.muted}`}>
                  Rewritten in a {toneOptions.find((t) => t.value === tone)?.label.toLowerCase()} tone.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isDisabled) return;
                void humanize();
              }}
              disabled={isDisabled}
              className={cn(
                `inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#111110] px-5 py-2.5
                 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90
                 dark:bg-white dark:text-[#111110]`,
                isDisabled && "cursor-not-allowed opacity-40",
              )}
            >
              {isProcessing ? (
                <>
                  <ScanLine size={15} className="animate-pulse" />
                  Refining…
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Humanize text
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Score meter ──────────────────────────────────────────────── */}
        <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-[13px] font-bold ${T.ink}`}>
                Human score
                <span className={`ml-2 text-[11px] font-medium ${T.muted}`}>
                  {verdict ? verdict.provider : outputScore ? "refined text" : "your draft"}
                </span>
              </p>
              <p className={`mt-0.5 text-[11.5px] ${T.muted}`}>
                {verdictState === "checking"
                  ? "Checking with the detector…"
                  : verdict
                  ? verdict.feedback || `Scored by ${verdict.provider}`
                  : "Our own estimate from sentence rhythm, phrasing and word variety"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {delta !== null && delta !== 0 && (
                <span className={`text-[11.5px] font-semibold ${T.muted}`}>
                  {delta > 0 ? "+" : ""}
                  {delta} vs draft
                </span>
              )}
              <span
                className="text-[26px] font-bold leading-none tabular-nums"
                style={{ color: scoreTone }}
              >
                {displayScore}%
              </span>
              {/* The word sits beside the colour, so the band never relies on hue alone. */}
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${scoreTone}1F`, color: scoreTone }}
              >
                {scoreLabel}
              </span>
            </div>
          </div>

          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: dark ? "#2C2C2A" : "#EFEFEC" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: scoreTone }}
              initial={{ width: 0 }}
              animate={{ width: `${displayScore}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* The detector's own figures when we have them. */}
          {verdict && (
            <div className={`mt-3.5 divide-y ${T.divide}`}>
              {[
                { label: "AI probability", value: verdict.aiProbability, suffix: "%" },
                {
                  label: "Words read as AI",
                  value: verdict.aiWords,
                  suffix: verdict.textWords ? ` of ${verdict.textWords}` : "",
                },
                { label: "Sentences flagged", value: verdict.flaggedSentences || null, suffix: "" },
              ]
                .filter((r) => r.value !== null)
                .map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-3 py-2">
                    <span className={`text-[11.5px] font-semibold ${T.ink}`}>{r.label}</span>
                    <span className={`text-[11.5px] font-semibold tabular-nums ${T.muted}`}>
                      {r.value}
                      {r.suffix}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Our own breakdown — shown when the detector hasn't answered, so the
              panel is never empty and the estimate is explainable. */}
          {!verdict && shown.signals.length > 0 ? (
            <div className={`mt-3.5 divide-y ${T.divide}`}>
              {shown.signals.map((s) => (
                <div key={s.key} className="flex items-center gap-3 py-2">
                  <span className={`w-[104px] shrink-0 text-[11.5px] font-semibold ${T.ink}`}>
                    {s.label}
                  </span>
                  <span
                    className="h-1 w-16 shrink-0 overflow-hidden rounded-full"
                    style={{ backgroundColor: dark ? "#2C2C2A" : "#EFEFEC" }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${s.value}%`, backgroundColor: toneFor(s.value) }}
                    />
                  </span>
                  <span className={`w-8 shrink-0 text-[11px] font-semibold tabular-nums ${T.ink}`}>
                    {s.value}
                  </span>
                  <span className={`min-w-0 truncate text-[11px] ${T.muted}`}>{s.detail}</span>
                </div>
              ))}
            </div>
          ) : !verdict ? (
            <p className={`mt-3 flex items-start gap-1.5 text-[11px] ${T.muted}`}>
              <Info size={12} className="mt-px shrink-0" />
              Needs at least 40 words across two sentences to measure.
            </p>
          ) : null}

          <p className={`mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed ${T.muted}`}>
            <Info size={11} className="mt-px shrink-0" />
            {verdict
              ? `Scored by ${verdict.provider}. A detector verdict is a probability, not proof — treat it as a signal, not a guarantee.`
              : verdictNote ||
                "A stylometric estimate computed from the text, not a detector verdict. It does not predict what a specific detection tool will report."}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RefinementEngine;
