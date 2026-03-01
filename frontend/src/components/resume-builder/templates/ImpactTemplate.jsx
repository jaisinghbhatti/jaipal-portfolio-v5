import React from "react";
import jsPDF from "jspdf";
import {
  Document, Paragraph, TextRun, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun
} from "docx";
import { cleanText, imageToUint8Array, loadImageForPDF } from "../resumeUtils";

const PRIMARY = "2A5C82";
const ACCENT = "F59E0B";
const DARK = "1E4460";

// ============================================
// PREVIEW
// ============================================
export const ImpactPreview = ({ parsed, profilePhoto }) => {
  // Extract top achievements from first job bullets
  const keyWins = parsed?.experience?.length > 0
    ? parsed.experience.flatMap(j => j.bullets).filter(b => /\d/.test(b)).slice(0, 3)
    : [];

  return (
    <div className="min-h-[700px] bg-white overflow-hidden rounded-lg shadow-lg" data-testid="impact-preview">
      {/* Header with accent bar */}
      <div className="bg-[#2A5C82] text-white p-5">
        <div className="flex items-center gap-4">
          {profilePhoto && <img src={profilePhoto} alt="" className="w-16 h-16 rounded-lg object-cover border-2 border-white/30" />}
          <div>
            <h1 className="text-xl font-bold tracking-wide">{parsed?.name || "YOUR NAME"}</h1>
            {parsed?.contact && <p className="text-xs text-white/80 mt-1">{parsed.contact}</p>}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Key Wins Box */}
        {keyWins.length > 0 && (
          <div className="bg-[#1E4460] text-white rounded-lg p-4 mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Key Achievements</h3>
            {keyWins.map((w, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className="text-amber-400 text-xs mt-0.5">&#9733;</span>
                <p className="text-xs text-white/90">{w}</p>
              </div>
            ))}
          </div>
        )}

        {parsed?.summary && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-2 border-b-2 border-[#2A5C82] pb-1">Professional Summary</h2>
            <p className="text-xs text-gray-700 leading-relaxed">{parsed.summary}</p>
          </div>
        )}

        {parsed?.experience?.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-2 border-b-2 border-[#2A5C82] pb-1">Experience</h2>
            {parsed.experience.map((job, i) => (
              <div key={i} className="mb-3">
                <h3 className="font-bold text-gray-900 text-sm">{job.title}</h3>
                <div className="flex justify-between items-baseline">
                  {job.company && <p className="text-xs text-[#2A5C82] font-medium">{job.company}{job.location ? ` | ${job.location}` : ''}</p>}
                  {job.dates && <span className="text-xs text-gray-500 italic">{job.dates}</span>}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {job.bullets.map((b, j) => <li key={j} className="text-xs text-gray-700 pl-3 relative before:content-['▸'] before:absolute before:left-0 before:text-[#2A5C82]">{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          {parsed?.skills?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-2 border-b-2 border-[#2A5C82] pb-1">Skills</h2>
              <div className="flex flex-wrap gap-1">
                {parsed.skills.slice(0, 12).map((s, i) => (
                  <span key={i} className="text-xs bg-[#2A5C82]/10 text-[#2A5C82] px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            {parsed?.education?.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-2 border-b-2 border-[#2A5C82] pb-1">Education</h2>
                {parsed.education.map((e, i) => <p key={i} className="text-xs text-gray-700 mb-1">{e}</p>)}
              </div>
            )}
            {parsed?.certifications?.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-2 border-b-2 border-[#2A5C82] pb-1">Certifications</h2>
                {parsed.certifications.map((c, i) => <p key={i} className="text-xs text-gray-700 mb-1">{c}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DOCX EXPORT
// ============================================
export const createImpactDOCX = async (parsed, photoSrc) => {
  const children = [];
  let photoData = await imageToUint8Array(photoSrc);

  // Header table with blue background
  const headerContent = [];
  if (photoData) {
    try {
      headerContent.push(new Paragraph({
        children: [
          new ImageRun({ data: photoData, transformation: { width: 55, height: 55 } }),
          new TextRun({ text: "  " }),
          new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 28, color: "FFFFFF", font: "Times New Roman" }),
        ],
        spacing: { after: 40 },
      }));
    } catch (e) {
      headerContent.push(new Paragraph({
        children: [new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 28, color: "FFFFFF", font: "Times New Roman" })],
        spacing: { after: 40 },
      }));
    }
  } else {
    headerContent.push(new Paragraph({
      children: [new TextRun({ text: parsed.name || "YOUR NAME", bold: true, size: 28, color: "FFFFFF", font: "Times New Roman" })],
      spacing: { after: 40 },
    }));
  }

  if (parsed.contact) {
    headerContent.push(new Paragraph({
      children: [new TextRun({ text: parsed.contact, size: 17, color: "FFFFFF", font: "Times New Roman" })],
      spacing: { after: 40 },
    }));
  }

  const BODY_INDENT = 600; // ~0.42 inches left/right margin for body content

  const headerTable = new Table({
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 100, type: WidthType.PERCENTAGE },
        shading: { fill: PRIMARY, type: ShadingType.CLEAR },
        children: headerContent,
        margins: { top: 200, bottom: 200, left: 400, right: 400 },
      })],
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
  });
  children.push(headerTable);

  // Key Achievements box
  const keyWins = parsed.experience.flatMap(j => j.bullets).filter(b => /\d/.test(b)).slice(0, 3);
  if (keyWins.length > 0) {
    const winsContent = [
      new Paragraph({
        children: [new TextRun({ text: "KEY ACHIEVEMENTS", bold: true, size: 18, color: ACCENT, font: "Times New Roman" })],
        spacing: { after: 60 },
      }),
    ];
    keyWins.forEach(w => {
      winsContent.push(new Paragraph({
        children: [new TextRun({ text: "★ " + w, size: 18, color: "FFFFFF", font: "Times New Roman" })],
        spacing: { after: 40 },
      }));
    });
    const winsTable = new Table({
      rows: [new TableRow({
        children: [new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          shading: { fill: DARK, type: ShadingType.CLEAR },
          children: winsContent,
          margins: { top: 150, bottom: 150, left: 400, right: 400 },
        })],
      })],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    });
    children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "" })] }));
    children.push(winsTable);
  }

  const addSection = (title, content) => {
    children.push(new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 22, color: PRIMARY, font: "Times New Roman" })],
      spacing: { before: 250, after: 60 },
      border: { bottom: { color: PRIMARY, size: 8, style: BorderStyle.SINGLE } },
      indent: { left: BODY_INDENT, right: BODY_INDENT },
    }));
    content();
  };

  if (parsed.summary) {
    addSection("PROFESSIONAL SUMMARY", () => {
      children.push(new Paragraph({
        children: [new TextRun({ text: parsed.summary, size: 20, font: "Times New Roman", color: "333333" })],
        spacing: { after: 150 },
        indent: { left: BODY_INDENT, right: BODY_INDENT },
      }));
    });
  }

  if (parsed.experience.length > 0) {
    addSection("EXPERIENCE", () => {
      parsed.experience.forEach(job => {
        children.push(new Paragraph({
          children: [new TextRun({ text: job.title, bold: true, size: 21, font: "Times New Roman" })],
          spacing: { before: 150, after: 20 },
          indent: { left: BODY_INDENT, right: BODY_INDENT },
        }));
        const subParts = [];
        if (job.company) subParts.push(new TextRun({ text: job.company + (job.location ? " | " + job.location : ""), size: 19, color: PRIMARY, font: "Times New Roman" }));
        if (job.dates) {
          if (subParts.length) subParts.push(new TextRun({ text: "  |  ", size: 19, color: "999999", font: "Times New Roman" }));
          subParts.push(new TextRun({ text: job.dates, italics: true, size: 18, color: "777777", font: "Times New Roman" }));
        }
        if (subParts.length) {
          children.push(new Paragraph({ children: subParts, spacing: { after: 50 }, indent: { left: BODY_INDENT, right: BODY_INDENT } }));
        }
        job.bullets.forEach(bullet => {
          children.push(new Paragraph({
            children: [new TextRun({ text: bullet, size: 19, font: "Times New Roman" })],
            bullet: { level: 0 },
            spacing: { after: 40 },
            indent: { left: BODY_INDENT + 200, right: BODY_INDENT },
          }));
        });
      });
    });
  }

  if (parsed.skills.length > 0) {
    addSection("SKILLS", () => {
      children.push(new Paragraph({
        children: [new TextRun({ text: parsed.skills.join("  |  "), size: 19, font: "Times New Roman" })],
        spacing: { after: 100 },
        indent: { left: BODY_INDENT, right: BODY_INDENT },
      }));
    });
  }

  if (parsed.education.length > 0) {
    addSection("EDUCATION", () => {
      parsed.education.forEach(edu => {
        children.push(new Paragraph({
          children: [new TextRun({ text: edu, size: 19, font: "Times New Roman" })],
          spacing: { after: 50 },
          indent: { left: BODY_INDENT, right: BODY_INDENT },
        }));
      });
    });
  }

  if (parsed.certifications?.length > 0) {
    addSection("CERTIFICATIONS", () => {
      parsed.certifications.forEach(cert => {
        children.push(new Paragraph({
          children: [new TextRun({ text: cert, size: 19, font: "Times New Roman" })],
          bullet: { level: 0 },
          spacing: { after: 40 },
          indent: { left: BODY_INDENT + 200, right: BODY_INDENT },
        }));
      });
    });
  }

  return new Document({
    sections: [{
      properties: { page: { margin: { top: 0, right: 0, bottom: 500, left: 0 } } },
      children,
    }],
  });
};

