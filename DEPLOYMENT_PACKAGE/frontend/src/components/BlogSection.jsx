import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Calendar, Clock, User, Share2, MessageCircle, Send, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockData } from "../data/mockData";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BlogSection = () => {
  const [selectedBlog, setSelectedBlog] = useState(mockData.blogs[0]);
  const [commentData, setCommentData] = useState({
    name: "",
    email: "",
    comment: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      
      case 'comment':
        if (!value.trim()) return 'Comment is required';
        if (value.trim().length < 5) return 'Comment must be at least 5 characters';
        if (value.trim().length > 500) return 'Comment must be less than 500 characters';
        return '';
      
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(commentData).forEach(field => {
      const error = validateField(field, commentData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCommentData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      comment: true
    });

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Please fix the errors below",
        description: "All fields are required and must be valid.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For now, simulate comment submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Comment submitted successfully!",
        description: "Thank you for sharing your thoughts. Your comment is awaiting moderation.",
      });
      
      // Reset form and validation state
      setCommentData({ name: "", email: "", comment: "" });
      setErrors({});
      setTouched({});
    } catch (error) {
      console.error("Comment submission error:", error);
      
      toast({
        title: "Error submitting comment",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkedInShare = () => {
    const url = window.location.href;
    const title = selectedBlog.title;
    const summary = selectedBlog.excerpt;
    
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    
    window.open(linkedinUrl, '_blank', 'width=600,height=600');
  };

  const formatContent = (content) => {
    // Simple markdown-style formatting
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('## ')) {
          return <h3 key={index} className="text-2xl font-bold text-slate-800 mt-8 mb-4">{paragraph.replace('## ', '')}</h3>;
        }
        if (paragraph.startsWith('* ')) {
          const items = paragraph.split('\n').filter(item => item.startsWith('* '));
          return (
            <ul key={index} className="list-disc list-inside space-y-2 mb-6 text-slate-700">
              {items.map((item, i) => (
                <li key={i}>{item.replace('* ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
              ))}
            </ul>
          );
        }
        
        // Handle bold text and italics
        const formattedParagraph = paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        return (
          <p 
            key={index} 
            className="text-slate-700 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: formattedParagraph }}
          />
        );
      });
  };

  return (
    <section id="blog" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Blog & Insights
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Sharing insights, strategies, and thoughts on digital marketing, SEO, and the evolving landscape of online business.
          </p>
        </div>

        {/* Blog Post */}
        <Card className="shadow-2xl border-0 bg-white hover:shadow-3xl transition-shadow duration-300 mb-12">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedBlog.publishedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedBlog.readTime}</span>
                </div>
              </div>
              <Button
                onClick={handleLinkedInShare}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors duration-300"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share on LinkedIn
              </Button>
            </div>
            
            <CardTitle className="text-3xl font-bold text-slate-800 leading-tight mb-4">
              {selectedBlog.title}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedBlog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <p className="text-lg text-slate-600 leading-relaxed">
              {selectedBlog.excerpt}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-lg max-w-none">
            <div className="text-slate-700 leading-relaxed">
              {formatContent(selectedBlog.content)}
            </div>
          </CardContent>
        </Card>

        {/* Author Section */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-100 mb-12">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg ring-4 ring-blue-200">
                <img
                  src="https://customer-assets.emergentagent.com/job_jsb-showcase/artifacts/iozlvq2a_PSX_20171017_182352.jpg"
                  alt="Jaipal Singh"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h4 className="text-xl font-bold text-slate-800">About the Author</h4>
                </div>
                <h5 className="text-lg font-semibold text-blue-700 mb-3">{selectedBlog.author}</h5>
                <p className="text-slate-700 leading-relaxed">
                  Digital Marketing Expert with 10+ years of experience in driving growth for enterprise-level organizations. 
                  Passionate about data-driven strategies, SEO optimization, and the evolving landscape of AI in marketing. 
                  Currently helping businesses navigate the intersection of traditional SEO and emerging AI technologies.
                </p>
                <div className="mt-4">
                  <a
                    href="https://www.linkedin.com/in/singh-jaipal/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    <span>Connect on LinkedIn</span>
                    <Share2 className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              <MessageCircle className="h-6 w-6 text-purple-600" />
              <span>Share Your Thoughts</span>
            </CardTitle>
            <p className="text-slate-600">
              I'd love to hear your perspective on this topic. Share your thoughts and join the conversation!
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleCommentSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comment-name" className="text-slate-700 font-medium">Name</Label>
                  <Input
                    id="comment-name"
                    name="name"
                    value={commentData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Your name"
                    className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {errors.name && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comment-email" className="text-slate-700 font-medium">Email</Label>
                  <Input
                    id="comment-email"
                    name="email"
                    type="email"
                    value={commentData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="your.email@example.com"
                    className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comment-text" className="text-slate-700 font-medium">
                  Comment
                  <span className="text-slate-400 text-xs ml-2">
                    ({commentData.comment.length}/500)
                  </span>
                </Label>
                <Textarea
                  id="comment-text"
                  name="comment"
                  value={commentData.comment}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Share your thoughts, questions, or insights about this post..."
                  rows={4}
                  className={`border-blue-200 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.comment ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.comment && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.comment}</span>
                  </div>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting || Object.keys(errors).some(key => errors[key])}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                size="lg"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Comment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default BlogSection;