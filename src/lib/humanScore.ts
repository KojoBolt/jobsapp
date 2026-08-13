/**
 * Stylometric "reads human" score.
 *
 * This is a HEURISTIC computed from the text itself — not a verdict from an AI
 * detector. It measures properties that are well documented as differing
 * between machine and human prose, so it moves for real reasons and can be
 * explained signal by signal. It cannot tell you what GPTZero or Originality.ai
 * would say; only a call to one of those can.
 *
 * Every signal returns 0–100 where higher = more human-like.
 */

export type ScoreSignal = {
  key: string;
  label: string;
  /** 0–100, higher is more human-like. */
  value: number;
  /** The measurement behind the score, shown to the reader. */
  detail: string;
  /** Contribution to the composite, 0–1. */
  weight: number;
};

export type HumanScore = {
  score: number;
  signals: ScoreSignal[];
  wordCount: number;
};

/* Phrases that cluster heavily in LLM output. Kept deliberately short and
   high-precision — a long fuzzy list would flag ordinary writing. */
const AI_TELLS = [
  "furthermore", "moreover", "in conclusion", "it is important to note",
  "it's important to note", "delve into", "delving", "leverage", "leveraging",
  "landscape of", "tapestry", "testament to", "navigate the complexities",
  "in today's world", "in the realm of", "plays a crucial role",
  "plays a vital role", "it is worth noting", "seamless", "robust solution",
  "unlock the potential", "game-changer", "cutting-edge", "revolutionize",
  "revolutionized", "myriad of", "pivotal role", "ever-evolving",
  "comprehensive understanding", "significantly enhance",
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const sentencesOf = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length > 1);

const wordsOf = (text: string) =>
  text.toLowerCase().match(/[a-z']+/g) ?? [];

export function scoreText(text: string): HumanScore {
  const clean = (text || "").trim();
  const words = wordsOf(clean);
  const sentences = sentencesOf(clean);

  // Below this the measurements are noise, so report nothing rather than a
  // confident-looking number derived from two sentences.
  if (words.length < 40 || sentences.length < 2) {
    return { score: 0, signals: [], wordCount: words.length };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, l) => a + (l - mean) ** 2, 0) / lengths.length;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation

  /* 1. Burstiness — human sentence lengths vary; LLM output is uniform.
        A CV around 0.55+ is typical of human prose. */
  const burstiness = clamp((cv / 0.55) * 100);

  /* 2. Lexical variety — type/token ratio, normalised for length since TTR
        falls naturally as text grows. */
  const ttr = new Set(words).size / words.length;
  const expected = 0.75 - Math.min(0.3, words.length / 2000); // longer ⇒ lower baseline
  const lexical = clamp(((ttr - (expected - 0.22)) / 0.22) * 100);

  /* 3. LLM tell-phrases — the strongest single signal in practice. */
  const lower = ` ${clean.toLowerCase()} `;
  const tells = AI_TELLS.filter((p) => lower.includes(p));
  const tellsPer100 = (tells.length / words.length) * 100;
  const phrasing = clamp(100 - tellsPer100 * 55);

  /* 4. Sentence length — 11–21 words reads naturally; long uniform sentences
        are a machine habit, very short ones read as clipped. */
  const lengthFit =
    mean >= 11 && mean <= 21
      ? 100
      : mean < 11
      ? clamp((mean / 11) * 100)
      : clamp(100 - (mean - 21) * 6);

  /* 5. Contractions and varied punctuation — small signal, low weight, because
        plenty of good formal writing has neither. */
  const contractions = (clean.match(/\b\w+'(s|t|re|ve|ll|d|m)\b/gi) ?? []).length;
  const varied = (clean.match(/[;:—–?!]/g) ?? []).length;
  const voice = clamp(((contractions + varied) / (sentences.length || 1)) * 120);

  const signals: ScoreSignal[] = [
    {
      key: "burstiness",
      label: "Sentence rhythm",
      value: burstiness,
      detail: `${cv.toFixed(2)} variation across ${sentences.length} sentences`,
      weight: 0.3,
    },
    {
      key: "phrasing",
      label: "Natural phrasing",
      value: phrasing,
      detail: tells.length ? `${tells.length} stock phrase${tells.length > 1 ? "s" : ""} found` : "No stock phrases",
      weight: 0.28,
    },
    {
      key: "lexical",
      label: "Word variety",
      value: lexical,
      detail: `${Math.round(ttr * 100)}% unique words`,
      weight: 0.2,
    },
    {
      key: "lengthFit",
      label: "Sentence length",
      value: lengthFit,
      detail: `${mean.toFixed(1)} words per sentence`,
      weight: 0.15,
    },
    {
      key: "voice",
      label: "Voice markers",
      value: voice,
      detail: `${contractions} contraction${contractions === 1 ? "" : "s"}, ${varied} varied mark${varied === 1 ? "" : "s"}`,
      weight: 0.07,
    },
  ];

  const score = clamp(signals.reduce((sum, s) => sum + s.value * s.weight, 0));

  return { score, signals, wordCount: words.length };
}
