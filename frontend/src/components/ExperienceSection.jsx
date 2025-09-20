import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Building2, Calendar } from "lucide-react";
import { mockData } from "../data/mockData";

const ExperienceSection = () => {
  return (
    <section id="experience" className="py-20 bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Professional Experience</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A journey of growth, leadership, and measurable impact in digital marketing
          </p>
        </div>
        
        <div className="space-y-8">
          {mockData.experience.map((exp, index) => (
            <Card key={index} className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] transform bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-2">{exp.position}</CardTitle>
                    <div className="flex items-center text-slate-600 mb-2">
                      <Building2 className="w-5 h-5 mr-2" />
                      <span className="font-medium">{exp.company}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Calendar className="w-5 h-5 mr-2" />
                    <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100 font-medium">
                      {exp.duration}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-slate-600 leading-relaxed mb-6">
                  {exp.description}
                </p>
                
                <div>
                  <h4 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Key Achievements</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {exp.achievements.map((achievement, achIndex) => (
                      <div key={achIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-slate-600">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;