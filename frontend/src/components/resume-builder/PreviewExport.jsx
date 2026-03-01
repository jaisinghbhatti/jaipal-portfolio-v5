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
  VerticalAlign, ShadingType, ImageRun, convertInchesToTwip
} from "docx";
import { saveAs } from "file-saver";

// ============================================
// TEXT CLEANUP UTILITIES
// ============================================
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*\n]+)\*/g, '$1')     // Remove *italic*
    .replace(/(\w)\*+\s/g, '$1 ')        // Remove trailing asterisks
    .replace(/^\*\s+/gm, '')             // Remove bullet asterisks at line start
    .replace(/^#{1,6}\s*/gm, '')         // Remove markdown headers
    .replace(/\*\*Attention:\*\*\s*/gi, '')
    .replace(/\*\*Interest:\*\*\s*/gi, '')
    .replace(/\*\*Desire:\*\*\s*/gi, '')
    .replace(/\*\*Action:\*\*\s*/gi, '')
    .replace(/Attention:\s*/gi, '')
    .replace(/Interest:\s*/gi, '')
    .replace(/Desire:\s*/gi, '')
    .replace(/Action:\s*/gi, '')
    .trim();
};

// ============================================
// RESUME PARSER - Extract structured data
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
  
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
  let currentSection = 'header';
  let currentJob = null;
  let summaryLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanedLine = cleanText(line);
    const upperLine = cleanedLine.toUpperCase();
    
    // Detect section headers
    if (upperLine === 'SUMMARY' || upperLine === 'PROFESSIONAL SUMMARY' || upperLine === 'PROFILE') {
      currentSection = 'summary';
      continue;
    }
    if (upperLine === 'EXPERIENCE' || upperLine === 'PROFESSIONAL EXPERIENCE' || upperLine === 'WORK EXPERIENCE' || upperLine === 'EMPLOYMENT HISTORY') {
      if (currentJob) { result.experience.push(currentJob); currentJob = null; }
      currentSection = 'experience';
      continue;
    }
    if (upperLine === 'EDUCATION' || upperLine === 'ACADEMIC BACKGROUND') {
      if (currentJob) { result.experience.push(currentJob); currentJob = null; }
      currentSection = 'education';
      continue;
    }
    if (upperLine === 'SKILLS' || upperLine === 'CORE SKILLS' || upperLine === 'KEY SKILLS' || upperLine.includes('SKILLS')) {
      currentSection = 'skills';
      continue;
    }
    if (upperLine === 'CERTIFICATIONS' || upperLine === 'CERTIFICATES') {
      currentSection = 'certifications';
      continue;
    }
    
    // Parse content by section
    switch (currentSection) {
      case 'header':
        if (!result.name && cleanedLine.length < 50 && !cleanedLine.includes('@') && !cleanedLine.includes('|') && !/\d{5,}/.test(cleanedLine)) {
          result.name = cleanedLine;
        } else if (cleanedLine.includes('@') || cleanedLine.includes('|') || cleanedLine.includes('Phone') || /\d{10}/.test(cleanedLine) || cleanedLine.includes('LinkedIn')) {
          result.contact = cleanedLine;
        }
        break;
        
      case 'summary':
        if (cleanedLine.length > 10) {
          summaryLines.push(cleanedLine);
        }
        break;
        
      case 'experience':
        // Check if this is a job title line (contains ** or has company after |)
        const isJobTitle = line.includes('**') || (cleanedLine.includes('|') && !cleanedLine.startsWith('*'));
        const isBullet = line.trim().startsWith('*') || line.trim().startsWith('•') || line.trim().startsWith('-');
        const isDateLine = /^\[?[A-Za-z]+,?\s*\d{4}\]?\s*[–-]/.test(cleanedLine) || /^(January|February|March|April|May|June|July|August|September|October|November|December)/i.test(cleanedLine);
        
        if (isJobTitle && !isBullet) {
          // Save previous job
          if (currentJob && currentJob.title) {
            result.experience.push(currentJob);
          }
          // Parse: "**Job Title** | Company | Location" or "Job Title | Company"
          const parts = cleanedLine.split('|').map(p => cleanText(p));
          currentJob = {
            title: parts[0] || '',
            company: parts[1] || '',
            location: parts[2] || '',
            dates: '',
            bullets: []
          };
        } else if (isDateLine && currentJob) {
          currentJob.dates = cleanedLine;
        } else if (isBullet && currentJob) {
          const bulletText = cleanText(line.replace(/^[\s]*[\*•\-]\s*/, ''));
          if (bulletText.length > 10) {
            currentJob.bullets.push(bulletText);
          }
        } else if (currentJob && cleanedLine.length > 20 && !isJobTitle) {
          // Could be a continuation or standalone text - add as bullet
          currentJob.bullets.push(cleanedLine);
        }
        break;
        
      case 'education':
        if (cleanedLine.length > 5) {
          result.education.push(cleanedLine);
        }
        break;
        
      case 'skills':
        // Parse skills - they might be in format "**Category:** skill1, skill2" or just comma-separated
        const skillLine = cleanedLine.replace(/\*\*[^*]+\*\*:?\s*/g, '');
        const skills = skillLine.split(/[,•|]/).map(s => cleanText(s)).filter(s => s.length > 2 && s.length < 50);
        result.skills.push(...skills);
        break;
        
      case 'certifications':
        if (cleanedLine.length > 5) {
          result.certifications.push(cleanedLine);
        }
        break;
    }
  }
  
  // Don't forget the last job
  if (currentJob && currentJob.title) {
    result.experience.push(currentJob);
  }
  
  // Combine summary
  result.summary = summaryLines.join(' ');
  
  // Dedupe skills
  result.skills = [...new Set(result.skills)].slice(0, 25);
  
  return result;
};

