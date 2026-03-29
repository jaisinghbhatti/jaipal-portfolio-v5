/**
 * Vercel Serverless Function: Call Emergent LLM Proxy
 * Uses the OpenAI-compatible API at integrations.emergentagent.com
 */

const PROXY_URL = 'https://integrations.emergentagent.com/llm/chat/completions';

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

function parseJSON(text) {
  let clean = text.trim();
  // Remove markdown code blocks
  if (clean.startsWith('```')) {
    const parts = clean.split('```');
    for (const part of parts) {
      const trimmed = part.replace(/^json\s*/, '').trim();
      if (trimmed.startsWith('{')) { clean = trimmed; break; }
    }
  }
  // Extract JSON object
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    clean = clean.substring(start, end + 1);
  }
  return JSON.parse(clean);
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
    return res.status(200).json({ matchScore: 50, missingKeywords: ['AI unavailable — set EMERGENT_LLM_KEY in Vercel env vars'] });
  }

  try {
    const { resumeText, jobDescription } = req.body;

    const prompt = `You are a strict ATS keyword analyzer. Compare the resume against the job description.

STEP 1: Extract ALL important keywords, skills, tools, technologies, certifications, and phrases from the JOB DESCRIPTION.
STEP 2: Check which of those keywords are MISSING or NOT EXPLICITLY MENTIONED in the RESUME.
STEP 3: Calculate a match score (0-100) based on how many JD keywords appear in the resume.

CRITICAL RULES:
- You MUST find at least 3-5 missing keywords. No resume is a 100% match.
- Be strict: if the JD says "Python" and the resume says "programming", Python is still missing.
- Never return an empty missingKeywords list.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Respond in this exact JSON format ONLY:
{"matchScore": <number 0-100>, "missingKeywords": ["keyword1", "keyword2", ...]}`;

    const response = await callLLM(apiKey, 'You are a strict ATS keyword matching engine. Respond with valid JSON only.', prompt);
    const result = parseJSON(response);

    const keywords = result.missingKeywords || [];
    if (keywords.length === 0) keywords.push('Review job description for specific requirements');

    return res.status(200).json({
      matchScore: Math.min(100, Math.max(0, parseInt(result.matchScore) || 50)),
      missingKeywords: keywords.slice(0, 10),
    });
  } catch (err) {
    console.error('Analyze error:', err.message);
    return res.status(200).json({ matchScore: 50, missingKeywords: [`Analysis error: ${err.message.substring(0, 100)}`] });
  }
}
