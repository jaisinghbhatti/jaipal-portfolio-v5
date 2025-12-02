import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-blue-100 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Jaipal Singh
              </h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/about-me"
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              About Me
            </Link>
            
            <Link
              to="/blog"
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Blog
            </Link>
          </nav>
          
          <div className="hidden md:flex">
            <Link to="/about-me#contact">
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Let's Connect
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-blue-100">
              <Link
                to="/about-me"
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About Me
              </Link>
              <Link
                to="/blog"
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <div className="px-3 py-2">
                <Link to="/about-me#contact" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full shadow-md"
                  >
                    Let's Connect
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;