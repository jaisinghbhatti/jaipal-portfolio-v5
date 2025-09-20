import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-slate-800">Jaipal Singh</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => scrollToSection("about")}
              className="text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("expertise")}
              className="text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Expertise
            </button>
            <button
              onClick={() => scrollToSection("experience")}
              className="text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Experience
            </button>
            <button
              onClick={() => scrollToSection("achievements")}
              className="text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Achievements
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-slate-600 hover:text-slate-900 transition-colors duration-200"
            >
              Contact
            </button>
          </nav>
          
          <div className="hidden md:flex">
            <Button
              onClick={() => scrollToSection("contact")}
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              Let's Connect
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <button
                onClick={() => scrollToSection("about")}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 w-full text-left"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("expertise")}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 w-full text-left"
              >
                Expertise
              </button>
              <button
                onClick={() => scrollToSection("experience")}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 w-full text-left"
              >
                Experience
              </button>
              <button
                onClick={() => scrollToSection("achievements")}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 w-full text-left"
              >
                Achievements
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="block px-3 py-2 text-slate-600 hover:text-slate-900 w-full text-left"
              >
                Contact
              </button>
              <div className="px-3 py-2">
                <Button
                  onClick={() => scrollToSection("contact")}
                  className="bg-slate-800 hover:bg-slate-700 text-white w-full"
                >
                  Let's Connect
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;