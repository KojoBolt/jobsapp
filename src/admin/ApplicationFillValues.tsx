import { useEffect, useState } from "react";
import { Check, Copy, Download, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveResumeUrl } from "@/lib/resumeUrl";
import { T } from "@/admin/ui/system";

/**
 * Everything needed to finish an application by hand.
 *
 * The bot cannot hand its session over — it fills the form inside a container,
 * and that typing lives in the page's memory, not in a cookie or a saved draft.
 * When an admin opens the same link they get an empty form and no way back to
 * the bot's work.
 *
 * So this hands over the VALUES instead: every field the bot used, one click to
 * copy, alongside the exact list of questions it could not answer. The admin
 * pastes their way through and answers only what genuinely needs a person,
 * rather than re-reading the form to work out what is missing.
 */

interface Field {
  label: string;
  value: string;
  /** Long values get a textarea and their own row. */
  long?: boolean;
}

interface Group {
  title: string;
  fields: Field[];
}

const s = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const ApplicationFillValues = ({
  applicationId,
  userId,
  coverLetter,
}: {
  applicationId: string;
  userId: string;
  coverLetter: string | null;
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const [{ data: profile }, { data: app }, { data: resume }] = await Promise.all([
        supabase.from("profiles").select("identity_vault_data, email, full_name").eq("id", userId).maybeSingle(),
        // Cast: automation_blocked post-dates the generated types.
        supabase.from("applications").select("automation_blocked" as never).eq("id", applicationId).maybeSingle(),
        supabase
          .from("resumes")
          .select("file_name, file_path, file_url")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const vault = (profile?.identity_vault_data ?? {}) as Record<string, any>;
      const p = (vault.personalInfo ?? {}) as Record<string, unknown>;
      const a = (vault.applicationAnswers ?? {}) as Record<string, unknown>;
      const t = (vault.targeting ?? {}) as Record<string, unknown>;
      const jobs = (Array.isArray(vault.employment) ? vault.employment : []) as Record<string, unknown>[];
      const edu = (Array.isArray(vault.education) ? vault.education : []) as Record<string, unknown>[];

      const next: Group[] = [
        {
          title: "Personal",
          fields: [
            { label: "First name", value: s(p.firstName) },
            { label: "Last name", value: s(p.lastName) },
            { label: "Email", value: s(p.email) || s(profile?.email) },
            { label: "Phone", value: s(p.phone) },
            { label: "City", value: s(a.city) },
            { label: "State / province", value: s(a.state) },
            { label: "Country", value: s(a.country) },
          ],
        },
        {
          title: "Eligibility",
          fields: [
            { label: "Can work without sponsorship in", value: (Array.isArray(a.authorizedCountries) ? a.authorizedCountries : []).map(s).join(", ") },
            { label: "Needs sponsorship elsewhere", value: s(a.needsSponsorship) },
            { label: "At least 18", value: s(a.atLeast18) },
            { label: "Would relocate", value: s(a.willingToRelocate) },
            { label: "Notice period", value: s(a.noticePeriod) },
            { label: "How they heard", value: s(a.hearAboutUs) },
            { label: "Salary expectation", value: [s(t.salaryMin), s(t.salaryMax)].filter(Boolean).join(" – ") },
          ],
        },
        {
          title: "Links",
          fields: [
            { label: "LinkedIn", value: s(p.linkedinUrl) },
            { label: "GitHub", value: s(a.githubUrl) },
            { label: "Portfolio / website", value: s(a.portfolioUrl) },
          ],
        },
        ...jobs.slice(0, 3).map((j, i) => ({
          title: `Employment ${i + 1}`,
          fields: [
            { label: "Employer", value: s(j.employer) },
            { label: "Job title", value: s(j.title) },
            { label: "Location", value: s(j.location) },
            { label: "Start", value: [s(j.startMonth), s(j.startYear)].filter(Boolean).join(" ") },
            {
              label: "End",
              value: j.current === true ? "Current role" : [s(j.endMonth), s(j.endYear)].filter(Boolean).join(" "),
            },
            { label: "Role description", value: s(j.description), long: true },
          ],
        })),
        ...edu.slice(0, 2).map((e, i) => ({
          title: `Education ${i + 1}`,
          fields: [
            { label: "School", value: s(e.school) },
            { label: "Degree", value: s(e.degree) },
            { label: "Discipline", value: s(e.discipline) },
            { label: "Years", value: [s(e.startYear), s(e.endYear)].filter(Boolean).join(" – ") },
          ],
        })),
      ];

      if (coverLetter?.trim()) {
        next.push({ title: "Cover letter", fields: [{ label: "Cover letter", value: coverLetter.trim(), long: true }] });
      }

      // Empty fields are dropped rather than shown blank: a row with nothing in
      // it is one more thing for the admin to read past.
      const pruned = next
        .map((g) => ({ ...g, fields: g.fields.filter((f) => f.value) }))
        .filter((g) => g.fields.length);

      const url = resume ? await resolveResumeUrl(resume) : null;

      if (!cancelled) {
        setGroups(pruned);
        setBlocked(((app as { automation_blocked?: string[] } | null)?.automation_blocked) ?? []);
        setResumeUrl(url);
        setResumeName(s(resume?.file_name));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [applicationId, userId, coverLetter]);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      // Long enough to notice, short enough not to linger on the next field.
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      // Clipboard access can be refused; the value is still selectable on screen.
    }
  };

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#EFEFEC] dark:bg-white/10" />;
  if (!groups.length) {
    return <p className={`text-[11.5px] ${T.muted}`}>No stored values — this candidate's vault is empty.</p>;
  }

  return (
    <div className="space-y-3.5">
      {/* What still needs a person. Shown first because it decides whether the
          admin needs to do anything at all. */}
      {blocked.length > 0 && (
        <div className="rounded-xl border border-[#D9822B]/30 bg-[#D9822B]/10 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-[#8A4B0F] dark:text-[#F0B27A]">
            <AlertTriangle size={12} />
            {blocked.length} question{blocked.length === 1 ? "" : "s"} the bot could not answer
          </p>
          <ul className="space-y-0.5">
            {blocked.map((b, i) => (
              <li key={i} className="text-[11px] text-[#8A4B0F] dark:text-[#F0B27A]">• {b}</li>
            ))}
          </ul>
        </div>
      )}

      {resumeUrl && (
        <a
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg border ${T.hairline} px-3 py-1.5
                      text-[12px] font-semibold ${T.ink} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
        >
          <Download size={13} />
          {resumeName || "Download résumé"}
        </a>
      )}

      {groups.map((group) => (
        <div key={group.title}>
          <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
            {group.title}
          </p>
          <div className={`divide-y ${T.hairline} overflow-hidden rounded-xl border ${T.hairline}`}>
            {group.fields.map((f) => {
              const key = `${group.title}:${f.label}`;
              const isCopied = copied === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => copy(key, f.value)}
                  title="Copy"
                  className={`flex w-full items-start gap-3 px-3 py-2 text-left transition-colors
                              hover:bg-[#F4F4F2] dark:hover:bg-white/[0.04]`}
                >
                  <span className={`w-[38%] shrink-0 text-[11px] ${T.muted}`}>{f.label}</span>
                  <span className={`min-w-0 flex-1 text-[12px] ${T.ink} ${f.long ? "whitespace-pre-wrap" : "truncate"}`}>
                    {f.value}
                  </span>
                  <span className={`shrink-0 ${isCopied ? "text-[#2F7D4F]" : T.muted}`}>
                    {isCopied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationFillValues;
