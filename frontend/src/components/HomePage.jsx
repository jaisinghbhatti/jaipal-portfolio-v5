import React from "react";
import Header from "./Header";
import HeroSection from "./HeroSection";
import BlogPreviewSection from "./BlogPreviewSection";
import Footer from "./Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />
      <BlogPreviewSection />
      <Footer />
    </div>
  );
};

export default HomePage;