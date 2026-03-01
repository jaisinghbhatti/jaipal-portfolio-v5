// Shared utilities for resume parsing and export

// ============================================
// TEXT CLEANUP
// ============================================
export const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/Attention:\s*/gi, '')
    .replace(/Interest:\s*/gi, '')
    .replace(/Desire:\s*/gi, '')
    .replace(/Action:\s*/gi, '')
    .trim();
};

// Check if line is a bullet point (starts with * or • but NOT bold markdown **)
export const isBulletPoint = (line) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('**')) return false;
  if (trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ')) return true;
  if (trimmed.startsWith('*   ') || trimmed.startsWith('•   ')) return true;
  return false;
};

// ============================================
// RESUME PARSER
// ============================================
export const parseResume = (rawText) => {
  if (!rawText) return null;
  
  const result = {
    name: '',
    contact: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: []
  };
  
  const lines = rawText.split('\n');
  let currentSection = 'header';
  let currentJob = null;
  let summaryLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;
    
    const cleanedLine = cleanText(line);
    const upperLine = cleanedLine.toUpperCase();
    
    // Detect section headers
    if (upperLine === 'SUMMARY' || upperLine === 'PROFESSIONAL SUMMARY' || upperLine === 'PROFILE' || upperLine === 'EXECUTIVE SUMMARY') {
      currentSection = 'summary';
      continue;
    }
    if (upperLine === 'EXPERIENCE' || upperLine === 'PROFESSIONAL EXPERIENCE' || upperLine === 'WORK EXPERIENCE' || upperLine === 'EMPLOYMENT' || upperLine === 'CAREER HISTORY') {
      if (currentJob && currentJob.title) {
        result.experience.push(currentJob);
        currentJob = null;
      }
      currentSection = 'experience';
      continue;
    }
    if (upperLine === 'EDUCATION' || upperLine === 'ACADEMIC BACKGROUND' || upperLine === 'EDUCATIONAL BACKGROUND') {
      if (currentJob && currentJob.title) {
        result.experience.push(currentJob);
        currentJob = null;
      }
      currentSection = 'education';
      continue;
    }
    if (upperLine === 'SKILLS' || upperLine === 'KEY SKILLS' || upperLine === 'CORE SKILLS' || upperLine === 'TECHNICAL SKILLS' || upperLine.startsWith('SKILLS')) {
      currentSection = 'skills';
      continue;
    }
    if (upperLine === 'CERTIFICATIONS' || upperLine === 'CERTIFICATES' || upperLine === 'LICENSES') {
      currentSection = 'certifications';
      continue;
    }
    
    // Parse content by section
    switch (currentSection) {
      case 'header':
        if (!result.name && cleanedLine.length > 2 && cleanedLine.length < 50 && 
            !cleanedLine.includes('@') && !cleanedLine.includes('|') && 
            !/\d{5,}/.test(cleanedLine) && !cleanedLine.includes('http')) {
          result.name = cleanedLine;
        } else if (cleanedLine.includes('@') || cleanedLine.includes('|') || 
                   cleanedLine.includes('Phone') || cleanedLine.includes('LinkedIn') ||
                   /\+?\d{10,}/.test(cleanedLine.replace(/\D/g, ''))) {
          result.contact = cleanedLine;
        }
        break;
        
      case 'summary':
        if (cleanedLine.length > 10) {
          summaryLines.push(cleanedLine);
        }
        break;
        
      case 'experience': {
        const isBullet = isBulletPoint(rawLine);
        const hasJobFormat = rawLine.includes('**') || (cleanedLine.includes('|') && cleanedLine.length < 150);
        const isDateLine = /^\[?[A-Za-z]+,?\s*\d{4}\]?\s*[–\-—]/.test(cleanedLine) || 
                          /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i.test(cleanedLine) ||
                          /^\d{4}\s*[–\-—]/.test(cleanedLine);
        
        if (hasJobFormat && !isBullet) {
          if (currentJob && currentJob.title) {
            result.experience.push(currentJob);
          }
          const parts = cleanedLine.split('|').map(p => cleanText(p).trim());
          currentJob = {
            title: parts[0] || '',
            company: parts[1] || '',
            location: parts[2] || '',
            dates: '',
            bullets: []
          };
        } else if (isDateLine && currentJob && !currentJob.dates) {
          currentJob.dates = cleanedLine;
        } else if (isBullet && currentJob) {
          const bulletText = cleanText(rawLine.replace(/^[\s]*[\*•\-]\s*/, ''));
          if (bulletText.length > 10) {
            currentJob.bullets.push(bulletText);
          }
        } else if (!isBullet && currentJob && cleanedLine.length > 20 && !hasJobFormat && !isDateLine) {
          currentJob.bullets.push(cleanedLine);
        }
        break;
      }
        
      case 'education':
        if (cleanedLine.length > 5) {
          result.education.push(cleanedLine);
        }
        break;
        
      case 'skills': {
        const skillLine = cleanedLine.replace(/\*\*[^*]+\*\*:?\s*/g, '');
        const skills = skillLine.split(/[,•|]/).map(s => cleanText(s).trim()).filter(s => s.length > 2 && s.length < 60);
        result.skills.push(...skills);
        break;
      }
        
      case 'certifications':
        if (cleanedLine.length > 5) {
          result.certifications.push(cleanedLine.replace(/^[\*•\-]\s*/, ''));
        }
        break;
      default:
        break;
    }
  }
  
  // Save last job
  if (currentJob && currentJob.title) {
    result.experience.push(currentJob);
  }
  
  result.summary = summaryLines.join(' ').substring(0, 1000);
  result.skills = [...new Set(result.skills)].slice(0, 25);
  
  return result;
};

// ============================================
// IMAGE UTILITIES
// ============================================
export const imageToUint8Array = async (src) => {
  if (!src) return null;
  try {
    if (src.startsWith('data:')) {
      const base64 = src.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
    const response = await fetch(src);
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  } catch (e) {
    console.error('Image error:', e);
    return null;
  }
};

export const loadImageForPDF = async (src) => {
  if (!src) return null;
  try {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (e) {
    console.error('Image load error:', e);
    return null;
  }
};
