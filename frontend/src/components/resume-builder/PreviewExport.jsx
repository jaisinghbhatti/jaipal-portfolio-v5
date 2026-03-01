import React, { useState, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { Packer } from "docx";
import { saveAs } from "file-saver";
import { parseResume, cleanText } from "./resumeUtils";
import { ModernPreview, createModernDOCX, createModernPDF } from "./templates/ModernTemplate";
import { HarvardPreview, createHarvardDOCX, createHarvardPDF } from "./templates/HarvardTemplate";
import { ImpactPreview, createImpactDOCX, createImpactPDF } from "./templates/ImpactTemplate";
import { MinimalPreview, createMinimalDOCX, createMinimalPDF } from "./templates/MinimalTemplate";

const TEMPLATE_CONFIG = {
  modern: {
    name: "Modern Tech",
    color: "#1F4E79",
    Preview: ModernPreview,
    createDOCX: createModernDOCX,
    createPDF: createModernPDF,
  },
  harvard: {
    name: "Harvard Executive",
    color: "#1A1A1A",
    Preview: HarvardPreview,
    createDOCX: createHarvardDOCX,
    createPDF: createHarvardPDF,
  },
  impact: {
    name: "Impact-First",
    color: "#2A5C82",
    Preview: ImpactPreview,
    createDOCX: createImpactDOCX,
    createPDF: createImpactPDF,
  },
  minimal: {
    name: "Minimalist ATS",
    color: "#374151",
    Preview: MinimalPreview,
    createDOCX: createMinimalDOCX,
    createPDF: createMinimalPDF,
  },
};

const PreviewExport = ({ data, updateData, onBack, goToStep }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resume");
  const [editMode, setEditMode] = useState(false);
  const [editedResume, setEditedResume] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [parsed, setParsed] = useState(null);

  const templateId = data.selectedTemplate || "harvard";
  const template = TEMPLATE_CONFIG[templateId] || TEMPLATE_CONFIG.harvard;
  const TemplatePreview = template.Preview;

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
      const doc = await template.createDOCX(parsed, data.profilePhotoPreview);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${templateId}_resume_${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Downloaded!", description: `${template.name} DOCX exported` });
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
      const pdf = await template.createPDF(parsed, data.profilePhotoPreview);
      pdf.save(`${templateId}_resume_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "Downloaded!", description: `${template.name} PDF exported` });
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: "Export Failed", description: err.message, variant: "destructive" });
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6" data-testid="preview-export">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" style={{ color: template.color }} />
              {template.name} Template
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToStep(3)} data-testid="change-template-btn">
                Change Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)} data-testid="edit-toggle-btn">
                <Edit3 className="w-4 h-4 mr-1" />{editMode ? "Preview" : "Edit"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="resume" data-testid="resume-tab">Resume</TabsTrigger>
              <TabsTrigger value="coverLetter" data-testid="cover-letter-tab">Cover Letter</TabsTrigger>
            </TabsList>

            <TabsContent value="resume">
              {editMode ? (
                <textarea
                  value={editedResume}
                  onChange={(e) => { setEditedResume(e.target.value); updateData({ optimizedResume: e.target.value }); }}
                  className="w-full min-h-[600px] p-4 font-mono text-xs border rounded"
                  data-testid="resume-editor-textarea"
                />
              ) : (
                <TemplatePreview parsed={parsed} profilePhoto={data.profilePhotoPreview} />
              )}
            </TabsContent>

            <TabsContent value="coverLetter">
              <div className="bg-white border rounded-lg p-6 min-h-[300px]">
                <pre className="whitespace-pre-wrap text-sm" data-testid="cover-letter-content">{cleanText(editedCoverLetter)}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {data.matchScore && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between" data-testid="ats-score-display">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${data.matchScore >= 70 ? "bg-green-500" : "bg-amber-500"}`}>
              {data.matchScore}%
            </div>
            <span className="font-medium">ATS Match Score</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)} data-testid="improve-score-btn">Improve</Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Checkbox id="terms" checked={data.agreedToTerms} onCheckedChange={(c) => updateData({ agreedToTerms: c })} data-testid="terms-checkbox" />
            <label htmlFor="terms" className="text-sm cursor-pointer">I agree to the Terms of Use</label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-50 rounded-lg p-6 text-center">
        <h3 className="font-medium mb-4">Download {template.name} Resume</h3>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleExportPDF} disabled={!data.agreedToTerms || isExporting} style={{ backgroundColor: template.color }} data-testid="export-pdf-btn">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}PDF
          </Button>
          <Button variant="outline" onClick={handleExportDOCX} disabled={!data.agreedToTerms || isExporting} data-testid="export-docx-btn">
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
        <Button variant="outline" onClick={onBack} data-testid="back-btn">Back</Button>
        <Button variant="ghost" onClick={() => goToStep(1)} data-testid="new-resume-btn">New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
