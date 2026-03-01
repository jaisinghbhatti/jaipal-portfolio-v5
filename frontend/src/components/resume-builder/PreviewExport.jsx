import React, { useState, useRef, useEffect } from "react";
import { Download, Edit3, Eye, FileText, Info, Loader2, FileDown, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

// Clean markdown from text - remove **, *, etc. and return clean text
const cleanMarkdown = (text) => {
  if (!text) return '';
  return text
    // Fix broken markdown patterns like *text** or **text*
    .replace(/\*([^*]+)\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*/g, '$1')
    // Remove bold markdown **text**
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markdown *text*
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove headers ## or ###
    .replace(/^#{1,6}\s*/gm, '')
    // Remove code blocks ```
    .replace(/```[^`]*```/g, '')
    // Remove inline code `text`
    .replace(/`([^`]+)`/g, '$1')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Clean entire resume text while preserving structure
const cleanResumeText = (text) => {
  if (!text) return '';
  return text.split('\n').map(line => {
    // Preserve empty lines
    if (!line.trim()) return '';
    // Clean each line
    return cleanMarkdown(line);
  }).join('\n');
};

// Parse resume text into structured sections
const parseResumeText = (text) => {
  if (!text) return null;
  
  // Clean the text first
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
    achievements: []
  };
  
  let currentSection = 'header';
  let currentExperience = null;
  let currentEducation = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const upperLine = line.toUpperCase();
    
    // Detect section headers
    if (upperLine.includes('SUMMARY') || upperLine.includes('OBJECTIVE') || upperLine.includes('PROFILE') || upperLine.includes('ABOUT')) {
      currentSection = 'summary';
      continue;
    } else if (upperLine.includes('EXPERIENCE') || upperLine.includes('EMPLOYMENT') || upperLine.includes('WORK HISTORY') || upperLine.includes('CAREER')) {
      currentSection = 'experience';
      continue;
    } else if (upperLine.includes('EDUCATION') || upperLine.includes('ACADEMIC')) {
      currentSection = 'education';
      continue;
    } else if (upperLine.includes('SKILL') || upperLine.includes('COMPETENC') || upperLine.includes('TECHNICAL') || upperLine.includes('CORE COMPETENCIES') || upperLine.includes('KEY SKILLS')) {
      currentSection = 'skills';
      continue;
    } else if (upperLine.includes('CERTIF') || upperLine.includes('LICENSE')) {
      currentSection = 'certifications';
      continue;
    } else if (upperLine.includes('ACHIEVEMENT') || upperLine.includes('AWARD') || upperLine.includes('KEY WINS')) {
      currentSection = 'achievements';
      continue;
    } else if (upperLine.includes('TOOL STACK') || upperLine.includes('TOOLS')) {
      currentSection = 'skills';
      continue;
    }
    
    // Parse content based on section
    if (currentSection === 'header') {
      if (!sections.name && line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('|') && !line.includes('Ph:')) {
        sections.name = line;
      } else if (line.includes('@') || line.includes('|') || line.includes('•') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line) || line.includes('Ph:') || line.includes('LinkedIn')) {
        sections.contact.push(line);
      } else if (line.length < 80 && !sections.title && !line.includes('@')) {
        sections.title = line;
      }
    } else if (currentSection === 'summary') {
      // Skip AIDA markers like **A**ttention, **I**nterest, etc.
      const cleanLine = line.replace(/^\*?\*?[AIDA]\*?\*?[a-z]*:\s*/i, '');
      if (cleanLine.length > 0) {
        sections.summary += (sections.summary ? ' ' : '') + cleanLine;
      }
    } else if (currentSection === 'experience') {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('►') || line.startsWith('→')) {
        if (currentExperience) {
          const bulletText = line.replace(/^[•\-*►→]\s*/, '');
          currentExperience.bullets.push(bulletText);
        }
      } else if (line.length > 0) {
        // Check for date patterns
        const datePattern = /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|\d{4})\b/i;
        if (datePattern.test(line) && line.length < 60) {
          if (currentExperience && !currentExperience.dates) {
            currentExperience.dates = line;
          }
        } else if (!line.startsWith(' ') && line.length < 120 && !line.includes('•')) {
          if (currentExperience && currentExperience.title) {
            sections.experience.push(currentExperience);
          }
          currentExperience = { title: line, company: '', dates: '', bullets: [] };
        } else if (currentExperience && !currentExperience.company && line.length < 80) {
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
        const yearMatch = line.match(/\d{4}/);
        if (yearMatch) currentEducation.year = yearMatch[0];
      }
    } else if (currentSection === 'skills') {
      const skillItems = line.split(/[,•|]/).map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 60);
      sections.skills.push(...skillItems);
    } else if (currentSection === 'certifications') {
      sections.certifications.push(line.replace(/^[•\-*]\s*/, ''));
    } else if (currentSection === 'achievements') {
      sections.achievements.push(line.replace(/^[•\-*►→]\s*/, ''));
    }
  }
  
  // Add last items
  if (currentExperience && currentExperience.title) sections.experience.push(currentExperience);
  if (currentEducation) sections.education.push(currentEducation);
  
  return sections;
};

