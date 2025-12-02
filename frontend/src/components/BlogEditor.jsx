import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { AlertCircle, CheckCircle, Send, LogOut, Edit, Plus, Save, Upload, FileText, Trash2 } from "lucide-react";
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

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
        
        // Set thumbnail preview
        setThumbnailPreview(post.thumbnail || "");
        
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
        // Convert children with marks back to markdown
        const text = block.children.map(child => {
          let childText = child.text || '';
          
          // Apply marks as markdown
          if (child.marks && child.marks.length > 0) {
            if (child.marks.includes('strong')) {
              childText = `**${childText}**`;
            }
            if (child.marks.includes('em')) {
              childText = `*${childText}*`;
            }
          }
          
          return childText;
        }).join('');
        
        // Handle list items
        if (block.listItem === 'bullet') {
          return `* ${text}`;
        }
        
        // Handle different styles
        switch (block.style) {
          case 'h2': return `## ${text}`;
          case 'h3': return `### ${text}`;
          default: return text;
        }
      }
      return '';
    }).join('\n\n');
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
    setThumbnailPreview("");
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

  // Upload thumbnail image to Sanity
  const handleThumbnailUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitStatus('error');
      setSubmitMessage('Please upload an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitStatus('error');
      setSubmitMessage('Image size must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    setSubmitStatus(null);

    try {
      // Upload image to Sanity
      const imageAsset = await client.assets.upload('image', file, {
        filename: file.name
      });

      // Get the image URL
      const imageUrl = imageAsset.url;

      // Update form data with the uploaded image URL
      setFormData(prev => ({
        ...prev,
        thumbnail: imageUrl
      }));

      // Set preview
      setThumbnailPreview(imageUrl);

      setSubmitStatus('success');
      setSubmitMessage(`Image "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading image:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to upload image. Please try again or use a URL instead.');
    } finally {
      setIsUploadingImage(false);
      // Clear the file input
      event.target.value = '';
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
    // Convert simple markdown-style content to PortableText blocks
    if (!content) return [];
    
    const blocks = [];
    const paragraphs = content.split('\n\n').filter(para => para.trim());
    
    paragraphs.forEach(paragraph => {
      const trimmed = paragraph.trim();
      
      // Handle headers
      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace('## ', '');
        blocks.push({
          _type: "block",
          style: "h2",
          children: parseInlineMarks(text)
        });
      } 
      else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace('### ', '');
        blocks.push({
          _type: "block",
          style: "h3",
          children: parseInlineMarks(text)
        });
      }
      // Handle bullet lists
      else if (trimmed.includes('\n* ') || trimmed.startsWith('* ')) {
        const listItems = trimmed.split('\n').filter(line => line.startsWith('* '));
        listItems.forEach(item => {
          const text = item.replace('* ', '');
          blocks.push({
            _type: "block",
            style: "normal",
            listItem: "bullet",
            children: parseInlineMarks(text)
          });
        });
      }
      // Handle normal paragraphs
      else {
        blocks.push({
          _type: "block",
          style: "normal",
          children: parseInlineMarks(trimmed)
        });
      }
    });
    
    return blocks.length > 0 ? blocks : [
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: content }]
      }
    ];
  };
  
  // Helper function to parse inline marks (bold, italic)
  const parseInlineMarks = (text) => {
    const children = [];
    let currentPos = 0;
    
    // Regex to find **bold** and *italic* patterns
    const markRegex = /(\*\*.*?\*\*|\*.*?\*)/g;
    let match;
    
    while ((match = markRegex.exec(text)) !== null) {
      // Add text before the mark
      if (match.index > currentPos) {
        children.push({
          _type: "span",
          text: text.substring(currentPos, match.index)
        });
      }
      
      // Add the marked text
      const markedText = match[0];
      if (markedText.startsWith('**') && markedText.endsWith('**')) {
        // Bold text
        children.push({
          _type: "span",
          text: markedText.slice(2, -2),
          marks: ["strong"]
        });
      } else if (markedText.startsWith('*') && markedText.endsWith('*')) {
        // Italic text
        children.push({
          _type: "span",
          text: markedText.slice(1, -1),
          marks: ["em"]
        });
      }
      
      currentPos = match.index + markedText.length;
    }
    
    // Add remaining text
    if (currentPos < text.length) {
      children.push({
        _type: "span",
        text: text.substring(currentPos)
      });
    }
    
    // If no marks found, return simple text span
    return children.length > 0 ? children : [{ _type: "span", text: text }];
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
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{post.title}</h4>
                      <p className="text-sm text-slate-500">
                        {new Date(post.publishedDate).toLocaleDateString()} • {post.status}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => loadPostForEditing(post._id)}
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        disabled={isDeleting}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeletePost(post._id, post.title)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {isDeleting ? "..." : "Delete"}
                      </Button>
                    </div>
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

              {/* Content - Simple Text Editor with Floating Toolbar */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-700 font-medium">
                  Content *
                </Label>
                
                <div className="relative">
                  {/* Floating Toolbar - Right Side */}
                  <div className="absolute -right-16 top-0 z-20 bg-white border border-blue-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 w-14" style={{ position: 'sticky', top: '120px' }}>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        const editor = document.getElementById('contentEditor');
                        const start = editor.selectionStart;
                        const end = editor.selectionEnd;
                        const selectedText = editor.value.substring(start, end);
                        const newText = editor.value.substring(0, start) + '**' + selectedText + '**' + editor.value.substring(end);
                        setFormData(prev => ({ ...prev, content: newText }));
                        setTimeout(() => {
                          editor.focus();
                          editor.setSelectionRange(start + 2, end + 2);
                        }, 0);
                      }}
                      className="p-2 border rounded text-sm hover:bg-blue-50 font-bold transition-colors"
                      title="Bold (**text**)"
                    >
                      B
                    </button>
                    
                    <div className="h-px bg-gray-300 my-1"></div>
                    
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        const editor = document.getElementById('contentEditor');
                        const start = editor.selectionStart;
                        const end = editor.selectionEnd;
                        const selectedText = editor.value.substring(start, end);
                        const newText = editor.value.substring(0, start) + '## ' + selectedText + editor.value.substring(end);
                        setFormData(prev => ({ ...prev, content: newText }));
                        setTimeout(() => {
                          editor.focus();
                          editor.setSelectionRange(start + 3, end + 3);
                        }, 0);
                      }}
                      className="p-2 border rounded text-sm hover:bg-blue-50 font-bold transition-colors"
                      title="Heading 2 (## text)"
                    >
                      H2
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        const editor = document.getElementById('contentEditor');
                        const start = editor.selectionStart;
                        const end = editor.selectionEnd;
                        const selectedText = editor.value.substring(start, end);
                        const newText = editor.value.substring(0, start) + '### ' + selectedText + editor.value.substring(end);
                        setFormData(prev => ({ ...prev, content: newText }));
                        setTimeout(() => {
                          editor.focus();
                          editor.setSelectionRange(start + 4, end + 4);
                        }, 0);
                      }}
                      className="p-2 border rounded text-sm hover:bg-blue-50 font-semibold transition-colors"
                      title="Heading 3 (### text)"
                    >
                      H3
                    </button>
                    
                    <div className="h-px bg-gray-300 my-1"></div>
                    
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        const editor = document.getElementById('contentEditor');
                        const start = editor.selectionStart;
                        const end = editor.selectionEnd;
                        const selectedText = editor.value.substring(start, end);
                        // Add bullet point to selected text or at cursor
                        const newText = editor.value.substring(0, start) + '* ' + selectedText + editor.value.substring(end);
                        setFormData(prev => ({ ...prev, content: newText }));
                        setTimeout(() => {
                          editor.focus();
                          editor.setSelectionRange(start + 2, end + 2);
                        }, 0);
                      }}
                      className="p-2 border rounded text-sm hover:bg-blue-50 transition-colors"
                      title="Bullet List (* item)"
                    >
                      •
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        const editor = document.getElementById('contentEditor');
                        const start = editor.selectionStart;
                        const newText = editor.value.substring(0, start) + '\n\n' + editor.value.substring(start);
                        setFormData(prev => ({ ...prev, content: newText }));
                        setTimeout(() => {
                          editor.focus();
                          editor.setSelectionRange(start + 2, start + 2);
                        }, 0);
                      }}
                      className="p-2 border rounded text-sm hover:bg-blue-50 transition-colors"
                      title="New Paragraph"
                    >
                      ¶
                    </button>
                  </div>

                  {/* Simple Text Editor - No HTML Issues */}
                  <textarea 
                    id="contentEditor"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full border border-blue-200 rounded-md p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-700 leading-relaxed resize-y font-mono text-sm pr-20"
                    style={{ minHeight: '400px' }}
                    placeholder="Write your blog content here using simple formatting:

**Bold text**
## Main Heading
### Sub Heading

Bullet List:
* First item
* Second item
* Third item

Use the floating toolbar on the right for quick formatting..."
                  />
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">✍️ Simple Formatting Guide:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                    <div>
                      <p><code>**Bold text**</code> → <strong>Bold text</strong></p>
                      <p><code>## Heading 2</code> → Large heading</p>
                    </div>
                    <div>
                      <p><code>### Heading 3</code> → Medium heading</p>
                      <p><code>* List item</code> → Bullet list</p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    💡 <strong>Focus on bold and lists!</strong> Use the floating toolbar for quick formatting.
                  </p>
                </div>
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
                  Thumbnail Image
                </Label>
                
                {/* Image Upload Section */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-5 w-5 text-purple-600" />
                        <Label className="text-purple-800 font-medium">
                          Upload Image
                        </Label>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="border-purple-300 focus:border-purple-500"
                        disabled={isUploadingImage}
                      />
                      <div className="text-xs text-purple-700">
                        {isUploadingImage ? (
                          <span className="font-medium">Uploading image...</span>
                        ) : (
                          <span>Upload an image (JPG, PNG, GIF, max 5MB) or use a URL below</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Thumbnail Preview */}
                {(thumbnailPreview || formData.thumbnail) && (
                  <div className="mt-3">
                    <Label className="text-slate-700 font-medium text-sm mb-2 block">Preview:</Label>
                    <img
                      src={thumbnailPreview || formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-blue-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Or use URL */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or use a URL</span>
                  </div>
                </div>

                <Input
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={(e) => {
                    handleInputChange(e);
                    setThumbnailPreview(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500">
                  You can upload an image above or paste an Unsplash URL here
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