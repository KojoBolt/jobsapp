export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  tone: 'professional' | 'creative' | 'technical'
): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a professional cover letter writer.

Generate a compelling cover letter based on:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TONE: ${tone}

Requirements:
- 250-300 words
- Highlight relevant experience from resume
- Address key job requirements
- Use ${tone} tone
- Be specific and concise
- Don't use generic phrases

Write only the cover letter, no preamble.`
        }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Cover letter generation failed:', error);
    throw new Error('Failed to generate cover letter');
  }
}
