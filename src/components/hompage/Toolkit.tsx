import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2, Vault, FileText, BarChart3, ArrowRight, Check, Sparkles, Star,
} from "lucide-react";
import { PrimaryButton } from "./Buttons";

/**
 * The tools that ship alongside the campaign.
 *
 * The reference this is modelled on was headed "Free AI tools" — a public,
 * no-signup lead magnet. These four all sit behind the dashboard and come with
 * an account, so calling them free would be a pricing claim that isn't true.
 * The framing is "what you get with the campaign" instead.
 *
 * Every tool below is real and routable. Deliberately left out: the Job
 * Tracker, which is a $29 add-on rather than included, and the Career
 * Accelerators, which are sold separately.
 */

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

/* ── Preview mockups ───────────────────────────────────────────────────
   Abstractions of each real screen, not screenshots — they stay legible at
   this size and don't go stale every time a page is restyled. */

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-white/8 bg-[#0f1225]/80 p-4 backdrop-blur ${className}`}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">{children}</p>
);

const RefinementPreview = () => (
  <div className="space-y-3">
    <Panel>
      <div className="flex items-center justify-between">
        <Label>Human score</Label>
        <span className="text-lg font-bold text-white">87%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-indigo-400"
          initial={{ width: 0 }}
          whileInView={{ width: "87%" }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Technical", "Creative", "Executive"].map((tone, i) => (
          <span
            key={tone}
            className={`rounded-full px-2.5 py-0.5 text-[10.5px] ${
              i === 0
                ? "border border-indigo-500/30 bg-indigo-500/15 text-indigo-200"
                : "border border-white/8 text-gray-400"
            }`}
          >
            {tone}
          </span>
        ))}
      </div>
    </Panel>

    <Panel>
      <Label>Before</Label>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-gray-500 line-through decoration-white/20">
        I am a highly motivated professional with a proven track record of delivering results. I
        believe my skills and experience align perfectly with the requirements of this position.
      </p>

      <div className="my-3 h-px bg-white/8" />

      <Label>After</Label>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-gray-200">
        I’m a motivated professional who takes my work seriously and has a strong track record of getting results. From what I’ve seen, 
        my skills and experience are a great match for what this role requires.
      </p>
    </Panel>
  </div>
);

const VaultPreview = () => (
  <div className="space-y-3">
    <Panel>
      <Label>Target roles</Label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Backend", "Full-stack", "DevOps"].map((r) => (
          <span
            key={r}
            className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5
                       text-[10.5px] text-indigo-200"
          >
            {r}
          </span>
        ))}
        <span className="rounded-full border border-white/8 px-2.5 py-0.5 text-[10.5px] text-gray-400">
          + Add
        </span>
      </div>

      <Label>
        <span className="mt-4 block">Industries</span>
      </Label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Engineering", "Product", "Data Science"].map((r) => (
          <span
            key={r}
            className="rounded-full border border-white/8 bg-white/5 px-2.5 py-0.5 text-[10.5px] text-gray-300"
          >
            {r}
          </span>
        ))}
      </div>
    </Panel>

    <Panel>
      <div className="flex items-center justify-between">
        <Label>Vault strength</Label>
        <span className="text-[11.5px] font-semibold text-indigo-300">6 of 7 complete</span>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < 6 ? "bg-indigo-400" : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-gray-400">
        The stronger the vault, the sharper the matching — every role is scored against what's
        in here.
      </p>
    </Panel>
  </div>
);

const ResumePreview = () => (
  <div className="space-y-3">
    <Panel className="space-y-2.5">
      {[
        { name: "Backend-focused CV", file: "resume-backend.pdf", primary: true },
        { name: "Platform / DevOps CV", file: "resume-devops.pdf", primary: false },
        { name: "Generalist CV", file: "resume-general.pdf", primary: false },
      ].map((r) => (
        <div key={r.name} className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-indigo-500/15">
            <FileText className="h-3.5 w-3.5 text-indigo-300" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold text-white">
              {r.name}
              {r.primary && (
                <span className="flex items-center gap-1 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9.5px] text-indigo-200">
                  <Star className="h-2.5 w-2.5" />
                  Primary
                </span>
              )}
            </p>
            <p className="truncate text-[10.5px] text-gray-500">{r.file}</p>
          </div>
        </div>
      ))}
    </Panel>

    <Panel>
      <p className="text-[11.5px] leading-relaxed text-gray-400">
        Store up to five versions and mark one as primary. Applications go out against the
        version you chose, not whatever you uploaded last.
      </p>
    </Panel>
  </div>
);

