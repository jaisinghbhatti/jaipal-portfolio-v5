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
  console.log('parseDocument called:', { fileName: file.name, fileType: file.type, fileSize: file.size, type });
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  try {
    const response = await fetch(`${API_URL}/api/resume-builder/parse`, {
      method: 'POST',
      body: formData,
    });

    console.log('Parse response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to parse file' }));
      console.error('Parse error response:', error);
      throw new Error(error.detail || 'Failed to parse file');
    }

    const result = await response.json();
    console.log('Parse success, extracted characters:', result.text?.length);
    return result;
  } catch (error) {
    console.error('Parse fetch error:', error);
    throw error;
  }
};

/**
 * Analyze resume against job description
 */
export const analyzeResume = async (resumeText, resumeParsed, jobDescription) => {
  console.log('analyzeResume called:', { resumeLength: resumeText?.length, jdLength: jobDescription?.length });
  
  try {
    const response = await fetch(`${API_URL}/api/resume-builder/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText,
        resumeParsed,
        jobDescription,
      }),
    });

    console.log('Analyze response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
      console.error('Analyze error response:', error);
      throw new Error(error.detail || 'Analysis failed');
    }

    const result = await response.json();
    console.log('Analyze success:', result);
    return result;
  } catch (error) {
    console.error('Analyze fetch error:', error);
    throw error;
  }
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
