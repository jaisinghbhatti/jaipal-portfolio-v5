import React from "react";
import jsPDF from "jspdf";
import {
  Document, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun
} from "docx";
import { cleanText, imageToUint8Array, loadImageForPDF } from "../resumeUtils";

const DARK = "1A1A1A";
const GRAY = "555555";

// ============================================
// PREVIEW
// ============================================
export const HarvardPreview = ({ parsed, profilePhoto }) => (
  <div className="min-h-[700px] bg-white overflow-hidden rounded-lg shadow-lg p-8" style={{ fontFamily: "'Times New Roman', Times, serif" }} data-testid="harvard-preview">
    {/* Header - centered, classic */}
    <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
      {profilePhoto && <img src={profilePhoto} alt="" className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />}
      <h1 className="text-2xl font-bold text-gray-900 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
        {parsed?.name || "YOUR NAME"}
      </h1>
      {parsed?.contact && (
        <p className="text-xs text-gray-500 mt-1">{parsed.contact}</p>
      )}
    </div>

    {parsed?.summary && (
      <div className="mb-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Professional Summary
        </h2>
        <p className="text-xs text-gray-700 leading-relaxed">{parsed.summary}</p>
      </div>
    )}

    {parsed?.experience?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Professional Experience
        </h2>
        {parsed.experience.map((job, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Georgia, serif' }}>{job.title}</h3>
              {job.dates && <span className="text-xs text-gray-500 italic">{job.dates}</span>}
            </div>
            {job.company && <p className="text-xs text-gray-600 italic">{job.company}{job.location ? `, ${job.location}` : ''}</p>}
            <ul className="mt-1 space-y-0.5">
              {job.bullets.map((b, j) => <li key={j} className="text-xs text-gray-700 pl-3 relative before:content-['•'] before:absolute before:left-0">{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}

    {parsed?.education?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Education
        </h2>
        {parsed.education.map((e, i) => <p key={i} className="text-xs text-gray-700 mb-1">{e}</p>)}
      </div>
    )}

    {parsed?.skills?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Skills
        </h2>
        <p className="text-xs text-gray-700">{parsed.skills.join(" | ")}</p>
      </div>
    )}

    {parsed?.certifications?.length > 0 && (
      <div>
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Certifications
        </h2>
        {parsed.certifications.map((c, i) => <p key={i} className="text-xs text-gray-700 mb-1">{c}</p>)}
      </div>
    )}
  </div>
);

// ============================================
// DOCX EXPORT
// ============================================
export const createHarvardDOCX = async (parsed, photoSrc) => {
  const children = [];
  let photoData = await imageToUint8Array(photoSrc);

  if (photoData) {
    try {
      children.push(new Paragraph({
        children: [new ImageRun({ data: photoData, transformation: { width: 60, height: 60 } })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }));
    } catch (e) { /* skip */ }
  }

  // Name
  children.push(new Paragraph({
    children: [new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 32, color: DARK, font: "Times New Roman" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  }));

  // Contact
  if (parsed.contact) {
    children.push(new Paragraph({
      children: [new TextRun({ text: parsed.contact, size: 18, color: GRAY, font: "Times New Roman" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));
  }

  // Divider line
  children.push(new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { color: DARK, size: 12, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text: "" })],
  }));

  const addSection = (title, content) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 22, color: DARK, font: "Times New Roman", allCaps: true })],
      spacing: { before: 200, after: 60 },
      border: { bottom: { color: "CCCCCC", size: 4, style: BorderStyle.SINGLE } },
    }));
    content();
  };

  // Summary
  if (parsed.summary) {
    addSection("PROFESSIONAL SUMMARY", () => {
      children.push(new Paragraph({
        children: [new TextRun({ text: parsed.summary, size: 20, font: "Times New Roman", color: "333333" })],
        spacing: { after: 150 },
      }));
    });
  }

  // Experience
  if (parsed.experience.length > 0) {
    addSection("PROFESSIONAL EXPERIENCE", () => {
      parsed.experience.forEach(job => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: job.title, bold: true, size: 21, font: "Times New Roman" }),
            ...(job.dates ? [new TextRun({ text: "  |  " + job.dates, italics: true, size: 18, color: GRAY, font: "Times New Roman" })] : []),
          ],
          spacing: { before: 150, after: 30 },
        }));
        if (job.company) {
          children.push(new Paragraph({
            children: [new TextRun({ text: job.company + (job.location ? ", " + job.location : ""), italics: true, size: 19, color: GRAY, font: "Times New Roman" })],
            spacing: { after: 50 },
          }));
        }
        job.bullets.forEach(bullet => {
          children.push(new Paragraph({
            children: [new TextRun({ text: bullet, size: 19, font: "Times New Roman" })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          }));
        });
      });
    });
  }

  // Education
  if (parsed.education.length > 0) {
    addSection("EDUCATION", () => {
      parsed.education.forEach(edu => {
        children.push(new Paragraph({
          children: [new TextRun({ text: edu, size: 19, font: "Times New Roman" })],
          spacing: { after: 50 },
        }));
      });
    });
  }

  // Skills
  if (parsed.skills.length > 0) {
    addSection("SKILLS", () => {
      children.push(new Paragraph({
        children: [new TextRun({ text: parsed.skills.join("  |  "), size: 19, font: "Times New Roman" })],
        spacing: { after: 100 },
      }));
    });
  }

  // Certifications
  if (parsed.certifications?.length > 0) {
    addSection("CERTIFICATIONS", () => {
      parsed.certifications.forEach(cert => {
        children.push(new Paragraph({
          children: [new TextRun({ text: cert, size: 19, font: "Times New Roman" })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }));
      });
    });
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  });
};

