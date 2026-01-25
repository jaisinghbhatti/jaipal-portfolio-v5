import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  AlertCircle,
  CheckCircle,
  LogOut,
  Edit,
  Plus,
  Save,
  FileText,
  Trash2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Undo,
  Redo,
  X,
  Upload,
  Calendar,
  Tag,
  Clock,
} from "lucide-react";
import { client } from "../services/sanityService";
import BlogLogin from "./BlogLogin";
import Header from "./Header";
import Footer from "./Footer";

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

// Custom CSS for the editor
const editorStyles = `
  .tiptap-editor {
    min-height: 500px;
    outline: none;
    font-size: 17px;
    line-height: 1.75;
  }
  
  .tiptap-editor p {
    margin-bottom: 1em;
  }
  
  .tiptap-editor h1 {
    font-size: 2.25em;
    font-weight: 700;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    line-height: 1.2;
  }
  
  .tiptap-editor h2 {
    font-size: 1.75em;
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    line-height: 1.3;
  }
  
  .tiptap-editor h3 {
    font-size: 1.375em;
    font-weight: 600;
    margin-top: 1.25em;
    margin-bottom: 0.5em;
    line-height: 1.4;
  }
  
  .tiptap-editor ul,
  .tiptap-editor ol {
    padding-left: 1.5em;
    margin-bottom: 1em;
  }
  
  .tiptap-editor li {
    margin-bottom: 0.25em;
  }
  
  .tiptap-editor blockquote {
    border-left: 4px solid #6366f1;
    padding-left: 1em;
    margin: 1.5em 0;
    font-style: italic;
    color: #64748b;
  }
  
  .tiptap-editor code {
    background: #1e293b;
    color: #e2e8f0;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.9em;
  }
  
  .tiptap-editor pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1em;
    border-radius: 8px;
    overflow-x: auto;
    margin: 1em 0;
  }
  
  .tiptap-editor pre code {
    background: transparent;
    padding: 0;
  }
  
  .tiptap-editor img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5em 0;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .tiptap-editor img:hover {
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  }
  
  .tiptap-editor img.ProseMirror-selectednode {
    outline: 3px solid #6366f1;
    outline-offset: 3px;
  }
  
  .tiptap-editor a {
    color: #6366f1;
    text-decoration: underline;
    cursor: pointer;
  }
  
  .tiptap-editor a:hover {
    color: #4f46e5;
  }
  
  .tiptap-editor mark {
    background: #fef08a;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }
  
  .tiptap-editor hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 2em 0;
  }
  
  .tiptap-editor .is-empty::before {
    content: attr(data-placeholder);
    color: #94a3b8;
    pointer-events: none;
    float: left;
    height: 0;
  }
  
  .tiptap-editor iframe {
    border-radius: 8px;
    margin: 1.5em 0;
  }
  
  /* Dark mode styles */
  .dark .tiptap-editor {
    color: #e2e8f0;
  }
  
  .dark .tiptap-editor blockquote {
    color: #94a3b8;
  }
  
  .dark .tiptap-editor hr {
    border-top-color: #374151;
  }
`;

