import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { mockData } from "../data/mockData";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlogDropdownOpen, setIsBlogDropdownOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const handleNavigate = (sectionId) => {
    if (isHomePage) {
      scrollToSection(sectionId);
    } else {
      // If not on home page, navigate to home page with section
      window.location.href = `/#${sectionId}`;
    }
  };

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
            <button
              onClick={() => handleNavigate("about")}
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              About
            </button>
            
            {/* Blog Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsBlogDropdownOpen(true)}
              onMouseLeave={() => setIsBlogDropdownOpen(false)}
            >
              <Link
                to="/blog"
                className="flex items-center space-x-1 text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                <span>Blog</span>
                <ChevronDown className="h-4 w-4" />
              </Link>
              
              {/* Dropdown Menu */}
              {isBlogDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-blue-100 py-2 z-50">
                  <Link
                    to="/blog"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                  >
                    <div className="font-medium">All Articles</div>
                    <div className="text-xs text-slate-500">View all {mockData.blogs.length} blog posts</div>
                  </Link>
                  <div className="border-t border-slate-100 my-2"></div>
                  {mockData.blogs.slice(0, 3).map((blog) => (
                    <Link
                      key={blog.id}
                      to={`/blog/${blog.slug}`}
                      className="block px-4 py-3 hover:bg-blue-50 transition-colors duration-200"
                    >
                      <div className="font-medium text-sm text-slate-800 hover:text-blue-600 line-clamp-2">
                        {blog.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {blog.readTime} • {new Date(blog.publishedDate).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                  {mockData.blogs.length > 3 && (
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <Link
                        to="/blog"
                        className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all {mockData.blogs.length} articles →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleNavigate("expertise")}
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Expertise
            </button>
            <button
              onClick={() => handleNavigate("experience")}
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Experience
            </button>
            <button
              onClick={() => handleNavigate("achievements")}
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Achievements
            </button>
            <button
              onClick={() => handleNavigate("contact")}
              className="text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Contact
            </button>
          </nav>
          
          <div className="hidden md:flex">
            <Button
              onClick={() => handleNavigate("contact")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
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
              <button
                onClick={() => handleNavigate("about")}
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
              >
                About
              </button>
              <Link
                to="/blog"
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <button
                onClick={() => handleNavigate("expertise")}
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
              >
                Expertise
              </button>
              <button
                onClick={() => handleNavigate("experience")}
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
              >
                Experience
              </button>
              <button
                onClick={() => handleNavigate("achievements")}
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
              >
                Achievements
              </button>
              <button
                onClick={() => handleNavigate("contact")}
                className="block px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 w-full text-left rounded-md font-medium"
              >
                Contact
              </button>
              <div className="px-3 py-2">
                <Button
                  onClick={() => handleNavigate("contact")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full shadow-md"
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