/**
 * Resume Builder Service
 * 
 * Architecture:
 * - File parsing: ALWAYS client-side (mammoth + pdf.js) — no backend dependency
 * - AI calls (analyze/optimize): Try backend, gracefully degrade if unavailable
 */
import { parseDocumentClientSide } from './clientSideParser';

// Get the backend API URL for AI features
const getAiApiUrl = () => {
  const hostname = window.location.hostname;
  
  // Emergent preview environments — use the FastAPI backend
  if (hostname.includes('preview.emergentagent.com')) {
    if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
    return `https://${hostname}`;
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }
  
  // For jaisingh.in and all other domains: use same-origin Vercel serverless functions
  // The api/ directory deploys as serverless functions on Vercel
  return '';
};

const AI_API_URL = getAiApiUrl();

/**
 * Parse uploaded document (PDF/DOCX) — runs entirely in the browser.
 * No backend call needed.
 */
export const parseDocument = async (file, type) => {
  return parseDocumentClientSide(file);
};

/**
 * Analyze resume against job description using AI
 */
export const analyzeResume = async (resumeText, resumeParsed, jobDescription) => {
  const response = await fetch(`${AI_API_URL}/api/resume-builder/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, resumeParsed, jobDescription }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let detail = 'Analysis failed';
    try { detail = JSON.parse(errorText).detail || detail; } catch (e) { detail = errorText || detail; }
    throw new Error(detail);
  }

  return response.json();
};

/**
 * Optimize resume with AI
 */
export const optimizeResume = async (resumeText, resumeParsed, jobDescription, tone) => {
  const response = await fetch(`${AI_API_URL}/api/resume-builder/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, resumeParsed, jobDescription, tone }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let detail = 'Optimization failed';
    try { detail = JSON.parse(errorText).detail || detail; } catch (e) { detail = errorText || detail; }
    throw new Error(detail);
  }

  return response.json();
};
