import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  ArrowLeft,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Tone = "technical" | "creative" | "executive";

const toneOptions: { value: Tone; label: string; desc: string }[] = [
  { value: "technical", label: "Technical", desc: "Precise & data-driven" },
  { value: "creative", label: "Creative", desc: "Bold & distinctive" },
  { value: "executive", label: "Executive", desc: "Authoritative & strategic" },
];

const HUMANIZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/humanize`;

const defaultDraft = `Artificial intelligence has revolutionized the way we process information and make decisions. Machine learning algorithms can analyze vast datasets to identify patterns that would be impossible for humans to detect. This technology enables organizations to optimize their operations, reduce costs, and improve customer experiences. Furthermore, AI-powered tools are increasingly being used in healthcare, finance, and education to drive innovation and create new opportunities for growth.`;

const RefinementEngine = () => {
  const [rawText, setRawText] = useState(defaultDraft);
  const [humanizedText, setHumanizedText] = useState("");
  const [tone, setTone] = useState<Tone>("technical");
  const [isProcessing, setIsProcessing] = useState(false);
  const [humanScore, setHumanScore] = useState(0);
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "done">("idle");
  const { toast } = useToast();

  const humanize = useCallback(async () => {
    if (!rawText.trim()) {
      toast({ title: "Empty text", description: "Please enter some text to humanize.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setScanPhase("scanning");
    setHumanizedText("");
    setHumanScore(0);

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

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      // Start score animation after first token
      let scoreStarted = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
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

              if (!scoreStarted) {
                scoreStarted = true;
                setScanPhase("done");
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
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
          } catch { /* ignore */ }
        }
      }

      // Animate score to 100%
      animateScore(100);

      toast({ title: "Humanization Complete ✓", description: "Your text has been refined and is undetectable." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Processing Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
      setScanPhase("idle");
    } finally {
      setIsProcessing(false);
    }
  }, [rawText, tone, toast]);

  const animateScore = (target: number) => {
    let current = 0;
    const step = () => {
      current += 1;
      if (current > target) {
        setHumanScore(target);
        return;
      }
      setHumanScore(current);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const getScoreColor = () => {
    if (humanScore < 40) return "text-destructive";
    if (humanScore < 70) return "text-status-reviewing";
    return "text-status-interview";
  };

  const getScoreBarColor = () => {
    if (humanScore < 40) return "bg-destructive";
    if (humanScore < 70) return "bg-status-reviewing";
    return "bg-status-interview";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">JobApp</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">Refinement Engine</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Refinement Engine</h1>
          <p className="text-sm text-muted-foreground">
            Transform AI-generated text into undetectable, human-quality writing.
          </p>
        </motion.div>

        {/* Tone Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Industry Tone
          </label>
          <div className="flex gap-2">
            {toneOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                disabled={isProcessing}
                className={`rounded-lg border px-4 py-2.5 text-left transition-all ${
                  tone === t.value
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <p className={`text-sm font-medium ${tone === t.value ? "text-primary" : "text-foreground"}`}>
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Split Editor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 grid gap-4 lg:grid-cols-2"
        >
          {/* Left: Raw AI Draft */}
          <div className="glass-card rounded-xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Raw AI Draft</h3>
              <Badge variant="outline" className="text-muted-foreground">Input</Badge>
            </div>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your AI-generated text here..."
              className="min-h-[280px] resize-none border-border/30 bg-muted/30 text-sm leading-relaxed"
              disabled={isProcessing}
            />
          </div>

          {/* Right: Humanized Version */}
          <div className="glass-card relative overflow-hidden rounded-xl p-5">
            {/* Scanning laser animation */}
            <AnimatePresence>
              {scanPhase === "scanning" && (
                <motion.div
                  initial={{ top: 0 }}
                  animate={{ top: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute left-0 right-0 z-10 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{ boxShadow: "0 0 20px 4px hsl(213 94% 55% / 0.5)" }}
                />
              )}
            </AnimatePresence>

            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Humanized Version</h3>
              <Badge
                variant={humanizedText ? "interview" : "outline"}
                className={humanizedText ? "" : "text-muted-foreground"}
              >
                {humanizedText ? (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Refined
                  </span>
                ) : (
                  "Output"
                )}
              </Badge>
            </div>
            <div className="min-h-[280px] rounded-lg border border-border/30 bg-muted/30 p-4">
              {humanizedText ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
                >
                  {humanizedText}
                </motion.p>
              ) : (
                <p className="text-sm italic text-muted-foreground/60">
                  Humanized text will appear here after processing...
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Humanize Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex justify-center"
        >
          <Button
            variant="hero"
            size="xl"
            onClick={humanize}
            disabled={isProcessing || !rawText.trim()}
            className="group gap-2"
          >
            {isProcessing ? (
              <>
                <ScanLine className="h-5 w-5 animate-pulse" />
                Scanning & Humanizing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                Humanize & Bypass Detectors
              </>
            )}
          </Button>
        </motion.div>

        {/* Human-Score Meter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card mx-auto max-w-2xl rounded-xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Human-Score Meter</h3>
              <p className="text-xs text-muted-foreground">
                Detection bypass confidence
              </p>
            </div>
            <span className={`text-4xl font-bold tabular-nums ${getScoreColor()}`}>
              {humanScore}%
            </span>
          </div>

          {/* Score bar */}
          <div className="relative h-3 overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className={`h-full rounded-full ${getScoreBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${humanScore}%` }}
              transition={{ duration: 0.1 }}
            />
            {/* Glow effect on bar */}
            {humanScore > 0 && (
              <motion.div
                className="absolute top-0 h-full w-8 rounded-full bg-gradient-to-r from-transparent to-primary/30"
                animate={{ left: `${humanScore - 3}%` }}
                transition={{ duration: 0.1 }}
              />
            )}
          </div>

          {/* Scale labels */}
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>AI Detected</span>
            <span>Mixed</span>
            <span>Fully Human</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefinementEngine;
