import React, { useState, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun, convertInchesToTwip } from "docx";
import { saveAs } from "file-saver";

// ============================================
// TEXT CLEANUP - Remove markdown, decode HTML
// ============================================
const cleanLine = (text) => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(\w)\*+\s/g, '$1 ')
    .replace(/^#{1,6}\s*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
};

// Check if line is a section header (ALL CAPS, short)
const isSectionHeader = (line) => {
  const cleaned = cleanLine(line);
  if (cleaned.length < 3 || cleaned.length > 60) return false;
  // Check if mostly uppercase
  const upperCount = (cleaned.match(/[A-Z]/g) || []).length;
  const letterCount = (cleaned.match(/[A-Za-z]/g) || []).length;
  return letterCount > 0 && (upperCount / letterCount) > 0.7;
};

// Check if line is a bullet point
const isBulletLine = (line) => {
  return /^[\s]*[•\-\*►→▸]\s/.test(line);
};

// Get bullet content without the bullet marker
const getBulletContent = (line) => {
  return cleanLine(line.replace(/^[\s]*[•\-\*►→▸]\s*/, ''));
};

// ============================================
// IMAGE CONVERSION
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
    console.error('Image conversion error:', e);
    return null;
  }
};

// ============================================
// DOCX EXPORT - Direct line-by-line rendering
// ============================================
const exportToDOCX = async (resumeText, photoSrc, name) => {
  const children = [];
  const lines = resumeText.split('\n');
  const primaryColor = "1F4E79";
  
  // Add photo if available
  if (photoSrc) {
    const photoData = await imageToUint8Array(photoSrc);
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
  }
  
  let isFirstLine = true;
  let prevWasHeader = false;
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = cleanLine(rawLine);
    
    if (!line) {
      // Empty line - add spacing
      children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }
    
    const isHeader = isSectionHeader(rawLine);
    const isBullet = isBulletLine(rawLine);
    
    // First non-empty line is usually the name
    if (isFirstLine && line.length < 50) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.toUpperCase(),
              bold: true,
              size: 40,
              font: "Calibri Light",
              color: primaryColor,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      );
      isFirstLine = false;
      continue;
    }
    isFirstLine = false;
    
    // Contact line (contains email, phone, linkedin)
    if (line.includes('@') || line.includes('Ph:') || line.includes('LinkedIn') || (line.includes('|') && line.length < 150)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 20,
              font: "Calibri",
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 250 },
        })
      );
      // Add divider after contact
      children.push(
        new Paragraph({
          border: { bottom: { color: primaryColor, size: 12, style: BorderStyle.SINGLE } },
          spacing: { after: 250 },
        })
      );
      continue;
    }
    
    // Section headers
    if (isHeader) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.toUpperCase(),
              bold: true,
              size: 24,
              font: "Calibri",
              color: primaryColor,
            }),
          ],
          spacing: { before: 300, after: 120 },
          border: { bottom: { color: primaryColor, size: 6, style: BorderStyle.SINGLE } },
        })
      );
      prevWasHeader = true;
      continue;
    }
    
    // Bullet points - use Word's native bullets
    if (isBullet) {
      const bulletContent = getBulletContent(rawLine);
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bulletContent,
              size: 21,
              font: "Calibri",
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: 80 },
          indent: { left: convertInchesToTwip(0.25) },
        })
      );
      prevWasHeader = false;
      continue;
    }
    
    // Job title/company lines (usually come right after section header or contain dates)
    const hasDate = /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|20\d{2}|19\d{2})\b/i.test(line);
    const isJobLine = (prevWasHeader || hasDate || line.includes('|')) && line.length < 150;
    
    if (isJobLine && !isBullet) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 23,
              font: "Calibri",
            }),
          ],
          spacing: { before: 180, after: 60 },
        })
      );
      prevWasHeader = false;
      continue;
    }
    
    // Regular paragraph
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 21,
            font: "Calibri",
          }),
        ],
        spacing: { after: 80 },
      })
    );
    prevWasHeader = false;
  }
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.6),
            right: convertInchesToTwip(0.6),
            bottom: convertInchesToTwip(0.6),
            left: convertInchesToTwip(0.6),
          },
        },
      },
      children,
    }],
  });
  
  return doc;
};

