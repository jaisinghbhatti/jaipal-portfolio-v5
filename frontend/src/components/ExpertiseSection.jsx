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

  return (
    <section id="expertise" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Expertise & Skills</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A comprehensive skill set developed through years of hands-on experience in digital marketing and team leadership
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
          {mockData.services.map((service, index) => {
            const IconComponent = iconMap[service.icon];
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-slate-900">{service.title}</CardTitle>
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
          {mockData.skills.map((skillCategory, index) => (
            <Card key={index} className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">{skillCategory.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {skillCategory.skills.map((skill, skillIndex) => (
                    <Badge
                      key={skillIndex}
                      variant="secondary"
                      className="mr-2 mb-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExpertiseSection;