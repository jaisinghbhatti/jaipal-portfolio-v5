"""Vercel Serverless Function: Resume Optimizer"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizeRequest(BaseModel):
    resumeText: str
    resumeParsed: Optional[dict] = None
    jobDescription: str
    tone: str = "executive"

class OptimizeResponse(BaseModel):
    optimizedResume: str
    coverLetter: str
    newMatchScore: Optional[int] = None

TONE_PROMPTS = {
    "executive": "Use executive language: Spearheaded, Orchestrated, Leveraged, Directed, Championed. Maintain a polished, C-suite tone.",
    "disruptor": "Use bold, action-oriented language: Built, Scaled, Disrupted, Accelerated, Launched. Maintain a confident, startup tone.",
    "human": "Use warm, collaborative language: Collaborated, Supported, Mentored, Nurtured, Facilitated. Maintain an approachable, team-oriented tone.",
}

@app.post("/api/resume-builder/optimize")
async def optimize(request: OptimizeRequest):
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return OptimizeResponse(
            optimizedResume=request.resumeText,
            coverLetter="AI unavailable. Set EMERGENT_LLM_KEY in Vercel environment variables.",
            newMatchScore=None
        )

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        tone_instruction = TONE_PROMPTS.get(request.tone, TONE_PROMPTS["executive"])

        prompt = f"""You are an expert resume writer. Optimize this resume for the target job description.

INSTRUCTIONS:
1. Rewrite the resume to maximize ATS keyword matching with the job description
2. {tone_instruction}
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
{request.resumeText}

TARGET JOB DESCRIPTION:
{request.jobDescription}

Output the complete optimized resume, then ---COVER LETTER---, then the cover letter.
"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"optimize-{os.urandom(4).hex()}",
            system_message="You are a world-class resume writer. Write compelling, ATS-optimized resumes. Output plain text only, no markdown code blocks."
        ).with_model("gemini", "gemini-2.5-flash")

        response = await chat.send_message(UserMessage(message=prompt))

        # Split resume and cover letter
        optimized_resume = response
        cover_letter = ""

        separators = ["---COVER LETTER---", "--- COVER LETTER ---", "COVER LETTER:", "---Cover Letter---"]
        for sep in separators:
            if sep in response:
                parts = response.split(sep, 1)
                optimized_resume = parts[0].strip()
                cover_letter = parts[1].strip() if len(parts) > 1 else ""
                break

        # Estimate new match score
        import json as json_mod
        try:
            score_chat = LlmChat(
                api_key=api_key,
                session_id=f"score-{os.urandom(4).hex()}",
                system_message="You are an ATS scoring engine. Respond with a JSON object only."
            ).with_model("gemini", "gemini-2.5-flash")

            score_response = await score_chat.send_message(UserMessage(
                message=f'Rate this resume against the JD on a 0-100 scale. Respond with ONLY: {{"matchScore": <number>}}\n\nRESUME:\n{optimized_resume[:2000]}\n\nJD:\n{request.jobDescription[:1000]}'
            ))

            clean = score_response.strip()
            if "{" in clean:
                start = clean.index("{")
                end = clean.rindex("}") + 1
                score_data = json_mod.loads(clean[start:end])
                new_match_score = min(100, max(0, int(score_data.get("matchScore", 75))))
            else:
                new_match_score = None
        except Exception:
            new_match_score = None

        return OptimizeResponse(
            optimizedResume=optimized_resume,
            coverLetter=cover_letter or "Cover letter generation was not available for this request.",
            newMatchScore=new_match_score
        )

    except Exception as e:
        logger.error(f"Optimize error: {e}")
        return OptimizeResponse(
            optimizedResume=request.resumeText,
            coverLetter=f"Optimization error: {str(e)[:200]}",
            newMatchScore=None
        )
