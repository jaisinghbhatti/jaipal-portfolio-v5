import React, { useState, useRef, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Check, Info, Loader2, FileDown } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";

// Template styles
const templateStyles = {
  harvard: {
    fontFamily: "times",
    fontSize: 11,
    headerAlign: "center",
    color: [0, 0, 0],
    lineHeight: 1.4,
  },
  modern: {
    fontFamily: "helvetica",
    fontSize: 10,
    headerAlign: "left",
    color: [42, 92, 130],
    lineHeight: 1.3,
  },
  impact: {
    fontFamily: "helvetica",
    fontSize: 11,
    headerAlign: "left",
    color: [42, 92, 130],
    lineHeight: 1.4,
  },
  minimal: {
    fontFamily: "helvetica",
    fontSize: 11,
    headerAlign: "left",
    color: [51, 51, 51],
    lineHeight: 1.4,
  },
};

const PreviewExport = ({ data, updateData, onBack, goToStep }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resume");
  const [editMode, setEditMode] = useState(false);
  const [editedResume, setEditedResume] = useState(data.optimizedResume || "");
  const [editedCoverLetter, setEditedCoverLetter] = useState(data.coverLetter || "");
  const [isExporting, setIsExporting] = useState(false);
  const resumeRef = useRef(null);
  const coverLetterRef = useRef(null);

  useEffect(() => {
    setEditedResume(data.optimizedResume || "");
    setEditedCoverLetter(data.coverLetter || "");
  }, [data.optimizedResume, data.coverLetter]);

  const handleContentEdit = (e, type) => {
    const content = e.target.innerText;
    if (type === "resume") {
      setEditedResume(content);
      updateData({ optimizedResume: content });
    } else {
      setEditedCoverLetter(content);
      updateData({ coverLetter: content });
    }
  };

  // Generate professional PDF with proper text formatting
  const exportToPDF = async (type = "resume") => {
    if (!data.agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Terms of Use before downloading.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const content = type === "resume" ? editedResume : editedCoverLetter;
      const style = templateStyles[data.selectedTemplate] || templateStyles.harvard;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Set font
      pdf.setFont(style.fontFamily, "normal");
      pdf.setFontSize(style.fontSize);
      pdf.setTextColor(...style.color);

      // Parse and render content
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 10) {
          pdf.addPage();
          yPosition = margin;
        }

        // Detect section headers (ALL CAPS or lines ending with :)
        const isHeader = /^[A-Z\s&]+$/.test(line) || 
                        /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|CONTACT|OBJECTIVE)/.test(line.toUpperCase());
        
        // Detect name (usually first non-empty line, larger text)
        const isName = i === 0 || (i < 3 && line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('|'));

        if (isName && i < 3) {
          // Name styling
          pdf.setFontSize(style.fontSize + 6);
          pdf.setFont(style.fontFamily, "bold");
          if (style.headerAlign === "center") {
            pdf.text(line, pageWidth / 2, yPosition, { align: "center" });
          } else {
            pdf.text(line, margin, yPosition);
          }
          yPosition += 8;
          pdf.setFontSize(style.fontSize);
          pdf.setFont(style.fontFamily, "normal");
        } else if (isHeader) {
          // Section header styling
          yPosition += 4; // Add space before header
          pdf.setFontSize(style.fontSize + 2);
          pdf.setFont(style.fontFamily, "bold");
          pdf.setTextColor(...style.color);
          pdf.text(line, margin, yPosition);
          yPosition += 2;
          // Add underline for headers
          pdf.setDrawColor(...style.color);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPosition, margin + pdf.getTextWidth(line), yPosition);
          yPosition += 6;
          pdf.setFontSize(style.fontSize);
          pdf.setFont(style.fontFamily, "normal");
          pdf.setTextColor(60, 60, 60);
        } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          // Bullet points
          const bulletText = line.replace(/^[•\-*]\s*/, '');
          const wrappedLines = pdf.splitTextToSize(bulletText, maxWidth - 10);
          pdf.text('•', margin, yPosition);
          pdf.text(wrappedLines, margin + 5, yPosition);
          yPosition += wrappedLines.length * style.fontSize * style.lineHeight * 0.35 + 2;
        } else if (line.length > 0) {
          // Regular text with word wrap
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          pdf.text(wrappedLines, margin, yPosition);
          yPosition += wrappedLines.length * style.fontSize * style.lineHeight * 0.35 + 1;
        } else {
          // Empty line - add small spacing
          yPosition += 3;
        }
      }

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Generated via JaiSingh.in/resume-builder", pageWidth / 2, pageHeight - 10, { align: "center" });

      // Generate filename
      const date = new Date().toISOString().split("T")[0];
      const filename = `Resume_${type === "resume" ? "Optimized" : "CoverLetter"}_${date}.pdf`;

      pdf.save(filename);

      toast({
        title: "Download Complete",
        description: `Your ${type === "resume" ? "resume" : "cover letter"} has been downloaded.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export as DOCX (text file that can be opened in Word)
  const exportToDocx = (type = "resume") => {
    if (!data.agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Terms of Use before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      const content = type === "resume" ? editedResume : editedCoverLetter;
      
      // Create a simple RTF format that Word can open
      const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs22
${content.replace(/\n/g, '\\par\n').replace(/[•]/g, '\\bullet ')}
\\par
\\par
{\\i\\fs16 Generated via JaiSingh.in/resume-builder}
}`;

      const blob = new Blob([rtfContent], { type: 'application/rtf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `Resume_${type === "resume" ? "Optimized" : "CoverLetter"}_${date}.rtf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Your ${type === "resume" ? "resume" : "cover letter"} has been downloaded as RTF (opens in Word).`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (type = "resume") => {
    const content = type === "resume" ? editedResume : editedCoverLetter;
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Copied!",
        description: "Content copied to clipboard. You can paste it into Word or Google Docs.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    });
  };

  const style = templateStyles[data.selectedTemplate] || templateStyles.harvard;

  const renderResumePreview = () => {
    const content = typeof editedResume === "string" ? editedResume : JSON.stringify(editedResume, null, 2);

    return (
      <div className="p-8 bg-white" style={{ fontFamily: style.fontFamily === "times" ? "Georgia, serif" : "Arial, sans-serif" }}>
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => handleContentEdit(e, "resume")}
          className={`whitespace-pre-wrap text-sm leading-relaxed outline-none ${editMode ? "bg-blue-50 p-2 rounded border-2 border-blue-300" : ""}`}
        >
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview Tabs */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2A5C82]" />
              Live Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeTab)}
              >
                Copy Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {editMode ? "Done Editing" : "Edit Content"}
              </Button>
            </div>
          </div>
          {editMode && (
            <p className="text-sm text-amber-600 mt-2">
              Click on the text below to edit directly. Changes are saved automatically.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
            </TabsList>

            <TabsContent value="resume">
              <div
                ref={resumeRef}
                className="bg-white border border-slate-200 rounded-lg min-h-[500px] max-h-[600px] overflow-y-auto shadow-inner"
              >
                {renderResumePreview()}
              </div>
            </TabsContent>

            <TabsContent value="coverLetter">
              <div
                ref={coverLetterRef}
                className="bg-white border border-slate-200 rounded-lg p-8 min-h-[500px] max-h-[600px] overflow-y-auto shadow-inner"
                style={{ fontFamily: style.fontFamily === "times" ? "Georgia, serif" : "Arial, sans-serif" }}
              >
                <div
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentEdit(e, "coverLetter")}
                  className={`whitespace-pre-wrap text-sm leading-relaxed outline-none ${editMode ? "bg-blue-50 p-2 rounded border-2 border-blue-300" : ""}`}
                >
                  {editedCoverLetter || "No cover letter generated yet."}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Match Score Summary */}
      {data.matchScore && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              data.matchScore >= 70 ? "bg-green-500" : data.matchScore >= 40 ? "bg-amber-500" : "bg-red-500"
            }`}>
              {data.matchScore}%
            </div>
            <div>
              <p className="font-medium text-slate-700">ATS Match Score</p>
              <p className="text-sm text-slate-500">
                {data.matchScore >= 70 ? "Excellent match!" : data.matchScore >= 40 ? "Good match" : "Consider adding more keywords"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>
            Improve Score
          </Button>
        </div>
      )}

      {/* Terms Agreement */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={data.agreedToTerms}
              onCheckedChange={(checked) => updateData({ agreedToTerms: checked })}
            />
            <div className="flex-1">
              <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
                I have reviewed my resume for accuracy and agree to the{" "}
                <Dialog>
                  <DialogTrigger className="text-[#2A5C82] underline">Terms of Use</DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Terms of Service & AI Disclaimer</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-slate-600 space-y-3 max-h-[60vh] overflow-y-auto">
                      <p>
                        By using Jai&apos;s AI Resume Builder, you acknowledge and agree to the following:
                      </p>
                      <p>
                        <strong>Accuracy of Information:</strong> This tool uses Artificial Intelligence to suggest content. It may occasionally generate inaccurate data or placeholders (e.g., [X%]). It is the user&apos;s sole responsibility to review, edit, and verify all information before submitting a resume to an employer.
                      </p>
                      <p>
                        <strong>No Guarantee of Employment:</strong> Use of this tool does not guarantee job interviews or employment. JaiSingh.in is not responsible for any career outcomes resulting from the use of these documents.
                      </p>
                      <p>
                        <strong>Data Privacy:</strong> We value your privacy. Your data is processed locally and via our AI partner. We do not sell your personal information.
                      </p>
                      <p>
                        <strong>Limitation of Liability:</strong> JaiSingh.in shall not be liable for any direct or indirect damages arising from the use of this free tool.
                      </p>
                      <p className="italic text-slate-500">
                        &quot;As a Digital Marketing veteran, I know the power of data. This tool helps you frame your story, but the results are all yours. Please ensure your metrics are 100% accurate before hitting &apos;Send&apos;.&quot; - Jaipal Singh
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-medium text-slate-700 mb-4 text-center">Download Your Documents</h3>
        
        {/* Resume Downloads */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3 text-center">Resume</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => exportToPDF("resume")}
              disabled={!data.agreedToTerms || isExporting}
              className="bg-[#2A5C82] hover:bg-[#1e4460] text-white"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportToDocx("resume")}
              disabled={!data.agreedToTerms}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Download RTF (Word)
            </Button>
          </div>
        </div>

        {/* Cover Letter Downloads */}
        {data.coverLetter && (
          <div>
            <p className="text-sm text-slate-500 mb-3 text-center">Cover Letter</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => exportToPDF("coverLetter")}
                disabled={!data.agreedToTerms || isExporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={() => exportToDocx("coverLetter")}
                disabled={!data.agreedToTerms}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download RTF (Word)
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">Before you download:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-amber-600">
            <li>Replace any [X%] or [Y Amount] placeholders with your actual achievements</li>
            <li>Verify all dates and company names are correct</li>
            <li>Use &quot;Copy Text&quot; to paste into Google Docs or Word for more formatting control</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Templates
        </Button>
        <Button
          variant="ghost"
          onClick={() => goToStep(1)}
          className="text-slate-500"
        >
          Start New Resume
        </Button>
      </div>
    </div>
  );
};

export default PreviewExport;
