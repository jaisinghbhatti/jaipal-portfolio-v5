import React from "react";
import Header from "./Header";
import AboutSection from "./AboutSection";
import ExpertiseSection from "./ExpertiseSection";
import ExperienceSection from "./ExperienceSection";
import AchievementsSection from "./AchievementsSection";
import ContactSection from "./ContactSection";
import Footer from "./Footer";

const AboutMePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        <AboutSection />
        <ExpertiseSection />
        <ExperienceSection />
        <AchievementsSection />
        <ContactSection />
      </div>
      <Footer />
    </div>
  );
};

export default AboutMePage;
