import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, MapPin, Briefcase, Check, ChevronLeft, ChevronRight,
  Sparkles, ShieldCheck, Send, Search, PenLine,
} from "lucide-react";
import Title from "./Title";
import { PrimaryButton } from "./Buttons";
import { sampleMatches } from "../../assets/dummy-data";

const MATCH_PIPELINE = [
  { label: "Sourced", icon: Search },
  { label: "Drafted by AI", icon: PenLine },
  { label: "Human reviewed", icon: ShieldCheck },
  { label: "Submitted", icon: Send },
];

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

const bandFor = (score: number) =>
  score >= 85 ? "Strong fit" : score >= 65 ? "Good fit" : "Partial fit";

const CompanyMark = ({
  name,
  logo,
  domain,
}: {
  name: string;
  logo?: string;
  domain?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const src = logo || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null);

  if (src && !failed) {
    return (
      <span
        className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl
                   border border-white/10 bg-white p-1.5"
      >
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10
                 bg-indigo-500/15 text-sm font-bold text-indigo-300"
    >
      {name[0]}
    </span>
  );
};

/** Match score as a ring, the way the dashboard shows it. */
const ScoreRing = ({ score }: { score: number }) => {
  const r = 30;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} className="fill-none stroke-white/10" strokeWidth="5" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          className="fill-none stroke-indigo-400"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (score / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="text-lg font-bold text-white">{score}%</span>
    </div>
  );
};

export default function MatchPreview() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % sampleMatches.length),
      6000,
    );
    return () => clearInterval(id);
  }, [paused]);

  const job = sampleMatches[index];
  const go = (dir: -1 | 1) =>
    setIndex((i) => (i + dir + sampleMatches.length) % sampleMatches.length);

  return (
    <section id="how-it-works" className="py-20 2xl:py-32">
      <div className="max-w-6xl mx-auto px-4">
        <Title
          title="Features"
          heading="You approve nothing. It just goes out."
          description="Every role is scored against your profile, written up in your voice, checked by a human, and submitted — 200 times, while you get on with your life."
        />

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={spring}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="overflow-hidden rounded-2xl border border-white/6 bg-white/3"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid md:grid-cols-[1.4fr_1fr]"
            >
              {/* ── The role ─────────────────────────────────────────────── */}
              <div className="border-b border-white/6 p-6 md:border-b-0 md:border-r">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <ScoreRing score={job.score} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-300">
                      {bandFor(job.score)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {job.posted}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold leading-tight text-white">
                      {job.title}
                    </h3>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3" />
                        {job.experience}
                      </span>
                    </div>

                    <p className="mt-2.5 text-[15px] font-semibold text-white">{job.salary}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/6 bg-white/5 px-3 py-1
                                 text-[11.5px] text-gray-300"
                    >
                      {skill}
                    </span>
                  ))}
                  <span className="rounded-full border border-white/6 px-3 py-1 text-[11.5px] text-gray-400">
                    +{job.extraSkills} more
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {job.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="flex items-center gap-1.5 rounded-full border border-indigo-500/25
                                 bg-indigo-500/10 px-3 py-1 text-[11.5px] text-indigo-200"
                    >
                      <Check className="h-3 w-3" />
                      {reason}
                    </span>
                  ))}
                </div>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Requirements
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-300">
                  {job.requirements}
                </p>
              </div>

              {/* ── What we did with it ──────────────────────────────────── */}
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <CompanyMark
                    name={job.company}
                    domain={job.domain}
                    logo={(job as { logo?: string }).logo}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{job.company}</p>
                    <p className="truncate text-xs text-gray-400">{job.industry}</p>
                  </div>
                </div>

                <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Application status
                </p>

                <ol className="mt-3 space-y-3">
                  {MATCH_PIPELINE.map((step, i) => {
                    const done = i < job.stage;
                    const active = i === job.stage - 1;
                    const StepIcon = step.icon;

                    return (
                      <li key={step.label} className="flex items-center gap-2.5">
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                            done
                              ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                              : "border-white/8 text-gray-600"
                          }`}
                        >
                          {done ? <Check className="h-3 w-3" /> : <StepIcon className="h-3 w-3" />}
                        </span>
                        <span
                          className={`text-[13px] ${
                            active ? "font-semibold text-white" : done ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </span>
                        {active && (
                          <span className="ml-auto text-[10.5px] font-semibold text-indigo-300">
                            Now
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-6 rounded-xl border border-white/6 bg-white/3 p-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    Your cover letter
                  </p>
                  <p className="mt-2 text-[12.5px] italic leading-relaxed text-gray-300">
                    “{job.letter}”
                  </p>
                </div>

                <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-gray-400">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                  Checked by a career specialist before it left — every single one.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Controls ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 px-6 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous example"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/6
                           text-gray-300 transition hover:border-white/15 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next example"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/6
                           text-gray-300 transition hover:border-white/15 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="ml-1 text-xs text-gray-400">
                {index + 1} of {sampleMatches.length} · {197 + index} left in this campaign
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Marked as a sample: the scores and salaries are illustrative,
                  not live openings. */}
              <span className="rounded-full border border-white/6 px-2.5 py-1 text-[10.5px] text-gray-500">
                Example
              </span>
              <PrimaryButton to="/sign-up">Start your campaign</PrimaryButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
