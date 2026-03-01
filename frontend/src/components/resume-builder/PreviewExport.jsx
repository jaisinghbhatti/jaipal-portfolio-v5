import React, { useState, useRef, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2, FileDown, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ImageRun, convertInchesToTwip } from "docx";
import { saveAs } from "file-saver";

// ============================================
// AGGRESSIVE TEXT CLEANUP
// ============================================
const cleanAllText = (text) => {
  if (!text) return '';
  
  let cleaned = text
    // Decode HTML entities FIRST
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Remove markdown bold **text** or *text*
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    // Remove stray asterisks but keep bullet markers for now
    .replace(/(\w)\*+(\s|$)/g, '$1$2')
    .replace(/(\s)\*+(\w)/g, '$1$2')
    // Remove markdown headers
    .replace(/^#{1,6}\s*/gm, '')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove AIDA markers
    .replace(/\*?\*?[AIDA]\*?\*?ttention:?\s*/gi, '')
    .replace(/\*?\*?[AIDA]\*?\*?nterest:?\s*/gi, '')
    .replace(/\*?\*?[AIDA]\*?\*?esire:?\s*/gi, '')
    .replace(/\*?\*?[AIDA]\*?\*?ction:?\s*/gi, '')
    // Remove template instructions in brackets
    .replace(/\[Add [^\]]*\]/gi, '')
    .replace(/\[if [^\]]*\]/gi, '')
    .replace(/\[otherwise [^\]]*\]/gi, '')
    .replace(/\[Note:[^\]]*\]/gi, '')
    // Clean multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
};

// Clean line and detect if it's a bullet point
const processLine = (line) => {
  if (!line) return { text: '', isBullet: false };
  
  let text = cleanAllText(line);
  let isBullet = false;
  
  // Check if line starts with bullet markers
  if (/^[•\-\*►→▸]\s*/.test(text)) {
    isBullet = true;
    text = text.replace(/^[•\-\*►→▸]\s*/, '').trim();
  }
  
  return { text, isBullet };
};

// ============================================
// SMART RESUME PARSER
// ============================================
const parseResumeIntoSections = (rawText) => {
  if (!rawText) return null;
  
  const result = {
    name: '',
    contactLine: '',
    summary: [],
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    achievements: []
  };
  
  // Split into lines and clean
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentSection = 'header';
  let currentJob = null;
  
  // Section detection patterns
  const sectionPatterns = {
    summary: /^(PROFESSIONAL\s+)?SUMMARY|^PROFILE|^OBJECTIVE|^ABOUT/i,
    skills: /^SKILLS|^EXPERTISE|^COMPETENC|^CORE\s+SKILLS/i,
    experience: /^(PROFESSIONAL\s+)?EXPERIENCE|^EMPLOYMENT|^WORK\s+HISTORY|^CAREER/i,
    education: /^EDUCATION|^ACADEMIC/i,
    certifications: /^CERTIFICATIONS?|^LICENSES?/i,
    achievements: /^(KEY\s+)?ACHIEVEMENTS?|^AWARDS?|^KEY\s+WINS/i
  };
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const { text: line, isBullet } = processLine(rawLine);
    
    if (!line) continue;
    
    // Check for section headers
    let foundSection = null;
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line) && line.length < 50) {
        foundSection = section;
        break;
      }
    }
    
    if (foundSection) {
      // Save current job if exists
      if (currentJob && currentJob.title) {
        result.experience.push(currentJob);
        currentJob = null;
      }
      currentSection = foundSection;
      continue;
    }
    
    // Parse based on current section
    switch (currentSection) {
      case 'header':
        // First non-empty short line is likely the name
        if (!result.name && line.length < 50 && !line.includes('@') && !line.includes('|') && !/\d{3}/.test(line)) {
          result.name = line.toUpperCase();
        } else if (line.includes('@') || line.includes('|') || line.includes('•') || /\+?\d{2,}/.test(line)) {
          result.contactLine = line;
        }
        break;
        
      case 'summary':
        if (line.length > 20) {
          result.summary.push(line);
        }
        break;
        
      case 'skills':
        // Split by common delimiters and clean
        const skillItems = line
          .split(/[•|,]/)
          .map(s => cleanAllText(s))
          .filter(s => s.length > 2 && s.length < 80);
        result.skills.push(...skillItems);
        break;
        
      case 'experience':
        // Detect job title lines (usually contains | or dates)
        const isDateLine = /^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|\d{4})/i.test(line);
        const isJobTitleLine = line.includes('|') && !isBullet && line.length < 120;
        
        if (isJobTitleLine) {
          // Save previous job
          if (currentJob && currentJob.title) {
            result.experience.push(currentJob);
          }
          // Parse job title line: "Title | Company | Dates" or "Title | Company"
          const parts = line.split('|').map(p => cleanAllText(p));
          currentJob = {
            title: parts[0] || '',
            company: parts[1] || '',
            dates: parts[2] || '',
            bullets: []
          };
        } else if (isDateLine && currentJob && !currentJob.dates) {
          currentJob.dates = line;
        } else if (isBullet && currentJob) {
          currentJob.bullets.push(line);
        } else if (line.length > 20 && currentJob) {
          // Might be a continuation or standalone bullet
          currentJob.bullets.push(line);
        } else if (!currentJob && line.length < 100 && !isBullet) {
          // Might be a job title without | separator
          currentJob = { title: line, company: '', dates: '', bullets: [] };
        }
        break;
        
      case 'education':
        if (line.length > 5) {
          result.education.push(line);
        }
        break;
        
      case 'certifications':
        if (line.length > 5) {
          result.certifications.push(isBullet ? line : line);
        }
        break;
        
      case 'achievements':
        if (line.length > 10) {
          result.achievements.push(line);
        }
        break;
    }
  }
  
  // Don't forget the last job
  if (currentJob && currentJob.title) {
    result.experience.push(currentJob);
  }
  
  // Dedupe skills
  result.skills = [...new Set(result.skills)].slice(0, 30);
  
  // Combine summary into one paragraph
  result.summaryText = result.summary.join(' ').substring(0, 800);
  
  return result;
};

