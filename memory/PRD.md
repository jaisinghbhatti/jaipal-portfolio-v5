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

### 1. Portfolio Website
- Homepage with hero section
- About Me page
- Experience section
- Achievements section
- Expertise section
- Contact section
- Responsive design

### 2. Blog System
- **Sanity.io Integration** for content storage
- **Modern Blog Editor (TipTap v3)**
  - Rich text formatting (Bold, Italic, Underline, Strikethrough, Highlight, Code)
  - Headings (H1, H2, H3), Lists, Blockquotes
  - Text alignment, Inline image upload, Link insertion
  - YouTube embedding, Bubble menu, Floating menu
  - Dark/Light mode, Live preview, Auto-save drafts
  - Cover image, Tags, Read Time, Status fields
  - Edit and delete existing posts
- Blog listing page (/blog)
- Individual blog post pages (/blog/:slug)

### 3. Resume Builder - FULLY FUNCTIONAL
- Multi-step UI workflow (4 steps: Upload, Customize, Select Style, Export)
- PDF/DOCX resume parsing
- AI-powered resume analysis (ATS score, missing keywords)
- AI optimization with tone selection (Executive, Disruptor, Human)
- **4 Professional Resume Templates with Preview + DOCX + PDF Export** (Dec 2025):
  - **Harvard Executive**: Classic single-column, serif fonts, centered header
  - **Modern Tech**: Two-column layout with blue sidebar, profile photo
  - **Impact-First**: Bold headers, Key Achievements box, accent colors
  - **Minimalist ATS**: Ultra-clean, minimal styling, maximum readability
- Template selector respects user choice through to export
- Clean markdown-free export for all templates
- Profile photo support in all templates (DOCX + PDF)
- "Change Template" button in Step 4 for easy switching

---

## Recent Fixes (Dec 2025)

### Resume Export - Complete Rewrite
- Refactored PreviewExport.jsx from monolithic 840-line file into modular architecture
- Created shared resumeUtils.js (parser, cleanText, image utilities)
- Built 4 individual template files under templates/ directory
- Fixed critical parser bug: `**bold**` no longer misinterpreted as bullet `*`
- All templates produce professional DOCX and PDF exports

### Missing Keywords Analysis Fix
- Improved AI prompt to be more aggressive about finding keyword gaps
- Enhanced JSON parsing with better code block extraction
- Added fallback to prevent empty keyword lists
- Verified: endpoint now correctly identifies missing keywords

### Backend Cleanup
- Removed obsolete files: email_service.py, models.py, migrate_blogs.py, railway.toml, nixpacks.toml

---

## Code Architecture
```
/app/
├── backend/
│   ├── resume_builder.py     # FastAPI router with AI logic (Gemini 2.5 Flash)
│   ├── server.py             # Main server file
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── resume-builder/
    │   │   │   ├── PreviewExport.jsx       # Orchestrator: dispatches to template
    │   │   │   ├── resumeUtils.js          # Shared parser + utilities
    │   │   │   ├── templates/
    │   │   │   │   ├── ModernTemplate.jsx  # Two-column blue sidebar
    │   │   │   │   ├── HarvardTemplate.jsx # Classic serif single-column
    │   │   │   │   ├── ImpactTemplate.jsx  # Bold headers + Key Wins
    │   │   │   │   └── MinimalTemplate.jsx # Ultra-clean minimalist
    │   │   │   ├── TemplateSelector.jsx
    │   │   │   ├── ResumeBuilderPage.jsx
    │   │   │   ├── InputModule.jsx
    │   │   │   ├── CustomizeModule.jsx
    │   │   │   └── ProgressStepper.jsx
    │   │   ├── ModernBlogEditor.jsx
    │   │   ├── BlogPage.jsx
    │   │   └── ui/
    │   ├── services/
    │   │   ├── sanityService.js
    │   │   └── resumeBuilderService.js
    │   └── App.js
    └── package.json
```

## Key API Endpoints
- `POST /api/resume-builder/parse` - Parse uploaded PDF/DOCX
- `POST /api/resume-builder/analyze` - Analyze resume vs job description
- `POST /api/resume-builder/optimize` - AI-optimize resume + generate cover letter
- `GET /api/health`

## Credentials
- **Blog Editor**: username: `jaipal`, password: `blog2025!`
- **Sanity Project ID**: bx61rc9c

---

## Pending Issues
None critical.

## Backlog (P2+)
- Blog Image Saving: Images in blog editor may not persist after save
- Consider server-side PDF generation for higher fidelity exports

---

*Last Updated: December 2025*
