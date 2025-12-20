import React, { useCallback, useState } from "react";
import { Upload, FileText, Image, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "../../hooks/use-toast";
import { parseDocument } from "../../services/resumeBuilderService";

const InputModule = ({ data, updateData, onNext, isLoading, setIsLoading }) => {
  const { toast } = useToast();
  const [parseErrors, setParseErrors] = useState({});

  const handleResumeFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setParseErrors(prev => ({ ...prev, resume: null }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'resume');

      const response = await fetch(`${API_URL}/api/resume-builder/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const result = await response.json();
      
      updateData({
        resumeFile: file,
        resumeText: result.text || '',
        resumeParsed: result.parsed || null,
      });

      toast({
        title: "Resume Uploaded",
        description: "Your resume has been parsed. Please review the extracted data.",
      });
    } catch (error) {
      console.error('Parse error:', error);
      setParseErrors(prev => ({ ...prev, resume: 'Failed to parse file. Please try pasting your resume text instead.' }));
      toast({
        title: "Parse Error",
        description: "Could not parse the file. Try pasting your resume text instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateData, setIsLoading, toast]);

  const handleJDFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setParseErrors(prev => ({ ...prev, jd: null }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'jd');

      const response = await fetch(`${API_URL}/api/resume-builder/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const result = await response.json();
      
      updateData({
        jdFile: file,
        jobDescription: result.text || '',
      });

      toast({
        title: "Job Description Uploaded",
        description: "Your job description has been extracted.",
      });
    } catch (error) {
      console.error('Parse error:', error);
      setParseErrors(prev => ({ ...prev, jd: 'Failed to parse file. Please try pasting the job description instead.' }));
    } finally {
      setIsLoading(false);
    }
  }, [updateData, setIsLoading, toast]);

  const handlePhotoUpload = useCallback((file) => {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      updateData({
        profilePhoto: file,
        profilePhotoPreview: e.target.result,
      });
    };
    reader.readAsDataURL(file);
    
    toast({
      title: "Photo Uploaded",
      description: "Your profile photo has been added.",
    });
  }, [updateData, toast]);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (type === 'resume') handleResumeFileUpload(file);
    else if (type === 'jd') handleJDFileUpload(file);
    else if (type === 'photo') handlePhotoUpload(file);
  }, [handleResumeFileUpload, handleJDFileUpload, handlePhotoUpload]);

  const canProceed = (data.resumeText || data.resumeParsed) && data.jobDescription;

  return (
    <div className="space-y-6">
      {/* Resume Input */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2A5C82]" />
            Your Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Zone */}
          <div
            onDrop={(e) => handleDrop(e, 'resume')}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-[#2A5C82] transition-colors cursor-pointer"
            onClick={() => document.getElementById('resume-upload').click()}
          >
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleResumeFileUpload(e.target.files[0])}
            />
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">Drop your resume here or click to upload</p>
            <p className="text-xs text-slate-400 mt-1">PDF or DOCX</p>
            {data.resumeFile && (
              <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{data.resumeFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateData({ resumeFile: null, resumeText: '', resumeParsed: null });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {parseErrors.resume && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {parseErrors.resume}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Text Area */}
          <Textarea
            placeholder="Paste your resume text here..."
            value={data.resumeText}
            onChange={(e) => updateData({ resumeText: e.target.value })}
            className="min-h-[200px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Job Description Input */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2A5C82]" />
            Target Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Zone */}
          <div
            onDrop={(e) => handleDrop(e, 'jd')}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-[#2A5C82] transition-colors cursor-pointer"
            onClick={() => document.getElementById('jd-upload').click()}
          >
            <input
              id="jd-upload"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleJDFileUpload(e.target.files[0])}
            />
            <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            <p className="text-sm text-slate-600">Upload JD (PDF/DOCX)</p>
            {data.jdFile && (
              <div className="mt-2 flex items-center justify-center gap-2 text-green-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{data.jdFile.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateData({ jdFile: null, jobDescription: '' });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {parseErrors.jd && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {parseErrors.jd}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Textarea
            placeholder="Paste the full job description here to optimize your resume keywords..."
            value={data.jobDescription}
            onChange={(e) => updateData({ jobDescription: e.target.value })}
            className="min-h-[150px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Profile Photo (Optional) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="w-5 h-5 text-[#2A5C82]" />
            Profile Photo <span className="text-sm font-normal text-slate-400">(Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div
              onDrop={(e) => handleDrop(e, 'photo')}
              onDragOver={(e) => e.preventDefault()}
              className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center hover:border-[#2A5C82] transition-colors cursor-pointer overflow-hidden"
              onClick={() => document.getElementById('photo-upload').click()}
            >
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files[0])}
              />
              {data.profilePhotoPreview ? (
                <img
                  src={data.profilePhotoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-slate-600">Upload a professional photo</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, or WebP</p>
              {data.profilePhoto && (
                <button
                  onClick={() => updateData({ profilePhoto: null, profilePhotoPreview: null })}
                  className="text-sm text-red-500 hover:text-red-700 mt-2"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className="bg-[#2A5C82] hover:bg-[#1e4460] text-white px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to Customize"
          )}
        </Button>
      </div>
    </div>
  );
};

export default InputModule;
