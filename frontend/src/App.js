import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import HomePage from "./components/HomePage";
import AboutMePage from "./components/AboutMePage";
import BlogIndex from "./components/BlogIndex";
import BlogPage from "./components/BlogPage";
import { ResumeBuilderPage } from "./components/resume-builder";
import { Toaster } from "./components/ui/toaster";
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <HelmetProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about-me" element={<AboutMePage />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPage />} />
            <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          </Routes>
          <Toaster />
          <Analytics />
        </BrowserRouter>
      </div>
    </HelmetProvider>
  );
}

export default App;