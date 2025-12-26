import React, { useState, useRef, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2, FileDown, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Parse resume text into structured sections
const parseResumeText = (text) => {
  if (!text) return null;
  
  const lines = text.split('\n').filter(line => line.trim());
  const sections = {
    name: '',
    title: '',
    contact: [],
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    achievements: []
  };
  
  let currentSection = 'header';
  let currentExperience = null;
  let currentEducation = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upperLine = line.toUpperCase();
    
    // Detect section headers
    if (upperLine.includes('SUMMARY') || upperLine.includes('OBJECTIVE') || upperLine.includes('PROFILE')) {
      currentSection = 'summary';
      continue;
    } else if (upperLine.includes('EXPERIENCE') || upperLine.includes('EMPLOYMENT') || upperLine.includes('WORK HISTORY')) {
      currentSection = 'experience';
      continue;
    } else if (upperLine.includes('EDUCATION') || upperLine.includes('ACADEMIC')) {
      currentSection = 'education';
      continue;
    } else if (upperLine.includes('SKILL') || upperLine.includes('COMPETENC') || upperLine.includes('TECHNICAL')) {
      currentSection = 'skills';
      continue;
    } else if (upperLine.includes('CERTIF') || upperLine.includes('LICENSE')) {
      currentSection = 'certifications';
      continue;
    } else if (upperLine.includes('ACHIEVEMENT') || upperLine.includes('AWARD') || upperLine.includes('KEY WINS')) {
      currentSection = 'achievements';
      continue;
    }
    
    // Parse content based on section
    if (currentSection === 'header') {
      if (!sections.name && line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('|')) {
        sections.name = line;
      } else if (line.includes('@') || line.includes('|') || line.includes('•') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) {
        sections.contact.push(line);
      } else if (line.length < 60 && !sections.title) {
        sections.title = line;
      }
    } else if (currentSection === 'summary') {
      sections.summary += (sections.summary ? ' ' : '') + line;
    } else if (currentSection === 'experience') {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        if (currentExperience) {
          currentExperience.bullets.push(line.replace(/^[•\-*]\s*/, ''));
        }
      } else if (line.length > 0) {
        if (currentExperience && currentExperience.company && !currentExperience.dates && /\d{4}/.test(line)) {
          currentExperience.dates = line;
        } else if (!line.startsWith(' ') && line.length < 100) {
          if (currentExperience) sections.experience.push(currentExperience);
          currentExperience = { title: line, company: '', dates: '', bullets: [] };
        } else if (currentExperience && !currentExperience.company) {
          currentExperience.company = line;
        }
      }
    } else if (currentSection === 'education') {
      if (line.startsWith('•') || line.startsWith('-')) {
        if (currentEducation) {
          currentEducation.details.push(line.replace(/^[•\-*]\s*/, ''));
        }
      } else if (line.length > 0) {
        if (currentEducation) sections.education.push(currentEducation);
        currentEducation = { school: line, degree: '', year: '', details: [] };
        if (/\d{4}/.test(line)) {
          const yearMatch = line.match(/\d{4}/);
          if (yearMatch) currentEducation.year = yearMatch[0];
        }
      }
    } else if (currentSection === 'skills') {
      const skillItems = line.split(/[,•|]/).map(s => s.trim()).filter(s => s);
      sections.skills.push(...skillItems);
    } else if (currentSection === 'certifications') {
      sections.certifications.push(line.replace(/^[•\-*]\s*/, ''));
    } else if (currentSection === 'achievements') {
      sections.achievements.push(line.replace(/^[•\-*]\s*/, ''));
    }
  }
  
  // Add last items
  if (currentExperience) sections.experience.push(currentExperience);
  if (currentEducation) sections.education.push(currentEducation);
  
  return sections;
};