// ============================================
// PDF EXPORT
// ============================================
export const createHarvardPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 15;

  const checkPage = (needed = 20) => {
    if (y > pageH - needed) { pdf.addPage(); y = 15; }
  };

  // Photo
  if (photoSrc) {
    try {
      const imgData = await loadImageForPDF(photoSrc);
      if (imgData) {
        pdf.addImage(imgData, 'JPEG', (pageW - 16) / 2, y, 16, 16);
        y += 19;
      }
    } catch (e) { /* skip */ }
  }

  // Name
  pdf.setTextColor(26, 26, 26);
  pdf.setFontSize(18);
  pdf.setFont("times", "bold");
  pdf.text(parsed.name || "YOUR NAME", pageW / 2, y, { align: "center" });
  y += 6;

  // Contact
  if (parsed.contact) {
    pdf.setFontSize(8);
    pdf.setFont("times", "normal");
    pdf.setTextColor(100, 100, 100);
    const contactLines = pdf.splitTextToSize(parsed.contact, contentW);
    pdf.text(contactLines, pageW / 2, y, { align: "center" });
    y += contactLines.length * 3.5 + 2;
  }

  // Divider
  pdf.setDrawColor(26, 26, 26);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  const addSectionHeader = (title) => {
    checkPage(15);
    pdf.setTextColor(26, 26, 26);
    pdf.setFontSize(11);
    pdf.setFont("times", "bold");
    pdf.text(title, margin, y);
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 1.5, pageW - margin, y + 1.5);
    y += 6;
  };

  // Summary
  if (parsed.summary) {
    addSectionHeader("PROFESSIONAL SUMMARY");
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    const sumLines = pdf.splitTextToSize(parsed.summary, contentW);
    pdf.text(sumLines, margin, y);
    y += sumLines.length * 4 + 5;
  }

  // Experience
  if (parsed.experience.length > 0) {
    addSectionHeader("PROFESSIONAL EXPERIENCE");
    parsed.experience.forEach(job => {
      checkPage(20);
      pdf.setTextColor(26, 26, 26);
      pdf.setFontSize(10);
      pdf.setFont("times", "bold");
      const titleText = job.title + (job.dates ? "  |  " + job.dates : "");
      pdf.text(titleText, margin, y);
      y += 4;
      if (job.company) {
        pdf.setFontSize(9);
        pdf.setFont("times", "italic");
        pdf.setTextColor(80, 80, 80);
        pdf.text(job.company + (job.location ? ", " + job.location : ""), margin, y);
        y += 4;
      }
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(8.5);
      pdf.setFont("times", "normal");
      job.bullets.forEach(b => {
        checkPage(10);
        const bLines = pdf.splitTextToSize(b, contentW - 5);
        pdf.text("•", margin + 1, y);
        pdf.text(bLines, margin + 4, y);
        y += bLines.length * 3.5 + 1;
      });
      y += 3;
    });
  }

  // Education
  if (parsed.education.length > 0) {
    addSectionHeader("EDUCATION");
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    parsed.education.forEach(edu => {
      checkPage(8);
      const lines = pdf.splitTextToSize(edu, contentW);
      pdf.text(lines, margin, y);
      y += lines.length * 3.5 + 2;
    });
  }

  // Skills
  if (parsed.skills.length > 0) {
    addSectionHeader("SKILLS");
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    const skillText = parsed.skills.join("  |  ");
    const skillLines = pdf.splitTextToSize(skillText, contentW);
    pdf.text(skillLines, margin, y);
    y += skillLines.length * 3.5 + 3;
  }

  // Certifications
  if (parsed.certifications?.length > 0) {
    addSectionHeader("CERTIFICATIONS");
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    parsed.certifications.forEach(cert => {
      checkPage(8);
      pdf.text("• " + cert, margin, y);
      y += 4;
    });
  }

  return pdf;
};
