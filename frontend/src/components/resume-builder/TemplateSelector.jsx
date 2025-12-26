import React from "react";
import { Layout, Check, User, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const templates = [
  {
    id: "harvard",
    name: "Harvard Executive",
    description: "Classic single column with serif fonts. Timeless elegance.",
    bestFor: "Executive & Leadership roles",
    colors: { primary: "#1a1a1a", secondary: "#666666", accent: "#333333" },
    style: "classic"
  },
  {
    id: "modern",
    name: "Modern Tech",
    description: "70/30 split with dark sidebar. Clean and contemporary.",
    bestFor: "Tech & Corporate roles",
    colors: { primary: "#1e293b", secondary: "#2A5C82", accent: "#64748b" },
    style: "split"
  },
  {
    id: "impact",
    name: "Impact-First",
    description: "Bold headers with Key Wins box. Results-focused design.",
    bestFor: "Sales & Marketing roles",
    colors: { primary: "#2A5C82", secondary: "#1e4460", accent: "#f59e0b" },
    style: "bold"
  },
  {
    id: "minimal",
    name: "Minimalist ATS",
    description: "Pure simplicity, maximum readability. ATS-optimized.",
    bestFor: "Entry-level & Big Tech",
    colors: { primary: "#374151", secondary: "#6b7280", accent: "#9ca3af" },
    style: "minimal"
  },
];

const TemplatePreview = ({ template, isSelected }) => {
  const { colors, style } = template;

  // Render different mini-preview styles
  const renderPreview = () => {
    switch (style) {
      case 'split':
        return (
          <div className="flex h-full">
            {/* Dark Sidebar */}
            <div className="w-[35%] p-2 rounded-l" style={{ backgroundColor: colors.primary }}>
              <div className="w-8 h-8 rounded-full bg-white/20 mx-auto mb-2" />
              <div className="h-2 bg-white/40 rounded w-full mb-1" />
              <div className="h-1.5 bg-white/20 rounded w-3/4 mx-auto mb-3" />
              <div className="space-y-1">
                <div className="h-1 bg-white/15 rounded w-full" />
                <div className="h-1 bg-white/15 rounded w-full" />
                <div className="h-1 bg-white/15 rounded w-4/5" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                <div className="h-2 w-6 bg-white/10 rounded" />
                <div className="h-2 w-8 bg-white/10 rounded" />
                <div className="h-2 w-5 bg-white/10 rounded" />
              </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 p-2 bg-white rounded-r">
              <div className="h-2 rounded w-16 mb-2" style={{ backgroundColor: colors.secondary }} />
              <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
              <div className="h-1 bg-slate-200 rounded w-5/6 mb-2" />
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.secondary }} />
                <div className="h-1.5 rounded w-20" style={{ backgroundColor: colors.secondary }} />
              </div>
              <div className="h-1 bg-slate-100 rounded w-full mb-0.5" />
              <div className="h-1 bg-slate-100 rounded w-4/5" />
            </div>
          </div>
        );
      
      case 'bold':
        return (
          <div className="p-2 bg-white h-full rounded">
            {/* Header with accent */}
            <div className="flex items-center gap-2 pb-2 mb-2 border-b-2" style={{ borderColor: colors.primary }}>
              <div className="w-6 h-6 rounded bg-slate-200" />
              <div>
                <div className="h-2 rounded w-16" style={{ backgroundColor: colors.primary }} />
                <div className="h-1 bg-slate-300 rounded w-12 mt-0.5" />
              </div>
            </div>
            {/* Key Wins Box */}
            <div className="p-1.5 rounded mb-2" style={{ backgroundColor: colors.primary }}>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
                <div className="h-1 bg-white/40 rounded w-10" />
              </div>
              <div className="flex gap-2">
                <div className="h-1 bg-white/20 rounded flex-1" />
                <div className="h-1 bg-white/20 rounded flex-1" />
              </div>
            </div>
            {/* Content */}
            <div className="h-1.5 rounded w-12 mb-1" style={{ backgroundColor: colors.primary }} />
            <div className="h-1 bg-slate-100 rounded w-full mb-0.5" />
            <div className="h-1 bg-slate-100 rounded w-4/5" />
          </div>
        );
      
      case 'minimal':
        return (
          <div className="p-3 bg-white h-full rounded">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-slate-200" />
              <div>
                <div className="h-2 bg-slate-700 rounded w-14" />
                <div className="h-1 bg-slate-300 rounded w-20 mt-0.5" />
              </div>
            </div>
            <hr className="border-slate-200 mb-2" />
            <div className="h-1 bg-slate-500 rounded w-8 mb-1" />
            <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
            <div className="h-1 bg-slate-200 rounded w-5/6 mb-2" />
            <div className="h-1 bg-slate-500 rounded w-10 mb-1" />
            <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
            <div className="h-1 bg-slate-200 rounded w-4/5" />
          </div>
        );
      
      case 'classic':
      default:
        return (
          <div className="p-3 bg-white h-full rounded" style={{ fontFamily: 'Georgia, serif' }}>
            {/* Centered Header */}
            <div className="text-center pb-2 mb-2 border-b border-slate-300">
              <div className="w-6 h-6 rounded-full bg-slate-200 mx-auto mb-1" />
              <div className="h-2 bg-slate-800 rounded w-16 mx-auto mb-0.5" />
              <div className="h-1 bg-slate-400 rounded w-12 mx-auto" />
            </div>
            {/* Section */}
            <div className="h-1.5 bg-slate-700 rounded w-14 mb-1" />
            <div className="border-b border-slate-200 pb-1 mb-1">
              <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
              <div className="h-1 bg-slate-200 rounded w-4/5" />
            </div>
            <div className="h-1.5 bg-slate-700 rounded w-10 mb-1" />
            <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
            <div className="h-1 bg-slate-200 rounded w-3/4" />
          </div>
        );
    }
  };

  return (
    <div 
      className={`relative h-44 rounded-lg border-2 overflow-hidden transition-all shadow-sm hover:shadow-md ${
        isSelected ? 'border-[#2A5C82] ring-2 ring-[#2A5C82]/20' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {renderPreview()}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#2A5C82] rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

const TemplateSelector = ({ data, updateData, onNext, onBack }) => {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#2A5C82]" />
            Choose Your Template
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            All templates are 100% ATS-friendly with professional designs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => updateData({ selectedTemplate: template.id })}
                className="text-left group focus:outline-none"
              >
                <TemplatePreview 
                  template={template} 
                  isSelected={data.selectedTemplate === template.id}
                />
                <div className="mt-3">
                  <h4 className={`font-semibold text-sm ${
                    data.selectedTemplate === template.id 
                      ? 'text-[#2A5C82]' 
                      : 'text-slate-700 group-hover:text-[#2A5C82]'
                  }`}>
                    {template.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{template.bestFor}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Template Features */}
          <div className="mt-8 p-4 bg-slate-50 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">All Templates Include:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-slate-600">Profile Photo Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-slate-600">ATS-Optimized Layout</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-slate-600">Professional Styling</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-slate-600">PDF Export</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-[#2A5C82] hover:bg-[#1e4460] text-white px-8"
        >
          Preview & Export
        </Button>
      </div>
    </div>
  );
};

export default TemplateSelector;
