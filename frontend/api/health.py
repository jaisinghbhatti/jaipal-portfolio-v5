"""Vercel Serverless Function: Health Check"""
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "resume-builder", "runtime": "vercel-serverless"}
