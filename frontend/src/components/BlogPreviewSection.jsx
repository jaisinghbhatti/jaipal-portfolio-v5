import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { blogService } from "../services/blogService";

const BlogPreviewSection = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const posts = await blogService.getAllBlogs('published');
        // Get only the last 3 blog posts
        setBlogs(posts.slice(0, 3));
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setBlogs([]); // Set empty array on error
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

  if (loading) {
    return (
      <section id="blog" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading blog posts...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Latest Insights
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore the latest articles on digital marketing, SEO strategies, and business growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link 
              key={blog.id} 
              to={`/blog/${blog.slug?.current || blog.slug}`}
              data-testid={`blog-thumbnail-${blog.slug?.current || blog.slug}`}
            >
              <Card 
                className="group shadow-lg border-0 bg-white hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer overflow-hidden h-full"
              >
                {/* Blog Thumbnail - Entire card is now clickable */}
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
                    {blog.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Excerpt */}
                  <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  
                  {/* Read More Button */}
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 group"
                    data-testid={`read-more-${blog.slug?.current || blog.slug}`}
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Blogs Button */}
        <div className="text-center mt-12">
          <Link to="/blog">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              data-testid="view-all-blogs-button"
            >
              View All Blog Posts
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;
