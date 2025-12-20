import React from "react";
import { Layout, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const templates = [
  {
    id: "harvard",
    name: "Harvard Executive",
    description: "Single column, Serif font, centered headers, zero icons",
    bestFor: "Executive & Leadership roles",
    preview: {
      font: "Georgia, serif",
      layout: "single",
      headerAlign: "center",
      color: "#000000",
    },
  },
  {
    id: "modern",
    name: "Modern Tech",
    description: "70/30 split, Sans-serif font, sidebar for skills",
    bestFor: "Tech & Corporate/Finance",
    preview: {
      font: "Inter, sans-serif",
      layout: "split",
      sidebarColor: "#F4F7F9",
      color: "#2A5C82",
    },
  },
  {
    id: "impact",
    name: "Impact-First",
    description: "Wide margins, bold headers, 'Key Wins' box",
    bestFor: "Sales & Results-driven roles",
    preview: {
      font: "Inter, sans-serif",
      layout: "single",
      headerColor: "#2A5C82",
      hasKeyWins: true,
    },
  },
  {
    id: "minimal",
    name: "Minimalist ATS",
    description: "Pure text, top-to-bottom flow, Arial, high readability",
    bestFor: "Entry-level & Big Tech applications",
    preview: {
      font: "Arial, sans-serif",
      layout: "single",
      minimal: true,
      color: "#333333",
    },
  },
];

const TemplatePreview = ({ template, isSelected }) => {
  const { preview } = template;

  return (
    <div 
      className={`relative h-48 bg-white rounded border overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-[#2A5C82]' : 'border-slate-200'
      }`}
      style={{ fontFamily: preview.font }}
    >
      {/* Mini resume preview */}
      <div className="p-3 h-full">
        {preview.layout === 'split' ? (
          <div className="flex h-full gap-2">
            {/* Sidebar */}
            <div 
              className="w-1/3 rounded p-2"
              style={{ backgroundColor: preview.sidebarColor }}
            >
              <div className="w-8 h-8 bg-slate-300 rounded-full mx-auto mb-2" />
              <div className="h-2 bg-slate-300 rounded w-full mb-1" />
              <div className="h-2 bg-slate-300 rounded w-3/4 mb-3" />
              <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
              <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
              <div className="h-1.5 bg-slate-200 rounded w-2/3" />
            </div>
            {/* Main */}
            <div className="flex-1">
              <div className="h-3 rounded w-3/4 mb-2" style={{ backgroundColor: preview.color }} />
              <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
              <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
              <div className="h-1.5 bg-slate-200 rounded w-5/6 mb-3" />
              <div className="h-2 rounded w-1/2 mb-1" style={{ backgroundColor: preview.color }} />
              <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
              <div className="h-1.5 bg-slate-200 rounded w-4/5" />
            </div>
          </div>
        ) : (
          <div className="h-full">
            {/* Header */}
            <div className={preview.headerAlign === 'center' ? 'text-center' : ''}>
              <div 
                className="h-3 rounded w-1/2 mx-auto mb-1" 
                style={{ backgroundColor: preview.headerColor || preview.color }}
              />
              <div className="h-1.5 bg-slate-200 rounded w-1/3 mx-auto mb-3" />
            </div>
            
            {/* Key Wins Box */}
            {preview.hasKeyWins && (
              <div className="border rounded p-2 mb-3" style={{ borderColor: preview.headerColor }}>
                <div className="h-2 rounded w-1/4 mb-1" style={{ backgroundColor: preview.headerColor }} />
                <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
                <div className="h-1 bg-slate-200 rounded w-5/6" />
              </div>
            )}
            
            {/* Content */}
            <div className="h-2 rounded w-1/3 mb-2" style={{ backgroundColor: preview.headerColor || preview.color }} />
            <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
            <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
            <div className="h-1.5 bg-slate-200 rounded w-4/5 mb-3" />
            
            <div className="h-2 rounded w-1/4 mb-2" style={{ backgroundColor: preview.headerColor || preview.color }} />
            <div className="h-1.5 bg-slate-200 rounded w-full mb-1" />
            <div className="h-1.5 bg-slate-200 rounded w-3/4" />
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#2A5C82] rounded-full flex items-center justify-center">
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
            All templates are 100% ATS-friendly with selectable text
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => updateData({ selectedTemplate: template.id })}
                className="text-left group"
              >
                <TemplatePreview 
                  template={template} 
                  isSelected={data.selectedTemplate === template.id}
                />
                <div className="mt-2">
                  <h4 className={`font-medium ${
                    data.selectedTemplate === template.id 
                      ? 'text-[#2A5C82]' 
                      : 'text-slate-700 group-hover:text-[#2A5C82]'
                  }`}>
                    {template.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {template.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Best for: {template.bestFor}
                  </p>
                </div>
              </button>
            ))}
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
          Continue to Export
        </Button>
      </div>
    </div>
  );
};

export default TemplateSelector;
