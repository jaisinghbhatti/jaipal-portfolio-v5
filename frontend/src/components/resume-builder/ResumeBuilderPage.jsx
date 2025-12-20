import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Header from "../Header";
import Footer from "../Footer";
import ProgressStepper from "./ProgressStepper";
import InputModule from "./InputModule";
import CustomizeModule from "./CustomizeModule";
import TemplateSelector from "./TemplateSelector";
import PreviewExport from "./PreviewExport";
import { useToast } from "../../hooks/use-toast";

const STORAGE_KEY = "resumeBuilderData";

const defaultState = {
  // Step 1: Input
  resumeText: "",
  resumeFile: null,
  resumeParsed: null,
  jobDescription: "",
  jdFile: null,
  profilePhoto: null,
  profilePhotoPreview: null,
  
  // Step 2: Customize
  tone: "executive",
  optimizedResume: null,
  matchScore: null,
  missingKeywords: [],
  coverLetter: "",
  
  // Step 3: Template
  selectedTemplate: "harvard",
  
  // Step 4: Export
  agreedToTerms: false,
};

const ResumeBuilderPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Don't restore file objects (they can't be serialized)
        setData(prev => ({
          ...prev,
          ...parsed,
          resumeFile: null,
          jdFile: null,
          profilePhoto: null,
        }));
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // Save to localStorage on data change
  useEffect(() => {
    const toSave = { ...data };
    // Remove non-serializable items
    delete toSave.resumeFile;
    delete toSave.jdFile;
    delete toSave.profilePhoto;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [data]);

  const updateData = (updates) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  };

  const clearAllData = () => {
    setData(defaultState);
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Data Cleared",
      description: "All your data has been cleared.",
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <InputModule
            data={data}
            updateData={updateData}
            onNext={nextStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 2:
        return (
          <CustomizeModule
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 3:
        return (
          <TemplateSelector
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <PreviewExport
            data={data}
            updateData={updateData}
            onBack={prevStep}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Resume Builder | Jaipal Singh</title>
        <meta name="description" content="Build ATS-friendly, AI-optimized resumes tailored to your dream job. Free AI-powered resume builder by Jaipal Singh." />
        <meta property="og:title" content="AI Resume Builder | Jaipal Singh" />
        <meta property="og:description" content="Build ATS-friendly, AI-optimized resumes tailored to your dream job." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        <Header />
        
        <main className="pt-20 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                AI Resume Builder
              </h1>
              <p className="text-slate-600 text-base max-w-2xl mx-auto">
                Create ATS-friendly resumes optimized for your dream job using AI
              </p>
            </div>

            {/* Progress Stepper */}
            <ProgressStepper currentStep={currentStep} goToStep={goToStep} />

            {/* Main Content */}
            <div className="mt-8">
              {renderStep()}
            </div>

            {/* Clear Data Button */}
            <div className="text-center mt-8">
              <button
                onClick={clearAllData}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear all data and start over
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ResumeBuilderPage;
