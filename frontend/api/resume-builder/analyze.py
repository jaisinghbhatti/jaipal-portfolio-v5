"""Vercel Serverless Function: Resume Analyzer"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import logging

logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    resumeText: str
    resumeParsed: Optional[dict] = None
    jobDescription: str

class AnalyzeResponse(BaseModel):
    matchScore: int
    missingKeywords: List[str]

@app.post("/api/resume-builder/analyze")
async def analyze(request: AnalyzeRequest):
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        return AnalyzeResponse(matchScore=50, missingKeywords=["AI unavailable - set EMERGENT_LLM_KEY in Vercel env vars"])

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        prompt = f"""You are a strict ATS keyword analyzer. Compare the resume against the job description.

STEP 1: Extract ALL important keywords, skills, tools, technologies, certifications, and phrases from the JOB DESCRIPTION.
STEP 2: Check which of those keywords are MISSING or NOT EXPLICITLY MENTIONED in the RESUME.
STEP 3: Calculate a match score (0-100) based on how many JD keywords appear in the resume.

CRITICAL RULES:
- You MUST find at least 3-5 missing keywords. No resume is a 100% match.
- Be strict: if the JD says "Python" and the resume says "programming", Python is still missing.
- Never return an empty missingKeywords list.

RESUME:
{request.resumeText}

JOB DESCRIPTION:
{request.jobDescription}

Respond in this exact JSON format ONLY:
{{"matchScore": <number 0-100>, "missingKeywords": ["keyword1", "keyword2", ...]}}
"""

        chat = LlmChat(
            api_key=api_key,
            session_id=f"analyze-{os.urandom(4).hex()}",
            system_message="You are a strict ATS keyword matching engine. Respond with valid JSON only."
        ).with_model("gemini", "gemini-2.5-flash")

        response = await chat.send_message(UserMessage(message=prompt))

        # Parse JSON from response
        clean = response.strip()
        if clean.startswith("```"):
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    clean = part
                    break

        # Find the JSON object
        brace_count = 0
        end_idx = 0
        for i, ch in enumerate(clean):
            if ch == '{': brace_count += 1
            elif ch == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        if end_idx > 0:
            clean = clean[:end_idx]

        result = json.loads(clean)
        keywords = result.get("missingKeywords", [])
        if not keywords:
            keywords = ["Review job description for specific requirements"]

        return AnalyzeResponse(
            matchScore=min(100, max(0, int(result.get("matchScore", 50)))),
            missingKeywords=keywords[:10]
        )

    except Exception as e:
        logger.error(f"Analyze error: {e}")
        return AnalyzeResponse(matchScore=50, missingKeywords=[f"Analysis error: {str(e)[:100]}"])
