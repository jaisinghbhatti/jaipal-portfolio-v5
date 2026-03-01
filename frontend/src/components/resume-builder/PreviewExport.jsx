import React, { useState, useRef, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2, FileDown, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ImageRun, Table, TableRow, TableCell, WidthType, VerticalAlign, ShadingType } from "docx";
import { saveAs } from "file-saver";

// Comprehensive markdown and placeholder cleanup
const cleanText = (text) => {
  if (!text) return '';
  return text
    // Remove AIDA markers like **A**ttention:, *I*nterest:, etc.
    .replace(/\*?\*?[AIDA]\*?\*?[a-z]*:\s*/gi, '')
    // Fix broken markdown patterns
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove stray asterisks at end of words
    .replace(/(\w)\*+/g, '$1')
    .replace(/\*+(\w)/g, '$1')
    // Remove headers ##
    .replace(/^#{1,6}\s*/gm, '')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove template instructions in brackets
    .replace(/\[Add [^\]]+\]/g, '')
    .replace(/\[if [^\]]+\]/gi, '')
    .replace(/\[otherwise [^\]]+\]/gi, '')
    // Clean up HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Clean entire resume while preserving structure
const cleanResumeText = (text) => {
  if (!text) return '';
  return text.split('\n').map(line => {
    if (!line.trim()) return '';
    return cleanText(line);
  }).join('\n');
};

// Parse resume into structured sections
const parseResumeText = (text) => {
  if (!text) return null;
  
  const cleanedText = cleanResumeText(text);
  const lines = cleanedText.split('\n').filter(line => line.trim());
  
  const sections = {
    name: '',
    title: '',
    contact: [],
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    achievements: [],
    tools: []
  };
  
  let currentSection = 'header';
  let currentExperience = null;
  let currentEducation = null;
  let summaryLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upperLine = line.toUpperCase();
    
    // Detect section headers
    if (upperLine.includes('SUMMARY') || upperLine.includes('OBJECTIVE') || upperLine.includes('PROFILE') || upperLine === 'ABOUT') {
      currentSection = 'summary';
      continue;
    } else if (upperLine.includes('EXPERIENCE') || upperLine.includes('EMPLOYMENT') || upperLine.includes('WORK HISTORY') || upperLine.includes('CAREER HISTORY')) {
      currentSection = 'experience';
      continue;
    } else if (upperLine.includes('EDUCATION') || upperLine.includes('ACADEMIC')) {
      currentSection = 'education';
      continue;
    } else if (upperLine.includes('SKILL') || upperLine.includes('COMPETENC') || upperLine.includes('CORE COMPETENCIES') || upperLine.includes('KEY SKILLS')) {
      currentSection = 'skills';
      continue;
    } else if (upperLine.includes('CERTIF') || upperLine.includes('LICENSE')) {
      currentSection = 'certifications';
      continue;
    } else if (upperLine.includes('ACHIEVEMENT') || upperLine.includes('AWARD') || upperLine.includes('KEY WINS')) {
      currentSection = 'achievements';
      continue;
    } else if (upperLine.includes('TOOL') || upperLine.includes('PLATFORM') || upperLine.includes('TECHNOLOGIES')) {
      currentSection = 'tools';
      continue;
    }
    
    // Parse content based on section
    if (currentSection === 'header') {
      if (!sections.name && line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('|') && !line.includes('Ph:') && !line.includes('+')) {
        sections.name = line;
      } else if (line.includes('@') || line.includes('|') || line.includes('•') || /\+?\d{1,3}[-.\s]?\d{3,}/.test(line) || line.includes('Ph:') || line.includes('LinkedIn') || line.includes('Website')) {
        sections.contact.push(line);
      }
    } else if (currentSection === 'summary') {
      if (line.length > 10) {
        summaryLines.push(line);
      }
    } else if (currentSection === 'experience') {
      const isBullet = /^[•\-*►→▸]/.test(line);
      const isDate = /^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|\d{4})/i.test(line);
      
      if (isBullet) {
        if (currentExperience) {
          currentExperience.bullets.push(line.replace(/^[•\-*►→▸]\s*/, ''));
        }
      } else if (isDate && line.length < 80) {
        if (currentExperience && !currentExperience.dates) {
          currentExperience.dates = line;
        }
      } else if (line.length > 0 && line.length < 120 && !isBullet) {
        // Likely a job title or company
        if (currentExperience && currentExperience.title && currentExperience.bullets.length > 0) {
          sections.experience.push(currentExperience);
          currentExperience = null;
        }
        if (!currentExperience) {
          currentExperience = { title: line, company: '', dates: '', bullets: [] };
        } else if (!currentExperience.company) {
          currentExperience.company = line;
        }
      }
    } else if (currentSection === 'education') {
      if (line.length > 0) {
        sections.education.push(line);
      }
    } else if (currentSection === 'skills' || currentSection === 'tools') {
      // Split by common delimiters
      const items = line.split(/[,•|]/).map(s => cleanText(s)).filter(s => s && s.length > 1 && s.length < 80);
      if (currentSection === 'skills') {
        sections.skills.push(...items);
      } else {
        sections.tools.push(...items);
      }
    } else if (currentSection === 'certifications') {
      if (line.length > 5) {
        sections.certifications.push(line.replace(/^[•\-*]\s*/, ''));
      }
    } else if (currentSection === 'achievements') {
      if (line.length > 10) {
        sections.achievements.push(line.replace(/^[•\-*►→▸]\s*/, ''));
      }
    }
  }
  
  // Finalize
  if (currentExperience && currentExperience.title) {
    sections.experience.push(currentExperience);
  }
  sections.summary = summaryLines.join(' ');
  
  // Dedupe skills
  sections.skills = [...new Set(sections.skills)];
  
  return sections;
};