// ============================================
// IMAGE TO UINT8ARRAY
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
// MODERN TEMPLATE DOCX - Two Column with Blue Sidebar
// ============================================
const createModernDOCX = async (parsed, photoSrc) => {
  const sidebarColor = "1F4E79";  // Dark blue
  const sidebarTextColor = "FFFFFF";
  const accentColor = "1F4E79";
  
  // Get photo
  let photoData = null;
  if (photoSrc) {
    photoData = await imageToUint8Array(photoSrc);
  }
  
  // === LEFT SIDEBAR CONTENT ===
  const sidebarCells = [];
  
  // Photo
  if (photoData) {
    sidebarCells.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: photoData,
            transformation: { width: 90, height: 90 },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }
  
  // Name in sidebar
  sidebarCells.push(
    new Paragraph({
      children: [
        new TextRun({
          text: parsed.name || "YOUR NAME",
          bold: true,
          size: 28,
          color: sidebarTextColor,
          font: "Calibri",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );
  
  // Contact Section
  sidebarCells.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "CONTACT",
          bold: true,
          size: 20,
          color: sidebarTextColor,
          font: "Calibri",
        }),
      ],
      spacing: { before: 200, after: 100 },
      border: { bottom: { color: "FFFFFF", size: 6, style: BorderStyle.SINGLE } },
    })
  );
  
  if (parsed.contact) {
    const contactParts = parsed.contact.split('|').map(c => cleanText(c));
    contactParts.forEach(part => {
      if (part.trim()) {
        sidebarCells.push(
          new Paragraph({
            children: [
              new TextRun({
                text: part.trim(),
                size: 18,
                color: sidebarTextColor,
                font: "Calibri",
              }),
            ],
            spacing: { after: 60 },
          })
        );
      }
    });
  }
  
  // Skills Section in Sidebar
  if (parsed.skills.length > 0) {
    sidebarCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "SKILLS",
            bold: true,
            size: 20,
            color: sidebarTextColor,
            font: "Calibri",
          }),
        ],
        spacing: { before: 300, after: 100 },
        border: { bottom: { color: "FFFFFF", size: 6, style: BorderStyle.SINGLE } },
      })
    );
    
    parsed.skills.slice(0, 15).forEach(skill => {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "• " + skill,
              size: 18,
              color: sidebarTextColor,
              font: "Calibri",
            }),
          ],
          spacing: { after: 40 },
        })
      );
    });
  }
  
  // Education in Sidebar
  if (parsed.education.length > 0) {
    sidebarCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "EDUCATION",
            bold: true,
            size: 20,
            color: sidebarTextColor,
            font: "Calibri",
          }),
        ],
        spacing: { before: 300, after: 100 },
        border: { bottom: { color: "FFFFFF", size: 6, style: BorderStyle.SINGLE } },
      })
    );
    
    parsed.education.forEach(edu => {
      sidebarCells.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu,
              size: 18,
              color: sidebarTextColor,
              font: "Calibri",
            }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }
  
  // === RIGHT MAIN CONTENT ===
  const mainCells = [];
  
  // Summary Section
  if (parsed.summary) {
    mainCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL SUMMARY",
            bold: true,
            size: 24,
            color: accentColor,
            font: "Calibri",
          }),
        ],
        spacing: { after: 100 },
        border: { bottom: { color: accentColor, size: 6, style: BorderStyle.SINGLE } },
      })
    );
    
    mainCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: parsed.summary,
            size: 21,
            font: "Calibri",
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }
  
  // Experience Section
  if (parsed.experience.length > 0) {
    mainCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "PROFESSIONAL EXPERIENCE",
            bold: true,
            size: 24,
            color: accentColor,
            font: "Calibri",
          }),
        ],
        spacing: { before: 100, after: 100 },
        border: { bottom: { color: accentColor, size: 6, style: BorderStyle.SINGLE } },
      })
    );
    
    parsed.experience.forEach((job, idx) => {
      // Job Title
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.title,
              bold: true,
              size: 23,
              font: "Calibri",
            }),
          ],
          spacing: { before: 200, after: 40 },
        })
      );
      
      // Company and Location
      if (job.company) {
        mainCells.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.company + (job.location ? " | " + job.location : ""),
                size: 21,
                color: accentColor,
                font: "Calibri",
              }),
            ],
            spacing: { after: 40 },
          })
        );
      }
      
      // Dates
      if (job.dates) {
        mainCells.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.dates,
                italics: true,
                size: 19,
                color: "666666",
                font: "Calibri",
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }
      
      // Bullets
      job.bullets.forEach(bullet => {
        mainCells.push(
          new Paragraph({
            children: [
              new TextRun({
                text: bullet,
                size: 20,
                font: "Calibri",
              }),
            ],
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      });
    });
  }
  
  // Certifications (if any, in main area)
  if (parsed.certifications.length > 0) {
    mainCells.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CERTIFICATIONS",
            bold: true,
            size: 24,
            color: accentColor,
            font: "Calibri",
          }),
        ],
        spacing: { before: 200, after: 100 },
        border: { bottom: { color: accentColor, size: 6, style: BorderStyle.SINGLE } },
      })
    );
    
    parsed.certifications.forEach(cert => {
      mainCells.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "• " + cert,
              size: 20,
              font: "Calibri",
            }),
          ],
          spacing: { after: 60 },
        })
      );
    });
  }
  
  // Create two-column table
  const table = new Table({
    rows: [
      new TableRow({
        children: [
          // Left sidebar cell (30%)
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: sidebarColor, type: ShadingType.CLEAR },
            children: sidebarCells,
            margins: {
              top: convertInchesToTwip(0.3),
              bottom: convertInchesToTwip(0.3),
              left: convertInchesToTwip(0.2),
              right: convertInchesToTwip(0.2),
            },
          }),
          // Right main content cell (70%)
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: mainCells,
            margins: {
              top: convertInchesToTwip(0.3),
              bottom: convertInchesToTwip(0.3),
              left: convertInchesToTwip(0.3),
              right: convertInchesToTwip(0.2),
            },
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
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
      },
      children: [table],
    }],
  });
  
  return doc;
};

