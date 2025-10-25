import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import BlogIndex from "./components/BlogIndex";
import BlogPage from "./components/BlogPage";
import BlogEditor from "./components/BlogEditor";
import { Toaster } from "./components/ui/toaster";
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/blog-editor" element={<BlogEditor />} />
        </Routes>
        <Toaster />
        <Analytics />
      </BrowserRouter>
    </div>
  );
}

export default App;