const ReportPreview = () => (
  <div className="space-y-3">
    <Panel>
      <Label>This campaign</Label>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { v: "200", l: "Sent" },
          { v: "31", l: "Replies" },
          { v: "9", l: "Interviews" },
        ].map((s) => (
          <div key={s.l}>
            <p className="text-xl font-bold text-white">{s.v}</p>
            <p className="text-[10.5px] text-gray-500">{s.l}</p>
          </div>
        ))}
      </div>
    </Panel>

    <Panel className="space-y-2.5">
      <Label>Where replies came from</Label>
      {[
        { name: "Match score 85+", pct: 72 },
        { name: "Match score 65–84", pct: 41 },
        { name: "Match score below 65", pct: 12 },
      ].map((row) => (
        <div key={row.name} className="flex items-center gap-3">
          <span className="w-[130px] shrink-0 text-[11px] text-gray-300">{row.name}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.span
              className="block h-full rounded-full bg-indigo-400"
              initial={{ width: 0 }}
              whileInView={{ width: `${row.pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-[11px] font-semibold text-white">
            {row.pct}%
          </span>
        </div>
      ))}
    </Panel>
  </div>
);

const TOOLS = [
  {
    id: "refinement",
    name: "Refinement Engine",
    icon: Wand2,
    blurb:
      "Paste any draft and see how machine-written it reads. Rewrite it in your own register — technical, creative or executive — until it sounds like a person wrote it, because one should have.",
    bullets: ["AI-detection score", "Tone rewriting", "Side-by-side diff"],
    preview: <RefinementPreview />,
  },
  {
    id: "vault",
    name: "Identity Vault",
    icon: Vault,
    blurb:
      "One place for your resume, target roles, industries and tone. Everything the system sources and writes is scored against it, so the sharper it is, the better the matches.",
    bullets: ["Role & industry targeting", "Tone of voice", "Strength meter"],
    preview: <VaultPreview />,
  },
  {
    id: "resumes",
    name: "Resume Manager",
    icon: FileText,
    blurb:
      "Keep up to five versions of your CV and set one as primary. Applications go out against the version you chose, not whichever file you happened to upload last.",
    bullets: ["Five versions", "Primary selection", "Instant preview"],
    preview: <ResumePreview />,
  },
  {
    id: "report",
    name: "Campaign Report",
    icon: BarChart3,
    blurb:
      "What actually happened to your 200 applications — how many landed, which match scores got replies, and where the interviews came from. Numbers, not vibes.",
    bullets: ["Reply rates", "Score breakdown", "Exportable"],
    preview: <ReportPreview />,
  },
];

export default function Toolkit() {
  const [active, setActive] = useState(TOOLS[0].id);
  const tool = TOOLS.find((t) => t.id === active) ?? TOOLS[0];

  return (
    <section id="toolkit" className="py-20 2xl:py-32">
      <div className="max-w-6xl mx-auto px-4">
        {/* Left-aligned header with the CTA opposite, matching the reference —
            so it deliberately doesn't use the centred <Title /> component. */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={spring}
          className="mb-12 flex flex-wrap items-end justify-between gap-6"
        >
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/3 px-3 py-1 text-xs text-gray-300">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              The toolkit
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-white md:text-4xl">
              Every tool your search
              <br />
              actually needs
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              The campaign sends the applications. These are what sharpen them — all included with
              your account, all in one dashboard.
            </p>
          </div>

          <PrimaryButton to="/sign-up">
            Try the Refinement Engine
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-[1.35fr_1fr]">
          {/* ── Preview ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-white/6
                       bg-gradient-to-br from-indigo-500/10 via-white/3 to-transparent p-5 md:p-6"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                {tool.preview}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Tool list ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: 0.2 }}
            className="space-y-2"
          >
            {TOOLS.map((t) => {
              const isActive = t.id === active;
              const Icon = t.icon;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  aria-expanded={isActive}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    isActive
                      ? "border-indigo-500/40 bg-indigo-500/8"
                      : "border-transparent hover:bg-white/3"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`text-[15px] font-semibold ${
                        isActive ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {t.name}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-[13px] leading-relaxed text-gray-300">{t.blurb}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {t.bullets.map((b) => (
                            <span
                              key={b}
                              className="flex items-center gap-1 rounded-full border border-white/8
                                         px-2.5 py-0.5 text-[10.5px] text-gray-400"
                            >
                              <Check className="h-2.5 w-2.5 text-indigo-400" />
                              {b}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