const ModernBlogEditor = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mode, setMode] = useState("create");
  const [existingPosts, setExistingPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    tags: "",
    readTime: "",
    excerpt: "",
    thumbnail: "",
    author: "Jaipal Singh",
    publishedDate: new Date().toISOString().split("T")[0],
    status: "published",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  // TipTap Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your amazing story... Type / for commands",
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Youtube.configure({
        inline: false,
        nocookie: true,
        width: 640,
        height: 360,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-lg max-w-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save draft
      handleAutoSave(editor.getHTML());
    },
  });

  // Auto-save functionality
  const handleAutoSave = useCallback((content) => {
    if (content && content !== "<p></p>") {
      localStorage.setItem("blog-draft-content", content);
      localStorage.setItem("blog-draft-meta", JSON.stringify(formData));
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus(null), 2000);
    }
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const savedContent = localStorage.getItem("blog-draft-content");
    const savedMeta = localStorage.getItem("blog-draft-meta");
    if (savedContent && editor && mode === "create") {
      editor.commands.setContent(savedContent);
      if (savedMeta) {
        try {
          const meta = JSON.parse(savedMeta);
          setFormData((prev) => ({ ...prev, ...meta }));
        } catch (e) {
          console.error("Failed to parse saved meta:", e);
        }
      }
    }
  }, [editor, mode]);

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem("blogEditorAuth");
    setIsAuthenticated(authStatus === "true");
    if (authStatus === "true") {
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
          status,
          excerpt
        }`
      );
      setExistingPosts(posts);
    } catch (error) {
      console.error("Error loading existing posts:", error);
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
        const contentHtml = convertPortableTextToHtml(post.content);

        setFormData({
          title: post.title || "",
          tags: post.tags ? post.tags.join(", ") : "",
          readTime: post.readTime || "",
          excerpt: post.excerpt || "",
          thumbnail: post.thumbnail || "",
          author: post.author || "Jaipal Singh",
          publishedDate: post.publishedDate || new Date().toISOString().split("T")[0],
          status: post.status || "published",
        });

        setThumbnailPreview(post.thumbnail || "");
        setSelectedPostId(postId);
        setMode("edit");

        if (editor) {
          editor.commands.setContent(contentHtml);
        }
      }
    } catch (error) {
      console.error("Error loading post for editing:", error);
      setSubmitStatus("error");
      setSubmitMessage("Failed to load post for editing.");
    }
  };

  const convertPortableTextToHtml = (portableText) => {
    if (!portableText || !Array.isArray(portableText)) return "";

    return portableText
      .map((block) => {
        if (block._type === "block" && block.children) {
          const text = block.children
            .map((child) => {
              let childText = child.text || "";
              if (child.marks && child.marks.length > 0) {
                if (child.marks.includes("strong")) {
                  childText = `<strong>${childText}</strong>`;
                }
                if (child.marks.includes("em")) {
                  childText = `<em>${childText}</em>`;
                }
              }
              return childText;
            })
            .join("");

          if (block.listItem === "bullet") {
            return `<li>${text}</li>`;
          }

          switch (block.style) {
            case "h1":
              return `<h1>${text}</h1>`;
            case "h2":
              return `<h2>${text}</h2>`;
            case "h3":
              return `<h3>${text}</h3>`;
            case "blockquote":
              return `<blockquote>${text}</blockquote>`;
            default:
              return `<p>${text}</p>`;
          }
        }
        // Handle image blocks - check multiple possible URL locations
        if (block._type === "image") {
          const imageUrl = block.asset?.url || block.src || block.url;
          if (imageUrl) {
            return `<img src="${imageUrl}" alt="${block.alt || ""}" class="editor-image" />`;
          }
        }
        // Handle YouTube embeds
        if (block._type === "youtube") {
          const videoUrl = block.url || block.src;
          if (videoUrl) {
            return `<div data-youtube-video><iframe src="${videoUrl}" frameborder="0" allowfullscreen></iframe></div>`;
          }
        }
        // Handle code blocks
        if (block._type === "code") {
          return `<pre><code>${block.code || ""}</code></pre>`;
        }
        return "";
      })
      .join("");
  };

  const handleLogin = (status) => {
    setIsAuthenticated(status);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("blogEditorAuth");
    setIsAuthenticated(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      tags: "",
      readTime: "",
      excerpt: "",
      thumbnail: "",
      author: "Jaipal Singh",
      publishedDate: new Date().toISOString().split("T")[0],
      status: "published",
    });
    setThumbnailPreview("");
    setSelectedPostId(null);
    setMode("create");
    if (editor) {
      editor.commands.clearContent();
    }
    localStorage.removeItem("blog-draft-content");
    localStorage.removeItem("blog-draft-meta");
  };

  // Handle image upload to Sanity
  const handleImageUpload = async (file) => {
    try {
      setIsUploadingImage(true);
      const imageAsset = await client.assets.upload("image", file, {
        filename: file.name,
      });
      return imageAsset.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Insert image into editor
  const insertImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitStatus("error");
      setSubmitMessage("Please upload an image file");
      return;
    }

    try {
      const imageUrl = await handleImageUpload(file);
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setSubmitStatus("success");
      setSubmitMessage("Image uploaded successfully!");
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage("Failed to upload image");
    }
    e.target.value = "";
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSubmitStatus("error");
      setSubmitMessage("Please upload an image file");
      return;
    }

    try {
      const imageUrl = await handleImageUpload(file);
      setFormData((prev) => ({ ...prev, thumbnail: imageUrl }));
      setThumbnailPreview(imageUrl);
      setSubmitStatus("success");
      setSubmitMessage("Thumbnail uploaded successfully!");
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage("Failed to upload thumbnail");
    }
    e.target.value = "";
  };

  // Add link
  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  // Add YouTube video
  const addYoutube = () => {
    if (youtubeUrl) {
      editor?.commands.setYoutubeVideo({ src: youtubeUrl });
      setYoutubeUrl("");
      setShowYoutubeInput(false);
    }
  };

  // Add image by URL
  const addImageByUrl = () => {
    if (imageUrlInput && editor) {
      console.log("Inserting image by URL:", imageUrlInput);
      editor.chain().focus().setImage({ src: imageUrlInput }).run();
      
      // Verify the image was inserted
      setTimeout(() => {
        const html = editor.getHTML();
        console.log("Editor HTML after image insert:", html);
        const hasImage = html.includes('<img');
        console.log("Image tag found in HTML:", hasImage);
      }, 100);
      
      setImageUrlInput("");
      setShowImageUrlInput(false);
      setSubmitStatus("success");
      setSubmitMessage("Image inserted successfully!");
    }
  };

  // Delete post
  const handleDeletePost = async (postId, postTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${postTitle}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await client.delete(postId);
      setSubmitStatus("success");
      setSubmitMessage(`"${postTitle}" deleted successfully!`);
      await loadExistingPosts();
      if (selectedPostId === postId) {
        resetForm();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setSubmitStatus("error");
      setSubmitMessage("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  };

  // Convert HTML to Portable Text for Sanity
  const convertHtmlToPortableText = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const blocks = [];
    const processedImages = new Set();

    // Debug log
    console.log("=== HTML TO PORTABLE TEXT CONVERSION ===");
    console.log("Input HTML:", html);

    // FIRST: Find ALL images in the document and store their positions
    const allImages = doc.querySelectorAll("img");
    console.log("Total images found in document:", allImages.length);
    allImages.forEach((img, i) => {
      console.log(`Image ${i + 1}: src=${img.src}`);
    });

    // Helper to create image block
    const createImageBlock = (imgElement) => {
      const src = imgElement.src || imgElement.getAttribute("src");
      if (!src || processedImages.has(src)) return null;
      processedImages.add(src);
      console.log("Creating image block for:", src);
      return {
        _type: "image",
        _key: Math.random().toString(36).substr(2, 9),
        asset: { url: src },
        src: src,
        alt: imgElement.alt || "",
      };
    };

    // Process all child nodes of body
    const processChildren = (parent) => {
      const children = Array.from(parent.childNodes);
      
      for (const node of children) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) {
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: "normal",
              children: [{ _type: "span", _key: Math.random().toString(36).substr(2, 9), text }],
            });
          }
          continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const tagName = node.tagName.toLowerCase();

        // Handle images directly
        if (tagName === "img") {
          const imgBlock = createImageBlock(node);
          if (imgBlock) blocks.push(imgBlock);
          continue;
        }

        // Check if this element contains images
        const imagesInside = node.querySelectorAll("img");
        
        if (tagName === "p") {
          if (imagesInside.length > 0) {
            // Extract text before/after images
            const textContent = node.textContent.trim();
            imagesInside.forEach(img => {
              const imgBlock = createImageBlock(img);
              if (imgBlock) blocks.push(imgBlock);
            });
            if (textContent) {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "normal",
                children: parseInlineElements(node),
              });
            }
          } else if (node.textContent.trim()) {
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: "normal",
              children: parseInlineElements(node),
            });
          }
        } else if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
          if (node.textContent.trim()) {
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: tagName,
              children: parseInlineElements(node),
            });
          }
        } else if (tagName === "blockquote") {
          const paras = node.querySelectorAll("p");
          if (paras.length > 0) {
            paras.forEach(p => {
              if (p.textContent.trim()) {
                blocks.push({
                  _type: "block",
                  _key: Math.random().toString(36).substr(2, 9),
                  style: "blockquote",
                  children: parseInlineElements(p),
                });
              }
            });
          } else if (node.textContent.trim()) {
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: "blockquote",
              children: parseInlineElements(node),
            });
          }
        } else if (tagName === "ul") {
          node.querySelectorAll(":scope > li").forEach(li => {
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: "normal",
              listItem: "bullet",
              children: parseInlineElements(li),
            });
          });
        } else if (tagName === "ol") {
          node.querySelectorAll(":scope > li").forEach(li => {
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: "normal",
              listItem: "number",
              level: 1,
              children: parseInlineElements(li),
            });
          });
        } else if (tagName === "figure" || tagName === "div") {
          // Check for images first
          imagesInside.forEach(img => {
            const imgBlock = createImageBlock(img);
            if (imgBlock) blocks.push(imgBlock);
          });
          // Process other children
          if (imagesInside.length === 0) {
            processChildren(node);
          }
        } else if (tagName === "pre") {
          const codeEl = node.querySelector("code");
          blocks.push({
            _type: "code",
            _key: Math.random().toString(36).substr(2, 9),
            code: codeEl ? codeEl.textContent : node.textContent,
          });
        } else if (tagName === "iframe") {
          if (node.src && node.src.includes("youtube")) {
            blocks.push({
              _type: "youtube",
              _key: Math.random().toString(36).substr(2, 9),
              url: node.src,
            });
          }
        } else if (tagName === "hr") {
          blocks.push({
            _type: "block",
            _key: Math.random().toString(36).substr(2, 9),
            style: "normal",
            children: [{ _type: "span", text: "---" }],
          });
        } else {
          // For other elements, recursively process children
          processChildren(node);
        }
      }
    };

    processChildren(doc.body);

    console.log("=== CONVERSION RESULT ===");
    console.log("Total blocks created:", blocks.length);
    const imageBlocks = blocks.filter(b => b._type === "image");
    console.log("Image blocks:", imageBlocks.length);
    imageBlocks.forEach((img, i) => {
      console.log(`  Image ${i + 1}: ${img.src || img.asset?.url}`);
    });

    return blocks.length > 0
      ? blocks
      : [{ _type: "block", style: "normal", children: [{ _type: "span", text: "" }] }];
  };
              _type: "image",
              _key: Math.random().toString(36).substr(2, 9),
              asset: {
                url: node.src,
              },
              alt: node.alt || "",
              src: node.src,
            });
            break;
          case "h1":
            if (node.textContent.trim()) {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "h1",
                children: parseInlineElements(node),
              });
            }
            break;
          case "h2":
            if (node.textContent.trim()) {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "h2",
                children: parseInlineElements(node),
              });
            }
            break;
          case "h3":
            if (node.textContent.trim()) {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "h3",
                children: parseInlineElements(node),
              });
            }
            break;
          case "blockquote":
            // Get all paragraphs inside blockquote
            const bqParas = node.querySelectorAll("p");
            if (bqParas.length > 0) {
              bqParas.forEach(p => {
                if (p.textContent.trim()) {
                  blocks.push({
                    _type: "block",
                    _key: Math.random().toString(36).substr(2, 9),
                    style: "blockquote",
                    children: parseInlineElements(p),
                  });
                }
              });
            } else if (node.textContent.trim()) {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "blockquote",
                children: parseInlineElements(node),
              });
            }
            break;
          case "ul":
            node.querySelectorAll(":scope > li").forEach((li) => {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "normal",
                listItem: "bullet",
                children: parseInlineElements(li),
              });
            });
            break;
          case "ol":
            node.querySelectorAll(":scope > li").forEach((li) => {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "normal",
                listItem: "number",
                level: 1,
                children: parseInlineElements(li),
              });
            });
            break;
          case "figure":
            // Handle figure elements that might contain images
            const figImg = node.querySelector("img");
            if (figImg) {
              console.log("Found image in figure:", figImg.src);
              blocks.push({
                _type: "image",
                _key: Math.random().toString(36).substr(2, 9),
                asset: {
                  url: figImg.src,
                },
                alt: figImg.alt || "",
                src: figImg.src,
              });
            }
            break;
          case "div":
            // TipTap sometimes wraps content in divs
            // Check for images first
            const divImg = node.querySelector("img");
            if (divImg) {
              console.log("Found image in div:", divImg.src);
              blocks.push({
                _type: "image",
                _key: Math.random().toString(36).substr(2, 9),
                asset: {
                  url: divImg.src,
                },
                alt: divImg.alt || "",
                src: divImg.src,
              });
            }
            // Process other children
            node.childNodes.forEach(processNode);
            break;
          case "iframe":
            // Handle YouTube embeds
            if (node.src && node.src.includes("youtube")) {
              blocks.push({
                _type: "youtube",
                _key: Math.random().toString(36).substr(2, 9),
                url: node.src,
              });
            }
            break;
          case "pre":
            // Handle code blocks
            const codeEl = node.querySelector("code");
            blocks.push({
              _type: "code",
              _key: Math.random().toString(36).substr(2, 9),
              code: codeEl ? codeEl.textContent : node.textContent,
            });
            break;
          case "hr":
            blocks.push({
              _type: "block",
              _key: Math.random().toString(36).substr(2, 9),
              style: "normal",
              children: [{ _type: "span", text: "---" }],
            });
            break;
          case "a":
            // Handle standalone links (rare but possible)
            if (node.textContent.trim()) {
              blocks.push({
                _type: "block",
                _key: Math.random().toString(36).substr(2, 9),
                style: "normal",
                children: [{
                  _type: "span",
                  _key: Math.random().toString(36).substr(2, 9),
                  text: node.textContent,
                  marks: ["link"],
                  // Note: Sanity needs link marks defined differently
                }],
              });
            }
            break;
          default:
            // For any unhandled element, process its children
            node.childNodes.forEach(processNode);
            break;
        }
      }
      return "";
    };

    // Helper function to parse inline elements (bold, italic, links, etc.)
    const parseInlineElements = (parentNode) => {
      const spans = [];
      
      const processInline = (node, marks = []) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim() || node.textContent === " ") {
            spans.push({
              _type: "span",
              _key: Math.random().toString(36).substr(2, 9),
              text: node.textContent,
              marks: marks.length > 0 ? [...marks] : undefined,
            });
          }
          return;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();
          let newMarks = [...marks];
          
          switch (tagName) {
            case "strong":
            case "b":
              newMarks.push("strong");
              break;
            case "em":
            case "i":
              newMarks.push("em");
              break;
            case "u":
              newMarks.push("underline");
              break;
            case "s":
            case "strike":
            case "del":
              newMarks.push("strike-through");
              break;
            case "code":
              newMarks.push("code");
              break;
            case "mark":
              newMarks.push("highlight");
              break;
            case "a":
              // For links, we'd need to handle them differently in Sanity
              // For now, just extract text
              break;
          }
          
          node.childNodes.forEach(child => processInline(child, newMarks));
        }
      };
      
      parentNode.childNodes.forEach(child => processInline(child));
      
      // If no spans were created, create a default empty span
      if (spans.length === 0) {
        spans.push({ _type: "span", text: parentNode.textContent || "" });
      }
      
      return spans;
    };

    doc.body.childNodes.forEach(processNode);
    return blocks.length > 0
      ? blocks
      : [{ _type: "block", style: "normal", children: [{ _type: "span", text: "" }] }];
  };

  // Submit blog post
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !editor?.getHTML()) {
      setSubmitStatus("error");
      setSubmitMessage("Please fill in the title and content");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const htmlContent = editor.getHTML();
      console.log("=== SAVING BLOG POST ===");
      console.log("HTML Content:", htmlContent);
      
      const portableTextContent = convertHtmlToPortableText(htmlContent);
      console.log("Portable Text Content:", JSON.stringify(portableTextContent, null, 2));
      
      // Check for images in the converted content
      const imageBlocks = portableTextContent.filter(b => b._type === "image");
      console.log("Image blocks found:", imageBlocks.length);
      if (imageBlocks.length > 0) {
        console.log("Image blocks:", JSON.stringify(imageBlocks, null, 2));
      }

      const blogPost = {
        _type: "post",
        title: formData.title,
        slug: selectedPostId
          ? undefined
          : { _type: "slug", current: generateSlug(formData.title) },
        author: formData.author,
        publishedDate: formData.publishedDate,
        readTime: formData.readTime || "5 min read",
        tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
        excerpt:
          formData.excerpt ||
          editor.getText().substring(0, 150) + "...",
        thumbnail: formData.thumbnail,
        content: portableTextContent,
        status: formData.status,
      };

      if (mode === "edit" && selectedPostId) {
        await client.patch(selectedPostId).set(blogPost).commit();
        setSubmitStatus("success");
        setSubmitMessage(`"${formData.title}" updated successfully!`);
      } else {
        await client.create(blogPost);
        setSubmitStatus("success");
        setSubmitMessage(`"${formData.title}" published successfully!`);
      }

      await loadExistingPosts();
      resetForm();
    } catch (error) {
      console.error("Error saving post:", error);
      setSubmitStatus("error");
      setSubmitMessage("Failed to save post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toolbar Button Component
  const ToolbarButton = ({ onClick, active, disabled, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all duration-200 ${
        active
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );

  if (!isAuthenticated) {
    return <BlogLogin onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-slate-50 via-white to-indigo-50"}`}>
      <style>{editorStyles}</style>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? "text-white" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"}`}>
              Blog Studio
            </h1>
            <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {mode === "create" ? "Create something amazing" : "Edit your masterpiece"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {autoSaveStatus === "saved" && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" /> Auto-saved
              </Badge>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={isDarkMode ? "border-gray-600" : ""}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={isDarkMode ? "border-gray-600" : ""}
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            {mode === "edit" && (
              <Button onClick={resetForm} variant="outline" className={isDarkMode ? "border-gray-600" : ""}>
                <Plus className="w-4 h-4 mr-2" /> New Post
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {submitStatus && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              submitStatus === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {submitStatus === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{submitMessage}</span>
            <button onClick={() => setSubmitStatus(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Post List */}
          <div className="lg:col-span-1">
            <Card className={`sticky top-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${isDarkMode ? "text-white" : ""}`}>
                  <FileText className="w-5 h-5 inline mr-2" /> Your Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {existingPosts.length === 0 ? (
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No posts yet. Start writing!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {existingPosts.map((post) => (
                      <div
                        key={post._id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                          selectedPostId === post._id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                            : isDarkMode
                            ? "border-gray-700 hover:border-gray-600 hover:bg-gray-700/50"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                        onClick={() => loadPostForEditing(post._id)}
                      >
                        <h4 className={`font-medium text-sm truncate ${isDarkMode ? "text-white" : ""}`}>
                          {post.title}
                        </h4>
                        <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {new Date(post.publishedDate).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadPostForEditing(post._id);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post._id, post.title);
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit}>
              {/* Title Input */}
              <div className="mb-6">
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Your amazing title..."
                  className={`text-3xl font-bold border-0 border-b-2 rounded-none px-0 py-4 focus:ring-0 focus-visible:ring-0 placeholder:text-gray-300 ${
                    isDarkMode
                      ? "bg-transparent text-white border-gray-700 focus:border-indigo-500"
                      : "bg-transparent border-gray-200 focus:border-indigo-500"
                  }`}
                />
              </div>

              {/* Editor Toolbar - Sticky */}
              {!isPreviewMode && (
                <Card className={`mb-4 sticky top-0 z-50 shadow-lg ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white/95 backdrop-blur-sm"}`}>
                  <CardContent className="p-3">
                    <div className="flex flex-wrap gap-1 items-center">
                      {/* Undo/Redo */}
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().undo().run()}
                        disabled={!editor?.can().undo()}
                        title="Undo"
                      >
                        <Undo className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().redo().run()}
                        disabled={!editor?.can().redo()}
                        title="Redo"
                      >
                        <Redo className="w-4 h-4" />
                      </ToolbarButton>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      {/* Text Formatting */}
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        active={editor?.isActive("bold")}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        active={editor?.isActive("italic")}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        active={editor?.isActive("underline")}
                        title="Underline"
                      >
                        <UnderlineIcon className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        active={editor?.isActive("strike")}
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleHighlight().run()}
                        active={editor?.isActive("highlight")}
                        title="Highlight"
                      >
                        <Highlighter className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        active={editor?.isActive("code")}
                        title="Inline Code"
                      >
                        <Code className="w-4 h-4" />
                      </ToolbarButton>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      {/* Headings */}
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor?.isActive("heading", { level: 1 })}
                        title="Heading 1"
                      >
                        <Heading1 className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor?.isActive("heading", { level: 2 })}
                        title="Heading 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor?.isActive("heading", { level: 3 })}
                        title="Heading 3"
                      >
                        <Heading3 className="w-4 h-4" />
                      </ToolbarButton>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      {/* Lists */}
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        active={editor?.isActive("bulletList")}
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        active={editor?.isActive("orderedList")}
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        active={editor?.isActive("blockquote")}
                        title="Quote"
                      >
                        <Quote className="w-4 h-4" />
                      </ToolbarButton>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      {/* Alignment */}
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                        active={editor?.isActive({ textAlign: "left" })}
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                        active={editor?.isActive({ textAlign: "center" })}
                        title="Align Center"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </ToolbarButton>
                      <ToolbarButton
                        onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                        active={editor?.isActive({ textAlign: "right" })}
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4" />
                      </ToolbarButton>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      {/* Media */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={insertImage}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                        <div className={`p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${isUploadingImage ? "opacity-50" : ""}`}>
                          <ImageIcon className={`w-4 h-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} />
                        </div>
                      </label>

                      <ToolbarButton
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        active={editor?.isActive("link")}
                        title="Add Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </ToolbarButton>

                      <ToolbarButton
                        onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                        title="Add YouTube Video"
                      >
                        <YoutubeIcon className="w-4 h-4" />
                      </ToolbarButton>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      {/* Insert Image by URL button */}
                      <ToolbarButton
                        onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                        title="Insert Image by URL"
                        active={showImageUrlInput}
                      >
                        <span className="text-xs font-medium">URL</span>
                        <ImageIcon className="w-4 h-4 ml-1" />
                      </ToolbarButton>
                    </div>

                    {/* Link Input */}
                    {showLinkInput && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1"
                        />
                        <Button type="button" onClick={addLink} size="sm">
                          Add Link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowLinkInput(false);
                            setLinkUrl("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* Image URL Input */}
                    {showImageUrlInput && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-indigo-200 bg-indigo-50/50 -mx-3 px-3 pb-3 rounded-b-lg">
                        <Input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Paste image URL here (e.g., https://example.com/image.png)"
                          className="flex-1"
                        />
                        <Button type="button" onClick={addImageByUrl} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                          Insert Image
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowImageUrlInput(false);
                            setImageUrlInput("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* YouTube Input */}
                    {showYoutubeInput && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1"
                        />
                        <Button type="button" onClick={addYoutube} size="sm">
                          Embed Video
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowYoutubeInput(false);
                            setYoutubeUrl("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Editor Content */}
              <Card className={`mb-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                <CardContent className="p-6">
                  {isPreviewMode ? (
                    <div
                      className={`prose prose-lg max-w-none ${isDarkMode ? "prose-invert" : ""}`}
                      dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
                    />
                  ) : (
                    <>
                      {/* Bubble Menu for selected text */}
                      {editor && (
                        <BubbleMenu
                          editor={editor}
                          tippyOptions={{ duration: 100 }}
                          className="bg-gray-900 rounded-lg shadow-xl p-1 flex gap-1"
                        >
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`p-2 rounded text-white hover:bg-gray-700 ${
                              editor.isActive("bold") ? "bg-gray-700" : ""
                            }`}
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`p-2 rounded text-white hover:bg-gray-700 ${
                              editor.isActive("italic") ? "bg-gray-700" : ""
                            }`}
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={`p-2 rounded text-white hover:bg-gray-700 ${
                              editor.isActive("underline") ? "bg-gray-700" : ""
                            }`}
                          >
                            <UnderlineIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHighlight().run()}
                            className={`p-2 rounded text-white hover:bg-gray-700 ${
                              editor.isActive("highlight") ? "bg-gray-700" : ""
                            }`}
                          >
                            <Highlighter className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLinkInput(true)}
                            className={`p-2 rounded text-white hover:bg-gray-700 ${
                              editor.isActive("link") ? "bg-gray-700" : ""
                            }`}
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </BubbleMenu>
                      )}

                      {/* Floating Menu for empty lines */}
                      {editor && (
                        <FloatingMenu
                          editor={editor}
                          tippyOptions={{ duration: 100 }}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-1 flex gap-1"
                        >
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Heading1 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Heading2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Quote className="w-4 h-4" />
                          </button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={insertImage}
                              className="hidden"
                            />
                            <div className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          </label>
                        </FloatingMenu>
                      )}

                      <EditorContent editor={editor} />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Meta Information */}
              <Card className={`mb-6 ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${isDarkMode ? "text-white" : ""}`}>
                    Post Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Thumbnail */}
                  <div>
                    <Label className={`flex items-center gap-2 mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>
                      <ImageIcon className="w-4 h-4" /> Cover Image
                    </Label>
                    <div className="flex gap-4">
                      <label className="flex-1">
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-indigo-400 ${
                          isDarkMode ? "border-gray-600 hover:bg-gray-700/50" : "border-gray-300 hover:bg-indigo-50"
                        }`}>
                          <Upload className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`} />
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {isUploadingImage ? "Uploading..." : "Click to upload cover image"}
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                      {thumbnailPreview && (
                        <div className="relative w-40 h-24">
                          <img
                            src={thumbnailPreview}
                            alt="Cover preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailPreview("");
                              setFormData((prev) => ({ ...prev, thumbnail: "" }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tags */}
                    <div>
                      <Label className={`flex items-center gap-2 mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>
                        <Tag className="w-4 h-4" /> Tags
                      </Label>
                      <Input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        placeholder="AI, Marketing, Strategy"
                        className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                      />
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Separate with commas
                      </p>
                    </div>

                    {/* Read Time */}
                    <div>
                      <Label className={`flex items-center gap-2 mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>
                        <Clock className="w-4 h-4" /> Read Time
                      </Label>
                      <Input
                        type="text"
                        value={formData.readTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, readTime: e.target.value }))}
                        placeholder="5 min read"
                        className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                      />
                    </div>

                    {/* Published Date */}
                    <div>
                      <Label className={`flex items-center gap-2 mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>
                        <Calendar className="w-4 h-4" /> Publish Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.publishedDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, publishedDate: e.target.value }))}
                        className={isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <Label className={`flex items-center gap-2 mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>
                        Status
                      </Label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                        className={`w-full h-10 px-3 rounded-md border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <Label className={`flex items-center gap-2 mb-2 ${isDarkMode ? "text-gray-300" : ""}`}>
                      Excerpt (Preview Text)
                    </Label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="A brief description of your post..."
                      rows={3}
                      className={`w-full px-3 py-2 rounded-md border ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                          : "bg-white border-gray-300 placeholder:text-gray-400"
                      }`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Leave empty to auto-generate from content
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="publish-blog-btn"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {mode === "edit" ? "Updating..." : "Publishing..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    {mode === "edit" ? "Update Post" : "Publish Post"}
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ModernBlogEditor;
