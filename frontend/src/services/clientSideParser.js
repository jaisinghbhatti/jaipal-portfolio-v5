/**
 * Client-side document parsing — NO backend, NO web workers, NO CDN dependencies.
 * - DOCX: mammoth.js (reliable, battle-tested)
 * - PDF:  unpdf (lightweight pdf.js wrapper, no workers needed)
 */
import mammoth from 'mammoth';

/**
 * Parse a DOCX file in the browser using mammoth
 */
const parseDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
};

/**
 * Parse a PDF file in the browser using unpdf (no workers)
 */
const parsePDF = async (file) => {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text || '';
};

/**
 * Parse a document (PDF or DOCX) client-side.
 * Returns { text, parsed } matching the expected response format.
 */
export const parseDocumentClientSide = async (file) => {
  const filename = file.name?.toLowerCase() || '';
  const mimeType = file.type?.toLowerCase() || '';
  
  let text = '';
  
  if (filename.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
    text = await parseDOCX(file);
  } else if (filename.endsWith('.pdf') || mimeType.includes('pdf')) {
    text = await parsePDF(file);
    if (!text || text.trim().length < 20) {
      throw new Error(
        'Could not extract text from this PDF. It may be image-based. ' +
        'Please paste your resume text in the box below.'
      );
    }
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
  
  if (!text || text.trim().length < 10) {
    throw new Error('Could not extract text from this file. Please paste your text manually.');
  }
  
  const lines = text.split('\n').filter(l => l.trim());
  const parsed = {
    fullName: lines[0]?.trim() || '',
    contact: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };
  
  return { text: text.trim(), parsed };
};
