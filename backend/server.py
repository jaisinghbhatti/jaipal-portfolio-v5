from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime
from models import (
    StatusCheck, StatusCheckCreate, 
    ContactSubmission, ContactSubmissionCreate, ContactResponse,
    BlogPost, BlogPostCreate, BlogPostUpdate, BlogResponse
)
from email_service import send_contact_email, send_confirmation_email
from typing import List

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Existing routes
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# New Contact Form Routes
@api_router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(contact_data: ContactSubmissionCreate):
    """Submit contact form and send email"""
    try:
        # Create contact submission object
        contact_submission = ContactSubmission(**contact_data.dict())
        
        # Store in database
        result = await db.contact_submissions.insert_one(contact_submission.dict())
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to store contact submission")
        
        # Send email to Jaipal Singh
        email_sent = False
        try:
            email_sent = await send_contact_email(
                name=contact_data.name,
                email=contact_data.email,
                message=contact_data.message
            )
            
            # Send confirmation email to sender (optional - won't fail if this fails)
            if email_sent:
                await send_confirmation_email(
                    name=contact_data.name,
                    email=contact_data.email
                )
            
        except Exception as email_error:
            logger.error(f"Email sending failed: {str(email_error)}")
            email_sent = False
        
        # Update status based on email success
        status = "processed" if email_sent else "email_failed"
        await db.contact_submissions.update_one(
            {"id": contact_submission.id},
            {"$set": {"status": status}}
        )
        
        return ContactResponse(
            success=True,
            message="Message received successfully! I'll get back to you soon." if not email_sent else "Message sent successfully! I'll get back to you soon.",
            id=contact_submission.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Contact form submission error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error. Please try again later.")

@api_router.get("/contact", response_model=List[ContactSubmission])
async def get_contact_submissions():
    """Get all contact submissions (for admin purposes)"""
    try:
        submissions = await db.contact_submissions.find().sort("submitted_at", -1).to_list(100)
        return [ContactSubmission(**submission) for submission in submissions]
    except Exception as e:
        logger.error(f"Error fetching contact submissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch contact submissions")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()