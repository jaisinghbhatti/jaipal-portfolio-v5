import React from "react";
import { Card, CardContent } from "./ui/card";
import { mockData } from "../data/mockData";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">About Me</h2>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Card className="p-6 shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-0">
                <h3 className="text-2xl font-semibold text-blue-800 mb-4">Professional Journey</h3>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Year 2015, I graduated and stepped into the corporate world. While as a fresher, all the verticals seemed interesting, 
                  I chose Digital Marketing as that was the hot buzzing word of that time. In my early career, I spent a lot of time 
                  learning and polishing my data research and analytical skills and after spending almost 5 years, I moved into the 
                  hard-core Digital Marketing side, taking care of technical and non-technical SEO for business websites.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Over the years, I have built and scaled multiple teams within the Digital Marketing vertical. With a proven track record 
                  in the technology industry, I've specialized in developing comprehensive digital marketing strategies, managing cross-functional 
                  teams, and driving measurable business results across diverse markets.
                </p>
              </CardContent>
            </Card>
            
            <Card className="p-6 shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="p-0">
                <h3 className="text-2xl font-semibold text-purple-800 mb-4">Personal Values</h3>
                <p className="text-slate-700 leading-relaxed">
                  {mockData.personalInfo.personalBio}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-80 h-96 rounded-lg overflow-hidden shadow-2xl ring-4 ring-blue-200">
                <img
                  src="https://customer-assets.emergentagent.com/job_4b80e805-b39e-4aa6-945f-a403976625cc/artifacts/0a0zh0zh_IMG_20210815_172530.jpg"
                  alt="Jaipal Singh with family at the beach"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                Family & Community First
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg">
            <div className="text-4xl font-bold text-blue-700 mb-2">10+</div>
            <div className="text-blue-600 font-medium">Years Experience</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-lg">
            <div className="text-4xl font-bold text-purple-700 mb-2">250+</div>
            <div className="text-purple-600 font-medium">Marketing Campaigns</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl shadow-lg">
            <div className="text-4xl font-bold text-indigo-700 mb-2">40%</div>
            <div className="text-indigo-600 font-medium">Lead Generation Increase</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;