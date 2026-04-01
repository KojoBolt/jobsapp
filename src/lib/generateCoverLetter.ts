const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  tone: 'professional' | 'creative' | 'technical'
): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-cover-letter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ resumeText, jobDescription, tone }),
  });

  if (!response.ok) throw new Error('Failed to generate cover letter');

  const data = await response.json();
  return data.coverLetter;
}