// Harvard Executive Template - Classic single column
const HarvardTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 font-serif min-h-[800px]" style={{ fontFamily: 'Georgia, serif' }}>
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
    
    {parsed?.education?.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">Education</h2>
        {parsed.education.map((edu, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">{edu.school}</span>
              <span className="text-sm text-gray-500">{edu.year}</span>
            </div>
          </div>
        ))}
      </div>
    )}
    
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
            {parsed.skills.slice(0, 12).map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
    
    <div className="w-[70%] p-8">
      {parsed?.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-[#2A5C82]"></span>About Me
          </h2>
          <p className="text-gray-600 leading-relaxed">{parsed.summary}</p>
        </div>
      )}
      
      {parsed?.experience?.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-[#2A5C82]"></span>Experience
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
                  <li key={j} className="text-gray-600 text-sm flex gap-2"><span className="text-[#2A5C82]">▸</span>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      {parsed?.education?.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#2A5C82] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-8 h-0.5 bg-[#2A5C82]"></span>Education
          </h2>
          {parsed.education.map((edu, i) => (
            <div key={i} className="mb-2 flex justify-between">
              <span className="font-semibold text-gray-900">{edu.school}</span>
              <span className="text-sm text-gray-500">{edu.year}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Impact-First Template
const ImpactTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[800px]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
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
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">{exp.title}</h3>
                    <span className="text-xs text-white bg-[#2A5C82] px-3 py-1 rounded-full">{exp.dates}</span>
                  </div>
                  {exp.company && <p className="text-[#2A5C82] font-medium">{exp.company}</p>}
                </div>
                <ul className="mt-3 space-y-2 pl-3">
                  {exp.bullets?.map((bullet, j) => (
                    <li key={j} className="text-gray-700 text-sm flex gap-2"><span className="text-[#2A5C82] font-bold">→</span>{bullet}</li>
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
              {parsed.skills.slice(0, 8).map((skill, i) => (
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

// Minimalist ATS Template
const MinimalTemplate = ({ data, parsed, profilePhoto }) => (
  <div className="bg-white p-8 min-h-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
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

  // Clean and set initial data
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

  // Generate proper text-based PDF with clean formatting
  const exportToPDF = async (type = "resume") => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to the Terms of Use before downloading.", variant: "destructive" });
      return;
    }

    setIsExporting(true);

    try {
      const content = type === "resume" ? editedResume : editedCoverLetter;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip empty section headers that might have been cleaned
        if (!line) {
          yPosition += 3;
          continue;
        }

        if (yPosition > pageHeight - margin - 10) {
          pdf.addPage();
          yPosition = margin;
        }

        const isHeader = /^[A-Z][A-Z\s&]+$/.test(line) && line.length < 50;
        const isName = i === 0 || (i < 3 && line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('|') && !line.includes('Ph:'));
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('►') || line.startsWith('→');
        const isDate = /^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}/i.test(line);

        if (isName && i < 3 && !line.includes('@') && !line.includes('Ph:')) {
          pdf.setFontSize(20);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text(line, pageWidth / 2, yPosition, { align: "center" });
          yPosition += 10;
        } else if (isHeader) {
          yPosition += 5;
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(42, 92, 130);
          pdf.text(line, margin, yPosition);
          yPosition += 2;
          pdf.setDrawColor(42, 92, 130);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPosition, margin + Math.min(pdf.getTextWidth(line), maxWidth), yPosition);
          yPosition += 6;
        } else if (isDate) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(100, 100, 100);
          pdf.text(line, margin, yPosition);
          yPosition += 5;
        } else if (isBullet) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          const bulletText = line.replace(/^[•\-*►→]\s*/, '');
          const wrappedLines = pdf.splitTextToSize(bulletText, maxWidth - 8);
          pdf.text('•', margin, yPosition);
          pdf.text(wrappedLines, margin + 5, yPosition);
          yPosition += wrappedLines.length * 5 + 2;
        } else if (line.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(60, 60, 60);
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          pdf.text(wrappedLines, margin, yPosition);
          yPosition += wrappedLines.length * 5 + 1;
        }
      }

      const templateName = data.selectedTemplate || 'resume';
      const date = new Date().toISOString().split("T")[0];
      pdf.save(`${templateName}_${date}.pdf`);

      toast({ title: "Download Complete", description: "Your PDF has been downloaded with clean formatting." });
    } catch (error) {
      console.error("PDF Export error:", error);
      toast({ title: "Export Failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Generate DOCX file with proper formatting
  const exportToDOCX = async (type = "resume") => {
    if (!data.agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to the Terms of Use before downloading.", variant: "destructive" });
      return;
    }

    setIsExporting(true);

    try {
      const content = type === "resume" ? editedResume : editedCoverLetter;
      const lines = content.split('\n');
      const children = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (!line) {
          children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
          continue;
        }
        
        const isHeader = /^[A-Z][A-Z\s&]+$/.test(line) && line.length < 50;
        const isName = i === 0 || (i < 3 && line.length > 0 && line.length < 50 && !line.includes('@') && !line.includes('|') && !line.includes('Ph:'));
        const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('►') || line.startsWith('→');
        const isDate = /^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}/i.test(line);
        const isJobTitle = line.includes('Sr.') || line.includes('Manager') || line.includes('Specialist') || line.includes('Director');

        if (isName && i < 3 && !line.includes('@') && !line.includes('Ph:')) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, size: 36, font: "Arial" })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          );
        } else if (isHeader) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, size: 24, color: "2A5C82", font: "Arial" })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
              border: { bottom: { color: "2A5C82", space: 1, size: 6, style: BorderStyle.SINGLE } },
            })
          );
        } else if (isDate) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, italics: true, size: 20, color: "666666", font: "Arial" })],
              spacing: { after: 80 },
            })
          );
        } else if (isJobTitle && !isBullet) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true, size: 22, font: "Arial" })],
              spacing: { before: 150, after: 50 },
            })
          );
        } else if (isBullet) {
          const bulletText = line.replace(/^[•\-*►→]\s*/, '');
          children.push(
            new Paragraph({
              children: [new TextRun({ text: bulletText, size: 22, font: "Arial" })],
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          );
        } else if (line.length > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 22, font: "Arial" })],
              spacing: { after: 100 },
            })
          );
        }
      }

      const doc = new Document({
        sections: [{ 
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children 
        }],
      });

      const blob = await Packer.toBlob(doc);
      const templateName = data.selectedTemplate || 'resume';
      const date = new Date().toISOString().split("T")[0];
      saveAs(blob, `${templateName}_${date}.docx`);

      toast({ title: "Download Complete", description: "Your DOCX has been downloaded with professional formatting." });
    } catch (error) {
      console.error("DOCX Export error:", error);
      toast({ title: "Export Failed", description: "Could not generate DOCX.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (type = "resume") => {
    const content = type === "resume" ? editedResume : editedCoverLetter;
    navigator.clipboard.writeText(content).then(() => {
      toast({ title: "Copied!", description: "Clean text copied to clipboard (no markdown symbols)." });
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
              Live Preview - {data.selectedTemplate?.charAt(0).toUpperCase() + data.selectedTemplate?.slice(1)} Template
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
                  <p className="text-sm text-yellow-700 mb-2">Edit mode: Modify the text below (markdown has been cleaned)</p>
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
          <p className="font-medium">Clean & Ready to Use!</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-green-600">
            <li>All markdown formatting (**, *, ##) has been removed</li>
            <li>Downloads are properly formatted PDF/DOCX files</li>
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
