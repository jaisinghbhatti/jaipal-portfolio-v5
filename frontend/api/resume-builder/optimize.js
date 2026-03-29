/**
 * Vercel Serverless Function: AI Resume Optimization
 * Uses the OpenAI-compatible API at integrations.emergentagent.com
 */

const PROXY_URL = 'https://integrations.emergentagent.com/llm/chat/completions';

const TONE_PROMPTS = {
  executive: 'Use executive language: Spearheaded, Orchestrated, Leveraged, Directed, Championed. Maintain a polished, C-suite tone.',
  disruptor: 'Use bold, action-oriented language: Built, Scaled, Disrupted, Accelerated, Launched. Maintain a confident, startup tone.',
  human: 'Use warm, collaborative language: Collaborated, Supported, Mentored, Nurtured, Facilitated. Maintain an approachable, team-oriented tone.',
};

async function callLLM(apiKey, systemMessage, userMessage) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gemini/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const apiKey = process.env.EMERGENT_LLM_KEY;
  if (!apiKey) {
    return res.status(200).json({
      optimizedResume: req.body?.resumeText || '',
      coverLetter: 'AI unavailable — set EMERGENT_LLM_KEY in Vercel environment variables.',
      newMatchScore: null,
    });
  }

  try {
    const { resumeText, jobDescription, tone = 'executive' } = req.body;
    const toneInstruction = TONE_PROMPTS[tone] || TONE_PROMPTS.executive;

    const prompt = `You are an expert resume writer. Optimize this resume for the target job description.

INSTRUCTIONS:
1. Rewrite the resume to maximize ATS keyword matching with the job description
2. ${toneInstruction}
3. Add quantified achievements where possible (use [X%], [N], [$Y] as placeholders if numbers aren't available)
4. Keep the same overall structure but improve every bullet point
5. Ensure all critical keywords from the JD appear naturally in the resume
6. After the resume, write a compelling cover letter

IMPORTANT FORMAT RULES:
- Output the optimized resume as plain text with clear section headers
- Use **Bold** for job titles only
- Use * for bullet points
- Separate the cover letter with "---COVER LETTER---"

CURRENT RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

Output the complete optimized resume, then ---COVER LETTER---, then the cover letter.`;

    const response = await callLLM(
      apiKey,
      'You are a world-class resume writer. Write compelling, ATS-optimized resumes. Output plain text only, no markdown code blocks.',
      prompt
    );

    // Split resume and cover letter
    let optimizedResume = response;
    let coverLetter = '';

    const separators = ['---COVER LETTER---', '--- COVER LETTER ---', 'COVER LETTER:', '---Cover Letter---'];
    for (const sep of separators) {
      if (response.includes(sep)) {
        const parts = response.split(sep);
        optimizedResume = parts[0].trim();
        coverLetter = parts[1]?.trim() || '';
        break;
      }
    }

    // Estimate new match score
    let newMatchScore = null;
    try {
      const scoreResponse = await callLLM(
        apiKey,
        'You are an ATS scoring engine. Respond with a JSON object only.',
        `Rate this resume against the JD on a 0-100 scale. Respond with ONLY: {"matchScore": <number>}\n\nRESUME:\n${optimizedResume.substring(0, 2000)}\n\nJD:\n${jobDescription.substring(0, 1000)}`
      );
      const start = scoreResponse.indexOf('{');
      const end = scoreResponse.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const scoreData = JSON.parse(scoreResponse.substring(start, end + 1));
        newMatchScore = Math.min(100, Math.max(0, parseInt(scoreData.matchScore) || 75));
      }
    } catch (e) {
      // Score estimation is optional
    }

    return res.status(200).json({
      optimizedResume,
      coverLetter: coverLetter || 'Cover letter generation was not available for this request.',
      newMatchScore,
    });
  } catch (err) {
    console.error('Optimize error:', err.message);
    return res.status(200).json({
      optimizedResume: req.body?.resumeText || '',
      coverLetter: `Optimization error: ${err.message.substring(0, 200)}`,
      newMatchScore: null,
    });
  }
}
