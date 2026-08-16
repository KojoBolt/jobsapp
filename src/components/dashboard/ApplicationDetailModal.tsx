import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  X, MapPin, CalendarClock, ExternalLink, FileText, Eye, CheckCircle2,
  Clock, AlertTriangle, Briefcase, Check,
} from "lucide-react";
import { Application } from "@/hooks/useDashboardData";
import CompanyLogo from "@/components/dashboard/CompanyLogo";
import { supabase } from "@/integrations/supabase/client";
import { resolveResumeUrl } from "@/lib/resumeUrl";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  drafting: "Drafting",
  pending_review: "In review",
  approved: "Approved",
  submitted: "Applied",
  interview: "Interview",
  completed: "Completed",
  failed: "Failed",
};

/** What the status means, in the user's terms rather than the enum's. */
const STATUS_BLURBS: Record<string, string> = {
  queued: "Queued for sourcing. We'll start drafting shortly.",
  drafting: "We're writing your tailored application now.",
  pending_review: "Drafted and waiting on a human reviewer.",
  approved: "Reviewed and approved — submitting next.",
  submitted: "Submitted on your behalf.",
  interview: "The employer has moved you to interview.",
  completed: "Submitted and closed out.",
  failed: "We couldn't complete this one.",
};

const scoreBand = (s: number) => (s >= 85 ? "STRONG" : s >= 65 ? "GOOD" : "FAIR");
const scoreFit = (s: number) => (s >= 85 ? "Strong fit" : s >= 65 ? "Good fit" : "Partial fit");

const SOURCE_LABELS: Record<string, string> = {
  adzuna: "Adzuna",
  remotive: "Remotive",
  jsearch: "JSearch",
  themuse: "The Muse",
  arbeitnow: "Arbeitnow",
  reed: "Reed",
  findwork: "Findwork",
};

/**
 * Technologies named in the posting text. Derived, not stored — the scraper
 * keeps only a description blob, so this reports what the posting actually
 * mentions rather than inventing a skills list. Word-boundary matched so "R"
 * doesn't match every word containing it.
 */
const TECH_TERMS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Svelte",
  "Node.js", "Python", "Django", "Flask", "Ruby", "Rails", "Go", "Rust", "Java",
  "Kotlin", "Swift", "PHP", "Laravel", "C++", "C#", ".NET", "GraphQL", "REST",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "AWS", "GCP",
  "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD", "Git", "Figma",
  "Tailwind", "SASS", "Webpack", "Vite", "Vercel", "Jest", "Cypress", "Playwright",
];

const extractTech = (text?: string): string[] => {
  if (!text) return [];
  return TECH_TERMS.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\w.#+])${escaped}([^\\w.#+]|$)`, "i").test(text);
  });
};

/**
 * Splits the posting on headings it actually contains. Descriptions are often a
 * single unstructured blob, so anything before the first recognised heading —
 * or the whole text when there are none — falls under "Overview".
 */
const SECTION_RE =
  /^\s*(responsibilities|what you.ll do|the role|requirements|qualifications|what we.re looking for|about you|benefits|perks|what we offer)\b[:\s-]*/gim;

const splitDescription = (text?: string): { heading: string; body: string }[] => {
  if (!text?.trim()) return [];

  const matches = [...text.matchAll(SECTION_RE)];
  if (!matches.length) return [{ heading: "Overview", body: text.trim() }];

  const out: { heading: string; body: string }[] = [];
  const lead = text.slice(0, matches[0].index).trim();
  if (lead) out.push({ heading: "Overview", body: lead });

  matches.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    if (body) {
      const heading = m[1].replace(/\b\w/g, (c) => c.toUpperCase());
      out.push({ heading, body });
    }
  });

  return out;
};

type ResumeRow = {
  file_name: string | null;
  file_url: string | null;
  file_path: string | null;
  /** Resolved at fetch time — see resolveResumeUrl for why it is not file_url. */
  viewUrl: string | null;
};