// ============================================
// MODERN TEMPLATE PDF
// ============================================
const createModernPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const sidebarWidth = 65;
  const mainStartX = sidebarWidth + 5;
  const mainWidth = pageWidth - mainStartX - 10;
  
  // Draw blue sidebar
  pdf.setFillColor(31, 78, 121);
  pdf.rect(0, 0, sidebarWidth, pageHeight, 'F');
  
  let sidebarY = 15;
  let mainY = 15;
  
  // === SIDEBAR ===
  // Photo
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
      canvas.getContext('2d').drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(imgData, 'JPEG', (sidebarWidth - 25) / 2, sidebarY, 25, 25);
      sidebarY += 30;
    } catch (e) {
      console.log('Photo error:', e);
    }
  }
  
  // Name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  const nameLines = pdf.splitTextToSize(parsed.name || "YOUR NAME", sidebarWidth - 10);
  pdf.text(nameLines, sidebarWidth / 2, sidebarY, { align: "center" });
  sidebarY += nameLines.length * 6 + 10;
  
  // Contact
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("CONTACT", 5, sidebarY);
  sidebarY += 1;
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(255, 255, 255);
  pdf.line(5, sidebarY, sidebarWidth - 5, sidebarY);
  sidebarY += 5;
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  if (parsed.contact) {
    const contactParts = parsed.contact.split('|').map(c => cleanText(c).trim());
    contactParts.forEach(part => {
      if (part) {
        const lines = pdf.splitTextToSize(part, sidebarWidth - 10);
        pdf.text(lines, 5, sidebarY);
        sidebarY += lines.length * 3.5 + 2;
      }
    });
  }
  sidebarY += 5;
  
  // Skills
  if (parsed.skills.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("SKILLS", 5, sidebarY);
    sidebarY += 1;
    pdf.line(5, sidebarY, sidebarWidth - 5, sidebarY);
    sidebarY += 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    parsed.skills.slice(0, 12).forEach(skill => {
      const lines = pdf.splitTextToSize("• " + skill, sidebarWidth - 10);
      pdf.text(lines, 5, sidebarY);
      sidebarY += lines.length * 3.5 + 1;
    });
    sidebarY += 5;
  }
  
  // Education
  if (parsed.education.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("EDUCATION", 5, sidebarY);
    sidebarY += 1;
    pdf.line(5, sidebarY, sidebarWidth - 5, sidebarY);
    sidebarY += 5;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    parsed.education.forEach(edu => {
      const lines = pdf.splitTextToSize(edu, sidebarWidth - 10);
      pdf.text(lines, 5, sidebarY);
      sidebarY += lines.length * 3.5 + 2;
    });
  }
  
  // === MAIN CONTENT ===
  pdf.setTextColor(31, 78, 121);
  
  // Summary
  if (parsed.summary) {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROFESSIONAL SUMMARY", mainStartX, mainY);
    mainY += 1;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(31, 78, 121);
    pdf.line(mainStartX, mainY, mainStartX + 60, mainY);
    mainY += 5;
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const summaryLines = pdf.splitTextToSize(parsed.summary, mainWidth);
    pdf.text(summaryLines, mainStartX, mainY);
    mainY += summaryLines.length * 4 + 8;
  }
  
  // Experience
  if (parsed.experience.length > 0) {
    pdf.setTextColor(31, 78, 121);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("PROFESSIONAL EXPERIENCE", mainStartX, mainY);
    mainY += 1;
    pdf.line(mainStartX, mainY, mainStartX + 60, mainY);
    mainY += 6;
    
    parsed.experience.forEach(job => {
      if (mainY > pageHeight - 30) {
        pdf.addPage();
        // Redraw sidebar on new page
        pdf.setFillColor(31, 78, 121);
        pdf.rect(0, 0, sidebarWidth, pageHeight, 'F');
        mainY = 15;
      }
      
      // Job title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(job.title, mainStartX, mainY);
      mainY += 5;
      
      // Company
      if (job.company) {
        pdf.setTextColor(31, 78, 121);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(job.company + (job.location ? " | " + job.location : ""), mainStartX, mainY);
        mainY += 4;
      }
      
      // Dates
      if (job.dates) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.text(job.dates, mainStartX, mainY);
        mainY += 5;
      }
      
      // Bullets
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      job.bullets.forEach(bullet => {
        if (mainY > pageHeight - 15) {
          pdf.addPage();
          pdf.setFillColor(31, 78, 121);
          pdf.rect(0, 0, sidebarWidth, pageHeight, 'F');
          mainY = 15;
        }
        const bulletLines = pdf.splitTextToSize(bullet, mainWidth - 5);
        pdf.text("•", mainStartX, mainY);
        pdf.text(bulletLines, mainStartX + 4, mainY);
        mainY += bulletLines.length * 4 + 2;
      });
      mainY += 5;
    });
  }
  
  return pdf;
};

