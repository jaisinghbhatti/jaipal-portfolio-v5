import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Target, Users, Search, BarChart3 } from "lucide-react";
import { mockData } from "../data/mockData";

const ExpertiseSection = () => {
  const iconMap = {
    target: Target,
    users: Users,
    search: Search,
    chart: BarChart3
  };

  const gradientClasses = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500", 
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500"
  ];

  return (
    <section id="expertise" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">Expertise & Skills</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A comprehensive skill set developed through years of hands-on experience in digital marketing and team leadership
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
          {mockData.services.map((service, index) => {
            const IconComponent = iconMap[service.icon];
            const gradientClass = gradientClasses[index];
            return (
              <Card key={index} className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-105 transform">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${gradientClass} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-center leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockData.skills.map((skillCategory, index) => {
            const bgColors = [
              "bg-gradient-to-br from-blue-50 to-blue-100",
              "bg-gradient-to-br from-purple-50 to-purple-100", 
              "bg-gradient-to-br from-green-50 to-green-100",
              "bg-gradient-to-br from-orange-50 to-orange-100"
            ];
            const titleColors = [
              "text-blue-700",
              "text-purple-700",
              "text-green-700", 
              "text-orange-700"
            ];
            return (
              <Card key={index} className={`shadow-lg border-0 ${bgColors[index]} hover:shadow-xl transition-shadow duration-300`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${titleColors[index]} font-bold`}>{skillCategory.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {skillCategory.skills.map((skill, skillIndex) => (
                      <Badge
                        key={skillIndex}
                        variant="secondary"
                        className="mr-2 mb-2 bg-white/70 text-slate-700 hover:bg-white hover:shadow-md transition-all duration-200 border border-white/50"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExpertiseSection;