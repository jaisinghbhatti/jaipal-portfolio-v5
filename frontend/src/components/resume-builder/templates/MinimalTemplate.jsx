import React from "react";
import jsPDF from "jspdf";
import {
  Document, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun
} from "docx";
import { cleanText, imageToUint8Array, loadImageForPDF } from "../resumeUtils";

// ============================================
// PREVIEW
// ============================================
export const MinimalPreview = ({ parsed, profilePhoto }) => (
  <div className="min-h-[700px] bg-white overflow-hidden rounded-lg shadow-lg p-8" data-testid="minimal-preview">
    {/* Header - clean, left-aligned */}
    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
      {profilePhoto && <img src={profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" />}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{parsed?.name || "YOUR NAME"}</h1>
        {parsed?.contact && <p className="text-xs text-gray-500 mt-0.5">{parsed.contact}</p>}
      </div>
    </div>

    {parsed?.summary && (
      <div className="mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Summary</h2>
        <p className="text-xs text-gray-700 leading-relaxed">{parsed.summary}</p>
      </div>
    )}

    {parsed?.experience?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Experience</h2>
        {parsed.experience.map((job, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold text-gray-800 text-sm">{job.title}</h3>
              {job.dates && <span className="text-xs text-gray-400">{job.dates}</span>}
            </div>
            {job.company && <p className="text-xs text-gray-500">{job.company}{job.location ? ` — ${job.location}` : ''}</p>}
            <ul className="mt-1 space-y-0.5">
              {job.bullets.map((b, j) => <li key={j} className="text-xs text-gray-600 pl-3 relative before:content-['–'] before:absolute before:left-0 before:text-gray-400">{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}

    {parsed?.education?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</h2>
        {parsed.education.map((e, i) => <p key={i} className="text-xs text-gray-700 mb-1">{e}</p>)}
      </div>
    )}

    {parsed?.skills?.length > 0 && (
      <div className="mb-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h2>
        <p className="text-xs text-gray-600">{parsed.skills.join(", ")}</p>
      </div>
    )}

    {parsed?.certifications?.length > 0 && (
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</h2>
        {parsed.certifications.map((c, i) => <p key={i} className="text-xs text-gray-600 mb-1">{c}</p>)}
      </div>
    )}
  </div>
);

// ============================================
// DOCX EXPORT
// ============================================
export const createMinimalDOCX = async (parsed, photoSrc) => {
  const children = [];
  const GRAY = "555555";
  const DARK = "333333";
  let photoData = await imageToUint8Array(photoSrc);

  // Header
  const headerChildren = [];
  if (photoData) {
    try {
      headerChildren.push(new ImageRun({ data: photoData, transformation: { width: 45, height: 45 } }));
      headerChildren.push(new TextRun({ text: "  " }));
    } catch (e) { /* skip */ }
  }
  headerChildren.push(new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 28, color: DARK, font: "Times New Roman" }));

  children.push(new Paragraph({
    children: headerChildren,
    spacing: { after: 40 },
  }));

  if (parsed.contact) {
    children.push(new Paragraph({
      children: [new TextRun({ text: parsed.contact, size: 17, color: "888888", font: "Times New Roman" })],
      spacing: { after: 60 },
    }));
  }

  // Thin divider
  children.push(new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { color: "DDDDDD", size: 4, style: BorderStyle.SINGLE } },
    children: [new TextRun({ text: "" })],
  }));

  const addSection = (title, content) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: title, bold: false, size: 18, color: "888888", font: "Times New Roman", allCaps: true })],
      spacing: { before: 200, after: 80 },
    }));
    content();
  };

  if (parsed.summary) {
    addSection("SUMMARY", () => {
      children.push(new Paragraph({
        children: [new TextRun({ text: parsed.summary, size: 20, font: "Times New Roman", color: GRAY })],
        spacing: { after: 150 },
      }));
    });
  }

  if (parsed.experience.length > 0) {
    addSection("EXPERIENCE", () => {
      parsed.experience.forEach(job => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: job.title, bold: true, size: 21, font: "Times New Roman", color: DARK }),
            ...(job.dates ? [new TextRun({ text: "    " + job.dates, size: 17, color: "999999", font: "Times New Roman" })] : []),
          ],
          spacing: { before: 140, after: 20 },
        }));
        if (job.company) {
          children.push(new Paragraph({
            children: [new TextRun({ text: job.company + (job.location ? " — " + job.location : ""), size: 18, color: "777777", font: "Times New Roman" })],
            spacing: { after: 50 },
          }));
        }
        job.bullets.forEach(bullet => {
          children.push(new Paragraph({
            children: [new TextRun({ text: "– " + bullet, size: 19, font: "Times New Roman", color: GRAY })],
            spacing: { after: 30 },
            indent: { left: 200 },
          }));
        });
      });
    });
  }

  if (parsed.education.length > 0) {
    addSection("EDUCATION", () => {
      parsed.education.forEach(edu => {
        children.push(new Paragraph({
          children: [new TextRun({ text: edu, size: 19, font: "Times New Roman", color: GRAY })],
          spacing: { after: 50 },
        }));
      });
    });
  }

  if (parsed.skills.length > 0) {
    addSection("SKILLS", () => {
      children.push(new Paragraph({
        children: [new TextRun({ text: parsed.skills.join(", "), size: 19, font: "Times New Roman", color: GRAY })],
        spacing: { after: 100 },
      }));
    });
  }

  if (parsed.certifications?.length > 0) {
    addSection("CERTIFICATIONS", () => {
      parsed.certifications.forEach(cert => {
        children.push(new Paragraph({
          children: [new TextRun({ text: "– " + cert, size: 19, font: "Times New Roman", color: GRAY })],
          spacing: { after: 30 },
          indent: { left: 200 },
        }));
      });
    });
  }

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
      },
      children,
    }],
  });
};

