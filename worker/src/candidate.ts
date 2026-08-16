import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { db } from "./queue.ts";
import { log } from "./log.ts";
import type { ClaimedApplication } from "./queue.ts";

/**
 * Everything needed to fill in an application form, gathered in one place.
 *
 * Nothing here is inferred. A field we do not have is absent, and an adapter
 * that meets a required question with no answer for it parks the application
 * for a human. The alternative — guessing — puts a false statement on a real
 * job application in the candidate's name.
 */
export interface Candidate {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  city: string;
  country: string;
  /** Countries where the candidate can work WITHOUT sponsorship. */
  authorizedCountries: string[];
  /** "yes" | "no" | "" — "" means we were never told. */
  needsSponsorship: string;
  noticePeriod: string;
  /** "Remote" | "Hybrid" | "On-site" — what the candidate said they want. */
  roleTypes: string[];
  salaryMin: string;
  salaryMax: string;
  /** "decline" | "manual" */
  eeoHandling: string;
  coverLetter: string;
  /** Absolute path to the downloaded CV, or null if there isn't one. */
  resumePath: string | null;
  resumeFileName: string;
}

/** Matches the vault's own list; see src/pages/IdentityVault.tsx. */
const KNOWN_COUNTRIES = [
  "United States", "United Kingdom", "Canada", "European Union", "Australia",
  "New Zealand", "Ireland", "Switzerland",
];

export { KNOWN_COUNTRIES };

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Download the CV to a temp file.
 *
 * It has to be a real file on disk — Playwright uploads from a path, not a
 * buffer. `file_url` is deliberately ignored: both upload paths in the app
 * store a getPublicUrl() result for a private bucket, so that URL does not
 * resolve. `file_path` is the only usable handle.
 */
async function downloadResume(
  resumeId: string,
): Promise<{ path: string; fileName: string } | null> {
  const { data: row, error } = await db
    .from("resumes")
    .select("file_path, file_name")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) {
    log.error("resume lookup failed", { resumeId, error: error.message });
    return null;
  }
  const filePath = str(row?.file_path);
  if (!filePath) {
    log.warn("resume row has no file_path", { resumeId });
    return null;
  }

  const { data: blob, error: dlError } = await db.storage
    .from("resumes")
    .download(filePath);

  if (dlError || !blob) {
    log.error("resume download failed", { resumeId, filePath, error: dlError?.message });
    return null;
  }

  // Keep the real extension: some boards validate on it, and a CV that
  // uploads as ".bin" gets rejected for reasons the log would not explain.
  const fileName = str(row?.file_name) || filePath.split("/").pop() || "resume.pdf";
  const target = join(await fs.mkdtemp(join(tmpdir(), "cv-")), fileName);
  await fs.writeFile(target, Buffer.from(await blob.arrayBuffer()));

  return { path: target, fileName };
}

/** Best-effort cleanup — a leftover temp file is not worth failing over. */
export async function discardResume(path: string | null): Promise<void> {
  if (!path) return;
  await fs.rm(path, { force: true }).catch(() => {});
  await fs.rmdir(join(path, "..")).catch(() => {});
}

export async function loadCandidate(app: ClaimedApplication): Promise<Candidate | null> {
  if (!app.user_id) {
    log.warn("application has no user_id", { applicationId: app.id });
    return null;
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("full_name, email, identity_vault_data")
    .eq("id", app.user_id)
    .maybeSingle();

  if (error) {
    log.error("profile lookup failed", { userId: app.user_id, error: error.message });
    return null;
  }

  const vault = (profile?.identity_vault_data ?? {}) as Record<string, any>;
  const personal = (vault.personalInfo ?? {}) as Record<string, unknown>;
  const targeting = (vault.targeting ?? {}) as Record<string, unknown>;
  const answers = (vault.applicationAnswers ?? {}) as Record<string, unknown>;

  // The cover letter is drafted per application by process-batch, so it is
  // read from the row rather than the profiles.
  const { data: appRow } = await db
    .from("applications")
    .select("cover_letter")
    .eq("id", app.id)
    .maybeSingle();

  const firstName = str(personal.firstName);
  const lastName = str(personal.lastName);
  const fullName = str(personal.name) || str(profile?.full_name);

  const resume = app.resume_id ? await downloadResume(app.resume_id) : null;

  return {
    firstName,
    lastName,
    fullName: fullName || [firstName, lastName].filter(Boolean).join(" "),
    email: str(personal.email) || str(profile?.email),
    phone: str(personal.phone),
    linkedinUrl: str(personal.linkedinUrl),
    portfolioUrl: str(answers.portfolioUrl),
    githubUrl: str(answers.githubUrl),
    city: str(answers.city) || str(personal.city),
    country: str(answers.country) || str(personal.country),
    authorizedCountries: Array.isArray(answers.authorizedCountries)
      ? (answers.authorizedCountries as unknown[]).map(str).filter(Boolean)
      : [],
    needsSponsorship: str(answers.needsSponsorship),
    noticePeriod: str(answers.noticePeriod),
    roleTypes: Array.isArray(targeting.roleTypes)
      ? (targeting.roleTypes as unknown[]).map(str).filter(Boolean)
      : [],
    salaryMin: str(targeting.salaryMin),
    salaryMax: str(targeting.salaryMax),
    eeoHandling: str(answers.eeoHandling) || "decline",
    coverLetter: str(appRow?.cover_letter),
    resumePath: resume?.path ?? null,
    resumeFileName: resume?.fileName ?? "",
  };
}

/**
 * The fields without which an application is not worth submitting. Missing
 * any of these is a vault problem, not a form problem, so the adapter parks
 * rather than retries — a retry would fail identically.
 */
export function missingEssentials(c: Candidate): string[] {
  const gaps: string[] = [];
  if (!c.firstName) gaps.push("first name");
  if (!c.lastName) gaps.push("last name");
  if (!c.email) gaps.push("email");
  if (!c.resumePath) gaps.push("resume file");
  return gaps;
}