// ============================================
// PDF EXPORT
// ============================================
export const createImpactPDF = async (parsed, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;

  // Header bar
  pdf.setFillColor(42, 92, 130);
  pdf.rect(0, 0, pageW, 28, 'F');
  let y = 10;

  if (photoSrc) {
    try {
      const imgData = await loadImageForPDF(photoSrc);
      if (imgData) {
        pdf.addImage(imgData, 'JPEG', margin, 5, 18, 18);
      }
    } catch (e) { /* skip */ }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("times", "bold");
  pdf.text(parsed.name || "YOUR NAME", photoSrc ? margin + 22 : margin, y + 3);
  if (parsed.contact) {
    pdf.setFontSize(7.5);
    pdf.setFont("times", "normal");
    const cLines = pdf.splitTextToSize(parsed.contact, contentW - 25);
    pdf.text(cLines, photoSrc ? margin + 22 : margin, y + 9);
  }
  y = 34;

  const checkPage = (needed = 20) => {
    if (y > pageH - needed) { pdf.addPage(); y = 15; }
  };

  // Key Achievements box
  const keyWins = parsed.experience.flatMap(j => j.bullets).filter(b => /\d/.test(b)).slice(0, 3);
  if (keyWins.length > 0) {
    const boxH = 6 + keyWins.length * 5;
    pdf.setFillColor(30, 68, 96);
    pdf.roundedRect(margin, y, contentW, boxH, 2, 2, 'F');
    pdf.setTextColor(245, 158, 11);
    pdf.setFontSize(8);
    pdf.setFont("times", "bold");
    pdf.text("KEY ACHIEVEMENTS", margin + 4, y + 4);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7.5);
    pdf.setFont("times", "normal");
    let wy = y + 8;
    keyWins.forEach(w => {
      const wLines = pdf.splitTextToSize(w, contentW - 12);
      pdf.text("★", margin + 4, wy);
      pdf.text(wLines, margin + 8, wy);
      wy += wLines.length * 3.5 + 1;
    });
    y += boxH + 5;
  }

  const addSectionHeader = (title) => {
    checkPage(15);
    pdf.setTextColor(42, 92, 130);
    pdf.setFontSize(11);
    pdf.setFont("times", "bold");
    pdf.text(title, margin, y);
    pdf.setDrawColor(42, 92, 130);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 1.5, pageW - margin, y + 1.5);
    y += 6;
  };

  if (parsed.summary) {
    addSectionHeader("PROFESSIONAL SUMMARY");
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    const sLines = pdf.splitTextToSize(parsed.summary, contentW);
    pdf.text(sLines, margin, y);
    y += sLines.length * 4 + 4;
  }

  if (parsed.experience.length > 0) {
    addSectionHeader("EXPERIENCE");
    parsed.experience.forEach(job => {
      checkPage(20);
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont("times", "bold");
      pdf.text(job.title, margin, y);
      y += 4;
      if (job.company) {
        pdf.setTextColor(42, 92, 130);
        pdf.setFontSize(9);
        pdf.setFont("times", "normal");
        const compText = job.company + (job.location ? " | " + job.location : "") + (job.dates ? "  |  " + job.dates : "");
        pdf.text(compText, margin, y);
        y += 4;
      }
      pdf.setTextColor(50, 50, 50);
      pdf.setFontSize(8.5);
      pdf.setFont("times", "normal");
      job.bullets.forEach(b => {
        checkPage(10);
        const bLines = pdf.splitTextToSize(b, contentW - 5);
        pdf.text("▸", margin + 1, y);
        pdf.text(bLines, margin + 4, y);
        y += bLines.length * 3.5 + 1;
      });
      y += 3;
    });
  }

  if (parsed.skills.length > 0) {
    addSectionHeader("SKILLS");
    pdf.setTextColor(50, 50, 50);
    pdf.setFontSize(9);
    pdf.setFont("times", "normal");
    const skillText = parsed.skills.join("  |  ");
    const sLines = pdf.splitTextToSize(skillText, contentW);
    pdf.text(sLines, margin, y);
    y += sLines.length * 4 + 3;
  }

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