// ============================================
// IMAGE HANDLING
// ============================================
const imageToBase64 = async (src) => {
  if (!src) return null;
  
  try {
    // If already base64
    if (src.startsWith('data:')) {
      const base64 = src.split(',')[1];
      return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    }
    
    // Fetch image
    const response = await fetch(src);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error('Image conversion failed:', err);
    return null;
  }
};

// ============================================
// DOCX EXPORT - Professional Quality
// ============================================
const createProfessionalDOCX = async (parsed, photoSrc, templateName) => {
  const children = [];
  const primaryColor = "1F4E79"; // Professional dark blue
  
  // Get photo data
  let photoData = null;
  if (photoSrc) {
    photoData = await imageToBase64(photoSrc);
  }
  
  // === HEADER WITH PHOTO ===
  if (photoData) {
    try {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: photoData,
              transformation: { width: 80, height: 80 },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    } catch (e) {
      console.log('Photo embed failed:', e);
    }
  }
  
  // === NAME ===
  if (parsed.name) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: parsed.name,
            bold: true,
            size: 40,
            font: "Calibri Light",
            color: primaryColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }
  
  // === CONTACT ===
  if (parsed.contactLine) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: parsed.contactLine,
            size: 20,
            font: "Calibri",
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }
  
  // === DIVIDER ===
  children.push(
    new Paragraph({
      border: {
        bottom: { color: primaryColor, size: 12, style: BorderStyle.SINGLE },
      },
      spacing: { after: 300 },
    })
  );
  
  // Helper to add section header
  const addSection = (title) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24,
            font: "Calibri",
            color: primaryColor,
          }),
        ],
        spacing: { before: 300, after: 120 },
        border: {
          bottom: { color: primaryColor, size: 6, style: BorderStyle.SINGLE },
        },
      })
    );
  };
  
  // === SUMMARY ===
  if (parsed.summaryText) {
    addSection("Professional Summary");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: parsed.summaryText,
            size: 22,
            font: "Calibri",
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }
  
  // === SKILLS ===
  if (parsed.skills.length > 0) {
    addSection("Skills & Expertise");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: parsed.skills.join("  •  "),
            size: 20,
            font: "Calibri",
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }
  
  // === EXPERIENCE ===
  if (parsed.experience.length > 0) {
    addSection("Professional Experience");
    
    for (const job of parsed.experience) {
      // Job Title
      const titleParts = [];
      titleParts.push(new TextRun({ text: job.title, bold: true, size: 24, font: "Calibri" }));
      
      if (job.company) {
        titleParts.push(new TextRun({ text: "  |  ", size: 22, font: "Calibri", color: "999999" }));
        titleParts.push(new TextRun({ text: job.company, size: 22, font: "Calibri", color: primaryColor }));
      }
      
      children.push(
        new Paragraph({
          children: titleParts,
          spacing: { before: 200, after: 40 },
        })
      );
      
      // Dates
      if (job.dates) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.dates,
                italics: true,
                size: 20,
                font: "Calibri",
                color: "666666",
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
      
      // Bullets - using proper Word bullets, NOT asterisks
      for (const bullet of job.bullets) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: bullet,
                size: 21,
                font: "Calibri",
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
            indent: { left: convertInchesToTwip(0.25) },
          })
        );
      }
    }
  }
  
  // === EDUCATION ===
  if (parsed.education.length > 0) {
    addSection("Education");
    for (const edu of parsed.education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu,
              size: 21,
              font: "Calibri",
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
    }
  }
  
  // === CERTIFICATIONS ===
  if (parsed.certifications.length > 0) {
    addSection("Certifications");
    for (const cert of parsed.certifications) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert,
              size: 21,
              font: "Calibri",
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
    }
  }
  
  // === ACHIEVEMENTS ===
  if (parsed.achievements.length > 0) {
    addSection("Key Achievements");
    for (const ach of parsed.achievements) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ach,
              size: 21,
              font: "Calibri",
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
    }
  }
  
  // Create document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.75),
            right: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(0.75),
          },
        },
      },
      children,
    }],
  });
  
  return doc;
};