// ============================================
// PREVIEW COMPONENT - Modern Template
// ============================================
const ModernPreview = ({ parsed, profilePhoto }) => {
  return (
    <div className="flex min-h-[700px] bg-white overflow-hidden rounded-lg shadow-lg">
      {/* Left Sidebar */}
      <div className="w-[30%] bg-[#1F4E79] text-white p-6">
        {profilePhoto && (
          <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/30" />
        )}
        <h1 className="text-xl font-bold text-center mb-6">{parsed?.name || "YOUR NAME"}</h1>
        
        {/* Contact */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold mb-2 border-b border-white/50 pb-1">Contact</h3>
          {parsed?.contact?.split('|').map((c, i) => (
            <p key={i} className="text-xs mb-1 break-words">{cleanText(c)}</p>
          ))}
        </div>
        
        {/* Skills */}
        {parsed?.skills?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider font-bold mb-2 border-b border-white/50 pb-1">Skills</h3>
            <div className="space-y-1">
              {parsed.skills.slice(0, 12).map((skill, i) => (
                <p key={i} className="text-xs">• {skill}</p>
              ))}
            </div>
          </div>
        )}
        
        {/* Education */}
        {parsed?.education?.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold mb-2 border-b border-white/50 pb-1">Education</h3>
            {parsed.education.map((edu, i) => (
              <p key={i} className="text-xs mb-2">{edu}</p>
            ))}
          </div>
        )}
      </div>
      
      {/* Right Main Content */}
      <div className="w-[70%] p-6">
        {/* Summary */}
        {parsed?.summary && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-[#1F4E79] uppercase tracking-wider mb-2 border-b-2 border-[#1F4E79] pb-1">Professional Summary</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{parsed.summary}</p>
          </div>
        )}
        
        {/* Experience */}
        {parsed?.experience?.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-[#1F4E79] uppercase tracking-wider mb-3 border-b-2 border-[#1F4E79] pb-1">Professional Experience</h2>
            {parsed.experience.map((job, i) => (
              <div key={i} className="mb-4">
                <h3 className="font-bold text-gray-900">{job.title}</h3>
                {job.company && <p className="text-[#1F4E79] text-sm">{job.company} {job.location && `| ${job.location}`}</p>}
                {job.dates && <p className="text-gray-500 text-xs italic mb-2">{job.dates}</p>}
                <ul className="space-y-1">
                  {job.bullets.slice(0, 4).map((bullet, j) => (
                    <li key={j} className="text-gray-700 text-xs flex gap-2">
                      <span className="text-[#1F4E79]">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
    console.log("Parsed resume:", result);
    setParsed(result);
  }, [editedResume]);

  const handleExportDOCX = async () => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to Terms first.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const doc = await createModernDOCX(parsed, data.profilePhotoPreview);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `modern_resume_${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Success!", description: "Modern DOCX with sidebar downloaded!" });
    } catch (err) {
      console.error('DOCX error:', err);
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
      const pdf = await createModernPDF(parsed, data.profilePhotoPreview);
      pdf.save(`modern_resume_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success!", description: "Modern PDF with sidebar downloaded!" });
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedResume.split('\n').map(l => cleanText(l)).join('\n'));
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#1F4E79]" />
              Modern Template Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-1" />Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                <Edit3 className="w-4 h-4 mr-1" />{editMode ? "Done" : "Edit Raw"}
              </Button>
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
                <div className="border-2 border-amber-300 rounded-lg p-2 bg-amber-50">
                  <p className="text-xs text-amber-700 mb-2">Edit raw AI output. Sections: SUMMARY, EXPERIENCE, EDUCATION, SKILLS</p>
                  <textarea
                    value={editedResume}
                    onChange={(e) => {
                      setEditedResume(e.target.value);
                      updateData({ optimizedResume: e.target.value });
                    }}
                    className="w-full min-h-[600px] p-4 font-mono text-xs border rounded bg-white"
                  />
                </div>
              ) : (
                <ModernPreview parsed={parsed} profilePhoto={data.profilePhotoPreview} />
              )}
            </TabsContent>
            
            <TabsContent value="coverLetter">
              <div className="bg-white border rounded-lg p-8 min-h-[400px]" style={{ fontFamily: 'Georgia, serif' }}>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {cleanText(editedCoverLetter) || "No cover letter generated."}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {data.matchScore && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              data.matchScore >= 70 ? "bg-green-500" : data.matchScore >= 40 ? "bg-amber-500" : "bg-red-500"
            }`}>
              {data.matchScore}%
            </div>
            <div>
              <p className="font-medium text-slate-700">ATS Match Score</p>
              <p className="text-sm text-slate-500">{data.matchScore >= 70 ? "Excellent!" : "Add more keywords"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>Improve</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={data.agreedToTerms} onCheckedChange={(c) => updateData({ agreedToTerms: c })} />
            <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
              I agree to the <Dialog><DialogTrigger className="text-[#1F4E79] underline">Terms of Use</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Terms</DialogTitle></DialogHeader><p className="text-sm">Review and verify all info before submitting.</p></DialogContent></Dialog>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-medium text-slate-700 mb-4 text-center">Download Modern Resume (Blue Sidebar)</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleExportPDF} disabled={!data.agreedToTerms || isExporting} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleExportDOCX} disabled={!data.agreedToTerms || isExporting}>
            <FileText className="w-4 h-4 mr-2" />
            Download DOCX
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Before submitting:</p>
            <ul className="mt-1 list-disc list-inside text-amber-600">
              <li>Replace [X%], [N], [$Y] with your actual numbers</li>
              <li>Verify all dates and company names</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button variant="ghost" onClick={() => goToStep(1)} className="text-slate-500">New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
