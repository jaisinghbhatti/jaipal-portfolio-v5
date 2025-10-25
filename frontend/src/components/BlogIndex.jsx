import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublishedPosts } from "../services/sanityService";
import Header from "./Header";
import Footer from "./Footer";

const BlogIndex = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const posts = await getPublishedPosts();
        setBlogs(posts);
      } catch (err) {
        setError('Failed to load blog posts');
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const calculateTotalReadTime = (blogs) => {
    return blogs.reduce((total, blog) => {
      const minutes = parseInt(blog.readTime?.replace(' min read', '')) || 0;
      return total + minutes;
    }, 0);
  };

  const getUniqueTags = (blogs) => {
    const allTags = blogs.flatMap(blog => blog.tags || []);
    return [...new Set(allTags)];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section for Blog Index */}
      <section className="pt-20 pb-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Portfolio</span>
            </Link>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Blog & Insights
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Exploring digital marketing strategies, SEO insights, and the evolving landscape of AI in business. 
              Practical wisdom for modern marketing leaders.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <Card 
                key={blog.id} 
                className="group shadow-lg border-0 bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
              >
                {/* Blog Thumbnail */}
                <div className="relative overflow-hidden h-48">
                  <img
                    src={blog.thumbnail}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <CardHeader className="pb-4">
                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(blog.publishedDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{blog.readTime || '5 min read'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Blog Title */}
                  <CardTitle className="text-xl font-bold text-slate-800 leading-tight mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                    {blog.title}
                  </CardTitle>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                        +{blog.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Excerpt */}
                  <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  
                  {/* Read More Button */}
                  <Link to={`/blog/${blog.slug?.current || blog.slug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 group"
                    >
                      <span>Read Full Article</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Blog Stats */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center space-x-8 bg-white rounded-xl px-8 py-6 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {blogs.length}
                </div>
                <div className="text-slate-600 text-sm font-medium">Articles Published</div>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {calculateTotalReadTime(blogs)}
                </div>
                <div className="text-slate-600 text-sm font-medium">Minutes of Content</div>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {getUniqueTags(blogs).length}
                </div>
                <div className="text-slate-600 text-sm font-medium">Unique Topics</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default BlogIndex;