// Convert image URL/data to base64 for embedding
const getImageAsBase64 = async (imageSource) => {
  if (!imageSource) return null;
  
  try {
    // If already base64
    if (imageSource.startsWith('data:image')) {
      return imageSource.split(',')[1];
    }
    
    // Fetch and convert
    const response = await fetch(imageSource);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image:', error);
    return null;
  }
};

// Template Components for Preview
const HarvardTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 font-serif min-h-[800px]" style={{ fontFamily: 'Georgia, serif' }}>
    <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
      {profilePhoto && (
        <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-gray-300" />
      )}
      <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase">{parsed?.name || 'Your Name'}</h1>
      <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm text-gray-600">
        {parsed?.contact?.map((c, i) => <span key={i}>{c}</span>)}
      </div>
    </div>
    
    {parsed?.summary && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
        <p className="text-gray-700 leading-relaxed text-justify">{parsed.summary}</p>
      </div>
    )}
    
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
    
    {parsed?.skills?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Skills & Expertise</h2>
        <p className="text-gray-700 text-sm">{parsed.skills.slice(0, 20).join(' • ')}</p>
      </div>
    )}
    
    {parsed?.education?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Education</h2>
        {parsed.education.map((edu, i) => (
          <p key={i} className="text-gray-700 text-sm">{edu}</p>
        ))}
      </div>
    )}
  </div>
);

const ModernTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white min-h-[800px] flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div className="w-[30%] bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6">
      {profilePhoto ? (
        <img src={profilePhoto} alt="Profile" className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-white/20" />
      ) : (
        <div className="w-28 h-28 rounded-full mx-auto mb-4 bg-slate-700 flex items-center justify-center text-3xl font-bold">
          {parsed?.name?.charAt(0) || 'U'}
        </div>
      )}
      
      <h1 className="text-xl font-bold text-center mb-6">{parsed?.name || 'Your Name'}</h1>
      
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Contact</h3>
        <div className="space-y-2 text-sm text-slate-300">
          {parsed?.contact?.map((c, i) => <p key={i} className="break-words">{c}</p>)}
        </div>
      </div>
      
      {parsed?.skills?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {parsed.skills.slice(0, 15).map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
    
    <div className="w-[70%] p-8">
      {parsed?.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-3">Summary</h2>
          <p className="text-gray-600 leading-relaxed">{parsed.summary}</p>
        </div>
      )}
      
      {parsed?.experience?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-4">Experience</h2>
          {parsed.experience.map((exp, i) => (
            <div key={i} className="mb-5 pl-4 border-l-2 border-slate-200">
              <h3 className="font-bold text-gray-900">{exp.title}</h3>
              {exp.company && <p className="text-[#2A5C82] text-sm">{exp.company}</p>}
              <p className="text-xs text-gray-500 mb-2">{exp.dates}</p>
              <ul className="space-y-1">
                {exp.bullets?.map((bullet, j) => (
                  <li key={j} className="text-gray-600 text-sm">• {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      {parsed?.education?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-3">Education</h2>
          {parsed.education.map((edu, i) => (
            <p key={i} className="text-gray-700 text-sm">{edu}</p>
          ))}
        </div>
      )}
    </div>
  </div>
);

const ImpactTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[800px]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div className="flex items-center gap-6 mb-6 pb-6 border-b-4 border-[#2A5C82]">
      {profilePhoto && (
        <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-lg object-cover shadow-lg" />
      )}
      <div className="flex-1">
        <h1 className="text-3xl font-black text-gray-900">{parsed?.name || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
          {parsed?.contact?.map((c, i) => <span key={i} className="bg-gray-100 px-2 py-1 rounded">{c}</span>)}
        </div>
      </div>
    </div>
    
    {parsed?.summary && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#2A5C82] uppercase mb-2">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed border-l-4 border-[#2A5C82] pl-4 bg-gray-50 py-3">{parsed.summary}</p>
      </div>
    )}
    
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        {parsed?.experience?.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#2A5C82] uppercase mb-4 border-b-2 border-gray-200 pb-2">Career History</h2>
            {parsed.experience.map((exp, i) => (
              <div key={i} className="mb-5">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-bold text-gray-900 text-lg">{exp.title}</h3>
                  {exp.company && <p className="text-[#2A5C82] font-medium">{exp.company}</p>}
                  <p className="text-xs text-gray-500">{exp.dates}</p>
                </div>
                <ul className="mt-3 space-y-2 pl-3">
                  {exp.bullets?.map((bullet, j) => (
                    <li key={j} className="text-gray-700 text-sm">→ {bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {parsed?.skills?.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-3">Core Skills</h2>
            <div className="space-y-2">
              {parsed.skills.slice(0, 10).map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#2A5C82] rounded-full"></div>
                  <span className="text-sm text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {parsed?.education?.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-bold text-[#2A5C82] uppercase mb-3">Education</h2>
            {parsed.education.map((edu, i) => (
              <p key={i} className="text-sm text-gray-700 mb-1">{edu}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const MinimalTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
    <div className="flex items-center gap-6 mb-6">
      {profilePhoto && (
        <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{parsed?.name || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
          {parsed?.contact?.map((c, i) => <span key={i}>{c}{i < parsed.contact.length - 1 ? ' | ' : ''}</span>)}
        </div>
      </div>
    </div>
    
    <hr className="border-gray-300 mb-6" />
    
    {parsed?.summary && (
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Summary</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{parsed.summary}</p>
      </div>
    )}
    
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
  const [editedResume, setEditedResume] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const resumeRef = useRef(null);
  const [parsedResume, setParsedResume] = useState(null);

  useEffect(() => {
    const cleanedResume = cleanResumeText(data.optimizedResume || "");
    const cleanedCoverLetter = cleanResumeText(data.coverLetter || "");
    setEditedResume(cleanedResume);
    setEditedCoverLetter(cleanedCoverLetter);
  }, [data.optimizedResume, data.coverLetter]);

  useEffect(() => {
    const parsed = parseResumeText(editedResume);
    setParsedResume(parsed);
  }, [editedResume]);

  // Export to professional DOCX with photo and proper layout
  const exportToDOCX = async (type = "resume") => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to the Terms of Use before downloading.", variant: "destructive" });
      return;
    }

    setIsExporting(true);

    try {
      const parsed = parsedResume;
      const children = [];
      const template = data.selectedTemplate || 'harvard';
      
      // Get profile photo as base64
      let photoData = null;
      if (data.profilePhotoPreview) {
        photoData = await getImageAsBase64(data.profilePhotoPreview);
      }

      // Header section with photo
      if (photoData && (template === 'harvard' || template === 'impact' || template === 'minimal')) {
        try {
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: Buffer.from(photoData, 'base64'),
                  transformation: { width: 100, height: 100 },
                  type: 'png',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          );
        } catch (imgErr) {
          console.log('Could not embed image:', imgErr);
        }
      }

      // Name - centered, large
      if (parsed?.name) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: parsed.name.toUpperCase(), bold: true, size: 36, font: "Calibri" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          })
        );
      }

      // Contact info - centered
      if (parsed?.contact?.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: parsed.contact.join(' | '), size: 20, color: "666666", font: "Calibri" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          })
        );
      }

      // Divider
      children.push(
        new Paragraph({
          border: { bottom: { color: "2A5C82", size: 12, style: BorderStyle.SINGLE } },
          spacing: { after: 300 },
        })
      );

      // Summary
      if (parsed?.summary) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 24, color: "2A5C82", font: "Calibri" })],
            spacing: { before: 200, after: 100 },
          })
        );
        children.push(
          new Paragraph({
            children: [new TextRun({ text: parsed.summary, size: 22, font: "Calibri" })],
            spacing: { after: 200 },
          })
        );
      }

      // Skills
      if (parsed?.skills?.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "SKILLS & EXPERTISE", bold: true, size: 24, color: "2A5C82", font: "Calibri" })],
            spacing: { before: 200, after: 100 },
          })
        );
        children.push(
          new Paragraph({
            children: [new TextRun({ text: parsed.skills.slice(0, 25).join(' • '), size: 20, font: "Calibri" })],
            spacing: { after: 200 },
          })
        );
      }

      // Experience
      if (parsed?.experience?.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "PROFESSIONAL EXPERIENCE", bold: true, size: 24, color: "2A5C82", font: "Calibri" })],
            spacing: { before: 200, after: 150 },
          })
        );

        parsed.experience.forEach((exp) => {
          // Job title and dates on same line
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: exp.title, bold: true, size: 22, font: "Calibri" }),
                new TextRun({ text: exp.dates ? `  |  ${exp.dates}` : '', size: 20, color: "666666", font: "Calibri" }),
              ],
              spacing: { before: 150, after: 50 },
            })
          );

          // Company
          if (exp.company) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: exp.company, italics: true, size: 20, color: "2A5C82", font: "Calibri" })],
                spacing: { after: 80 },
              })
            );
          }

          // Bullets
          exp.bullets?.forEach((bullet) => {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: bullet, size: 20, font: "Calibri" })],
                bullet: { level: 0 },
                spacing: { after: 60 },
              })
            );
          });
        });
      }

      // Education
      if (parsed?.education?.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "EDUCATION", bold: true, size: 24, color: "2A5C82", font: "Calibri" })],
            spacing: { before: 200, after: 100 },
          })
        );
        parsed.education.forEach((edu) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: edu, size: 20, font: "Calibri" })],
              spacing: { after: 60 },
            })
          );
        });
      }

      // Certifications
      if (parsed?.certifications?.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "CERTIFICATIONS", bold: true, size: 24, color: "2A5C82", font: "Calibri" })],
            spacing: { before: 200, after: 100 },
          })
        );
        parsed.certifications.forEach((cert) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: cert, size: 20, font: "Calibri" })],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
        });
      }

      // Achievements
      if (parsed?.achievements?.length > 0) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: "KEY ACHIEVEMENTS", bold: true, size: 24, color: "2A5C82", font: "Calibri" })],
            spacing: { before: 200, after: 100 },
          })
        );
        parsed.achievements.forEach((ach) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: ach, size: 20, font: "Calibri" })],
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
        });
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const templateName = template;
      const date = new Date().toISOString().split("T")[0];
      saveAs(blob, `${templateName}_resume_${date}.docx`);

      toast({ title: "Download Complete", description: "Your professionally formatted DOCX has been downloaded." });
    } catch (error) {
      console.error("DOCX Export error:", error);
      toast({ title: "Export Failed", description: "Could not generate DOCX: " + error.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async (type = "resume") => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to the Terms of Use before downloading.", variant: "destructive" });
      return;
    }

    setIsExporting(true);

    try {
      const parsed = parsedResume;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let y = margin;

      // Add profile photo if available
      if (data.profilePhotoPreview) {
        try {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = data.profilePhotoPreview;
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          
          pdf.addImage(imgData, 'JPEG', (pageWidth - 25) / 2, y, 25, 25);
          y += 30;
        } catch (imgErr) {
          console.log('Could not add photo to PDF:', imgErr);
        }
      }

      // Name
      if (parsed?.name) {
        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(parsed.name.toUpperCase(), pageWidth / 2, y, { align: "center" });
        y += 8;
      }

      // Contact
      if (parsed?.contact?.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        const contactText = parsed.contact.join(' | ');
        const contactLines = pdf.splitTextToSize(contactText, maxWidth);
        pdf.text(contactLines, pageWidth / 2, y, { align: "center" });
        y += contactLines.length * 4 + 3;
      }

      // Divider
      pdf.setDrawColor(42, 92, 130);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Helper function for section header
      const addSectionHeader = (title) => {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(42, 92, 130);
        pdf.text(title, margin, y);
        y += 2;
        pdf.setDrawColor(42, 92, 130);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, margin + pdf.getTextWidth(title), y);
        y += 6;
      };

      // Summary
      if (parsed?.summary) {
        addSectionHeader("PROFESSIONAL SUMMARY");
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const summaryLines = pdf.splitTextToSize(parsed.summary, maxWidth);
        pdf.text(summaryLines, margin, y);
        y += summaryLines.length * 4.5 + 5;
      }

      // Skills
      if (parsed?.skills?.length > 0) {
        addSectionHeader("SKILLS & EXPERTISE");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const skillsText = parsed.skills.slice(0, 25).join(' • ');
        const skillLines = pdf.splitTextToSize(skillsText, maxWidth);
        pdf.text(skillLines, margin, y);
        y += skillLines.length * 4 + 5;
      }

      // Experience
      if (parsed?.experience?.length > 0) {
        addSectionHeader("PROFESSIONAL EXPERIENCE");
        
        parsed.experience.forEach((exp) => {
          if (y > pageHeight - 40) {
            pdf.addPage();
            y = margin;
          }

          // Title and dates
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text(exp.title, margin, y);
          
          if (exp.dates) {
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(100, 100, 100);
            pdf.text(exp.dates, pageWidth - margin, y, { align: "right" });
          }
          y += 5;

          // Company
          if (exp.company) {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(42, 92, 130);
            pdf.text(exp.company, margin, y);
            y += 5;
          }

          // Bullets
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          exp.bullets?.forEach((bullet) => {
            if (y > pageHeight - 15) {
              pdf.addPage();
              y = margin;
            }
            const bulletLines = pdf.splitTextToSize(bullet, maxWidth - 5);
            pdf.text('•', margin, y);
            pdf.text(bulletLines, margin + 4, y);
            y += bulletLines.length * 4 + 2;
          });
          y += 3;
        });
      }

      // Education
      if (parsed?.education?.length > 0) {
        addSectionHeader("EDUCATION");
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        parsed.education.forEach((edu) => {
          pdf.text(edu, margin, y);
          y += 5;
        });
      }

      const templateName = data.selectedTemplate || 'resume';
      const date = new Date().toISOString().split("T")[0];
      pdf.save(`${templateName}_resume_${date}.pdf`);

      toast({ title: "Download Complete", description: "Your PDF has been downloaded." });
    } catch (error) {
      console.error("PDF Export error:", error);
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (type = "resume") => {
    const content = type === "resume" ? editedResume : editedCoverLetter;
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: "Copied!", description: "Clean text copied to clipboard." });
    });
  };

  const renderTemplate = () => {
    const templateProps = { data, parsed: parsedResume, profilePhoto: data.profilePhotoPreview };
    switch (data.selectedTemplate) {
      case 'modern': return <ModernTemplate {...templateProps} />;
      case 'impact': return <ImpactTemplate {...templateProps} />;
      case 'minimal': return <MinimalTemplate {...templateProps} />;
      case 'harvard': default: return <HarvardTemplate {...templateProps} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2A5C82]" />
              Preview - {data.selectedTemplate?.charAt(0).toUpperCase() + data.selectedTemplate?.slice(1)} Template
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(activeTab)}>
                <Copy className="w-4 h-4 mr-1" /> Copy
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
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 mb-2">Edit mode: Modify the text below</p>
                  <textarea
                    value={editedResume}
                    onChange={(e) => { setEditedResume(e.target.value); updateData({ optimizedResume: e.target.value }); }}
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
                  onBlur={(e) => { setEditedCoverLetter(e.target.innerText); updateData({ coverLetter: e.target.innerText }); }}
                  className={`whitespace-pre-wrap text-sm leading-relaxed outline-none ${editMode ? "bg-blue-50 p-2 rounded border-2 border-blue-300" : ""}`}
                >
                  {editedCoverLetter || "No cover letter generated yet."}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {data.matchScore && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${data.matchScore >= 70 ? "bg-green-500" : data.matchScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}>
              {data.matchScore}%
            </div>
            <div>
              <p className="font-medium text-slate-700">ATS Match Score</p>
              <p className="text-sm text-slate-500">{data.matchScore >= 70 ? "Excellent!" : "Consider adding more keywords"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => goToStep(2)}>Improve</Button>
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={data.agreedToTerms} onCheckedChange={(checked) => updateData({ agreedToTerms: checked })} />
            <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
              I have reviewed my resume and agree to the{" "}
              <Dialog>
                <DialogTrigger className="text-[#2A5C82] underline">Terms of Use</DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Terms</DialogTitle></DialogHeader>
                  <p className="text-sm text-slate-600">Please verify all information before submitting.</p>
                </DialogContent>
              </Dialog>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-medium text-slate-700 mb-4 text-center">Download Your Resume</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => exportToPDF("resume")} disabled={!data.agreedToTerms || isExporting} className="bg-[#2A5C82] hover:bg-[#1e4460] text-white">
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
          <Button variant="outline" onClick={() => exportToDOCX("resume")} disabled={!data.agreedToTerms || isExporting}>
            <FileText className="w-4 h-4 mr-2" />
            Download DOCX
          </Button>
          <Button variant="outline" onClick={() => copyToClipboard("resume")} disabled={!data.agreedToTerms}>
            <FileDown className="w-4 h-4 mr-2" />
            Copy Text
          </Button>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-green-700">
          <p className="font-medium">Professional Export Ready!</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-green-600">
            <li>Photo included (if uploaded)</li>
            <li>Clean formatting - no markdown symbols</li>
            <li>Replace [X%] placeholders with your actual numbers</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="ghost" onClick={() => goToStep(1)} className="text-slate-500">New Resume</Button>
      </div>
    </div>
  );
};

export default PreviewExport;
