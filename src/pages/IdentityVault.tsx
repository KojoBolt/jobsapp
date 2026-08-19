import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Upload,
  FileText,
  Briefcase,
  MapPin,
  DollarSign,
  ShieldCheck,
  Target,
  Building2,
  MessageSquare,
  Trash2,
  Plus,
  X,
  ClipboardCheck,
  Globe,
  CalendarClock,
  Link2,
  EyeOff,
  Plane,
  Megaphone,
} from "lucide-react";
import VaultStrengthMeter from "@/components/identity-vault/VaultStrengthMeter";
import MultiSelectChips from "@/components/identity-vault/MultiSelectChips";
import ChipInput from "@/components/identity-vault/ChipInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

const industries = [
  "Engineering", "Finance", "Marketing", "Product", "Design",
  "Data Science", "Sales", "Operations", "Healthcare", "Legal",
];
const roleTypes = ["Remote", "Hybrid", "On-site"];
const targetRoleOptions = [
  "Full-stack", "Backend", "Frontend", "WordPress Developer", "DevOps", "Project Manager",
  "Product Manager", "Data Analyst", "UX Designer", "UI Designer",
  "QA Engineer", "Mobile Developer", "Cloud Architect", "AI/ML Engineer", "Security Specialist",
  "Content Writer", "Digital Marketer", "Sales Executive", "Customer Success Manager",
  "HR Specialist", "Finance Analyst", "Legal Counsel", "Video Editor", "Other",
];
const companySizeOptions = [
  "Startup (1-10)", "Early Stage (11-50)", "Mid-Market (51-500)", "Enterprise (500+)",
];
const toneOptions = [
  { value: "bold", label: "Bold & Assertive", description: "Bold and distinctive" },
  { value: "professional", label: "Professional & Corporate", description: "Formal and polished" },
  { value: "creative", label: "Creative & Personality-driven", description: "Bold and distinctive" },
  { value: "concise", label: "Concise & Technical", description: "Data-driven and precise" },
];

/* ── Application answers ──────────────────────────────────────────────────
   Everything below feeds the questions employers ask on the form itself,
   not the questions we ask when sourcing.

   These exist because they cannot be inferred. "Are you authorised to work
   in the United States?" is a legal declaration made in the candidate's
   name, so a guess is not a worse answer — it is a false statement. Where
   an answer is missing, the application is routed to a human instead. */

const workCountries = [
  "United States", "United Kingdom", "Canada", "European Union", "Australia",
  "New Zealand", "Ireland", "Switzerland",
];

const noticePeriodOptions = [
  "Immediately", "1 week", "2 weeks", "1 month", "2 months", "3 months or more",
];

/* Employers phrase this as "Do you currently live or are you willing to
   relocate to the job's location?" — one question doing two jobs. Whether the
   candidate already lives there is a fact we work out per job from their city;
   only the preference below belongs in a vault, because only it is stable. */
const relocateOptions = [
  { value: "yes", label: "Yes, I would relocate", description: "Opens up roles anywhere" },
  { value: "no", label: "No, I would not relocate", description: "Only roles I can reach today" },
];

/* Asked on a large share of forms and often required, so leaving it blank
   stops applications that are otherwise complete. It is a marketing question,
   not a declaration about the candidate, which is why a stored default is
   fine here where it would not be for work authorisation. */
const hearAboutOptions = [
  "Job board", "LinkedIn", "Company website", "Referral from a friend",
  "Recruiter outreach", "Search engine", "Social media", "Other",
];

/* Employers ask these voluntarily and "decline to self-identify" is a normal,
   accepted answer — so we offer that rather than reproducing a demographic
   taxonomy that differs by country and would be wrong half the time. Anyone
   who wants to answer properly can have those applications held back. */
const eeoOptions = [
  {
    value: "decline",
    label: "Decline to self-identify",
    description: "Standard, accepted answer",
  },
  {
    value: "manual",
    label: "Let me answer these myself",
    description: "We'll hold those applications for you",
  },
];

/* Shapes live at module scope so loadVaultData can merge a saved vault onto
   them. A straight cast of stored JSON leaves any field added later
   `undefined`, which flips a controlled input to uncontrolled mid-render. */
const EMPTY_PERSONAL = {
  /* The name the candidate actually types. Application forms want the two
     parts separately, and splitting at submit time mangles multi-part
     surnames and reversed name orders — on real applications. */
  firstName: "",
  lastName: "",
  /* Derived from the two above on save, never shown as a field. Six other
     places read it — cover letter signing in process-job and process-batch,
     the deploy gate in DashboardLayout, the tracker's manual job modal — so
     it stays in the saved shape even though nobody types it any more. */
  name: "",
  email: "",
  phone: "",
  linkedinUrl: "",
};

