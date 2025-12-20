# Resume Builder Testing

## Test Environment
- Frontend: http://localhost:3000/resume-builder
- Backend API: http://localhost:8001/api/resume-builder/

## Features to Test

### 1. UI Navigation
- [ ] Resume Builder link visible in header navigation
- [ ] Page loads at /resume-builder
- [ ] Progress stepper shows 4 steps
- [ ] Mobile responsive navigation

### 2. Step 1: Input Module
- [ ] Resume text area accepts input
- [ ] JD text area accepts input
- [ ] File upload for PDF/DOCX (resume)
- [ ] File upload for PDF/DOCX (JD)
- [ ] Profile photo upload
- [ ] "Continue to Customize" button enables when resume and JD are provided

### 3. Step 2: Customize Module
- [ ] Match score displays (circular gauge)
- [ ] Missing keywords are shown
- [ ] Tone selector (Executive/Disruptor/Human)
- [ ] "Optimize My Resume" button works
- [ ] Optimized resume preview shows
- [ ] Cover letter is generated

### 4. Step 3: Template Selector
- [ ] 4 templates are displayed (Harvard, Modern, Impact, Minimal)
- [ ] Templates can be selected
- [ ] Template preview updates

### 5. Step 4: Export
- [ ] Live preview shows resume
- [ ] Edit mode works (click to edit)
- [ ] Cover letter tab works
- [ ] Terms of Use checkbox
- [ ] Download PDF button (disabled until terms agreed)

### 6. Backend API Tests
- POST /api/resume-builder/parse (file upload)
- POST /api/resume-builder/analyze (match score)
- POST /api/resume-builder/optimize (AI optimization)

## Test Data
Sample Resume:
```
John Smith
Software Engineer
john@email.com | (555) 123-4567

EXPERIENCE
Software Engineer at ABC Corp (2020-Present)
- Developed web applications using React and Python
- Led team of 3 developers
- Improved system performance

SKILLS
Python, JavaScript, React, SQL
```

Sample JD:
```
Senior Software Engineer
Requirements:
- 5+ years experience
- Python, JavaScript, React
- AWS, Docker, Kubernetes
- Team leadership experience
```

## Incorporate User Feedback
- User wants to build AI-powered resume builder
- Must have 4-step wizard flow
- ATS-friendly templates required
- Match score calculation
- Cover letter generation with different tones
