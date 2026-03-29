/**
 * Client-side document parsing - NO backend needed.
 * Uses mammoth (DOCX) and pdfjs-dist (PDF) to extract text in the browser.
 */
import mammoth from 'mammoth';

/**
 * Parse a DOCX file entirely in the browser using mammoth
 */
const parseDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
};

/**
 * Parse a PDF file entirely in the browser using pdf.js
 */
const parsePDF = async (file) => {
  // Dynamic import to avoid bundling issues with pdf.js worker
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set the worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n');
};

/**
 * Parse a document (PDF or DOCX) client-side.
 * Returns { text, parsed } matching the old backend response format.
 */
export const parseDocumentClientSide = async (file) => {
  const filename = file.name?.toLowerCase() || '';
  const mimeType = file.type?.toLowerCase() || '';
  
  let text = '';
  
  if (filename.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
    text = await parseDOCX(file);
  } else if (filename.endsWith('.pdf') || mimeType.includes('pdf')) {
    text = await parsePDF(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
  
  if (!text || text.trim().length < 10) {
    throw new Error('Could not extract text from this file. The file may be image-based or empty. Please paste your text manually.');
  }
  
  // Basic structured parsing (matches old backend response)
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
