/**
 * Resume Builder API Service
 * Handles all API calls to the backend for the Resume Builder feature
 */

// Get the API URL - use relative path for same-origin or configured URL
const getApiUrl = () => {
  // If REACT_APP_BACKEND_URL is set, use it
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // For same-origin deployment (e.g., Vercel), use relative path
  // The API routes will be proxied to the backend
  return '';
};

const API_URL = getApiUrl();

/**
 * Parse uploaded document (PDF/DOCX)
 */
export const parseDocument = async (file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch(`${API_URL}/api/resume-builder/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to parse file' }));
    throw new Error(error.detail || 'Failed to parse file');
  }

  return response.json();
};

/**
 * Analyze resume against job description
 */
export const analyzeResume = async (resumeText, resumeParsed, jobDescription) => {
  const response = await fetch(`${API_URL}/api/resume-builder/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText,
      resumeParsed,
      jobDescription,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
};

/**
 * Optimize resume with AI
 */
export const optimizeResume = async (resumeText, resumeParsed, jobDescription, tone) => {
  const response = await fetch(`${API_URL}/api/resume-builder/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText,
      resumeParsed,
      jobDescription,
      tone,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Optimization failed' }));
    throw new Error(error.detail || 'Optimization failed');
  }

  return response.json();
};