// ============================================
// PDF EXPORT - Direct line-by-line rendering
// ============================================
const exportToPDF = async (resumeText, photoSrc) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const lines = resumeText.split('\n');
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;
  
  const primaryColor = [31, 78, 121];
  const textColor = [50, 50, 50];
  const grayColor = [120, 120, 120];
  
  // Add photo
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
      const photoSize = 20;
      pdf.addImage(imgData, 'JPEG', (pageWidth - photoSize) / 2, y, photoSize, photoSize);
      y += photoSize + 4;
    } catch (e) {
      console.log('PDF photo error:', e);
    }
  }
  
  let isFirstLine = true;
  let addedDivider = false;
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = cleanLine(rawLine);
    
    // Page break check
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = margin;
    }
    
    if (!line) {
      y += 3;
      continue;
    }
    
    const isHeader = isSectionHeader(rawLine);
    const isBullet = isBulletLine(rawLine);
    
    // Name (first line)
    if (isFirstLine && line.length < 50) {
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text(line.toUpperCase(), pageWidth / 2, y, { align: "center" });
      y += 8;
      isFirstLine = false;
      continue;
    }
    isFirstLine = false;
    
    // Contact line
    if (!addedDivider && (line.includes('@') || line.includes('Ph:') || line.includes('LinkedIn'))) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...grayColor);
      const contactLines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(contactLines, pageWidth / 2, y, { align: "center" });
      y += contactLines.length * 4 + 4;
      
      // Divider
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
      addedDivider = true;
      continue;
    }
    
    // Section header
    if (isHeader) {
      y += 3;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text(line.toUpperCase(), margin, y);
      y += 1;
      pdf.setLineWidth(0.3);
      pdf.line(margin, y + 1, margin + Math.min(pdf.getTextWidth(line.toUpperCase()), contentWidth), y + 1);
      y += 5;
      continue;
    }
    
    // Bullet points
    if (isBullet) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...textColor);
      const bulletContent = getBulletContent(rawLine);
      const bulletLines = pdf.splitTextToSize(bulletContent, contentWidth - 5);
      pdf.text("•", margin, y);
      pdf.text(bulletLines, margin + 4, y);
      y += bulletLines.length * 4 + 1.5;
      continue;
    }
    
    // Job title lines (bold)
    const hasDate = /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|20\d{2}|19\d{2})\b/i.test(line);
    if ((hasDate || line.includes('|')) && line.length < 150) {
      y += 2;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      const jobLines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(jobLines, margin, y);
      y += jobLines.length * 4.5 + 1;
      continue;
    }
    
    // Regular text
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textColor);
    const textLines = pdf.splitTextToSize(line, contentWidth);
    pdf.text(textLines, margin, y);
    y += textLines.length * 4 + 1;
  }
  
  return pdf;
};