// ============================================
// PDF EXPORT
// ============================================
export const createMinimalPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 18;

  const checkPage = (needed = 20) => {
    if (y > pageH - needed) { pdf.addPage(); y = 18; }
  };

  // Photo + Name
  let nameX = margin;
  if (photoSrc) {
    try {
      const imgData = await loadImageForPDF(photoSrc);
      if (imgData) {
        pdf.addImage(imgData, 'JPEG', margin, y - 3, 13, 13);
        nameX = margin + 16;
      }
    } catch (e) { /* skip */ }
  }

  pdf.setTextColor(50, 50, 50);
  pdf.setFontSize(16);
  pdf.setFont("times", "bold");
  pdf.text(parsed.name || "YOUR NAME", nameX, y + 3);
  y += 8;

  if (parsed.contact) {
    pdf.setFontSize(7.5);
    pdf.setFont("times", "normal");
    pdf.setTextColor(130, 130, 130);
    const cLines = pdf.splitTextToSize(parsed.contact, contentW);
    pdf.text(cLines, margin, y);
    y += cLines.length * 3 + 3;
  }

  // Divider
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageW - margin, y);
  y += 6;

  const addSectionHeader = (title) => {
    checkPage(12);
    pdf.setTextColor(140, 140, 140);
    pdf.setFontSize(8);
    pdf.setFont("times", "bold");
    pdf.text(title, margin, y);
    y += 5;
  };

  if (parsed.summary) {
    addSectionHeader("SUMMARY");
    pdf.setTextColor(70, 70, 70);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    const sLines = pdf.splitTextToSize(parsed.summary, contentW);
    pdf.text(sLines, margin, y);
    y += sLines.length * 4 + 5;
  }

  if (parsed.experience.length > 0) {
    addSectionHeader("EXPERIENCE");
    parsed.experience.forEach(job => {
      checkPage(18);
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(10);
      pdf.setFont("times", "bold");
      pdf.text(job.title, margin, y);
      if (job.dates) {
        pdf.setFontSize(7.5);
        pdf.setFont("times", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text(job.dates, pageW - margin, y, { align: "right" });
      }
      y += 4;
      if (job.company) {
        pdf.setFontSize(8.5);
        pdf.setFont("times", "normal");
        pdf.setTextColor(110, 110, 110);
        pdf.text(job.company + (job.location ? " — " + job.location : ""), margin, y);
        y += 4;
      }
      pdf.setTextColor(70, 70, 70);
      pdf.setFontSize(8.5);
      pdf.setFont("times", "normal");
      job.bullets.forEach(b => {
        checkPage(10);
        const bLines = pdf.splitTextToSize(b, contentW - 5);
        pdf.text("–", margin + 2, y);
        pdf.text(bLines, margin + 5, y);
        y += bLines.length * 3.5 + 1;
      });
      y += 3;
    });
  }

  if (parsed.education.length > 0) {
    addSectionHeader("EDUCATION");
    pdf.setTextColor(70, 70, 70);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    parsed.education.forEach(edu => {
      checkPage(8);
      const lines = pdf.splitTextToSize(edu, contentW);
      pdf.text(lines, margin, y);
      y += lines.length * 3.5 + 2;
    });
  }

  if (parsed.skills.length > 0) {
    addSectionHeader("SKILLS");
    pdf.setTextColor(70, 70, 70);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    const skillText = parsed.skills.join(", ");
    const sLines = pdf.splitTextToSize(skillText, contentW);
    pdf.text(sLines, margin, y);
    y += sLines.length * 3.5 + 3;
  }

  if (parsed.certifications?.length > 0) {
    addSectionHeader("CERTIFICATIONS");
    pdf.setTextColor(70, 70, 70);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    parsed.certifications.forEach(cert => {
      checkPage(8);
      pdf.text("– " + cert, margin, y);
      y += 4;
    });
  }

  return pdf;
};
