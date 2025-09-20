import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Award, Calendar } from "lucide-react";
import { mockData } from "../data/mockData";

const AchievementsSection = () => {
  return (
    <section id="achievements" className="py-20 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Awards & Recognition</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Recognition for excellence, leadership, and outstanding contributions to organizational success
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {mockData.achievements.map((achievement, index) => (
            <Card key={index} className="shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="w-6 h-6 mr-3" />
                    <CardTitle className="text-xl">{achievement.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Calendar className="w-4 h-4 mr-1" />
                    {achievement.year}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="text-sm text-slate-500 mb-2">Awarded by</div>
                  <div className="font-semibold text-slate-900">{achievement.organization}</div>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {achievement.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <Card className="inline-block p-8 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-slate-50">
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-slate-900 mb-2">4+</div>
              <div className="text-slate-600">Awards & Recognition</div>
              <div className="text-sm text-slate-500 mt-2">
                Consistent recognition for excellence and leadership
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;