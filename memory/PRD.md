# Jaipal Singh Portfolio - Product Requirements Document

## Original Problem Statement
A personal portfolio website for Jaipal Singh (Digital Marketing Expert) with:
1. **Portfolio Website** - Showcasing experience, achievements, and expertise
2. **Blog System** - Powered by Sanity.io CMS for content management
3. **Resume Builder** - AI-powered tool to help users build and optimize resumes using Gemini 2.5 Flash

## User Personas
- **Primary User**: Jaipal Singh (portfolio owner, blog author)
- **Secondary Users**: Visitors, recruiters, potential clients, resume builder users

## Tech Stack
- **Frontend**: React 19, TailwindCSS, Shadcn/UI components
- **Backend**: FastAPI (Python) - hosted on Emergent Preview
- **Database**: Sanity.io (Blog CMS)
- **AI Provider**: Gemini 2.5 Flash via Emergent LLM Key
- **Deployment**: Vercel (Frontend), Emergent Preview (Backend)

---

## Completed Features

### 1. Portfolio Website ✅
- Homepage with hero section
- About Me page
- Experience section
- Achievements section
- Expertise section
- Contact section
- Responsive design

### 2. Blog System ✅
- **Sanity.io Integration** for content storage
- **Modern Blog Editor (TipTap v3)** - Completed Jan 25, 2025
  - Rich text formatting (Bold, Italic, Underline, Strikethrough, Highlight, Code)
  - Headings (H1, H2, H3)
  - Lists (Bullet, Numbered, Blockquote)
  - Text alignment (Left, Center, Right)
  - Inline image upload to Sanity
  - Link insertion
  - YouTube video embedding
  - Bubble menu for selected text
  - Floating menu for empty lines
  - Dark/Light mode toggle
  - Live preview mode
  - Auto-save drafts to localStorage
  - Cover image upload
  - Tags, Read Time, Publish Date, Status fields
  - Edit and delete existing posts
  - **Sticky floating toolbar** - Jan 25, 2025
  - **Insert Image by URL feature** - Jan 25, 2025
- Blog listing page (/blog)
- Individual blog post pages (/blog/:slug)

### 3. Resume Builder ✅
- Multi-step UI workflow
- PDF/DOCX resume parsing
- AI-powered resume analysis (ATS score, missing keywords)
- AI optimization with tone selection (Executive, Disruptor, Human)
- 4 professional resume templates (Harvard, Modern, Impact, Minimal)
- **Clean markdown-free export** - Fixed Jan 25, 2025
  - PDF export with proper formatting (no **, *, ## symbols)
  - DOCX export with professional styling
  - Automatic markdown cleanup on AI response
- Route: /resume-builder

---

## Recent Fixes (Jan 25, 2025)

### Resume Builder Export Fix
- **Problem**: Downloaded DOCX/PDF files contained raw markdown symbols like `**bold**`, `*italic*`, `##headers`
- **Solution**: Added `cleanMarkdown()` and `cleanResumeText()` functions to strip all markdown from AI output before display and export
- **Result**: Clean, professional, ready-to-use resume documents

---

## Pending Issues

### P1 - Missing Keywords Bug
- **Description**: The "Missing Keywords" analysis sometimes incorrectly shows "No missing keywords detected" even when gaps exist
- **Status**: NOT STARTED
- **File**: backend/resume_builder.py

### P2 - Blog Image Saving
- **Description**: Images added in blog editor may not persist after save
- **Status**: IN PROGRESS
- **Files**: frontend/src/components/ModernBlogEditor.jsx

---

## Code Architecture
```
/app/
├── backend/
│   ├── resume_builder.py     # FastAPI router with AI logic
│   ├── server.py             # Main server file
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── resume-builder/
    │   │   │   ├── PreviewExport.jsx   # UPDATED: Clean markdown export
    │   │   │   └── ...
    │   │   ├── ModernBlogEditor.jsx
    │   │   ├── BlogLogin.jsx
    │   │   └── ui/
    │   ├── services/
    │   │   ├── sanityService.js
    │   │   └── resumeBuilderService.js
    │   └── App.js
    └── package.json
```

## Key API Endpoints
- `POST /api/resume-builder/parse`
- `POST /api/resume-builder/analyze`
- `POST /api/resume-builder/optimize`
- `GET /api/health`

## Backend URL
- **Production**: `https://layout-rebuild-v2.preview.emergentagent.com`
- **Vercel Environment Variable**: `REACT_APP_BACKEND_URL`

## Credentials
- **Blog Editor**: username: `jaipal`, password: `blog2025!`
- **Sanity Project ID**: bx61rc9c

---

*Last Updated: January 25, 2025*
