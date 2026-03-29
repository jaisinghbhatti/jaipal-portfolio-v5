# Jaipal Singh Portfolio - Product Requirements Document

## Original Problem Statement
A personal portfolio website for Jaipal Singh (Digital Marketing Expert) with:
1. **Portfolio Website** - Showcasing experience, achievements, and expertise
2. **Blog System** - Powered by Sanity.io CMS
3. **Resume Builder** - AI-powered tool to build and optimize resumes using Gemini 2.5 Flash

## Tech Stack
- **Frontend**: React 19, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI (Python) — used only for AI features
- **AI Provider**: Gemini 2.5 Flash via Emergent LLM Key
- **Deployment**: Vercel (Frontend + Serverless API functions)
- **Blog CMS**: Sanity.io

---

## Architecture — Resume Builder (PERMANENT FIX - Dec 2025)

### Previous Architecture (BROKEN)
```
[User Browser] → [Vercel Frontend] → [External Backend (Railway/Emergent Preview)] → [Gemini AI]
                                       ↑ This kept dying
```

### New Architecture (PERMANENT)
```
[User Browser] → [Vercel Frontend]
                   ├── File Upload: Client-side (mammoth.js + pdfjs-dist) — NO backend needed
                   ├── AI Analyze: Vercel Serverless Function (/api/resume-builder/analyze.py)
                   ├── AI Optimize: Vercel Serverless Function (/api/resume-builder/optimize.py)
                   └── Export: Client-side (docx + jsPDF) — NO backend needed
```

**Key changes:**
1. **File parsing is 100% client-side** — mammoth.js (DOCX) + pdfjs-dist (PDF). No backend call needed.
2. **Vercel serverless functions** for AI endpoints — deployed alongside frontend, same domain.
3. **"Skip AI" fallback** — users can skip AI optimization and go directly to template/export.
4. **No external backend dependency** — everything runs on Vercel.

### Deployment Instructions for jaisingh.in
1. Push code to GitHub using "Save to GitHub"
2. In Vercel Dashboard → Settings → Environment Variables:
   - Add `EMERGENT_LLM_KEY` = (your Emergent Universal Key from Profile → Universal Key)
3. Redeploy on Vercel — the `/api/` directory auto-deploys as serverless functions

---

## Completed Features

### Portfolio Website
- Homepage, About Me, Experience, Achievements, Expertise, Contact sections

### Blog System
- Sanity.io CMS integration
- Modern TipTap v3 editor with rich text, images, links, YouTube embeds
- Blog listing (/blog) and post pages (/blog/:slug)
- Credentials: jaipal / blog2025!

### Resume Builder — FULLY FUNCTIONAL
- **4-Step Workflow**: Upload → Customize → Select Style → Export
- **Client-side file parsing** (DOCX + PDF) — permanent, no backend needed
- **AI-powered analysis** (ATS score, missing keywords) via Gemini 2.5 Flash
- **AI optimization** with 3 tones (Executive, Disruptor, Human)
- **4 Professional Templates**:
  - Harvard Executive: Classic single-column, serif fonts
  - Modern Tech: Two-column layout with blue sidebar
  - Impact-First: Bold headers, Key Achievements box
  - Minimalist ATS: Ultra-clean, maximum readability
- **Export**: DOCX + PDF for all templates with profile photo support
- **Font**: Times New Roman across all templates
- **Skip AI**: Users can proceed without AI when backend is unavailable
- **Vercel Serverless Functions** ready for deployment (api/ directory)

---

## Code Architecture
```
/app/frontend/
├── api/                           # Vercel Serverless Functions
│   ├── requirements.txt           # emergentintegrations
│   ├── health.py                  # GET /api/health
│   └── resume-builder/
│       ├── analyze.py             # POST /api/resume-builder/analyze
│       └── optimize.py            # POST /api/resume-builder/optimize
├── src/
│   ├── services/
│   │   ├── clientSideParser.js    # Client-side DOCX/PDF parsing (mammoth + pdfjs)
│   │   ├── resumeBuilderService.js # API service (parseDocument → client-side)
│   │   └── sanityService.js
│   ├── components/
│   │   ├── resume-builder/
│   │   │   ├── PreviewExport.jsx
│   │   │   ├── resumeUtils.js
│   │   │   ├── templates/
│   │   │   │   ├── ModernTemplate.jsx
│   │   │   │   ├── HarvardTemplate.jsx
│   │   │   │   ├── ImpactTemplate.jsx
│   │   │   │   └── MinimalTemplate.jsx
│   │   │   ├── InputModule.jsx
│   │   │   ├── CustomizeModule.jsx
│   │   │   ├── TemplateSelector.jsx
│   │   │   └── ResumeBuilderPage.jsx
│   │   └── ModernBlogEditor.jsx
│   └── App.js
├── vercel.json
└── package.json
```

---

## Pending / Backlog
- P2: Blog image persistence in editor
- P2: Server-side PDF generation for pixel-perfect exports

---

*Last Updated: December 2025*