// Harvard Executive Template - Classic single column
const HarvardTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 font-serif min-h-[800px]" style={{ fontFamily: 'Georgia, serif' }}>
    {/* Header */}
    <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
      {profilePhoto && (
        <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-gray-300" />
      )}
      <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase">{parsed?.name || 'Your Name'}</h1>
      {parsed?.title && <p className="text-lg text-gray-600 mt-2 italic">{parsed.title}</p>}
      <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm text-gray-600">
        {parsed?.contact?.map((c, i) => <span key={i}>{c}</span>)}
      </div>
    </div>
    
    {/* Summary */}
    {parsed?.summary && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
        <p className="text-gray-700 leading-relaxed text-justify">{parsed.summary}</p>
      </div>
    )}
    
    {/* Experience */}
    {parsed?.experience?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Professional Experience</h2>
        {parsed.experience.map((exp, i) => (
          <div key={i} className="mb-5">
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold text-gray-900">{exp.title}</h3>
              <span className="text-sm text-gray-500 italic">{exp.dates}</span>
            </div>
            {exp.company && <p className="text-gray-700 italic">{exp.company}</p>}
            <ul className="mt-2 space-y-1">
              {exp.bullets?.map((bullet, j) => (
                <li key={j} className="text-gray-700 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0">{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}
    
    {/* Education */}
    {parsed?.education?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Education</h2>
        {parsed.education.map((edu, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">{edu.school}</span>
              <span className="text-sm text-gray-500">{edu.year}</span>
            </div>
            {edu.degree && <p className="text-gray-700 italic text-sm">{edu.degree}</p>}
          </div>
        ))}
      </div>
    )}
    
    {/* Skills */}
    {parsed?.skills?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Skills</h2>
        <p className="text-gray-700 text-sm">{parsed.skills.join(' • ')}</p>
      </div>
    )}
  </div>
);

// Modern Tech Template - 70/30 split with sidebar
const ModernTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white min-h-[800px] flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
    {/* Sidebar */}
    <div className="w-[30%] bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6">
      {profilePhoto ? (
        <img src={profilePhoto} alt="Profile" className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-white/20" />
      ) : (
        <div className="w-28 h-28 rounded-full mx-auto mb-4 bg-slate-700 flex items-center justify-center text-3xl font-bold">
          {parsed?.name?.charAt(0) || 'U'}
        </div>
      )}
      
      <h1 className="text-xl font-bold text-center mb-1">{parsed?.name || 'Your Name'}</h1>
      {parsed?.title && <p className="text-sm text-slate-300 text-center mb-6">{parsed.title}</p>}
      
      {/* Contact */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Contact</h3>
        <div className="space-y-2 text-sm text-slate-300">
          {parsed?.contact?.map((c, i) => <p key={i} className="break-words">{c}</p>)}
        </div>
      </div>
      
      {/* Skills */}
      {parsed?.skills?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {parsed.skills.slice(0, 12).map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">{skill}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Certifications */}
      {parsed?.certifications?.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Certifications</h3>
          <ul className="space-y-1 text-sm text-slate-300">
            {parsed.certifications.map((cert, i) => <li key={i}>• {cert}</li>)}
          </ul>
        </div>
      )}
    </div>
    
    {/* Main Content */}
    <div className="w-[70%] p-8">
      {/* Summary */}
      {parsed?.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-[#2A5C82]"></span>
            About Me
          </h2>
          <p className="text-gray-600 leading-relaxed">{parsed.summary}</p>
        </div>
      )}
      
      {/* Experience */}
      {parsed?.experience?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-[#2A5C82]"></span>
            Experience
          </h2>
          {parsed.experience.map((exp, i) => (
            <div key={i} className="mb-5 relative pl-4 border-l-2 border-slate-200">
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#2A5C82]"></div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">{exp.title}</h3>
                <span className="text-xs text-gray-500 bg-slate-100 px-2 py-1 rounded">{exp.dates}</span>
              </div>
              {exp.company && <p className="text-[#2A5C82] text-sm font-medium">{exp.company}</p>}
              <ul className="mt-2 space-y-1">
                {exp.bullets?.map((bullet, j) => (
                  <li key={j} className="text-gray-600 text-sm flex gap-2">
                    <span className="text-[#2A5C82]">▸</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      {/* Education */}
      {parsed?.education?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-[#2A5C82]"></span>
            Education
          </h2>
          {parsed.education.map((edu, i) => (
            <div key={i} className="mb-2 flex justify-between">
              <div>
                <span className="font-semibold text-gray-900">{edu.school}</span>
                {edu.degree && <span className="text-gray-600 text-sm ml-2">— {edu.degree}</span>}
              </div>
              <span className="text-sm text-gray-500">{edu.year}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Impact-First Template - Bold with Key Wins box
const ImpactTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[800px]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
    {/* Header with accent bar */}
    <div className="flex items-center gap-6 mb-6 pb-6 border-b-4 border-[#2A5C82]">
      {profilePhoto && (
        <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-lg object-cover shadow-lg" />
      )}
      <div className="flex-1">
        <h1 className="text-3xl font-black text-gray-900">{parsed?.name || 'Your Name'}</h1>
        {parsed?.title && <p className="text-lg text-[#2A5C82] font-semibold mt-1">{parsed.title}</p>}
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
          {parsed?.contact?.map((c, i) => <span key={i} className="bg-gray-100 px-2 py-1 rounded">{c}</span>)}
        </div>
      </div>
    </div>
    
    {/* Key Wins Box */}
    {parsed?.achievements?.length > 0 && (
      <div className="bg-gradient-to-r from-[#2A5C82] to-[#1e4460] text-white p-5 rounded-lg mb-6 shadow-lg">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="text-yellow-400">★</span> Key Wins & Achievements
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {parsed.achievements.slice(0, 4).map((achievement, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-yellow-400 text-lg">✓</span>
              <span className="text-sm">{achievement}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Summary */}
    {parsed?.summary && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#2A5C82] uppercase mb-2">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed border-l-4 border-[#2A5C82] pl-4 bg-gray-50 py-3">{parsed.summary}</p>
      </div>
    )}
    
    {/* Two Column Layout */}
    <div className="grid grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="col-span-2">
        {/* Experience */}
        {parsed?.experience?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#2A5C82] uppercase mb-4 border-b-2 border-gray-200 pb-2">Career History</h2>
            {parsed.experience.map((exp, i) => (
              <div key={i} className="mb-5">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">{exp.title}</h3>
                    <span className="text-xs text-white bg-[#2A5C82] px-3 py-1 rounded-full">{exp.dates}</span>
                  </div>
                  {exp.company && <p className="text-[#2A5C82] font-medium">{exp.company}</p>}
                </div>
                <ul className="mt-3 space-y-2 pl-3">
                  {exp.bullets?.map((bullet, j) => (
                    <li key={j} className="text-gray-700 text-sm flex gap-2">
                      <span className="text-[#2A5C82] font-bold">→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Skills */}
        {parsed?.skills?.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-3">Core Skills</h2>
            <div className="space-y-2">
              {parsed.skills.slice(0, 8).map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#2A5C82] rounded-full"></div>
                  <span className="text-sm text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Education */}
        {parsed?.education?.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-3">Education</h2>
            {parsed.education.map((edu, i) => (
              <div key={i} className="mb-2 text-sm">
                <p className="font-semibold text-gray-900">{edu.school}</p>
                <p className="text-gray-600">{edu.year}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Minimalist ATS Template - Clean and simple
const MinimalTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
    {/* Header */}
    <div className="flex items-center gap-6 mb-6">
      {profilePhoto && (
        <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover grayscale" />
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{parsed?.name || 'Your Name'}</h1>
        {parsed?.title && <p className="text-gray-600">{parsed.title}</p>}
        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
          {parsed?.contact?.map((c, i) => <span key={i}>{c}{i < parsed.contact.length - 1 ? ' | ' : ''}</span>)}
        </div>
      </div>
    </div>
    
    <hr className="border-gray-300 mb-6" />
    
    {/* Summary */}
    {parsed?.summary && (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Summary</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{parsed.summary}</p>
      </div>
    )}
    
    {/* Experience */}
    {parsed?.experience?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Experience</h2>
        {parsed.experience.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">{exp.title}</span>
              <span className="text-sm text-gray-500">{exp.dates}</span>
            </div>
            {exp.company && <p className="text-gray-600 text-sm">{exp.company}</p>}
            <ul className="mt-1 space-y-1">
              {exp.bullets?.map((bullet, j) => (
                <li key={j} className="text-gray-600 text-sm">• {bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}
    
    {/* Education */}
    {parsed?.education?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Education</h2>
        {parsed.education.map((edu, i) => (
          <div key={i} className="flex justify-between text-sm mb-1">
            <span className="text-gray-900">{edu.school}</span>
            <span className="text-gray-500">{edu.year}</span>
          </div>
        ))}
      </div>
    )}
    
    {/* Skills */}
    {parsed?.skills?.length > 0 && (
      <div>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Skills</h2>
        <p className="text-gray-600 text-sm">{parsed.skills.join(', ')}</p>
      </div>
    )}
  </div>
);

const PreviewExport = ({ data, updateData, onBack, goToStep }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resume");
  const [editMode, setEditMode] = useState(false);
  const [editedResume, setEditedResume] = useState(data.optimizedResume || "");
  const [editedCoverLetter, setEditedCoverLetter] = useState(data.coverLetter || "");
  const [isExporting, setIsExporting] = useState(false);
  const resumeRef = useRef(null);
  const [parsedResume, setParsedResume] = useState(null);

  useEffect(() => {
    setEditedResume(data.optimizedResume || "");
    setEditedCoverLetter(data.coverLetter || "");
  }, [data.optimizedResume, data.coverLetter]);

  useEffect(() => {
    const parsed = parseResumeText(editedResume);
    setParsedResume(parsed);
  }, [editedResume]);

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

  // Export using html2canvas for beautiful output
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
      const element = resumeRef.current;
      if (!element) throw new Error("Resume element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      const date = new Date().toISOString().split("T")[0];
      pdf.save(`Resume_${date}.pdf`);

      toast({
        title: "Download Complete",
        description: "Your resume has been downloaded.",
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

  // Copy to clipboard
  const copyToClipboard = (type = "resume") => {
    const content = type === "resume" ? editedResume : editedCoverLetter;
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    });
  };

  // Render template based on selection
  const renderTemplate = () => {
    const templateProps = {
      data,
      parsed: parsedResume,
      profilePhoto: data.profilePhotoPreview
    };

    switch (data.selectedTemplate) {
      case 'modern':
        return <ModernTemplate {...templateProps} />;
      case 'impact':
        return <ImpactTemplate {...templateProps} />;
      case 'minimal':
        return <MinimalTemplate {...templateProps} />;
      case 'harvard':
      default:
        return <HarvardTemplate {...templateProps} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2A5C82]" />
              Live Preview - {data.selectedTemplate?.charAt(0).toUpperCase() + data.selectedTemplate?.slice(1)} Template
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(activeTab)}>
                <Copy className="w-4 h-4 mr-1" /> Copy Text
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                <Edit3 className="w-4 h-4 mr-1" />
                {editMode ? "Done" : "Edit Text"}
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
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 mb-2">Edit mode: Modify the text below</p>
                  <textarea
                    value={editedResume}
                    onChange={(e) => {
                      setEditedResume(e.target.value);
                      updateData({ optimizedResume: e.target.value });
                    }}
                    className="w-full min-h-[500px] p-4 font-mono text-sm border rounded"
                  />
                </div>
              ) : (
                <div ref={resumeRef} className="border border-slate-200 rounded-lg overflow-hidden shadow-lg">
                  {renderTemplate()}
                </div>
              )}
            </TabsContent>

            <TabsContent value="coverLetter">
              <div className="bg-white border border-slate-200 rounded-lg p-8 min-h-[500px]" style={{ fontFamily: 'Georgia, serif' }}>
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

      {/* Match Score */}
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
                {data.matchScore >= 70 ? "Excellent match!" : "Consider adding more keywords"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>
            Improve Score
          </Button>
        </div>
      )}

      {/* Terms */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={data.agreedToTerms}
              onCheckedChange={(checked) => updateData({ agreedToTerms: checked })}
            />
            <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
              I have reviewed my resume for accuracy and agree to the{" "}
              <Dialog>
                <DialogTrigger className="text-[#2A5C82] underline">Terms of Use</DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Terms of Service</DialogTitle></DialogHeader>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p><strong>Accuracy:</strong> Please verify all information before submitting.</p>
                    <p><strong>AI Generated:</strong> Content may need manual review.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Download Buttons */}
      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-medium text-slate-700 mb-4 text-center">Download Your Resume</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => exportToPDF("resume")}
            disabled={!data.agreedToTerms || isExporting}
            className="bg-[#2A5C82] hover:bg-[#1e4460] text-white"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => copyToClipboard("resume")} disabled={!data.agreedToTerms}>
            <FileDown className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">Before you download:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-amber-600">
            <li>Replace any [X%] placeholders with actual achievements</li>
            <li>Verify all dates and company names are correct</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back to Templates</Button>
        <Button variant="ghost" onClick={() => goToStep(1)} className="text-slate-500">Start New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
