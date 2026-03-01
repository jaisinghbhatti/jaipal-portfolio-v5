import React, { useState, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";
import { 
  Document, Packer, Paragraph, TextRun, AlignmentType, 
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, ImageRun, convertInchesToTwip
} from "docx";
import { saveAs } from "file-saver";

// ============================================
// TEXT CLEANUP
// ============================================
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
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
const isBulletPoint = (line) => {
  const trimmed = line.trim();
  // Bullet: starts with "* " or "• " or "- " (with space after)
  // NOT bullet: starts with "**" (bold markdown)
  if (trimmed.startsWith('**')) return false;
  if (trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ')) return true;
  if (trimmed.startsWith('*   ') || trimmed.startsWith('•   ')) return true; // Multiple spaces
  return false;
};

// ============================================
// RESUME PARSER
// ============================================
const parseResume = (rawText) => {
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
  
  console.log("=== PARSING RESUME ===");
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;
    
    const cleanedLine = cleanText(line);
    const upperLine = cleanedLine.toUpperCase();
    
    // Detect section headers
    if (upperLine === 'SUMMARY' || upperLine === 'PROFESSIONAL SUMMARY' || upperLine === 'PROFILE' || upperLine === 'EXECUTIVE SUMMARY') {
      console.log(">> Found SUMMARY section");
      currentSection = 'summary';
      continue;
    }
    if (upperLine === 'EXPERIENCE' || upperLine === 'PROFESSIONAL EXPERIENCE' || upperLine === 'WORK EXPERIENCE' || upperLine === 'EMPLOYMENT' || upperLine === 'CAREER HISTORY') {
      console.log(">> Found EXPERIENCE section");
      if (currentJob && currentJob.title) {
        result.experience.push(currentJob);
        currentJob = null;
      }
      currentSection = 'experience';
      continue;
    }
    if (upperLine === 'EDUCATION' || upperLine === 'ACADEMIC BACKGROUND' || upperLine === 'EDUCATIONAL BACKGROUND') {
      console.log(">> Found EDUCATION section");
      if (currentJob && currentJob.title) {
        result.experience.push(currentJob);
        currentJob = null;
      }
      currentSection = 'education';
      continue;
    }
    if (upperLine === 'SKILLS' || upperLine === 'KEY SKILLS' || upperLine === 'CORE SKILLS' || upperLine === 'TECHNICAL SKILLS' || upperLine.startsWith('SKILLS')) {
      console.log(">> Found SKILLS section");
      currentSection = 'skills';
      continue;
    }
    if (upperLine === 'CERTIFICATIONS' || upperLine === 'CERTIFICATES' || upperLine === 'LICENSES') {
      console.log(">> Found CERTIFICATIONS section");
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
          console.log(">> Found name:", result.name);
        } else if (cleanedLine.includes('@') || cleanedLine.includes('|') || 
                   cleanedLine.includes('Phone') || cleanedLine.includes('LinkedIn') ||
                   /\+?\d{10,}/.test(cleanedLine.replace(/\D/g, ''))) {
          result.contact = cleanedLine;
          console.log(">> Found contact");
        }
        break;
        
      case 'summary':
        if (cleanedLine.length > 10) {
          summaryLines.push(cleanedLine);
        }
        break;
        
      case 'experience':
        const isBullet = isBulletPoint(rawLine);
        // Job title line: contains ** for bold OR has | separator (but not a bullet)
        const hasJobFormat = rawLine.includes('**') || (cleanedLine.includes('|') && cleanedLine.length < 150);
        const isDateLine = /^\[?[A-Za-z]+,?\s*\d{4}\]?\s*[–\-—]/.test(cleanedLine) || 
                          /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i.test(cleanedLine) ||
                          /^\d{4}\s*[–\-—]/.test(cleanedLine);
        
        console.log(`EXP: "${cleanedLine.substring(0,50)}..." | bullet:${isBullet} | job:${hasJobFormat} | date:${isDateLine}`);
        
        if (hasJobFormat && !isBullet) {
          // Save previous job
          if (currentJob && currentJob.title) {
            result.experience.push(currentJob);
            console.log(">> Saved job:", currentJob.title, "with", currentJob.bullets.length, "bullets");
          }
          // Parse job title: "**Title** | Company | Location" or "Title | Company"
          const parts = cleanedLine.split('|').map(p => cleanText(p).trim());
          currentJob = {
            title: parts[0] || '',
            company: parts[1] || '',
            location: parts[2] || '',
            dates: '',
            bullets: []
          };
          console.log(">> New job:", currentJob.title, "@", currentJob.company);
        } else if (isDateLine && currentJob && !currentJob.dates) {
          currentJob.dates = cleanedLine;
          console.log(">> Job dates:", currentJob.dates);
        } else if (isBullet && currentJob) {
          const bulletText = cleanText(rawLine.replace(/^[\s]*[\*•\-]\s*/, ''));
          if (bulletText.length > 10) {
            currentJob.bullets.push(bulletText);
          }
        } else if (!isBullet && currentJob && cleanedLine.length > 20 && !hasJobFormat && !isDateLine) {
          // Could be a continuation line, treat as bullet
          currentJob.bullets.push(cleanedLine);
        }
        break;
        
      case 'education':
        if (cleanedLine.length > 5) {
          result.education.push(cleanedLine);
        }
        break;
        
      case 'skills':
        // Skills might be "**Category:** skill1, skill2" or just comma-separated
        const skillLine = cleanedLine.replace(/\*\*[^*]+\*\*:?\s*/g, '');
        const skills = skillLine.split(/[,•|]/).map(s => cleanText(s).trim()).filter(s => s.length > 2 && s.length < 60);
        result.skills.push(...skills);
        break;
        
      case 'certifications':
        if (cleanedLine.length > 5) {
          result.certifications.push(cleanedLine.replace(/^[\*•\-]\s*/, ''));
        }
        break;
    }
  }
  
  // Save last job
  if (currentJob && currentJob.title) {
    result.experience.push(currentJob);
    console.log(">> Final job saved:", currentJob.title);
  }
  
  // Combine summary
  result.summary = summaryLines.join(' ').substring(0, 1000);
  
  // Dedupe skills
  result.skills = [...new Set(result.skills)].slice(0, 25);
  
  console.log("=== PARSE COMPLETE ===");
  console.log("Name:", result.name);
  console.log("Experience jobs:", result.experience.length);
  console.log("Skills:", result.skills.length);
  
  return result;
};

