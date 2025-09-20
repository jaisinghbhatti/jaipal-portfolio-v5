import React from "react";
import { Button } from "./ui/button";
import { LinkedinIcon, MailIcon, DownloadIcon } from "lucide-react";

const HeroSection = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
                Jaipal Singh
              </h1>
              <h2 className="text-xl md:text-2xl text-slate-700 font-medium">
                Senior Marketing Manager & Digital Marketing Leader
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Highly accomplished and results-driven Digital Marketing leader with 10+ years of experience 
                in driving revenue growth, leading high-performing teams, and executing strategic marketing initiatives.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => scrollToSection("contact")}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <MailIcon className="mr-2 h-5 w-5" />
                Get In Touch
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white px-8 py-3 text-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download Resume
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-full"
              >
                <LinkedinIcon className="h-6 w-6" />
              </Button>
              <div className="text-sm text-slate-600">
                Connect with me on LinkedIn
              </div>
            </div>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden shadow-2xl border-4 border-white ring-4 ring-blue-200">
                <img
                  src="https://customer-assets.emergentagent.com/job_jsb-showcase/artifacts/iozlvq2a_PSX_20171017_182352.jpg"
                  alt="Jaipal Singh - Professional Headshot"
                  className="w-full h-full object-cover object-center"
                  style={{ objectPosition: 'center 20%' }}
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                10+ Years Experience
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;