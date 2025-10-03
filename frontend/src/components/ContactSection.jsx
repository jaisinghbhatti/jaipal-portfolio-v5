import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Mail, MapPin, Zap, Target, Lightbulb, TrendingUp } from "lucide-react";
import { mockData } from "../data/mockData";

const ContactSection = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">AI Strategy & Digital Marketing Leader</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Transforming businesses through strategic AI integration and proven digital marketing excellence. 
            From prompt engineering to scalable marketing systems—I architect the future of growth.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 hover:shadow-2xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Email</div>
                    <div className="text-blue-600 font-medium">{mockData.personalInfo.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Location</div>
                    <div className="text-green-600 font-medium">{mockData.personalInfo.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-indigo-100 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">Available For</h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>AI Strategy & Implementation</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Prompt Engineering Training</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>Digital Marketing Leadership</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></span>Executive AI Workshops</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50 hover:shadow-2xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AI Generalist & Digital Marketing Architect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-700 leading-relaxed">
                In an era where <strong>AI doesn't replace professionals—it replaces non-specialized work</strong>, I help executives and organizations build their <em>"AI Personal Moat"</em> through strategic implementation and custom solutions.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">R-O-C-I Framework Expert</h4>
                    <p className="text-slate-600 text-sm">Transform from beginner AI user to prompt expert with Role, Objective, Context, Instruction methodology for 10x ROI.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Custom AI Tool Architecture</h4>
                    <p className="text-slate-600 text-sm">Design and deploy specialized AI agents that codify your unique professional expertise into scalable digital assets.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Multimodal AI Strategy</h4>
                    <p className="text-slate-600 text-sm">Leverage Gemini AI and advanced models to create unified campaigns where every touchpoint speaks the same optimized language.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Digital Marketing Excellence</h4>
                    <p className="text-slate-600 text-sm">10+ years driving growth for enterprise organizations with data-driven strategies and scalable marketing systems.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <p className="text-slate-700 text-sm italic">
                  <strong>"The professional world is separating into two classes: the Generalists who are being automated by AI, and the Architects who use custom AI tools to scale their unique genius."</strong>
                </p>
                <p className="text-xs text-slate-500 mt-2">— From "The AI Personal Moat" blog post</p>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <a href={`mailto:${mockData.personalInfo.email}?subject=AI Strategy Consultation`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Discuss Your AI Strategy
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;