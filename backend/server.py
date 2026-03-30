from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from places_service import places_service
from lead_service import lead_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Lead Sniper API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class LeadSearchRequest(BaseModel):
    user_business_name: str = Field(..., description="User's business name")
    user_location: str = Field(..., description="User's location (city, address)")
    user_core_offering: str = Field(..., description="What the user sells/offers")
    target_industry: str = Field(..., description="Target client industry to search for")
    search_radius_km: int = Field(default=10, ge=1, le=50, description="Search radius in kilometers")
    use_ai_pitch: bool = Field(default=False, description="Use AI to generate personalized pitches")

class Lead(BaseModel):
    name: str
    address: str
    phone: str
    distance_km: float
    industry: str
    status: str
    power_pitch: str
    whatsapp_link: str

class LeadSearchResponse(BaseModel):
    success: bool
    total_results: int
    user_location: str
    user_coordinates: Optional[dict] = None
    search_radius_km: int
    leads: List[Lead]
    message: str


# Routes
@api_router.get("/")
async def root():
    return {"message": "Lead Sniper API v1.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lead-sniper"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/leads/search", response_model=LeadSearchResponse)
async def search_leads(request: LeadSearchRequest):
    """
    Search for potential business leads based on target industry and location.
    Returns leads with contact info, distance, and pre-formatted outreach messages.
    """
    try:
        logger.info(f"Lead search request: {request.user_business_name} looking for {request.target_industry} near {request.user_location}")
        
        # Step 1: Geocode user's location
        coordinates = places_service.geocode_location(request.user_location)
        
        if not coordinates:
            raise HTTPException(
                status_code=400,
                detail=f"Could not find location: {request.user_location}. Please provide a valid address or city."
            )
        
        # Step 2: Search for businesses in target industry
        radius_meters = request.search_radius_km * 1000
        
        places = places_service.search_nearby(
            latitude=coordinates["latitude"],
            longitude=coordinates["longitude"],
            keyword=request.target_industry,
            radius=radius_meters,
            max_results=20
        )
        
        if not places:
            return LeadSearchResponse(
                success=True,
                total_results=0,
                user_location=request.user_location,
                user_coordinates=coordinates,
                search_radius_km=request.search_radius_km,
                leads=[],
                message=f"No {request.target_industry} businesses found within {request.search_radius_km}km of {request.user_location}. Try increasing the search radius or changing the target industry."
            )
        
        # Step 3: Format places as leads
        raw_leads = places_service.format_places_for_leads(
            places,
            coordinates["latitude"],
            coordinates["longitude"]
        )
        
        # Step 4: Generate power pitches and WhatsApp links
        processed_leads = await lead_service.process_leads(
            raw_leads,
            request.user_business_name,
            request.user_core_offering,
            request.use_ai_pitch
        )
        
        # Step 5: Save search to database
        search_record = {
            "id": str(uuid.uuid4()),
            "user_business_name": request.user_business_name,
            "user_location": request.user_location,
            "target_industry": request.target_industry,
            "search_radius_km": request.search_radius_km,
            "results_count": len(processed_leads),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.lead_searches.insert_one(search_record)
        
        return LeadSearchResponse(
            success=True,
            total_results=len(processed_leads),
            user_location=request.user_location,
            user_coordinates=coordinates,
            search_radius_km=request.search_radius_km,
            leads=processed_leads,
            message=f"Found {len(processed_leads)} potential leads in {request.target_industry} within {request.search_radius_km}km of {request.user_location}."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in lead search: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for leads: {str(e)}"
        )


@api_router.get("/leads/history")
async def get_search_history(limit: int = 10):
    """Get recent lead search history."""
    searches = await db.lead_searches.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {"searches": searches}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
