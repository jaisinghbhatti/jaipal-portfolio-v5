import React from "react";
import jsPDF from "jspdf";
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, ImageRun
} from "docx";
import { cleanText, imageToUint8Array, loadImageForPDF } from "../resumeUtils";

const BLUE = "1F4E79";
const WHITE = "FFFFFF";

// ============================================
// PREVIEW
// ============================================
export const ModernPreview = ({ parsed, profilePhoto }) => (
  <div className="flex min-h-[700px] bg-white overflow-hidden rounded-lg shadow-lg" data-testid="modern-preview">
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
          {parsed.skills.slice(0, 12).map((s, i) => <p key={i} className="text-xs mb-0.5">{s}</p>)}
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
              {job.company && <p className="text-[#1F4E79] text-xs">{job.company}{job.location ? ` | ${job.location}` : ''}</p>}
              {job.dates && <p className="text-gray-500 text-xs italic mb-1">{job.dates}</p>}
              <ul className="space-y-0.5">
                {job.bullets.map((b, j) => <li key={j} className="text-gray-700 text-xs pl-3 relative before:content-['•'] before:absolute before:left-0">{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
      {parsed?.certifications?.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-bold text-[#1F4E79] uppercase mb-2 border-b-2 border-[#1F4E79] pb-1">Certifications</h2>
          {parsed.certifications.map((c, i) => <p key={i} className="text-xs text-gray-700">{c}</p>)}
        </div>
      )}
    </div>
  </div>
);

// ============================================
// DOCX EXPORT
// ============================================
export const createModernDOCX = async (parsed, photoSrc) => {
  let photoData = await imageToUint8Array(photoSrc);

  const leftContent = [];
  if (photoData) {
    try {
      leftContent.push(new Paragraph({
        children: [new ImageRun({ data: photoData, transformation: { width: 85, height: 85 } })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    } catch (e) { /* skip photo */ }
  }

  leftContent.push(new Paragraph({
    children: [new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 26, color: WHITE, font: "Times New Roman" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 250 },
  }));

  leftContent.push(new Paragraph({
    children: [new TextRun({ text: "CONTACT", bold: true, size: 20, color: WHITE, font: "Times New Roman" })],
    spacing: { before: 150, after: 80 },
    border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
  }));

  if (parsed.contact) {
    parsed.contact.split('|').forEach(part => {
      const p = cleanText(part).trim();
      if (p && p.length > 2) {
        leftContent.push(new Paragraph({
          children: [new TextRun({ text: p, size: 17, color: WHITE, font: "Times New Roman" })],
          spacing: { after: 50 },
        }));
      }
    });
  }

  if (parsed.skills.length > 0) {
    leftContent.push(new Paragraph({
      children: [new TextRun({ text: "SKILLS", bold: true, size: 20, color: WHITE, font: "Times New Roman" })],
      spacing: { before: 250, after: 80 },
      border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
    }));
    parsed.skills.slice(0, 14).forEach(skill => {
      leftContent.push(new Paragraph({
        children: [new TextRun({ text: skill, size: 17, color: WHITE, font: "Times New Roman" })],
        bullet: { level: 0 },
        spacing: { after: 35 },
      }));
    });
  }

  if (parsed.education.length > 0) {
    leftContent.push(new Paragraph({
      children: [new TextRun({ text: "EDUCATION", bold: true, size: 20, color: WHITE, font: "Times New Roman" })],
      spacing: { before: 250, after: 80 },
      border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
    }));
    parsed.education.forEach(edu => {
      leftContent.push(new Paragraph({
        children: [new TextRun({ text: edu, size: 17, color: WHITE, font: "Times New Roman" })],
        spacing: { after: 60 },
      }));
    });
  }

  if (parsed.certifications?.length > 0) {
    leftContent.push(new Paragraph({
      children: [new TextRun({ text: "CERTIFICATIONS", bold: true, size: 20, color: WHITE, font: "Times New Roman" })],
      spacing: { before: 250, after: 80 },
      border: { bottom: { color: WHITE, size: 6, style: BorderStyle.SINGLE } },
    }));
    parsed.certifications.forEach(cert => {
      leftContent.push(new Paragraph({
        children: [new TextRun({ text: cert, size: 17, color: WHITE, font: "Times New Roman" })],
        bullet: { level: 0 },
        spacing: { after: 40 },
      }));
    });
  }

  const rightContent = [];
  if (parsed.summary) {
    rightContent.push(new Paragraph({
      children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 24, color: BLUE, font: "Times New Roman" })],
      spacing: { after: 80 },
      border: { bottom: { color: BLUE, size: 8, style: BorderStyle.SINGLE } },
    }));
    rightContent.push(new Paragraph({
      children: [new TextRun({ text: parsed.summary, size: 20, font: "Times New Roman" })],
      spacing: { after: 250 },
    }));
  }

  if (parsed.experience.length > 0) {
    rightContent.push(new Paragraph({
      children: [new TextRun({ text: "PROFESSIONAL EXPERIENCE", bold: true, size: 24, color: BLUE, font: "Times New Roman" })],
      spacing: { before: 100, after: 80 },
      border: { bottom: { color: BLUE, size: 8, style: BorderStyle.SINGLE } },
    }));
    parsed.experience.forEach(job => {
      rightContent.push(new Paragraph({
        children: [new TextRun({ text: job.title, bold: true, size: 22, font: "Times New Roman" })],
        spacing: { before: 180, after: 30 },
      }));
      if (job.company) {
        rightContent.push(new Paragraph({
          children: [new TextRun({ text: job.company + (job.location ? " | " + job.location : ""), size: 20, color: BLUE, font: "Times New Roman" })],
          spacing: { after: 30 },
        }));
      }
      if (job.dates) {
        rightContent.push(new Paragraph({
          children: [new TextRun({ text: job.dates, italics: true, size: 18, color: "666666", font: "Times New Roman" })],
          spacing: { after: 60 },
        }));
      }
      job.bullets.forEach(bullet => {
        rightContent.push(new Paragraph({
          children: [new TextRun({ text: bullet, size: 19, font: "Times New Roman" })],
          bullet: { level: 0 },
          spacing: { after: 50 },
        }));
      });
    });
  }

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
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
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
// PDF EXPORT
// ============================================
export const createModernPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const sidebarW = 62;
  const mainX = sidebarW + 6;
  const mainW = pageWidth - mainX - 8;

  pdf.setFillColor(31, 78, 121);
  pdf.rect(0, 0, sidebarW, pageHeight, 'F');

  let sY = 12;
  let mY = 12;

  if (photoSrc) {
    try {
      const imgData = await loadImageForPDF(photoSrc);
      if (imgData) {
        pdf.addImage(imgData, 'JPEG', (sidebarW - 22) / 2, sY, 22, 22);
        sY += 26;
      }
    } catch (e) { /* skip */ }
  }

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