const ApplicationDetailModal = ({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) => {
  const { dark } = useRamp();
  const [tab, setTab] = useState<"application" | "job">("application");
  const [resume, setResume] = useState<ResumeRow | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const accent = dark ? CHART.accentDark : CHART.accent;
  const good = dark ? CHART.goodDark : CHART.good;
  const critical = dark ? CHART.criticalDark : CHART.critical;

  const sections = useMemo(() => splitDescription(app.job_description), [app.job_description]);
  const tech = useMemo(() => extractTech(app.job_description), [app.job_description]);

  /* Only facts we actually hold. The reference also lists an experience level,
     which nothing in the pipeline captures, so it isn't shown. */
  const matchFacts = useMemo(() => {
    const facts: { label: string; value: string }[] = [];
    if (app.match_score) {
      facts.push({ label: "Match", value: `${app.match_score} · ${scoreFit(app.match_score)}` });
    }
    if (app.location) facts.push({ label: "Location", value: app.location });
    if (app.source) {
      facts.push({ label: "Source", value: SOURCE_LABELS[app.source] || app.source });
    }
    return facts;
  }, [app.match_score, app.location, app.source]);

  const isDone = ["submitted", "completed", "interview"].includes(app.status);
  const isFailed = app.status === "failed";
  const tone = isFailed ? critical : isDone ? good : CHART.warning;
  const StatusIcon = isFailed ? AlertTriangle : isDone ? CheckCircle2 : Clock;

  // Escape closes, matching the rest of the dashboard's overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The feed only carries resume_id, so the name and link come from `resumes`.
  useEffect(() => {
    if (!app.resume_id) return;
    let cancelled = false;

    (async () => {
      setResumeLoading(true);
      const { data, error } = await supabase
        .from("resumes")
        .select("file_name, file_url, file_path")
        .eq("id", app.resume_id)
        .maybeSingle();

      if (error) console.error("[ApplicationDetail] resume lookup failed:", error);

      // Signing is a second round trip, so it happens here rather than in the
      // render — and inside the same cancelled guard, since the modal can
      // close while it is in flight.
      const viewUrl = data ? await resolveResumeUrl(data) : null;

      if (!cancelled) {
        setResume(data ? ({ ...data, viewUrl } as ResumeRow) : null);
        setResumeLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [app.resume_id]);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className={`flex items-start justify-between gap-4 border-b ${T.hairline} py-2.5 last:border-0`}>
      <span className={`text-[11.5px] font-semibold uppercase tracking-[0.06em] ${T.muted}`}>
        {label}
      </span>
      <span className={`min-w-0 text-right text-[12.5px] font-semibold ${T.ink}`}>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[86vh] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl
                    border ${T.hairline} bg-white shadow-xl dark:bg-[#1A1A19]`}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-5 pb-4 pt-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border
                        ${T.hairline} ${T.muted} transition-colors hover:bg-[#F4F4F2]
                        dark:hover:bg-white/5`}
          >
            <X size={15} />
          </button>

          <div className="flex items-center gap-2.5 pr-10">
            <CompanyLogo name={app.company_name} logo={app.company_logo} size={40} />
            <span className="text-[13.5px] font-bold" style={{ color: accent }}>
              {app.company_name || "Unknown Company"}
            </span>
          </div>

          <h2 className={`mt-3 text-[21px] font-bold leading-snug tracking-[-0.01em] ${T.ink}`}>
            {app.job_title || "Unknown Role"}
          </h2>

          <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] ${T.muted}`}>
            {app.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} />
                {app.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} />
              {format(new Date(app.created_at), "d MMM yyyy")}
            </span>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {app.match_score ? (
              <span
                className={`inline-flex items-baseline gap-1.5 rounded-full border ${T.hairline} px-3 py-1.5`}
              >
                <span className="text-[14px] font-bold tabular-nums" style={{ color: tone }}>
                  {app.match_score}
                </span>
                <span className={`text-[9.5px] font-bold tracking-[0.06em] ${T.muted}`}>
                  {scoreBand(app.match_score)}
                </span>
              </span>
            ) : null}

            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
              style={{ backgroundColor: `${tone}1A`, color: tone }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
              {STATUS_LABELS[app.status] || app.status}
            </span>

            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`ml-auto inline-flex items-center gap-1.5 rounded-full border ${T.hairline}
                            px-3 py-1.5 text-[11.5px] font-semibold ${T.ink} transition-colors
                            hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                View posting
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className={`flex items-center gap-1 border-b ${T.hairline} px-5`}>
          {([
            { key: "application", label: "Application", icon: FileText },
            { key: "job", label: "Job Details", icon: Briefcase },
          ] as const).map((t) => {
            const active = t.key === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-2 pb-2.5 pt-1
                            text-[12.5px] transition-colors ${
                              active
                                ? `font-bold ${T.ink}`
                                : `border-transparent font-medium ${T.muted} hover:${T.ink}`
                            }`}
                style={active ? { borderColor: accent } : undefined}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === "application" ? (
            <>
              {/* Status banner */}
              <div
                className="flex items-start gap-3 rounded-xl p-3.5"
                style={{ backgroundColor: `${tone}14` }}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: `${tone}2E`, color: tone }}
                >
                  <StatusIcon size={15} strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold ${T.ink}`}>
                    {STATUS_LABELS[app.status] || app.status}
                  </p>
                  <p className={`mt-0.5 text-[11.5px] leading-relaxed ${T.muted}`}>
                    {STATUS_BLURBS[app.status] || "Status update pending."}
                  </p>
                  <p className={`mt-1 text-[11px] ${T.muted}`}>
                    {format(new Date(app.created_at), "d MMM yyyy, h:mm a")}
                  </p>
                </div>
              </div>

              {/* Resume used */}
              <p className={`mb-2 mt-5 text-[13px] font-bold ${T.ink}`}>Resume used</p>

              {resumeLoading ? (
                <div className={`h-[62px] animate-pulse rounded-xl border ${T.hairline}`} />
              ) : resume?.file_name ? (
                <div
                  className={`flex items-center gap-3 rounded-xl border ${T.hairline} p-3.5`}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${critical}1A`, color: critical }}
                  >
                    <FileText size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${T.muted}`}>
                      Resume
                    </p>
                    <p className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                      {resume.file_name}
                    </p>
                  </div>
                  {resume.viewUrl && (
                    <a
                      href={resume.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                                  px-3 py-1.5 text-[12px] font-semibold ${T.ink} transition-colors
                                  hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                    >
                      View
                      <Eye size={13} />
                    </a>
                  )}
                </div>
              ) : (
                <div className={`rounded-xl border ${T.hairline} p-3.5`}>
                  <p className={`text-[12.5px] ${T.muted}`}>
                    {app.resume_id
                      ? "That resume is no longer on file."
                      : "Your default profile was used for this application."}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-5">
              {/* ── Why this matched ─────────────────────────────────────── */}
              <div>
                <p className={`mb-2 text-[13px] font-bold ${T.ink}`}>Why this matched</p>
                <div className={`rounded-xl border ${T.hairline} divide-y ${T.divide}`}>
                  {matchFacts.map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5 px-3 py-2.5">
                      <span
                        className="grid h-4 w-4 shrink-0 place-items-center rounded-full"
                        style={{ backgroundColor: good, color: dark ? "#0D0D0D" : "#FFFFFF" }}
                      >
                        <Check size={10} strokeWidth={3.5} />
                      </span>
                      <span className={`text-[12.5px] font-bold ${T.ink}`}>{f.label}</span>
                      <span className={`min-w-0 truncate text-[12px] ${T.muted}`}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Posting text ─────────────────────────────────────────── */}
              {sections.length > 0 ? (
                sections.map((s) => (
                  <div key={s.heading}>
                    <p className={`mb-1.5 text-[13px] font-bold ${T.ink}`}>{s.heading}</p>
                    <p className={`whitespace-pre-line text-[12.5px] leading-relaxed ${T.ink2}`}>
                      {s.body}
                    </p>
                  </div>
                ))
              ) : (
                <div>
                  <p className={`mb-1.5 text-[13px] font-bold ${T.ink}`}>Job description</p>
                  <p className={`text-[12.5px] ${T.muted}`}>
                    No description was captured for this posting.
                  </p>
                </div>
              )}

              {/* ── Technologies named in the posting ────────────────────── */}
              {tech.length > 0 && (
                <div>
                  <p className={`mb-1 text-[13px] font-bold ${T.ink}`}>Technologies</p>
                  <p className={`mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                    Mentioned in this posting
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tech.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full border ${T.hairline} px-2.5 py-1 text-[11.5px]
                                    font-semibold ${T.ink}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Facts ────────────────────────────────────────────────── */}
              <div>
                <p className={`mb-1 text-[13px] font-bold ${T.ink}`}>Details</p>
                <Row label="Company" value={app.company_name || "—"} />
                <Row label="Role" value={app.job_title || "—"} />
                <Row label="Location" value={app.location || "—"} />
                <Row label="Status" value={STATUS_LABELS[app.status] || app.status} />
                <Row
                  label="Added"
                  value={format(new Date(app.created_at), "d MMM yyyy, h:mm a")}
                />
                <Row
                  label="Posting"
                  value={
                    app.job_url ? (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:underline"
                        style={{ color: accent }}
                      >
                        Open original
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ApplicationDetailModal;