// ============================================
// IMAGE UTILITIES
// ============================================
const imageToUint8Array = async (src) => {
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

// ============================================
// MODERN DOCX - Two Column Layout
// ============================================
const createModernDOCX = async (parsed, photoSrc) => {
  const BLUE = "1F4E79";
  const WHITE = "FFFFFF";
  
  let photoData = await imageToUint8Array(photoSrc);
  
  // === LEFT SIDEBAR CONTENT ===
  const leftContent = [];
  
  // Photo
  if (photoData) {
    try {
      leftContent.push(
        new Paragraph({
          children: [new ImageRun({ data: photoData, transformation: { width: 85, height: 85 } })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    } catch (e) { console.log('Photo failed:', e); }
  }
  
  // Name
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 26, color: WHITE, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 250 },
    })
  );
  
  // Contact header
  leftContent.push(
    new Paragraph({
      children: [new TextRun({ text: "CONTACT", bold: true, size: 20, color: WHITE, font: "Calibri" })],
      spacing: { before: 150, after: 80 },
      border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
    })
  );
  
  // Contact details
  if (parsed.contact) {
    parsed.contact.split('|').forEach(part => {
      const p = cleanText(part).trim();
      if (p && p.length > 2) {
        leftContent.push(
          new Paragraph({
            children: [new TextRun({ text: p, size: 17, color: WHITE, font: "Calibri" })],
            spacing: { after: 50 },
          })
        );
      }
    });
  }
  
  // Skills
  if (parsed.skills.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [new TextRun({ text: "SKILLS", bold: true, size: 20, color: WHITE, font: "Calibri" })],
        spacing: { before: 250, after: 80 },
        border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
      })
    );
    parsed.skills.slice(0, 14).forEach(skill => {
      leftContent.push(
        new Paragraph({
          children: [new TextRun({ text: "• " + skill, size: 17, color: WHITE, font: "Calibri" })],
          spacing: { after: 35 },
        })
      );
    });
  }
  
  // Education
  if (parsed.education.length > 0) {
    leftContent.push(
      new Paragraph({
        children: [new TextRun({ text: "EDUCATION", bold: true, size: 20, color: WHITE, font: "Calibri" })],
        spacing: { before: 250, after: 80 },
        border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
      })
    );
    parsed.education.forEach(edu => {
      leftContent.push(
        new Paragraph({
          children: [new TextRun({ text: edu, size: 17, color: WHITE, font: "Calibri" })],
          spacing: { after: 60 },
        })
      );
    });
  }
  
  // === RIGHT MAIN CONTENT ===
  const rightContent = [];
  
  // Summary
  if (parsed.summary) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 24, color: BLUE, font: "Calibri" })],
        spacing: { after: 80 },
        border: { bottom: { color: BLUE, size: 8, style: BorderStyle.SINGLE } },
      })
    );
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: parsed.summary, size: 20, font: "Calibri" })],
        spacing: { after: 250 },
      })
    );
  }
  
  // Experience
  if (parsed.experience.length > 0) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: "PROFESSIONAL EXPERIENCE", bold: true, size: 24, color: BLUE, font: "Calibri" })],
        spacing: { before: 100, after: 80 },
        border: { bottom: { color: BLUE, size: 8, style: BorderStyle.SINGLE } },
      })
    );
    
    parsed.experience.forEach(job => {
      // Job Title
      rightContent.push(
        new Paragraph({
          children: [new TextRun({ text: job.title, bold: true, size: 22, font: "Calibri" })],
          spacing: { before: 180, after: 30 },
        })
      );
      // Company
      if (job.company) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: job.company + (job.location ? " | " + job.location : ""), size: 20, color: BLUE, font: "Calibri" })],
            spacing: { after: 30 },
          })
        );
      }
      // Dates
      if (job.dates) {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: job.dates, italics: true, size: 18, color: "666666", font: "Calibri" })],
            spacing: { after: 60 },
          })
        );
      }
      // Bullets
      job.bullets.forEach(bullet => {
        rightContent.push(
          new Paragraph({
            children: [new TextRun({ text: bullet, size: 19, font: "Calibri" })],
            bullet: { level: 0 },
            spacing: { after: 50 },
          })
        );
      });
    });
  }
  
  // Certifications
  if (parsed.certifications.length > 0) {
    rightContent.push(
      new Paragraph({
        children: [new TextRun({ text: "CERTIFICATIONS", bold: true, size: 24, color: BLUE, font: "Calibri" })],
        spacing: { before: 200, after: 80 },
        border: { bottom: { color: BLUE, size: 8, style: BorderStyle.SINGLE } },
      })
    );
    parsed.certifications.forEach(cert => {
      rightContent.push(
        new Paragraph({
          children: [new TextRun({ text: "• " + cert, size: 19, font: "Calibri" })],
          spacing: { after: 50 },
        })
      );
    });
  }
  
  // Create table for two-column layout
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: BLUE, type: ShadingType.CLEAR },
            children: leftContent,
            margins: { top: 300, bottom: 300, left: 150, right: 150 },
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: rightContent,
            margins: { top: 300, bottom: 300, left: 250, right: 150 },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
  
  return new Document({
    sections: [{
      properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [table],
    }],
  });
};

