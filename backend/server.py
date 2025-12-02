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


# Blog CMS Routes
@api_router.get("/blogs", response_model=List[BlogPost])
async def get_blogs(status: str = "published"):
    """Get all blog posts"""
    try:
        query = {"status": status} if status != "all" else {}
        blogs = await db.blog_posts.find(query).sort("published_date", -1).to_list(100)
        return [BlogPost(**blog) for blog in blogs]
    except Exception as e:
        logger.error(f"Error fetching blogs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch blogs")

@api_router.get("/blogs/{slug}", response_model=BlogPost)
async def get_blog_by_slug(slug: str):
    """Get a specific blog post by slug"""
    try:
        blog = await db.blog_posts.find_one({"slug": slug, "status": "published"})
        if not blog:
            raise HTTPException(status_code=404, detail="Blog post not found")
        return BlogPost(**blog)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching blog by slug: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch blog")

@api_router.post("/blogs", response_model=BlogResponse)
async def create_blog(blog_data: BlogPostCreate):
    """Create a new blog post"""
    try:
        # Check if slug already exists
        existing_blog = await db.blog_posts.find_one({"slug": blog_data.slug})
        if existing_blog:
            raise HTTPException(status_code=400, detail="A blog with this slug already exists")
        
        # Create blog post
        blog_post = BlogPost(**blog_data.dict())
        result = await db.blog_posts.insert_one(blog_post.dict())
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create blog post")
            
        return BlogResponse(
            success=True,
            message="Blog post created successfully",
            blog=blog_post
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create blog post")

@api_router.put("/blogs/{blog_id}", response_model=BlogResponse)
async def update_blog(blog_id: str, blog_data: BlogPostUpdate):
    """Update a blog post"""
    try:
        # Check if blog exists
        existing_blog = await db.blog_posts.find_one({"id": blog_id})
        if not existing_blog:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        # Prepare update data
        update_data = {k: v for k, v in blog_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update blog post
        result = await db.blog_posts.update_one(
            {"id": blog_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes were made")
            
        # Fetch updated blog
        updated_blog = await db.blog_posts.find_one({"id": blog_id})
        
        return BlogResponse(
            success=True,
            message="Blog post updated successfully",
            blog=BlogPost(**updated_blog)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update blog post")

@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str):
    """Delete a blog post"""
    try:
        # Check if blog exists
        existing_blog = await db.blog_posts.find_one({"id": blog_id})
        if not existing_blog:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        # Delete blog post
        result = await db.blog_posts.delete_one({"id": blog_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete blog post")
            
        return {"success": True, "message": "Blog post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete blog post")

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