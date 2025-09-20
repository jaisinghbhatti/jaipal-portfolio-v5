import React from "react";
import { Card, CardContent } from "./ui/card";
import { mockData } from "../data/mockData";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">About Me</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get to know the person behind the professional achievements
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Card className="p-6 shadow-lg border-0 bg-slate-50">
              <CardContent className="p-0">
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">Professional Journey</h3>
                <p className="text-slate-600 leading-relaxed mb-4">
                  {mockData.personalInfo.bio}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  With a proven track record at Gartner, I've specialized in developing comprehensive 
                  digital marketing strategies, managing cross-functional teams, and driving measurable 
                  business results across diverse markets including the U.S. and Spain.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 shadow-lg border-0 bg-blue-50">
              <CardContent className="p-0">
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">Personal Values</h3>
                <p className="text-slate-600 leading-relaxed">
                  {mockData.personalInfo.personalBio}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-80 h-96 rounded-lg overflow-hidden shadow-2xl">
                <img
                  src="https://customer-assets.emergentagent.com/job_4b80e805-b39e-4aa6-945f-a403976625cc/artifacts/0a0zh0zh_IMG_20210815_172530.jpg"
                  alt="Jaipal Singh with family at the beach"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                Family & Community First
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">10+</div>
            <div className="text-slate-600">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">12</div>
            <div className="text-slate-600">Team Members Led</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-2">40%</div>
            <div className="text-slate-600">Lead Generation Increase</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;