// ============================================
// PDF EXPORT - Professional Quality
// ============================================
const createProfessionalPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  
  const primaryColor = [31, 78, 121]; // RGB for dark blue
  const textColor = [60, 60, 60];
  const lightGray = [150, 150, 150];
  
  // === PHOTO ===
  if (photoSrc) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photoSrc;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      const photoSize = 22;
      pdf.addImage(imgData, 'JPEG', (pageWidth - photoSize) / 2, y, photoSize, photoSize);
      y += photoSize + 5;
    } catch (e) {
      console.log('PDF photo failed:', e);
    }
  }
  
  // === NAME ===
  if (parsed.name) {
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text(parsed.name, pageWidth / 2, y, { align: "center" });
    y += 8;
  }
  
  // === CONTACT ===
  if (parsed.contactLine) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...lightGray);
    const contactLines = pdf.splitTextToSize(parsed.contactLine, contentWidth);
    pdf.text(contactLines, pageWidth / 2, y, { align: "center" });
    y += contactLines.length * 4 + 4;
  }
  
  // === DIVIDER ===
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  // Helper for section headers
  const addSectionHeader = (title) => {
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...primaryColor);
    pdf.text(title.toUpperCase(), margin, y);
    y += 1;
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 1, margin + pdf.getTextWidth(title.toUpperCase()), y + 1);
    y += 6;
  };
  
  // === SUMMARY ===
  if (parsed.summaryText) {
    addSectionHeader("Professional Summary");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textColor);
    const summaryLines = pdf.splitTextToSize(parsed.summaryText, contentWidth);
    pdf.text(summaryLines, margin, y);
    y += summaryLines.length * 4.5 + 5;
  }
  
  // === SKILLS ===
  if (parsed.skills.length > 0) {
    addSectionHeader("Skills & Expertise");
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textColor);
    const skillsText = parsed.skills.join("  •  ");
    const skillLines = pdf.splitTextToSize(skillsText, contentWidth);
    pdf.text(skillLines, margin, y);
    y += skillLines.length * 4 + 5;
  }
  
  // === EXPERIENCE ===
  if (parsed.experience.length > 0) {
    addSectionHeader("Professional Experience");
    
    for (const job of parsed.experience) {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }
      
      // Job title
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      let titleText = job.title;
      if (job.company) titleText += ` | ${job.company}`;
      pdf.text(titleText, margin, y);
      y += 5;
      
      // Dates
      if (job.dates) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(...lightGray);
        pdf.text(job.dates, margin, y);
        y += 4;
      }
      
      // Bullets
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textColor);
      
      for (const bullet of job.bullets) {
        if (y > pageHeight - 15) {
          pdf.addPage();
          y = margin;
        }
        const bulletLines = pdf.splitTextToSize(bullet, contentWidth - 5);
        pdf.text("•", margin, y);
        pdf.text(bulletLines, margin + 4, y);
        y += bulletLines.length * 4 + 2;
      }
      y += 3;
    }
  }
  
  // === EDUCATION ===
  if (parsed.education.length > 0) {
    addSectionHeader("Education");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textColor);
    for (const edu of parsed.education) {
      pdf.text("• " + edu, margin, y);
      y += 5;
    }
    y += 3;
  }
  
  // === CERTIFICATIONS ===
  if (parsed.certifications.length > 0) {
    addSectionHeader("Certifications");
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textColor);
    for (const cert of parsed.certifications) {
      const certLines = pdf.splitTextToSize("• " + cert, contentWidth);
      pdf.text(certLines, margin, y);
      y += certLines.length * 4 + 1;
    }
    y += 3;
  }
  
  // === ACHIEVEMENTS ===
  if (parsed.achievements.length > 0) {
    addSectionHeader("Key Achievements");
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textColor);
    for (const ach of parsed.achievements) {
      if (y > pageHeight - 15) {
        pdf.addPage();
        y = margin;
      }
      const achLines = pdf.splitTextToSize("• " + ach, contentWidth);
      pdf.text(achLines, margin, y);
      y += achLines.length * 4 + 1;
    }
  }
  
  return pdf;
};

// ============================================
// PREVIEW TEMPLATES (unchanged for UI)
// ============================================
const HarvardTemplate = ({ parsed, profilePhoto }) => (
  <div className="bg-white p-8 font-serif min-h-[700px]" style={{ fontFamily: 'Georgia, serif' }}>
    <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
      {profilePhoto && <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-gray-300" />}
      <h1 className="text-3xl font-bold text-slate-900 tracking-wide">{parsed?.name || 'YOUR NAME'}</h1>
      {parsed?.contactLine && <p className="text-sm text-slate-600 mt-2">{parsed.contactLine}</p>}
    </div>
    {parsed?.summaryText && (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1 mb-3">Summary</h2>
        <p className="text-slate-700 leading-relaxed text-sm">{parsed.summaryText}</p>
      </div>
    )}
    {parsed?.experience?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1 mb-3">Experience</h2>
        {parsed.experience.slice(0, 3).map((exp, i) => (
          <div key={i} className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">{exp.title}</h3>
            {exp.company && <p className="text-slate-600 text-xs italic">{exp.company}</p>}
            {exp.dates && <p className="text-slate-500 text-xs">{exp.dates}</p>}
            <ul className="mt-1 space-y-1">
              {exp.bullets?.slice(0, 3).map((b, j) => <li key={j} className="text-slate-700 text-xs">• {b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ModernTemplate = ({ parsed, profilePhoto }) => (
  <div className="bg-white min-h-[700px] flex">
    <div className="w-1/3 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6">
      {profilePhoto ? <img src={profilePhoto} alt="" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/20" /> : <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-slate-700 flex items-center justify-center text-2xl font-bold">{parsed?.name?.charAt(0) || 'U'}</div>}
      <h1 className="text-lg font-bold text-center mb-4">{parsed?.name || 'YOUR NAME'}</h1>
      {parsed?.contactLine && <p className="text-xs text-slate-300 text-center mb-6 break-words">{parsed.contactLine}</p>}
      {parsed?.skills?.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Skills</h3>
          <div className="flex flex-wrap gap-1">{parsed.skills.slice(0, 10).map((s, i) => <span key={i} className="px-2 py-0.5 bg-slate-700 rounded text-xs">{s}</span>)}</div>
        </div>
      )}
    </div>
    <div className="w-2/3 p-6">
      {parsed?.summaryText && <div className="mb-4"><h2 className="text-sm font-bold text-[#1F4E79] uppercase mb-2">Summary</h2><p className="text-slate-600 text-sm">{parsed.summaryText}</p></div>}
      {parsed?.experience?.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#1F4E79] uppercase mb-2">Experience</h2>
          {parsed.experience.slice(0, 2).map((exp, i) => (
            <div key={i} className="mb-3 pl-3 border-l-2 border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">{exp.title}</h3>
              <p className="text-[#1F4E79] text-xs">{exp.company} {exp.dates && `| ${exp.dates}`}</p>
              <ul className="mt-1">{exp.bullets?.slice(0, 2).map((b, j) => <li key={j} className="text-slate-600 text-xs">• {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const ImpactTemplate = ({ parsed, profilePhoto }) => (
  <div className="bg-white p-6 min-h-[700px]">
    <div className="flex items-center gap-4 mb-4 pb-4 border-b-4 border-[#1F4E79]">
      {profilePhoto && <img src={profilePhoto} alt="" className="w-20 h-20 rounded-lg object-cover shadow" />}
      <div><h1 className="text-2xl font-black text-slate-900">{parsed?.name || 'YOUR NAME'}</h1>{parsed?.contactLine && <p className="text-xs text-slate-600 mt-1">{parsed.contactLine}</p>}</div>
    </div>
    {parsed?.summaryText && <div className="mb-4 border-l-4 border-[#1F4E79] pl-4 bg-slate-50 py-2"><p className="text-slate-700 text-sm">{parsed.summaryText}</p></div>}
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {parsed?.experience?.slice(0, 2).map((exp, i) => (
          <div key={i} className="mb-3"><h3 className="font-bold text-slate-900 text-sm">{exp.title} | {exp.company}</h3><p className="text-xs text-slate-500">{exp.dates}</p><ul className="mt-1">{exp.bullets?.slice(0, 2).map((b, j) => <li key={j} className="text-slate-700 text-xs">→ {b}</li>)}</ul></div>
        ))}
      </div>
      <div className="bg-slate-50 p-3 rounded">{parsed?.skills?.length > 0 && <><h3 className="text-xs font-bold text-[#1F4E79] uppercase mb-2">Skills</h3>{parsed.skills.slice(0, 8).map((s, i) => <p key={i} className="text-xs text-slate-700">• {s}</p>)}</>}</div>
    </div>
  </div>
);

const MinimalTemplate = ({ parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[700px]">
    <div className="flex items-center gap-4 mb-4">
      {profilePhoto && <img src={profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover" />}
      <div><h1 className="text-xl font-bold text-slate-900">{parsed?.name || 'YOUR NAME'}</h1>{parsed?.contactLine && <p className="text-xs text-slate-500">{parsed.contactLine}</p>}</div>
    </div>
    <hr className="mb-4" />
    {parsed?.summaryText && <div className="mb-4"><h2 className="text-xs font-bold text-slate-700 uppercase mb-1">Summary</h2><p className="text-slate-600 text-sm">{parsed.summaryText}</p></div>}
    {parsed?.experience?.slice(0, 2).map((exp, i) => <div key={i} className="mb-3"><h3 className="font-semibold text-slate-900 text-sm">{exp.title} <span className="font-normal text-slate-500">| {exp.company}</span></h3>{exp.dates && <p className="text-xs text-slate-400">{exp.dates}</p>}<ul className="mt-1">{exp.bullets?.slice(0, 2).map((b, j) => <li key={j} className="text-slate-600 text-xs">• {b}</li>)}</ul></div>)}
    {parsed?.skills?.length > 0 && <div><h2 className="text-xs font-bold text-slate-700 uppercase mb-1">Skills</h2><p className="text-slate-600 text-xs">{parsed.skills.slice(0, 15).join(', ')}</p></div>}
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const PreviewExport = ({ data, updateData, onBack, goToStep }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resume");
  const [editMode, setEditMode] = useState(false);
  const [editedResume, setEditedResume] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [parsed, setParsed] = useState(null);

  useEffect(() => {
    setEditedResume(data.optimizedResume || "");
    setEditedCoverLetter(data.coverLetter || "");
  }, [data.optimizedResume, data.coverLetter]);

  useEffect(() => {
    const result = parseResumeIntoSections(editedResume);
    setParsed(result);
  }, [editedResume]);

  const handleExportDOCX = async () => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to Terms first.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const doc = await createProfessionalDOCX(parsed, data.profilePhotoPreview, data.selectedTemplate);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${data.selectedTemplate || 'resume'}_${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Success!", description: "DOCX downloaded successfully." });
    } catch (err) {
      console.error('DOCX export error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  const handleExportPDF = async () => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to Terms first.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const pdf = await createProfessionalPDF(parsed, data.profilePhotoPreview);
      pdf.save(`${data.selectedTemplate || 'resume'}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success!", description: "PDF downloaded successfully." });
    } catch (err) {
      console.error('PDF export error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  const copyToClipboard = () => {
    const cleanedText = editedResume.split('\n').map(l => processLine(l).text).filter(l => l).join('\n');
    navigator.clipboard.writeText(cleanedText);
    toast({ title: "Copied!", description: "Clean text copied." });
  };

  const renderTemplate = () => {
    const props = { parsed, profilePhoto: data.profilePhotoPreview };
    switch (data.selectedTemplate) {
      case 'modern': return <ModernTemplate {...props} />;
      case 'impact': return <ImpactTemplate {...props} />;
      case 'minimal': return <MinimalTemplate {...props} />;
      default: return <HarvardTemplate {...props} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#1F4E79]" />
              Preview - {(data.selectedTemplate || 'harvard').charAt(0).toUpperCase() + (data.selectedTemplate || 'harvard').slice(1)}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-4 h-4 mr-1" />Copy</Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}><Edit3 className="w-4 h-4 mr-1" />{editMode ? "Done" : "Edit"}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
            </TabsList>
            <TabsContent value="resume">
              {editMode ? (
                <textarea value={editedResume} onChange={(e) => { setEditedResume(e.target.value); updateData({ optimizedResume: e.target.value }); }} className="w-full min-h-[500px] p-4 font-mono text-sm border rounded" />
              ) : (
                <div className="border rounded-lg overflow-hidden shadow-lg">{renderTemplate()}</div>
              )}
            </TabsContent>
            <TabsContent value="coverLetter">
              <div className="bg-white border rounded-lg p-8 min-h-[400px]" style={{ fontFamily: 'Georgia, serif' }}>
                <pre className="whitespace-pre-wrap text-sm">{cleanAllText(editedCoverLetter) || "No cover letter generated."}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {data.matchScore && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${data.matchScore >= 70 ? "bg-green-500" : data.matchScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}>{data.matchScore}%</div>
            <div><p className="font-medium text-slate-700">ATS Match Score</p><p className="text-sm text-slate-500">{data.matchScore >= 70 ? "Excellent!" : "Add more keywords"}</p></div>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>Improve</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={data.agreedToTerms} onCheckedChange={(c) => updateData({ agreedToTerms: c })} />
            <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
              I have reviewed my resume and agree to the <Dialog><DialogTrigger className="text-[#1F4E79] underline">Terms of Use</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Terms</DialogTitle></DialogHeader><p className="text-sm">Please verify all information.</p></DialogContent></Dialog>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-medium text-slate-700 mb-4 text-center">Download Your Resume</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleExportPDF} disabled={!data.agreedToTerms || isExporting} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Download PDF
          </Button>
          <Button variant="outline" onClick={handleExportDOCX} disabled={!data.agreedToTerms || isExporting}>
            <FileText className="w-4 h-4 mr-2" />Download DOCX
          </Button>
          <Button variant="outline" onClick={copyToClipboard} disabled={!data.agreedToTerms}>
            <FileDown className="w-4 h-4 mr-2" />Copy Text
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Before submitting:</p>
            <ul className="mt-1 list-disc list-inside text-amber-600">
              <li>Replace [X%], [N], [$Y] placeholders with your real numbers</li>
              <li>Verify all dates and company names are correct</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="ghost" onClick={() => goToStep(1)} className="text-slate-500">New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
