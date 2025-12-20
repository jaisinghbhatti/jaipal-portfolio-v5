import React, { useState, useEffect } from "react";
import { Wand2, Target, AlertTriangle, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { useToast } from "../../hooks/use-toast";
import { analyzeResume, optimizeResume } from "../../services/resumeBuilderService";

const tones = [
  {
    id: "executive",
    name: "The Executive",
    description: "Professional & Formal",
    verbs: "Spearheaded, Orchestrated, Leveraged",
  },
  {
    id: "disruptor",
    name: "The Disruptor",
    description: "Bold & Confident",
    verbs: "Built, Scaled, Accelerated",
  },
  {
    id: "human",
    name: "The Human",
    description: "Friendly & Approachable",
    verbs: "Collaborated, Supported, Mentored",
  },
];

const CustomizeModule = ({ data, updateData, onNext, onBack, isLoading, setIsLoading }) => {
  const { toast } = useToast();
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  // Auto-analyze on mount if not already done
  useEffect(() => {
    if (!data.matchScore && !analyzed && !isLoading) {
      handleAnalyze();
    }
    // Only run once on component mount
  }, [analyzed, isLoading]); // eslint-disable-line

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalyzed(true);
    
    try {
      const result = await analyzeResume(
        data.resumeText,
        data.resumeParsed,
        data.jobDescription
      );
      
      updateData({
        matchScore: result.matchScore,
        missingKeywords: result.missingKeywords || [],
      });

      if (result.matchScore < 40) {
        toast({
          title: "Low Match Score",
          description: "Consider adding more relevant skills from the job description.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    
    toast({
      title: "AI Optimization Started",
      description: "AI has added placeholders like [X%]. Please fill these in with your actual achievements!",
    });

    try {
      const result = await optimizeResume(
        data.resumeText,
        data.resumeParsed,
        data.jobDescription,
        data.tone
      );
      
      updateData({
        optimizedResume: result.optimizedResume,
        coverLetter: result.coverLetter,
        matchScore: result.newMatchScore || data.matchScore,
      });

      toast({
        title: "Optimization Complete",
        description: "Your resume and cover letter have been optimized!",
      });
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Could not optimize your resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };

  const canProceed = data.optimizedResume;

  return (
    <div className="space-y-6">
      {/* Match Score Dashboard */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-[#2A5C82]" />
            ATS Match Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Score Circle */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={data.matchScore >= 70 ? "#22c55e" : data.matchScore >= 40 ? "#eab308" : "#ef4444"}
                    strokeWidth="12"
                    strokeDasharray={`${(data.matchScore || 0) * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-700">
                    {isLoading ? "..." : `${data.matchScore || 0}%`}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="mt-3"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            </div>

            {/* Missing Keywords */}
            <div className="flex-1">
              <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Missing High-Priority Keywords
              </h4>
              {data.missingKeywords && data.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full border border-red-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {isLoading ? "Analyzing..." : "No missing keywords detected. Great job!"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tone Selector */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[#2A5C82]" />
            Select Your Tone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => updateData({ tone: tone.id })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  data.tone === tone.id
                    ? "border-[#2A5C82] bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <h4 className="font-medium text-slate-700">{tone.name}</h4>
                <p className="text-sm text-slate-500">{tone.description}</p>
                <p className="text-xs text-slate-400 mt-2 italic">
                  Uses: {tone.verbs}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimize Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleOptimize}
          disabled={optimizing || isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
        >
          {optimizing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Optimizing with AI...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-2" />
              Optimize My Resume
            </>
          )}
        </Button>
      </div>

      {/* Optimized Preview */}
      {data.optimizedResume && (
        <Card className="border-green-200 bg-green-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-700">Optimized Resume Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                {typeof data.optimizedResume === 'string' 
                  ? data.optimizedResume 
                  : JSON.stringify(data.optimizedResume, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Letter Preview */}
      {data.coverLetter && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader 
            className="pb-3 cursor-pointer" 
            onClick={() => setShowCoverLetter(!showCoverLetter)}
          >
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Generated Cover Letter</span>
              {showCoverLetter ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
          {showCoverLetter && (
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                  {data.coverLetter}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#2A5C82] hover:bg-[#1e4460] text-white px-8"
        >
          Continue to Templates
        </Button>
      </div>
    </div>
  );
};

export default CustomizeModule;
