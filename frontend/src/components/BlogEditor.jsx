import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { AlertCircle, CheckCircle, Send, LogOut, Edit, Plus, Save, Upload, FileText } from "lucide-react";
import { client } from "../services/sanityService";
import BlogLogin from "./BlogLogin";
import mammoth from "mammoth";
import Header from "./Header";
import Footer from "./Footer";

const BlogEditor = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' or 'edit'
  const [existingPosts, setExistingPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
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
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('blogEditorAuth');
    setIsAuthenticated(authStatus === 'true');
    
    // Load existing posts if authenticated
    if (authStatus === 'true') {
      loadExistingPosts();
    }
  }, []);

  const loadExistingPosts = async () => {
    try {
      const posts = await client.fetch(
        `*[_type == "post"] | order(publishedDate desc) {
          _id,
          title,
          slug,
          publishedDate,
          status
        }`
      );
      setExistingPosts(posts);
    } catch (error) {
      console.error('Error loading existing posts:', error);
    }
  };

  const loadPostForEditing = async (postId) => {
    try {
      const post = await client.fetch(
        `*[_type == "post" && _id == $postId][0] {
          _id,
          title,
          slug,
          author,
          publishedDate,
          readTime,
          tags,
          excerpt,
          thumbnail,
          content,
          status
        }`,
        { postId }
      );
      
      if (post) {
        // Convert PortableText content back to HTML for editing
        const contentHtml = convertPortableTextToHtml(post.content);
        
        setFormData({
          title: post.title || "",
          content: contentHtml,
          tags: post.tags ? post.tags.join(', ') : "",
          readTime: post.readTime || "",
          excerpt: post.excerpt || "",
          thumbnail: post.thumbnail || "https://images.unsplash.com/photo-1486312338219-ce68e2c6316a",
          author: post.author || "Jaipal Singh",
          publishedDate: post.publishedDate || new Date().toISOString().split('T')[0],
          status: post.status || "published"
        });
        
        setSelectedPostId(postId);
        setMode('edit');
      }
    } catch (error) {
      console.error('Error loading post for editing:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to load post for editing.');
    }
  };

  const convertPortableTextToHtml = (portableText) => {
    if (!portableText || !Array.isArray(portableText)) return '';
    
    return portableText.map(block => {
      if (block._type === 'block' && block.children) {
        const text = block.children.map(child => child.text || '').join('');
        
        switch (block.style) {
          case 'h1': return `<h1>${text}</h1>`;
          case 'h2': return `<h2>${text}</h2>`;
          case 'h3': return `<h3>${text}</h3>`;
          case 'blockquote': return `<blockquote>${text}</blockquote>`;
          default: return `<p>${text}</p>`;
        }
      }
      return '';
    }).join('');
  };

  const handleLogin = (status) => {
    setIsAuthenticated(status);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('blogEditorAuth');
    setIsAuthenticated(false);
  };

  const resetForm = () => {
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
    setSelectedPostId(null);
    setMode('create');
  };

  // TinyMCE configuration removed

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <BlogLogin onLogin={handleLogin} />;
  }

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

  // Delete blog post
  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await client.delete(postId);
      setSubmitStatus('success');
      setSubmitMessage(`Blog post "${postTitle}" deleted successfully!`);
      
      // Reload existing posts and reset form if we were editing the deleted post
      await loadExistingPosts();
      if (selectedPostId === postId) {
        resetForm();
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to delete blog post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setSubmitStatus('error');
      setSubmitMessage('Please upload a .doc or .docx file');
      return;
    }

    setIsProcessingDoc(true);
    setSubmitStatus(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      // Extract title (first h1 or first line)
      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || html.match(/<p[^>]*><strong>(.*?)<\/strong><\/p>/i);
      const extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : '';
      
      // Remove the title from content if it was extracted
      let content = html;
      if (titleMatch) {
        content = content.replace(titleMatch[0], '');
      }
      
      // Clean up the content
      content = content
        .replace(/<p><\/p>/g, '') // Remove empty paragraphs
        .replace(/^[\s]*/, '') // Remove leading whitespace
        .trim();
      
      // Extract first paragraph as excerpt
      const excerptMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
      const extractedExcerpt = excerptMatch ? 
        excerptMatch[1].replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '';
      
      // Auto-populate form
      setFormData(prev => ({
        ...prev,
        title: extractedTitle || prev.title,
        content: content,
        excerpt: extractedExcerpt || prev.excerpt,
        publishedDate: new Date().toISOString().split('T')[0],
      }));

      setSubmitStatus('success');
      setSubmitMessage(`Document "${file.name}" uploaded and processed successfully! Review and edit the content below.`);
      
    } catch (error) {
      console.error('Error processing document:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to process the document. Please try again or copy-paste the content manually.');
    } finally {
      setIsProcessingDoc(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const formatContentAsBlocks = (content) => {
    // Convert HTML content to PortableText blocks
    if (!content) return [];
    
    // Simple HTML to PortableText conversion
    // Split by HTML tags and create blocks
    const htmlBlocks = content.split(/<\/(p|h1|h2|h3|blockquote)>/).filter(block => block.trim());
    
    return htmlBlocks.map(block => {
      const cleanBlock = block.replace(/<[^>]*>/g, '').trim();
      if (!cleanBlock) return null;
      
      let style = 'normal';
      if (block.includes('<h1>')) style = 'h1';
      else if (block.includes('<h2>')) style = 'h2';
      else if (block.includes('<h3>')) style = 'h3';
      else if (block.includes('<blockquote>')) style = 'blockquote';
      
      return {
        _type: "block",
        children: [
          {
            _type: "span",
            text: cleanBlock
          }
        ],
        style: style
      };
    }).filter(Boolean);
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
      const blogPost = {
        _type: "post",
        title: formData.title,
        slug: selectedPostId ? undefined : { // Don't update slug when editing
          _type: "slug",
          current: generateSlug(formData.title)
        },
        author: formData.author,
        publishedDate: formData.publishedDate,
        readTime: formData.readTime || "5 min read",
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        excerpt: formData.excerpt || formData.content.replace(/<[^>]*>/g, '').substring(0, 150) + "...",
        thumbnail: formData.thumbnail,
        content: formatContentAsBlocks(formData.content),
        status: formData.status
      };

      let result;
      if (mode === 'edit' && selectedPostId) {
        // Update existing post
        result = await client.patch(selectedPostId).set(blogPost).commit();
        setSubmitStatus('success');
        setSubmitMessage(`Blog post "${formData.title}" updated successfully!`);
      } else {
        // Create new post
        result = await client.create(blogPost);
        setSubmitStatus('success');
        setSubmitMessage(`Blog post "${formData.title}" published successfully!`);
      }
      
      // Reload existing posts and reset form
      await loadExistingPosts();
      resetForm();

    } catch (error) {
      console.error('Error saving blog post:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to save blog post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Blog Editor
            </h1>
            <div className="flex space-x-3">
              {mode === 'edit' && (
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <p className="text-lg text-slate-600">
            {mode === 'create' ? 'Create and publish your blog posts instantly' : 'Edit your existing blog post'}
          </p>
        </div>

        {/* Existing Posts Section */}
        {existingPosts.length > 0 && mode === 'create' && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50 mb-8">
            <CardHeader>
              <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Edit Existing Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {existingPosts.map((post) => (
                  <div key={post._id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
                    <div>
                      <h4 className="font-medium text-slate-900">{post.title}</h4>
                      <p className="text-sm text-slate-500">
                        {new Date(post.publishedDate).toLocaleDateString()} • {post.status}
                      </p>
                    </div>
                    <Button
                      onClick={() => loadPostForEditing(post._id)}
                      variant="outline"
                      size="sm"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
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
              {/* Document Upload Section */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <Label className="text-green-800 font-medium">
                        Quick Upload: Word Document
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept=".doc,.docx"
                      onChange={handleDocumentUpload}
                      className="border-green-300 focus:border-green-500"
                      disabled={isProcessingDoc}
                    />
                    <div className="text-xs text-green-700 flex items-center space-x-2">
                      <Upload className="h-3 w-3" />
                      <span>
                        Upload a .doc or .docx file to automatically populate title and content. 
                        {isProcessingDoc && <span className="font-medium ml-2">Processing document...</span>}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

              {/* Content - Rich Text Editor */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-700 font-medium">
                  Content *
                </Label>
                
                {/* Sticky Rich Text Toolbar */}
                <div className="sticky top-4 z-10 border border-blue-200 rounded-md bg-white shadow-lg p-2 flex flex-wrap gap-2 mb-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('bold');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50 font-bold"
                  >
                    B
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('italic');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50 italic"
                  >
                    I
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('underline');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50 underline"
                  >
                    U
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('formatBlock', false, 'h1');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50 font-bold text-lg"
                  >
                    H1
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('formatBlock', false, 'h2');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50 font-semibold"
                  >
                    H2
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('formatBlock', false, 'h3');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50 font-medium"
                  >
                    H3
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('insertUnorderedList');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50"
                  >
                    • List
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('insertOrderedList');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50"
                  >
                    1. List
                  </button>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('justifyLeft');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50"
                  >
                    ←
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('justifyCenter');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50"
                  >
                    ↔
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      document.execCommand('justifyRight');
                      document.querySelector('[contenteditable="true"]').focus();
                    }}
                    className="px-3 py-1 border rounded text-sm hover:bg-blue-50"
                  >
                    →
                  </button>
                </div>

                {/* Rich Text Editor Area - Fixed cursor position */}
                <div 
                  ref={(el) => {
                    if (el && !el.innerHTML && formData.content) {
                      el.innerHTML = formData.content;
                    }
                  }}
                  contentEditable
                  className="border border-blue-200 rounded-md p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 leading-relaxed"
                  style={{ minHeight: '400px' }}
                  onInput={(e) => {
                    // Save cursor position before updating state
                    const selection = window.getSelection();
                    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                    
                    setFormData(prev => ({ ...prev, content: e.target.innerHTML }));
                    
                    // Restore cursor position after state update
                    if (range) {
                      setTimeout(() => {
                        try {
                          selection.removeAllRanges();
                          selection.addRange(range);
                        } catch (err) {
                          // Fallback: place cursor at end
                          const newRange = document.createRange();
                          newRange.selectNodeContents(e.target);
                          newRange.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(newRange);
                        }
                      }, 0);
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertHTML', false, text);
                  }}
                  suppressContentEditableWarning={true}
                />
                
                <p className="text-xs text-slate-500">
                  <strong>💡 Tip:</strong> The formatting toolbar will stay visible as you scroll! Use <strong>bold</strong>, <em>italic</em>, headers, lists, and alignment to make your content engaging.
                </p>
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
                  mode === 'edit' ? "Updating..." : "Publishing..."
                ) : (
                  <>
                    {mode === 'edit' ? (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Update Blog Post
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Publish Blog Post
                      </>
                    )}
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