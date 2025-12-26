/**
 * Resume Builder API Service
 * Handles all API calls to the backend for the Resume Builder feature
 */

// Get the API URL - use relative path for same-origin or configured URL
const getApiUrl = () => {
  // If REACT_APP_BACKEND_URL is set, use it
  if (process.env.REACT_APP_BACKEND_URL) {
    console.log('Using REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Fallback: detect if we're on Emergent preview and construct the URL
  const hostname = window.location.hostname;
  if (hostname.includes('preview.emergentagent.com')) {
    // Extract the preview ID and construct backend URL
    const previewUrl = `https://${hostname}`;
    console.log('Auto-detected preview URL:', previewUrl);
    return previewUrl;
  }
  
  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('Using localhost backend');
    return 'http://localhost:8001';
  }
  
  // For same-origin deployment, use empty string for relative paths
  console.log('No REACT_APP_BACKEND_URL set, using relative paths');
  return '';
};

const API_URL = getApiUrl();
console.log('Resume Builder API_URL initialized:', API_URL);

/**
 * Parse uploaded document (PDF/DOCX)
 */
export const parseDocument = async (file, type) => {
  console.log('parseDocument called:', { 
    fileName: file.name, 
    fileType: file.type, 
    fileSize: file.size, 
    type,
    apiUrl: API_URL 
  });
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const url = `${API_URL}/api/resume-builder/parse`;
  console.log('Fetching URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    console.log('Parse response:', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    });

    if (!response.ok) {
      let errorDetail = 'Failed to parse file';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
        console.error('Parse error JSON:', errorJson);
      } catch (e) {
        const errorText = await response.text();
        console.error('Parse error text:', errorText);
        errorDetail = errorText || errorDetail;
      }
      throw new Error(errorDetail);
    }

    const result = await response.json();
    console.log('Parse success, extracted characters:', result.text?.length);
    return result;
  } catch (error) {
    console.error('Parse fetch error:', error.message, error);
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
