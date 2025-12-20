import React, { useState, useRef, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Check, Info, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Template styles
const templateStyles = {
  harvard: {
    fontFamily: "Georgia, serif",
    fontSize: "12pt",
    headerAlign: "center",
    color: "#000000",
    margins: "1in",
  },
  modern: {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: "10pt",
    layout: "split",
    sidebarBg: "#F4F7F9",
    accentColor: "#2A5C82",
  },
  impact: {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: "11pt",
    headerColor: "#2A5C82",
    hasKeyWins: true,
  },
  minimal: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "11pt",
    color: "#333333",
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
    const ref = type === "resume" ? resumeRef : coverLetterRef;

    try {
      const element = ref.current;
      if (!element) throw new Error("Element not found");

      // Create canvas from element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text("Generated via JaiSingh.in", pdfWidth - 45, pdfHeight - 5);

      // Generate filename
      const parsed = data.resumeParsed || {};
      const name = parsed.fullName || "Resume";
      const date = new Date().toISOString().split("T")[0];
      const filename = `${name.replace(/\s+/g, "_")}_${type === "resume" ? "Resume" : "CoverLetter"}_${date}.pdf`;

      pdf.save(filename);

      toast({
        title: "Download Started",
        description: `Your ${type === "resume" ? "resume" : "cover letter"} is being downloaded.`,
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

  const style = templateStyles[data.selectedTemplate] || templateStyles.harvard;

  const renderResume = () => {
    const content = typeof editedResume === "string" ? editedResume : JSON.stringify(editedResume, null, 2);

    if (data.selectedTemplate === "modern") {
      return (
        <div className="flex" style={{ fontFamily: style.fontFamily }}>
          {/* Sidebar */}
          <div className="w-1/3 p-6" style={{ backgroundColor: style.sidebarBg }}>
            {data.profilePhotoPreview && (
              <img
                src={data.profilePhotoPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            )}
            <h3 className="text-sm font-semibold mb-2" style={{ color: style.accentColor }}>
              SKILLS
            </h3>
            <div className="text-xs text-slate-600 space-y-1">
              {/* Skills would be extracted from parsed data */}
              <p>• Leadership</p>
              <p>• Strategic Planning</p>
              <p>• Project Management</p>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 p-6">
            <div
              contentEditable={editMode}
              suppressContentEditableWarning
              onBlur={(e) => handleContentEdit(e, "resume")}
              className={`whitespace-pre-wrap text-sm outline-none ${editMode ? "bg-blue-50 p-2 rounded" : ""}`}
            >
              {content}
            </div>
          </div>
        </div>
      );
    }

    // Default single-column layout
    return (
      <div className="p-8" style={{ fontFamily: style.fontFamily }}>
        {data.profilePhotoPreview && data.selectedTemplate === "impact" && (
          <img
            src={data.profilePhotoPreview}
            alt="Profile"
            className="w-20 h-20 rounded-full float-right ml-4 mb-4 object-cover"
          />
        )}
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => handleContentEdit(e, "resume")}
          className={`whitespace-pre-wrap text-sm outline-none ${
            style.headerAlign === "center" ? "text-center" : ""
          } ${editMode ? "bg-blue-50 p-2 rounded" : ""}`}
          style={{ color: style.color }}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2A5C82]" />
              Live Preview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              {editMode ? "Done Editing" : "Edit Content"}
            </Button>
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
                className="bg-white border border-slate-200 rounded-lg min-h-[600px] max-h-[800px] overflow-y-auto shadow-inner"
              >
                {renderResume()}
              </div>
            </TabsContent>

            <TabsContent value="coverLetter">
              <div
                ref={coverLetterRef}
                className="bg-white border border-slate-200 rounded-lg p-8 min-h-[600px] max-h-[800px] overflow-y-auto shadow-inner"
                style={{ fontFamily: style.fontFamily }}
              >
                <div
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentEdit(e, "coverLetter")}
                  className={`whitespace-pre-wrap text-sm outline-none ${editMode ? "bg-blue-50 p-2 rounded" : ""}`}
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
                        By using Jai's AI Resume Builder, you acknowledge and agree to the following:
                      </p>
                      <p>
                        <strong>Accuracy of Information:</strong> This tool uses Artificial Intelligence to suggest content. It may occasionally generate inaccurate data or placeholders (e.g., [X%]). It is the user's sole responsibility to review, edit, and verify all information before submitting a resume to an employer.
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
                        "As a Digital Marketing veteran, I know the power of data. This tool helps you frame your story, but the results are all yours. Please ensure your metrics are 100% accurate before hitting 'Send'." - Jaipal Singh
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
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => exportToPDF("resume")}
          disabled={!data.agreedToTerms || isExporting}
          className="bg-[#2A5C82] hover:bg-[#1e4460] text-white px-8 py-6 text-lg"
        >
          {isExporting ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          Download Resume PDF
        </Button>
        
        {data.coverLetter && (
          <Button
            variant="outline"
            onClick={() => exportToPDF("coverLetter")}
            disabled={!data.agreedToTerms || isExporting}
            className="px-8 py-6 text-lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            Download Cover Letter
          </Button>
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
            <li>Test the PDF by opening it and highlighting text (ATS-friendly check)</li>
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