// ============================================
// MODERN PDF
// ============================================
const createModernPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const sidebarW = 62;
  const mainX = sidebarW + 6;
  const mainW = pageWidth - mainX - 8;
  
  // Blue sidebar
  pdf.setFillColor(31, 78, 121);
  pdf.rect(0, 0, sidebarW, pageHeight, 'F');
  
  let sY = 12;
  let mY = 12;
  
  // Photo
  if (photoSrc) {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = photoSrc; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', (sidebarW - 22) / 2, sY, 22, 22);
      sY += 26;
    } catch (e) {}
  }
  
  // Sidebar text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  const nameLines = pdf.splitTextToSize(parsed.name || "YOUR NAME", sidebarW - 8);
  pdf.text(nameLines, sidebarW / 2, sY, { align: "center" });
  sY += nameLines.length * 5 + 8;
  
  // Contact
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("CONTACT", 4, sY);
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(255, 255, 255);
  pdf.line(4, sY + 1, sidebarW - 4, sY + 1);
  sY += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  if (parsed.contact) {
    parsed.contact.split('|').forEach(p => {
      const t = cleanText(p).trim();
      if (t) {
        const ls = pdf.splitTextToSize(t, sidebarW - 8);
        pdf.text(ls, 4, sY);
        sY += ls.length * 3 + 1;
      }
    });
  }
  sY += 4;
  
  // Skills
  if (parsed.skills.length > 0) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("SKILLS", 4, sY);
    pdf.line(4, sY + 1, sidebarW - 4, sY + 1);
    sY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    parsed.skills.slice(0, 12).forEach(sk => {
      const ls = pdf.splitTextToSize("• " + sk, sidebarW - 8);
      pdf.text(ls, 4, sY);
      sY += ls.length * 3 + 0.5;
    });
    sY += 4;
  }
  
  // Education
  if (parsed.education.length > 0) {
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("EDUCATION", 4, sY);
    pdf.line(4, sY + 1, sidebarW - 4, sY + 1);
    sY += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    parsed.education.forEach(ed => {
      const ls = pdf.splitTextToSize(ed, sidebarW - 8);
      pdf.text(ls, 4, sY);
      sY += ls.length * 3 + 1;
    });
  }
  
  // Main content
  pdf.setTextColor(31, 78, 121);
  
  if (parsed.summary) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROFESSIONAL SUMMARY", mainX, mY);
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(31, 78, 121);
    pdf.line(mainX, mY + 1, mainX + 55, mY + 1);
    mY += 6;
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const sumLines = pdf.splitTextToSize(parsed.summary, mainW);
    pdf.text(sumLines, mainX, mY);
    mY += sumLines.length * 4 + 6;
  }
  
  if (parsed.experience.length > 0) {
    pdf.setTextColor(31, 78, 121);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROFESSIONAL EXPERIENCE", mainX, mY);
    pdf.line(mainX, mY + 1, mainX + 55, mY + 1);
    mY += 6;
    
    parsed.experience.forEach(job => {
      if (mY > pageHeight - 25) {
        pdf.addPage();
        pdf.setFillColor(31, 78, 121);
        pdf.rect(0, 0, sidebarW, pageHeight, 'F');
        mY = 12;
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(job.title, mainX, mY);
      mY += 4;
      
      if (job.company) {
        pdf.setTextColor(31, 78, 121);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(job.company + (job.location ? " | " + job.location : ""), mainX, mY);
        mY += 4;
      }
      
      if (job.dates) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(job.dates, mainX, mY);
        mY += 4;
      }
      
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      job.bullets.forEach(b => {
        if (mY > pageHeight - 12) {
          pdf.addPage();
          pdf.setFillColor(31, 78, 121);
          pdf.rect(0, 0, sidebarW, pageHeight, 'F');
          mY = 12;
        }
        const bLines = pdf.splitTextToSize(b, mainW - 4);
        pdf.text("•", mainX, mY);
        pdf.text(bLines, mainX + 3, mY);
        mY += bLines.length * 3.5 + 1;
      });
      mY += 4;
    });
  }
  
  return pdf;
};

