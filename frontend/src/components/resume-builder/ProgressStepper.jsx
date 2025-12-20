import React from "react";
import { Upload, Wand2, Layout, Download, Check } from "lucide-react";

const steps = [
  { id: 1, name: "Upload", icon: Upload, description: "Resume & JD" },
  { id: 2, name: "Customize", icon: Wand2, description: "AI Optimization" },
  { id: 3, name: "Select Style", icon: Layout, description: "Templates" },
  { id: 4, name: "Export", icon: Download, description: "Download" },
];

const ProgressStepper = ({ currentStep, goToStep }) => {
  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => goToStep(step.id)}
                className={`flex flex-col items-center group transition-all duration-300 ${
                  isCurrent ? "scale-105" : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-[#2A5C82] text-white shadow-lg shadow-blue-200"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isCurrent
                      ? "text-[#2A5C82]"
                      : isCompleted
                      ? "text-green-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.name}
                </span>
                <span className="text-xs text-slate-400">{step.description}</span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={`w-16 lg:w-24 h-1 mx-2 rounded-full transition-colors duration-300 ${
                    currentStep > step.id ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-[#2A5C82] text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </button>
            );
          })}        </div>
        <div className="text-center">
          <p className="font-medium text-[#2A5C82]">
            Step {currentStep}: {steps[currentStep - 1].name}
          </p>
          <p className="text-sm text-slate-400">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;