// ============================================
// PREVIEW COMPONENT
// ============================================
const ResumePreview = ({ resumeText, profilePhoto }) => {
  const lines = resumeText.split('\n');
  
  return (
    <div className="bg-white p-8 min-h-[700px] font-sans text-sm leading-relaxed">
      {profilePhoto && (
        <div className="text-center mb-4">
          <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-gray-200" />
        </div>
      )}
      {lines.map((rawLine, i) => {
        const line = cleanLine(rawLine);
        if (!line) return <div key={i} className="h-2" />;
        
        const isHeader = isSectionHeader(rawLine);
        const isBullet = isBulletLine(rawLine);
        
        // Name (first meaningful line)
        if (i < 3 && line.length < 50 && !line.includes('@') && !line.includes('|')) {
          return <h1 key={i} className="text-2xl font-bold text-center text-[#1F4E79] mb-2">{line}</h1>;
        }
        
        // Contact
        if (line.includes('@') || line.includes('Ph:') || line.includes('LinkedIn')) {
          return (
            <div key={i}>
              <p className="text-center text-gray-500 text-xs mb-4">{line}</p>
              <hr className="border-[#1F4E79] border-t-2 mb-4" />
            </div>
          );
        }
        
        // Header
        if (isHeader) {
          return (
            <h2 key={i} className="text-sm font-bold text-[#1F4E79] uppercase tracking-wide mt-4 mb-2 border-b border-[#1F4E79] pb-1">
              {line}
            </h2>
          );
        }
        
        // Bullet
        if (isBullet) {
          return <p key={i} className="text-gray-700 ml-4 mb-1">• {getBulletContent(rawLine)}</p>;
        }
        
        // Job title (has date or pipe)
        const hasDate = /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|20\d{2})\b/i.test(line);
        if ((hasDate || line.includes('|')) && line.length < 150) {
          return <p key={i} className="font-semibold text-gray-900 mt-3 mb-1">{line}</p>;
        }
        
        return <p key={i} className="text-gray-700 mb-1">{line}</p>;
      })}
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

  useEffect(() => {
    setEditedResume(data.optimizedResume || "");
    setEditedCoverLetter(data.coverLetter || "");
  }, [data.optimizedResume, data.coverLetter]);

  const handleExportDOCX = async () => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to Terms first.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const doc = await exportToDOCX(editedResume, data.profilePhotoPreview, data.selectedTemplate);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `resume_${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Success!", description: "DOCX downloaded." });
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
      const pdf = await exportToPDF(editedResume, data.profilePhotoPreview);
      pdf.save(`resume_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Success!", description: "PDF downloaded." });
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  const copyToClipboard = () => {
    const cleaned = editedResume.split('\n').map(l => cleanLine(l)).join('\n');
    navigator.clipboard.writeText(cleaned);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#1F4E79]" />
              Resume Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4 mr-1" />Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                <Edit3 className="w-4 h-4 mr-1" />{editMode ? "Done" : "Edit"}
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
                  <p className="text-xs text-amber-700 mb-2">Edit the raw text below. Changes will reflect in preview and downloads.</p>
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
                <div className="border rounded-lg overflow-hidden shadow">
                  <ResumePreview resumeText={editedResume} profilePhoto={data.profilePhotoPreview} />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="coverLetter">
              <div className="bg-white border rounded-lg p-8 min-h-[400px]" style={{ fontFamily: 'Georgia, serif' }}>
                {editMode ? (
                  <textarea
                    value={editedCoverLetter}
                    onChange={(e) => {
                      setEditedCoverLetter(e.target.value);
                      updateData({ coverLetter: e.target.value });
                    }}
                    className="w-full min-h-[400px] p-4 font-mono text-sm border rounded"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {cleanLine(editedCoverLetter) || "No cover letter generated."}
                  </pre>
                )}
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
              <p className="text-sm text-slate-500">{data.matchScore >= 70 ? "Excellent match!" : "Consider adding more keywords"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>Improve Score</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={data.agreedToTerms}
              onCheckedChange={(checked) => updateData({ agreedToTerms: checked })}
            />
            <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
              I have reviewed my resume and agree to the{" "}
              <Dialog>
                <DialogTrigger className="text-[#1F4E79] underline">Terms of Use</DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Terms of Use</DialogTitle></DialogHeader>
                  <p className="text-sm text-slate-600">
                    By downloading, you confirm that you have reviewed and verified all information in your resume.
                    Replace all placeholder values ([X%], [N], etc.) with your actual metrics before submitting.
                  </p>
                </DialogContent>
              </Dialog>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-medium text-slate-700 mb-4 text-center">Download Your Resume</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleExportPDF}
            disabled={!data.agreedToTerms || isExporting}
            className="bg-[#1F4E79] hover:bg-[#163a5c] text-white"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleExportDOCX} disabled={!data.agreedToTerms || isExporting}>
            <FileText className="w-4 h-4 mr-2" />
            Download DOCX
          </Button>
        </div>
        <p className="text-xs text-center text-slate-500 mt-3">
          Both formats include your photo and maintain consistent formatting
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Before submitting your resume:</p>
            <ul className="mt-1 list-disc list-inside text-amber-600 space-y-1">
              <li>Replace all [X%], [N], [$Y] placeholders with your actual numbers</li>
              <li>Verify dates, company names, and job titles are accurate</li>
              <li>Proofread for any remaining formatting issues</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back to Customize</Button>
        <Button variant="ghost" onClick={() => goToStep(1)} className="text-slate-500">Start New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
