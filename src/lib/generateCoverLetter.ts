const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface CoverLetterUserInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export interface GenerateCoverLetterOptions {
  jobTitle?: string;
  company?: string;
  /** Without this the letter opens at the greeting — the function never invents a contact block. */
  userInfo?: CoverLetterUserInfo;
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  tone: 'professional' | 'creative' | 'technical',
  options: GenerateCoverLetterOptions = {}
): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-cover-letter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ resumeText, jobDescription, tone, ...options }),
  });

  const data = await response.json().catch(() => ({}));

  // Surface the real reason (e.g. which models failed) instead of a generic string.
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to generate cover letter');
  }

  return data.coverLetter;
}
