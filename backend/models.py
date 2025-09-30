from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime


# Blog CMS Models
class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=100)
    excerpt: str = Field(..., max_length=500)
    author: str = Field(default="Jaipal Singh")
    published_date: datetime = Field(default_factory=datetime.utcnow)
    read_time: str = Field(..., max_length=20)
    tags: List[str] = Field(default=[])
    thumbnail: Optional[str] = None
    status: str = Field(default="published")  # draft, published
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=100)
    excerpt: str = Field(..., max_length=500)
    author: str = Field(default="Jaipal Singh")
    read_time: str = Field(..., max_length=20)
    tags: List[str] = Field(default=[])
    thumbnail: Optional[str] = None
    status: str = Field(default="published")

class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200)  
    content: Optional[str] = Field(None, min_length=100)
    excerpt: Optional[str] = Field(None, max_length=500)
    author: Optional[str] = None
    read_time: Optional[str] = Field(None, max_length=20)
    tags: Optional[List[str]] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = None

class BlogResponse(BaseModel):
    success: bool
    message: str
    blog: Optional[BlogPost] = None


# Contact Form Models
class ContactSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=1000)
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="pending")

class ContactSubmissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=1000)

class ContactResponse(BaseModel):
    success: bool
    message: str
    id: str = None

# Existing Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str