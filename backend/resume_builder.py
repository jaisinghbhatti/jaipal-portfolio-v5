"""
Resume Builder API endpoints with AI integration using Gemini 2.5 Flash
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import logging
import io
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume-builder", tags=["resume-builder"])

# Pydantic Models
class AnalyzeRequest(BaseModel):
    resumeText: str
    resumeParsed: Optional[Dict[str, Any]] = None
    jobDescription: str

class AnalyzeResponse(BaseModel):
    matchScore: int
    missingKeywords: List[str]

class OptimizeRequest(BaseModel):
    resumeText: str
    resumeParsed: Optional[Dict[str, Any]] = None
    jobDescription: str
    tone: str = "executive"

class OptimizeResponse(BaseModel):
    optimizedResume: str
    coverLetter: str
    newMatchScore: Optional[int] = None


# Helper functions
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file"""
    try:
        from PyPDF2 import PdfReader
        pdf_reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from DOCX")


def parse_resume_text(text: str) -> Dict[str, Any]:
    """Basic parsing of resume text into structured data"""
    parsed = {
        "fullName": "",
        "contact": "",
        "summary": "",
        "experience": [],
        "education": [],
        "skills": []
    }
    
    # Try to extract name (usually first line or lines)
    lines = text.split('\n')
    for line in lines[:5]:
        line = line.strip()
        if line and len(line) < 50 and not any(char.isdigit() for char in line[:5]):
            # Likely a name
            if not parsed["fullName"]:
                parsed["fullName"] = line
                break
    
    # Extract email
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    emails = re.findall(email_pattern, text)
    if emails:
        parsed["contact"] = emails[0]
    
    # Extract skills section (basic)
    skills_keywords = ["skills", "technologies", "tools", "proficiencies"]
    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in skills_keywords):
            # Get next few lines as skills
            skill_lines = []
            for j in range(i+1, min(i+10, len(lines))):
                if lines[j].strip() and len(lines[j].strip()) < 100:
                    skill_lines.append(lines[j].strip())
                else:
                    break
            parsed["skills"] = skill_lines
            break
    
    return parsed


async def call_gemini_ai(prompt: str, system_message: str = "") -> str:
    """Call Gemini 2.5 Flash using emergentintegrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"resume-builder-{os.urandom(8).hex()}",
            system_message=system_message or "You are an expert resume writer and career coach."
        ).with_model("gemini", "gemini-2.5-flash")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return response
        
    except Exception as e:
        logger.error(f"Gemini AI error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# API Endpoints
@router.post("/parse")
async def parse_document(
    file: UploadFile = File(...),
    type: str = Form(...)
):
    """Parse uploaded PDF or DOCX file"""
    try:
        file_bytes = await file.read()
        
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_bytes)
        elif file.filename.lower().endswith('.docx'):
            text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF or DOCX.")
        
        result = {"text": text}
        
        # If it's a resume, also parse it
        if type == "resume":
            result["parsed"] = parse_resume_text(text)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse file")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(request: AnalyzeRequest):
    """Analyze resume against job description to calculate match score"""
    try:
        prompt = f"""Analyze this resume against the job description and provide:
1. A match score from 0-100 based on keyword density and skill alignment
2. A list of top 10 missing high-priority keywords/skills from the JD that are NOT in the resume

RESUME:
{request.resumeText}

JOB DESCRIPTION:
{request.jobDescription}

Respond in this exact JSON format only, no other text:
{{
    "matchScore": <number between 0-100>,
    "missingKeywords": ["keyword1", "keyword2", ...]
}}
"""
        
        system_message = "You are an ATS (Applicant Tracking System) expert. Analyze resumes objectively and provide accurate match scores. Always respond with valid JSON only."
        
        response = await call_gemini_ai(prompt, system_message)
        
        # Parse the response
        import json
        # Clean the response - remove markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        try:
            result = json.loads(clean_response)
        except json.JSONDecodeError:
            # Fallback: try to extract values manually
            logger.warning(f"Failed to parse AI response as JSON: {response}")
            result = {
                "matchScore": 50,
                "missingKeywords": ["Unable to analyze - please try again"]
            }
        
        return AnalyzeResponse(
            matchScore=min(100, max(0, int(result.get("matchScore", 50)))),
            missingKeywords=result.get("missingKeywords", [])[:10]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_resume(request: OptimizeRequest):
    """Optimize resume with AI and generate cover letter"""
    try:
        # Define tone-specific instructions
        tone_instructions = {
            "executive": """Use high-level strategic language. 
            Preferred verbs: Spearheaded, Orchestrated, Leveraged, Directed, Championed
            Focus on leadership, strategy, and organizational impact.""",
            
            "disruptor": """Use punchy, action-oriented language.
            Preferred verbs: Built, Scaled, Accelerated, Disrupted, Transformed
            Focus on growth, innovation, and bold achievements.""",
            
            "human": """Use friendly, approachable language.
            Preferred verbs: Collaborated, Supported, Mentored, Facilitated, Nurtured
            Focus on teamwork, cultural fit, and people skills."""
        }
        
        tone_guide = tone_instructions.get(request.tone, tone_instructions["executive"])
        
        # Optimize Resume
        resume_prompt = f"""You are an expert resume writer. Rewrite this resume to be optimized for the given job description.

CRITICAL RULES:
1. For EVERY bullet point, include quantifiable metrics. If the original doesn't have numbers, add placeholders like [X%], [Y amount], [$Z], [N employees]
2. Apply the AIDA framework (Attention, Interest, Desire, Action) to the summary section
3. Incorporate missing keywords from the job description naturally
4. Keep the same structure but enhance the content

TONE STYLE:
{tone_guide}

ORIGINAL RESUME:
{request.resumeText}

TARGET JOB DESCRIPTION:
{request.jobDescription}

Provide the optimized resume as clean, formatted text. Use proper sections (SUMMARY, EXPERIENCE, EDUCATION, SKILLS, etc.)
Do NOT include any explanations or notes - just the optimized resume content."""

        optimized_resume = await call_gemini_ai(resume_prompt)
        
        # Generate Cover Letter
        cover_letter_prompt = f"""Generate a professional 3-paragraph cover letter based on this resume and job description.

STRUCTURE:
Paragraph 1 (HOOK): Open with attention-grabbing statement + job title being applied for
Paragraph 2 (CONNECTION): Connect 2-3 specific JD requirements with matching resume achievements
Paragraph 3 (CTA): Express enthusiasm + clear call to action

TONE STYLE:
{tone_guide}

RESUME:
{request.resumeText}

JOB DESCRIPTION:
{request.jobDescription}

Write ONLY the cover letter content, starting with "Dear Hiring Manager," and ending with a professional sign-off.
Do NOT include any explanations or notes - just the cover letter."""

        cover_letter = await call_gemini_ai(cover_letter_prompt)
        
        # Calculate new match score
        new_match_prompt = f"""Calculate a match score (0-100) for this optimized resume against the job description.
Consider keyword density, skill alignment, and experience relevance.

OPTIMIZED RESUME:
{optimized_resume}

JOB DESCRIPTION:
{request.jobDescription}

Respond with ONLY a single number between 0 and 100, nothing else."""

        try:
            new_score_response = await call_gemini_ai(new_match_prompt)
            new_match_score = int(re.search(r'\d+', new_score_response).group())
            new_match_score = min(100, max(0, new_match_score))
        except:
            new_match_score = None
        
        return OptimizeResponse(
            optimizedResume=optimized_resume.strip(),
            coverLetter=cover_letter.strip(),
            newMatchScore=new_match_score
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")
