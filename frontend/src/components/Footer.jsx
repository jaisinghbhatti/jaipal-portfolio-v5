import React from "react";
import { Linkedin, Mail } from "lucide-react";
import { mockData } from "../data/mockData";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Jaipal Singh</h3>
            <p className="text-slate-300 leading-relaxed">
              Senior Marketing Manager & Digital Marketing Leader with 10+ years of experience 
              driving growth and leading high-performing teams.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <div className="space-y-2">
              <a href="#about" className="block text-slate-300 hover:text-white transition-colors">
                About
              </a>
              <a href="#expertise" className="block text-slate-300 hover:text-white transition-colors">
                Expertise
              </a>
              <a href="#experience" className="block text-slate-300 hover:text-white transition-colors">
                Experience
              </a>
              <a href="#achievements" className="block text-slate-300 hover:text-white transition-colors">
                Achievements
              </a>
              <a href="#contact" className="block text-slate-300 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Connect</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300">{mockData.personalInfo.email}</span>
              </div>
              <a
                href="https://www.linkedin.com/in/singh-jaipal/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 hover:text-blue-400 transition-colors duration-200 group"
              >
                <Linkedin className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-slate-300 group-hover:text-blue-300">LinkedIn Profile</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-400">
            © {currentYear} Jaipal Singh. All rights reserved. Built with passion for excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;