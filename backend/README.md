# Resume Builder Backend

This is the FastAPI backend for the AI Resume Builder feature on JaiSingh.in.

## Deploy to Railway

1. Create a Railway account at https://railway.app
2. Create a new project from this repository
3. Add the environment variable: `EMERGENT_LLM_KEY`
4. Deploy!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| EMERGENT_LLM_KEY | Yes | Your Emergent LLM API key for AI features |
| MONGO_URL | No | MongoDB URL (only for contact form) |
| DB_NAME | No | Database name (default: resume_builder) |

## API Endpoints

- `POST /api/resume-builder/parse` - Parse PDF/DOCX files
- `POST /api/resume-builder/analyze` - Analyze resume against job description
- `POST /api/resume-builder/optimize` - Optimize resume with AI