// ============================================
// PREVIEW
// ============================================
const ModernPreview = ({ parsed, profilePhoto }) => (
  <div className="flex min-h-[700px] bg-white overflow-hidden rounded-lg shadow-lg">
    <div className="w-[28%] bg-[#1F4E79] text-white p-5">
      {profilePhoto && <img src={profilePhoto} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-white/30" />}
      <h1 className="text-lg font-bold text-center mb-5">{parsed?.name || "YOUR NAME"}</h1>
      
      <div className="mb-5">
        <h3 className="text-xs uppercase tracking-wider font-bold mb-2 border-b border-white/50 pb-1">Contact</h3>
        {parsed?.contact?.split('|').map((c, i) => <p key={i} className="text-xs mb-1 break-words">{cleanText(c)}</p>)}
      </div>
      
      {parsed?.skills?.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs uppercase tracking-wider font-bold mb-2 border-b border-white/50 pb-1">Skills</h3>
          {parsed.skills.slice(0, 10).map((s, i) => <p key={i} className="text-xs mb-0.5">• {s}</p>)}
        </div>
      )}
      
      {parsed?.education?.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold mb-2 border-b border-white/50 pb-1">Education</h3>
          {parsed.education.map((e, i) => <p key={i} className="text-xs mb-1">{e}</p>)}
        </div>
      )}
    </div>
    
    <div className="w-[72%] p-5">
      {parsed?.summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-[#1F4E79] uppercase mb-2 border-b-2 border-[#1F4E79] pb-1">Summary</h2>
          <p className="text-gray-700 text-xs leading-relaxed">{parsed.summary}</p>
        </div>
      )}
      
      {parsed?.experience?.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#1F4E79] uppercase mb-2 border-b-2 border-[#1F4E79] pb-1">Experience</h2>
          {parsed.experience.map((job, i) => (
            <div key={i} className="mb-3">
              <h3 className="font-bold text-gray-900 text-sm">{job.title}</h3>
              {job.company && <p className="text-[#1F4E79] text-xs">{job.company}</p>}
              {job.dates && <p className="text-gray-500 text-xs italic mb-1">{job.dates}</p>}
              <ul className="space-y-0.5">
                {job.bullets.slice(0, 3).map((b, j) => <li key={j} className="text-gray-700 text-xs">• {b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
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
    const result = parseResume(editedResume);
    setParsed(result);
  }, [editedResume]);

  const handleExportDOCX = async () => {
    if (!data.agreedToTerms) {
      toast({ title: "Please agree to Terms", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const doc = await createModernDOCX(parsed, data.profilePhotoPreview);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `modern_resume_${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Downloaded!", description: "Modern DOCX with blue sidebar" });
    } catch (err) {
      console.error('DOCX error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  const handleExportPDF = async () => {
    if (!data.agreedToTerms) {
      toast({ title: "Please agree to Terms", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const pdf = await createModernPDF(parsed, data.profilePhotoPreview);
      pdf.save(`modern_resume_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Downloaded!", description: "Modern PDF with blue sidebar" });
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#1F4E79]" /> Modern Template
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
              <Edit3 className="w-4 h-4 mr-1" />{editMode ? "Preview" : "Edit"}
            </Button>
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
                <textarea
                  value={editedResume}
                  onChange={(e) => { setEditedResume(e.target.value); updateData({ optimizedResume: e.target.value }); }}
                  className="w-full min-h-[600px] p-4 font-mono text-xs border rounded"
                />
              ) : (
                <ModernPreview parsed={parsed} profilePhoto={data.profilePhotoPreview} />
              )}
            </TabsContent>
            
            <TabsContent value="coverLetter">
              <div className="bg-white border rounded-lg p-6 min-h-[300px]">
                <pre className="whitespace-pre-wrap text-sm">{cleanText(editedCoverLetter)}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {data.matchScore && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${data.matchScore >= 70 ? "bg-green-500" : "bg-amber-500"}`}>{data.matchScore}%</div>
            <span className="font-medium">ATS Match Score</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>Improve</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Checkbox id="terms" checked={data.agreedToTerms} onCheckedChange={(c) => updateData({ agreedToTerms: c })} />
            <label htmlFor="terms" className="text-sm cursor-pointer">I agree to the Terms of Use</label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-50 rounded-lg p-6 text-center">
        <h3 className="font-medium mb-4">Download Modern Resume</h3>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleExportPDF} disabled={!data.agreedToTerms || isExporting} className="bg-[#1F4E79]">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}PDF
          </Button>
          <Button variant="outline" onClick={handleExportDOCX} disabled={!data.agreedToTerms || isExporting}>
            <FileText className="w-4 h-4 mr-2" />DOCX
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Replace placeholders:</p>
            <p>[X%], [N], [$Y] → your actual numbers</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button variant="ghost" onClick={() => goToStep(1)}>New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