const EMPTY_TARGETING = {
  industries: [] as string[],
  roleTypes: [] as string[],
  salaryMin: "",
  salaryMax: "",
  targetRoles: [] as string[],
  toneOfVoice: "",
  targetJobTitles: [] as string[],
  companySizes: [] as string[],
  mustHaves: "",
};

/* Greenhouse's OWN degree list, read off a live form. Not a list I chose:
   these dropdowns match on exact option text, and a vault offering "MBA" or
   "Doctorate (PhD)" matched nothing against "Master of Business Administration
   (M.B.A.)". Typing an absent value filters the menu to empty, which reads as
   "no options" rather than as a mismatch — so it failed silently. */
const degreeOptions = [
  "Associate's Degree", "Bachelor's Degree", "Doctor of Medicine (M.D.)",
  "Doctor of Philosophy (Ph.D.)", "Engineer's Degree", "High School",
  "Juris Doctor (J.D.)", "Master of Business Administration (M.B.A.)",
  "Master's Degree", "Other",
];

/* Greenhouse's own discipline list, same reasoning. Note there is no
   "Information Technology" — the nearest is "Information Systems", which is
   exactly the mismatch that left this field blank. */
const disciplineOptions = [
  "Accounting", "African Studies", "Agriculture", "Anthropology", "Applied Health Services",
  "Architecture", "Art", "Asian Studies", "Biology", "Business", "Business Administration",
  "Business Analytics", "Chemistry", "Classical Languages", "Communications & Film",
  "Computer Science", "Dentistry", "Developing Nations", "Discipline Unknown",
  "Earth Sciences", "Economics", "Education", "Electronics", "Engineering",
  "English Studies", "Environmental Studies", "European Studies", "Fashion", "Finance",
  "Fine Arts", "General Studies", "Health Services", "History", "Humanities",
  "Human Resources Management", "Industrial Arts & Carpentry", "Information Systems",
  "International Relations", "Journalism", "Languages", "Latin American Studies", "Law",
  "Linguistics", "Manufacturing & Mechanics", "Mathematics", "Medicine",
  "Middle Eastern Studies", "Naval Science", "North American Studies", "Nuclear Technics",
  "Operations Research & Strategy", "Organizational Theory", "Other", "Philosophy",
  "Physical Education", "Physical Sciences", "Physics", "Political Science", "Psychology",
  "Public Policy", "Public Service", "Religious Studies", "Russian & Soviet Studies",
  "Scandinavian Studies", "Science", "Slavic Studies", "Social Science", "Social Sciences",
  "Sociology", "Speech", "Statistics & Decision Theory", "Urban Studies",
  "Veterinary Medicine",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Month and year separately, because that is how the forms ask for them —
 *  "Start date month" and "Start date year" are two different dropdowns. */
const EMPTY_EDUCATION = { school: "", degree: "", discipline: "", startYear: "", endYear: "" };

const EMPTY_JOB = {
  employer: "",
  title: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  current: false,
};

const EMPTY_ANSWERS = {
  city: "",
  /** State, province or region. US forms ask for it alongside the city. */
  state: "",
  country: "",
  /** Where the candidate can work WITHOUT sponsorship. */
  authorizedCountries: [] as string[],
  /** Their answer for anywhere not in that list. "" means we don't know. */
  needsSponsorship: "",
  noticePeriod: "",
  /** "yes" | "no" | "" — "" means we were never told, so those questions park. */
  willingToRelocate: "",
  hearAboutUs: "",
  /** "yes" | "no" | "" — a fact the candidate states, never assumed. */
  atLeast18: "",
  portfolioUrl: "",
  githubUrl: "",
  eeoHandling: "decline",
};

/** First token is the given name, the remainder the family name. A suggestion
 *  only — it is shown in editable fields, never submitted unreviewed. */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/* One field shell for every input, select and textarea on the page, so the form
   reads as one system instead of three shadcn defaults. */
const FIELD =
  "w-full rounded-lg border border-[#EAEAE7] bg-transparent px-3 py-2 text-[12.5px] " +
  "text-[#111110] placeholder:text-[#9A9995] focus:outline-none focus:ring-2 " +
  "focus:ring-[#2a78d6]/30 dark:border-white/10 dark:text-white";

/* A native <select> needs a real background colour, not `bg-transparent`.
   The control inherits the page in light mode either way, but the popup list
   the browser draws does not — it falls back to white, so dark mode showed
   white options with white text. The <option> elements need it too: they are
   rendered by the OS and do not inherit from the select. */
const SELECT_FIELD = `${FIELD} bg-white dark:bg-[#1A1A19]`;
const OPTION = "bg-white text-[#111110] dark:bg-[#1A1A19] dark:text-white";

const Section = ({
  icon: Icon,
  title,
  hint,
  accent,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  accent: string;
  children: React.ReactNode;
}) => (
  <div className={`rounded-2xl border ${T.hairline} bg-white p-5 dark:bg-[#1A1A19]`}>
    <div className="mb-4 flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon size={15} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className={`text-[13.5px] font-bold leading-tight ${T.ink}`}>{title}</p>
        {hint && <p className={`mt-0.5 text-[11.5px] ${T.muted}`}>{hint}</p>}
      </div>
    </div>
    {children}
  </div>
);

const FieldLabel = ({
  icon: Icon,
  children,
  htmlFor,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
  htmlFor?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={`mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold ${T.ink2}`}
  >
    {Icon && <Icon size={12} />}
    {children}
  </label>
);

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-resume`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    console.log("Edge Function response:", data);

    if (!response.ok) {
      console.error("Edge function error:", data.error);
      throw new Error(data.error || "Extraction failed");
    }

    if (!data.extractedText) {
      throw new Error("No text returned");
    }

    return data.extractedText;
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return "";
  }
};

const IdentityVault = () => {
  const { dark } = useRamp();
  const { user } = useAuth();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [personalInfo, setPersonalInfo] = useState(EMPTY_PERSONAL);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targeting, setTargeting] = useState(EMPTY_TARGETING);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [education, setEducation] = useState<(typeof EMPTY_EDUCATION)[]>([]);
  const [employment, setEmployment] = useState<(typeof EMPTY_JOB)[]>([]);

  // ✅ State for the "Other" custom role input
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customRoles, setCustomRoles] = useState<string[]>([]);

  const [currentResume, setCurrentResume] = useState<{
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  } | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  // ✅ Detect if "Other" is selected in targetRoles
  const otherSelected = targeting.targetRoles.includes("Other");

  // ✅ Add custom role to the list and clear input
  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    if (customRoles.includes(trimmed)) {
      toast.error("You've already added this role.");
      return;
    }
    setCustomRoles((prev) => [...prev, trimmed]);
    setCustomRoleInput("");
  };

  // ✅ Remove a custom role chip
  const handleRemoveCustomRole = (role: string) => {
    setCustomRoles((prev) => prev.filter((r) => r !== role));
  };

  // ✅ Allow pressing Enter to add a custom role
  const handleCustomRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomRole();
    }
  };

  const loadVaultData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, identity_vault_data")
        .eq("id", user.id)
        .single();

      if (profileError) console.error("Error fetching profile:", profileError.message);

      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeError) console.error("Error fetching resume:", resumeError.message);

      if (resumeData?.file_url && resumeData?.file_name) {
        setCurrentResume({
          fileName: resumeData.file_name,
          fileUrl: resumeData.file_url,
          uploadedAt: resumeData.created_at || new Date().toISOString(),
        });
        setCurrentResumeId(resumeData.id);
      } else {
        setCurrentResume(null);
        setCurrentResumeId(null);
      }

      if (profileData?.identity_vault_data) {
        const vault = profileData.identity_vault_data as Record<string, unknown>;

        // Merged onto the defaults, not cast over them: a vault saved before a
        // field existed has no key for it, and spreading keeps that field a
        // controlled empty string instead of undefined.
        const saved = { ...EMPTY_PERSONAL, ...(vault.personalInfo as object ?? {}) };
        // Older vaults predate the split fields; offer a suggestion rather
        // than leaving them blank, which the candidate then sees and can fix.
        if (!saved.firstName && !saved.lastName && saved.name) {
          Object.assign(saved, splitName(saved.name));
        }
        setPersonalInfo(saved);
        setTargeting({ ...EMPTY_TARGETING, ...(vault.targeting as object ?? {}) });
        setAnswers({ ...EMPTY_ANSWERS, ...(vault.applicationAnswers as object ?? {}) });
        // Merged per entry so a list saved before a field existed still fills
        // every input rather than leaving some undefined.
        setEducation(((vault.education as object[]) ?? []).map((e) => ({ ...EMPTY_EDUCATION, ...e })));
        setEmployment(((vault.employment as object[]) ?? []).map((e) => ({ ...EMPTY_JOB, ...e })));

        // ✅ Restore saved custom roles from vault
        if (vault.customRoles) setCustomRoles(vault.customRoles as string[]);
      } else {
        const fullName = profileData?.full_name || "";
        setPersonalInfo({
          ...EMPTY_PERSONAL,
          name: fullName,
          ...splitName(fullName),
          email: profileData?.email || user.email || "",
        });

        setTargeting({
          ...EMPTY_TARGETING,
          targetRoles: resumeData?.job_title ? [resumeData.job_title] : [],
          toneOfVoice: resumeData?.tone_preference || "",
        });
        setAnswers(EMPTY_ANSWERS);
        setEducation([]);
        setEmployment([]);
      }
    } catch (error) {
      console.error("Unexpected error loading vault:", error);
    }
  }, [user]);

  useEffect(() => {
    loadVaultData();
  }, [user, loadVaultData]);

  useEffect(() => {
    loadVaultData();
  }, [location.pathname, loadVaultData]);

  const getVaultStrength = useCallback(() => {
    let score = 0;
    const total = 10;
    // Scores the fields that exist on the page. `name` is derived on save, so
    // reading it here would lag a save behind what the user just typed.
    if (personalInfo.firstName.trim()) score++;
    if (personalInfo.email.trim()) score++;
    if (personalInfo.linkedinUrl.trim()) score++;
    if (resumeFile || currentResume) score++;
    if (targeting.industries.length > 0) score++;
    if (targeting.targetRoles.length > 0) score++;
    if (targeting.toneOfVoice) score++;
    if (targeting.targetJobTitles.length > 0) score++;
    // Counted because a vault without these cannot be applied with — every
    // application goes to a human instead. Showing 100% while they are blank
    // would say the opposite.
    if (answers.authorizedCountries.length > 0 && answers.needsSponsorship) score++;
    if (answers.country.trim()) score++;
    return Math.round((score / total) * 100);
  }, [personalInfo, resumeFile, currentResume, targeting, answers]);

  const handleSave = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    setSaving(true);

    try {
      // `name` is no longer a field on this page, but six other places still
      // read it — cover letters sign off with it and DashboardLayout gates
      // deployment on it. Rebuild it from the two parts, and fall back to
      // whatever was already stored if both are blank, so saving an untouched
      // legacy vault can't wipe a name that other screens depend on.
      const joined = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
      const personal = {
        ...personalInfo,
        name: joined || personalInfo.name,
        // process-job and process-batch already build the cover letter's
        // location from personalInfo.city/country — they just never found
        // anything there, because nothing wrote them. Mirror the answers here
        // so that existing code does what it was written to do.
        city: answers.city,
        country: answers.country,
      };

      // Include customRoles in the vault data so they persist across sessions
      const vaultData = {
        personalInfo: personal,
        targeting,
        customRoles,
        applicationAnswers: answers,
        // Blank rows are dropped: an empty entry would put an empty option into
        // a required dropdown on a real application.
        education: education.filter((e) => e.school.trim() || e.degree.trim()),
        employment: employment.filter((e) => e.employer.trim() || e.title.trim()),
      };
      const { error: vaultError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, identity_vault_data: vaultData }, { onConflict: "id" })
        .eq("id", user.id);

      if (vaultError) {
        console.error("Vault save error:", vaultError);
        toast.error(`Failed to save: ${vaultError.message}`);
        setSaving(false);
        return;
      }

      if (resumeFile) {
        toast.info("Extracting resume text...");

        const extractedText = await extractTextFromPDF(resumeFile);
        console.log("Extracted text length:", extractedText.length);
        console.log("Extracted text preview:", extractedText.slice(0, 200));

        if (!extractedText) {
          toast.warning("Could not extract text from PDF. Please ensure it's a text-based PDF.");
        }

        const fileExt = resumeFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, resumeFile, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload resume file");
          setSaving(false);
          return;
        }

        const { data } = supabase.storage
          .from("resumes")
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl;

        if (!publicUrl) {
          toast.error("Failed to get resume URL");
          setSaving(false);
          return;
        }

        if (currentResume && currentResumeId) {
          const { error: updateError } = await supabase
            .from("resumes")
            .update({
              file_name: resumeFile.name,
              file_url: publicUrl,
              file_path: filePath,
              extracted_text: extractedText,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentResumeId);

          if (updateError) {
            toast.error("Failed to update resume");
            setSaving(false);
            return;
          }
        } else {
          const { error: insertError } = await supabase
            .from("resumes")
            .insert([{
              user_id: user.id,
              file_name: resumeFile.name,
              file_url: publicUrl,
              file_path: filePath,
              extracted_text: extractedText,
              created_at: new Date().toISOString(),
            }]);

          if (insertError) {
            toast.error("Failed to save resume");
            setSaving(false);
            return;
          }
        }

        setCurrentResume({
          fileName: resumeFile.name,
          fileUrl: publicUrl,
          uploadedAt: new Date().toISOString(),
        });
        setResumeFile(null);
        toast.success("Resume uploaded and text extracted successfully");
      }

      setSaving(false);
      toast.success("Identity Vault saved successfully");
      await loadVaultData();
    } catch (error) {
      console.error("Unexpected error during save:", error);
      setSaving(false);
      toast.error("An unexpected error occurred while saving");
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !currentResumeId || !currentResume) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", currentResumeId);

      if (deleteError) {
        toast.error("Failed to delete resume");
        setSaving(false);
        return;
      }

      setCurrentResume(null);
      setCurrentResumeId(null);
      setSaving(false);
      toast.success("Resume deleted successfully");
    } catch (error) {
      toast.error("Failed to delete resume");
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  const accent = dark ? CHART.accentDark : CHART.accent;
  const good = dark ? CHART.goodDark : CHART.good;

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-4">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Identity Vault</h1>
          <p className={`text-[12px] ${T.muted}`}>
            The stronger your vault, the better your applications.
          </p>
        </div>

        <VaultStrengthMeter strength={getVaultStrength()} />

        {/* Personal Info */}
        <Section icon={User} title="Personal information" accent={accent}
                 hint="Used on every application we send">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FieldLabel icon={User} htmlFor="vault-first">First name</FieldLabel>
              <input id="vault-first" placeholder="Jane" value={personalInfo.firstName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })} className={FIELD} />
            </div>
            <div>
              <FieldLabel icon={User} htmlFor="vault-last">Last name</FieldLabel>
              <input id="vault-last" placeholder="Doe" value={personalInfo.lastName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })} className={FIELD} />
            </div>
            <div>
              <FieldLabel icon={Mail} htmlFor="vault-email">Email address</FieldLabel>
              <input id="vault-email" type="email" placeholder="jane@example.com" value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} className={FIELD} />
            </div>
            <div>
              <FieldLabel icon={Phone} htmlFor="vault-phone">Phone number</FieldLabel>
              <input id="vault-phone" type="tel" placeholder="+1 (555) 000-0000" value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} className={FIELD} />
            </div>
            <div>
              <FieldLabel icon={Linkedin} htmlFor="vault-linkedin">LinkedIn URL</FieldLabel>
              <input id="vault-linkedin" placeholder="https://linkedin.com/in/jane-doe" value={personalInfo.linkedinUrl}
                onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })} className={FIELD} />
            </div>
          </div>
        </Section>

        {/* Resume Hub */}
        <Section icon={FileText} title="Resume hub" accent={accent}
                 hint="PDF only, up to 10MB">
          {currentResume && (
            <div
              className="mb-3.5 flex items-start justify-between gap-3 rounded-xl p-3.5"
              style={{ backgroundColor: `${good}14` }}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: `${good}2E`, color: good }}
                >
                  <FileText size={17} />
                </span>
                <div className="min-w-0">
                  <p className={`truncate text-[12.5px] font-semibold ${T.ink}`}>
                    {currentResume.fileName}
                  </p>
                  <p className={`mt-0.5 text-[11px] ${T.muted}`}>
                    Uploaded {new Date(currentResume.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeleteResume}
                disabled={saving}
                aria-label="Delete resume"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${T.muted}
                            transition-colors hover:bg-[#D03B3B]/10 hover:text-[#B32F2F]
                            disabled:opacity-40 dark:hover:text-[#EF7A7A]`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          <label
            htmlFor="vault-resume"
            className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-dashed
                        ${T.hairline} px-6 py-8 text-center transition-colors hover:bg-[#FAFAF8]
                        dark:hover:bg-white/[0.03]`}
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-xl"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              {resumeFile ? <FileText size={19} /> : <Upload size={19} />}
            </span>
            <span className={`text-[13px] font-bold ${T.ink}`}>
              {resumeFile ? resumeFile.name : "Upload your resume"}
            </span>
            <span className={`text-[11.5px] ${T.muted}`}>
              {resumeFile ? "Click to replace" : "PDF format, up to 10MB"}
            </span>
          </label>
          <input id="vault-resume" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </Section>

        {/* Employment history — asked for by name on almost every ATS, and the
            source of "have you worked here before?" answers too. */}
        <Section icon={Briefcase} title="Employment history" accent={accent}
                 hint="Your most recent roles — two or three is usually enough">
          <div className="space-y-3">
            {employment.map((job, i) => (
              <div key={i} className={`rounded-xl border ${T.hairline} p-3.5`}>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className={`text-[11.5px] font-semibold ${T.ink2}`}>Role {i + 1}</span>
                  <button type="button" aria-label={`Remove role ${i + 1}`}
                    onClick={() => setEmployment(employment.filter((_, j) => j !== i))}
                    className={`${T.muted} transition-colors hover:text-[#B32F2F]`}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input placeholder="Employer" value={job.employer} className={FIELD}
                    onChange={(e) => setEmployment(employment.map((j, k) => k === i ? { ...j, employer: e.target.value } : j))} />
                  <input placeholder="Job title" value={job.title} className={FIELD}
                    onChange={(e) => setEmployment(employment.map((j, k) => k === i ? { ...j, title: e.target.value } : j))} />
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <select value={job.startMonth} className={SELECT_FIELD}
                    onChange={(e) => setEmployment(employment.map((j, k) => k === i ? { ...j, startMonth: e.target.value } : j))}>
                    <option value="" className={OPTION}>Start month</option>
                    {MONTHS.map((m) => <option key={m} value={m} className={OPTION}>{m}</option>)}
                  </select>
                  <input placeholder="Start year" value={job.startYear} inputMode="numeric" className={FIELD}
                    onChange={(e) => setEmployment(employment.map((j, k) => k === i ? { ...j, startYear: e.target.value } : j))} />
                  <select value={job.endMonth} disabled={job.current} className={SELECT_FIELD}
                    onChange={(e) => setEmployment(employment.map((j, k) => k === i ? { ...j, endMonth: e.target.value } : j))}>
                    <option value="" className={OPTION}>End month</option>
                    {MONTHS.map((m) => <option key={m} value={m} className={OPTION}>{m}</option>)}
                  </select>
                  <input placeholder="End year" value={job.endYear} disabled={job.current} inputMode="numeric" className={FIELD}
                    onChange={(e) => setEmployment(employment.map((j, k) => k === i ? { ...j, endYear: e.target.value } : j))} />
                </div>
                <label className={`mt-2.5 flex items-center gap-2 text-[11.5px] ${T.ink2}`}>
                  <input type="checkbox" checked={job.current}
                    onChange={(e) => setEmployment(employment.map((j, k) =>
                      // Clearing the end date keeps "current" and a leaving
                      // date from contradicting each other on the form.
                      k === i ? { ...j, current: e.target.checked, endMonth: "", endYear: "" } : j))} />
                  I currently work here
                </label>
              </div>
            ))}
            <button type="button" onClick={() => setEmployment([...employment, { ...EMPTY_JOB }])}
              className={`inline-flex items-center gap-1 rounded-lg border ${T.hairline} px-3 py-2
                          text-[12px] font-semibold ${T.ink} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}>
              <Plus size={13} /> Add a role
            </button>
          </div>
        </Section>

        {/* Education — School and Degree are the two most common blockers. */}
        <Section icon={Building2} title="Education" accent={accent}
                 hint="Employers ask for school and degree by name">
          <div className="space-y-3">
            {education.map((ed, i) => (
              <div key={i} className={`rounded-xl border ${T.hairline} p-3.5`}>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className={`text-[11.5px] font-semibold ${T.ink2}`}>Qualification {i + 1}</span>
                  <button type="button" aria-label={`Remove qualification ${i + 1}`}
                    onClick={() => setEducation(education.filter((_, j) => j !== i))}
                    className={`${T.muted} transition-colors hover:text-[#B32F2F]`}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input placeholder="School or university" value={ed.school} className={FIELD}
                    onChange={(e) => setEducation(education.map((x, k) => k === i ? { ...x, school: e.target.value } : x))} />
                  {/* A fixed list, matching what the forms offer. */}
                  <select value={ed.degree} className={SELECT_FIELD}
                    onChange={(e) => setEducation(education.map((x, k) => k === i ? { ...x, degree: e.target.value } : x))}>
                    <option value="" className={OPTION}>Select a degree</option>
                    {degreeOptions.map((d) => <option key={d} value={d} className={OPTION}>{d}</option>)}
                  </select>
                  <select value={ed.discipline} className={SELECT_FIELD}
                    onChange={(e) => setEducation(education.map((x, k) => k === i ? { ...x, discipline: e.target.value } : x))}>
                    <option value="" className={OPTION}>Field of study</option>
                    {disciplineOptions.map((d) => <option key={d} value={d} className={OPTION}>{d}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input placeholder="Start year" value={ed.startYear} inputMode="numeric" className={FIELD}
                      onChange={(e) => setEducation(education.map((x, k) => k === i ? { ...x, startYear: e.target.value } : x))} />
                    <input placeholder="End year" value={ed.endYear} inputMode="numeric" className={FIELD}
                      onChange={(e) => setEducation(education.map((x, k) => k === i ? { ...x, endYear: e.target.value } : x))} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setEducation([...education, { ...EMPTY_EDUCATION }])}
              className={`inline-flex items-center gap-1 rounded-lg border ${T.hairline} px-3 py-2
                          text-[12px] font-semibold ${T.ink} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}>
              <Plus size={13} /> Add a qualification
            </button>
          </div>
        </Section>

        {/* Application answers — what employers ask on the form itself. */}
        <Section icon={ClipboardCheck} title="Application answers" accent={accent}
                 hint="Questions employers ask that we can't answer for you">
          <div className="space-y-4">
            <div className="grid gap-3.5 sm:grid-cols-3">
              <div>
                <FieldLabel icon={MapPin} htmlFor="vault-city">Where you live — city</FieldLabel>
                <input id="vault-city" placeholder="Chicago" value={answers.city}
                  onChange={(e) => setAnswers({ ...answers, city: e.target.value })} className={FIELD} />
              </div>
              {/* Its own field, not part of the city. US forms ask "in what city
                  and state do you reside?" as one required box, and a city alone
                  does not answer it. Optional — many countries have no state. */}
              <div>
                <FieldLabel icon={MapPin} htmlFor="vault-state">State / province</FieldLabel>
                <input id="vault-state" placeholder="Illinois" value={answers.state}
                  onChange={(e) => setAnswers({ ...answers, state: e.target.value })} className={FIELD} />
              </div>
              <div>
                <FieldLabel icon={Globe} htmlFor="vault-country">Country</FieldLabel>
                <input id="vault-country" placeholder="United States" value={answers.country}
                  onChange={(e) => setAnswers({ ...answers, country: e.target.value })} className={FIELD} />
              </div>
            </div>

            <div>
              <FieldLabel icon={ShieldCheck}>Where can you work without sponsorship?</FieldLabel>
              <p className={`-mt-1 mb-2 text-[11px] ${T.muted}`}>
                Employers ask this on almost every application. We never guess — leave it
                blank and those applications wait for you to complete them by hand.
              </p>
              <MultiSelectChips options={workCountries} selected={answers.authorizedCountries}
                onChange={(v) => setAnswers({ ...answers, authorizedCountries: v })} />
            </div>

            <div>
              <FieldLabel>Would you need visa sponsorship anywhere else?</FieldLabel>
              <Select value={answers.needsSponsorship}
                onValueChange={(v) => setAnswers({ ...answers, needsSponsorship: v })}>
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="Select an answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">
                    <span>Yes — I would need sponsorship</span>
                  </SelectItem>
                  <SelectItem value="no">
                    <span>No — I would not need sponsorship</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <FieldLabel icon={Plane}>Would you relocate for a role?</FieldLabel>
                <Select value={answers.willingToRelocate}
                  onValueChange={(v) => setAnswers({ ...answers, willingToRelocate: v })}>
                  <SelectTrigger className={FIELD}>
                    <SelectValue placeholder="Select an answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {relocateOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span>{o.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">— {o.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel icon={Megaphone}>How did you hear about us?</FieldLabel>
                <Select value={answers.hearAboutUs}
                  onValueChange={(v) => setAnswers({ ...answers, hearAboutUs: v })}>
                  <SelectTrigger className={FIELD}>
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    {hearAboutOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <FieldLabel icon={ShieldCheck}>Are you at least 18 years old?</FieldLabel>
                <Select value={answers.atLeast18}
                  onValueChange={(v) => setAnswers({ ...answers, atLeast18: v })}>
                  <SelectTrigger className={FIELD}>
                    <SelectValue placeholder="Select an answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes"><span>Yes</span></SelectItem>
                    <SelectItem value="no"><span>No</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel icon={CalendarClock}>Notice period</FieldLabel>
                <Select value={answers.noticePeriod}
                  onValueChange={(v) => setAnswers({ ...answers, noticePeriod: v })}>
                  <SelectTrigger className={FIELD}>
                    <SelectValue placeholder="How soon could you start?" />
                  </SelectTrigger>
                  <SelectContent>
                    {noticePeriodOptions.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel icon={Link2} htmlFor="vault-portfolio">Portfolio or website</FieldLabel>
                <input id="vault-portfolio" placeholder="https://janedoe.com" value={answers.portfolioUrl}
                  onChange={(e) => setAnswers({ ...answers, portfolioUrl: e.target.value })} className={FIELD} />
              </div>
            </div>

            <div>
              <FieldLabel icon={Link2} htmlFor="vault-github">GitHub</FieldLabel>
              <input id="vault-github" placeholder="https://github.com/janedoe" value={answers.githubUrl}
                onChange={(e) => setAnswers({ ...answers, githubUrl: e.target.value })} className={FIELD} />
            </div>

            <div>
              <FieldLabel icon={EyeOff}>Equal-opportunity questions</FieldLabel>
              <p className={`-mt-1 mb-2 text-[11px] ${T.muted}`}>
                Optional questions about gender, ethnicity, veteran and disability status.
                Answering is always voluntary.
              </p>
              <Select value={answers.eeoHandling}
                onValueChange={(v) => setAnswers({ ...answers, eeoHandling: v })}>
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="Choose how to answer" />
                </SelectTrigger>
                <SelectContent>
                  {eeoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span>{o.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">— {o.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Targeting Preferences */}
        <Section icon={Briefcase} title="Targeting preferences" accent={accent}
                 hint="What we look for when sourcing roles">
          <div className="space-y-4">
            <div>
              <FieldLabel>Industry</FieldLabel>
              <MultiSelectChips options={industries} selected={targeting.industries}
                onChange={(v) => setTargeting({ ...targeting, industries: v })} />
            </div>

            <div>
              <FieldLabel icon={MapPin}>Role type</FieldLabel>
              <MultiSelectChips options={roleTypes} selected={targeting.roleTypes}
                onChange={(v) => setTargeting({ ...targeting, roleTypes: v })} />
            </div>

            {/* ✅ Target Roles with "Other" custom input */}
            <div>
              <FieldLabel icon={Target}>Target roles</FieldLabel>
              <MultiSelectChips
                options={targetRoleOptions}
                selected={targeting.targetRoles}
                onChange={(v) => setTargeting({ ...targeting, targetRoles: v })}
              />

              {/* ✅ Show custom role input only when "Other" is selected */}
              {otherSelected && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3"
                >
                  <FieldLabel>Add your own role</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      placeholder="e.g. Blockchain Developer, Growth Hacker…"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      onKeyDown={handleCustomRoleKeyDown}
                      className={`${FIELD} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomRole}
                      disabled={!customRoleInput.trim()}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-lg border ${T.hairline}
                                  px-3 py-2 text-[12px] font-semibold ${T.ink} transition-colors
                                  hover:bg-[#F4F4F2] disabled:opacity-40 dark:hover:bg-white/5`}
                    >
                      <Plus size={13} />
                      Add
                    </button>
                  </div>

                  {customRoles.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {customRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
                          style={{ backgroundColor: `${accent}1A`, color: accent }}
                        >
                          {role}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomRole(role)}
                            aria-label={`Remove ${role}`}
                            className="transition-opacity hover:opacity-60"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div>
              <FieldLabel icon={DollarSign}>Salary expectations</FieldLabel>
              <div className="grid grid-cols-2 gap-2.5">
                <input placeholder="Min (e.g. 80,000)" value={targeting.salaryMin}
                  onChange={(e) => setTargeting({ ...targeting, salaryMin: e.target.value })} className={FIELD} />
                <input placeholder="Max (e.g. 150,000)" value={targeting.salaryMax}
                  onChange={(e) => setTargeting({ ...targeting, salaryMax: e.target.value })} className={FIELD} />
              </div>
            </div>

            <div>
              <FieldLabel icon={MessageSquare}>Tone of voice</FieldLabel>
              <Select value={targeting.toneOfVoice}
                onValueChange={(v) => setTargeting({ ...targeting, toneOfVoice: v })}>
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="Select preferred tone" />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span>{t.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">— {t.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Role Specifics */}
        <Section icon={Building2} title="Role specifics" accent={accent}
                 hint="Fine-tune what counts as a good match">
          <div className="space-y-4">
            <div>
              <FieldLabel>Target job titles</FieldLabel>
              <ChipInput values={targeting.targetJobTitles}
                onChange={(v) => setTargeting({ ...targeting, targetJobTitles: v })}
                placeholder="Type a title and press Enter (e.g. Senior Product Designer)" />
            </div>
            <div>
              <FieldLabel icon={Building2}>Preferred company size</FieldLabel>
              <MultiSelectChips options={companySizeOptions} selected={targeting.companySizes}
                onChange={(v) => setTargeting({ ...targeting, companySizes: v })} />
            </div>
            <div>
              <FieldLabel>Role preferences / must-haves</FieldLabel>
              <textarea placeholder="e.g. Must have health insurance, 4-day work week…"
                value={targeting.mustHaves}
                onChange={(e) => setTargeting({ ...targeting, mustHaves: e.target.value })}
                className={`${FIELD} min-h-[96px] resize-y`} />
            </div>
          </div>
        </Section>

        {/* Save — sticks to the bottom so it stays reachable on a long form. */}
        <div
          className={`sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t
                      ${T.hairline} bg-[#F4F4F2]/90 px-4 py-3 backdrop-blur
                      dark:bg-[#0D0D0D]/90 sm:-mx-5 sm:px-5`}
        >
          <p className={`text-[11.5px] ${T.muted}`}>
            Changes apply to applications sent from now on.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#111110] px-5 py-2.5
                       text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90
                       disabled:opacity-50 dark:bg-white dark:text-[#111110]"
          >
            <ShieldCheck size={15} />
            {saving ? "Saving…" : "Save vault"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IdentityVault;