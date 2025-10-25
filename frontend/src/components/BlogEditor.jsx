import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { AlertCircle, CheckCircle, Send } from "lucide-react";
import { client } from "../services/sanityService";
import Header from "./Header";
import Footer from "./Footer";

const BlogEditor = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    readTime: "",
    excerpt: "",
    thumbnail: "https://images.unsplash.com/photo-1486312338219-ce68e2c6316a", // Default image
    author: "Jaipal Singh",
    publishedDate: new Date().toISOString().split('T')[0], // Today's date
    status: "published"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [submitMessage, setSubmitMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim('-'); // Remove leading/trailing hyphens
  };

  const formatContentAsBlocks = (content) => {
    // Split content by double newlines to create paragraphs
    const paragraphs = content.split('\n\n').filter(para => para.trim());
    
    return paragraphs.map(paragraph => ({
      _type: "block",
      children: [
        {
          _type: "span",
          text: paragraph.trim()
        }
      ],
      style: "normal"
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      setSubmitStatus('error');
      setSubmitMessage('Please fill in at least the title and content.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Prepare the blog post data
      const blogPost = {
        _type: "post",
        title: formData.title,
        slug: {
          _type: "slug",
          current: generateSlug(formData.title)
        },
        author: formData.author,
        publishedDate: formData.publishedDate,
        readTime: formData.readTime || "5 min read",
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        excerpt: formData.excerpt || formData.content.substring(0, 150) + "...",
        thumbnail: formData.thumbnail,
        content: formatContentAsBlocks(formData.content),
        status: formData.status
      };

      // Create the blog post using Sanity client
      const result = await client.create(blogPost);
      
      setSubmitStatus('success');
      setSubmitMessage(`Blog post "${formData.title}" published successfully!`);
      
      // Reset form after successful submission
      setFormData({
        title: "",
        content: "",
        tags: "",
        readTime: "",
        excerpt: "",
        thumbnail: "https://images.unsplash.com/photo-1486312338219-ce68e2c6316a",
        author: "Jaipal Singh",
        publishedDate: new Date().toISOString().split('T')[0],
        status: "published"
      });

    } catch (error) {
      console.error('Error creating blog post:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to publish blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Blog Editor
          </h1>
          <p className="text-lg text-slate-600">
            Create and publish your blog posts instantly
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Create New Blog Post
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {submitStatus && (
              <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
                submitStatus === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {submitStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{submitMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 font-medium">
                  Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your blog post title"
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-700 font-medium">
                  Content *
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your blog post content here... Use double line breaks to separate paragraphs."
                  rows={12}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-slate-700 font-medium">
                  Excerpt (Brief Description)
                </Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Brief description of your blog post (will auto-generate if left empty)"
                  rows={3}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Two column layout for smaller fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-slate-700 font-medium">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., AI, Marketing, Strategy"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500">Separate tags with commas</p>
                </div>

                {/* Read Time */}
                <div className="space-y-2">
                  <Label htmlFor="readTime" className="text-slate-700 font-medium">
                    Read Time
                  </Label>
                  <Input
                    id="readTime"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    placeholder="5 min read"
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-slate-700 font-medium">
                  Thumbnail Image URL
                </Label>
                <Input
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  placeholder="https://images.unsplash.com/..."
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                  You can use Unsplash URLs or any public image URL
                </p>
              </div>

              {/* Published Date */}
              <div className="space-y-2">
                <Label htmlFor="publishedDate" className="text-slate-700 font-medium">
                  Published Date
                </Label>
                <Input
                  id="publishedDate"
                  name="publishedDate"
                  type="date"
                  value={formData.publishedDate}
                  onChange={handleInputChange}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                size="lg"
              >
                {isSubmitting ? (
                  "Publishing..."
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Publish Blog Post
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default BlogEditor;