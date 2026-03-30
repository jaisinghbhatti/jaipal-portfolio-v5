Create backend/lead_sniper.py on main branch:
Go to: https://github.com/jaisinghbhatti/jaipal-portfolio-v5/tree/main/backend
Click "Add file" → "Create new file"
Name it: lead_sniper.py
Paste this code:
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

from places_service import places_service
from lead_service import lead_service

router = APIRouter(prefix="/api/leads", tags=["leads"])

logger = logging.getLogger(__name__)


# Define Models
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


@router.get("/health")
async def leads_health():
    return {"status": "healthy", "service": "lead-sniper"}


@router.post("/search", response_model=LeadSearchResponse)
async def search_leads(request: LeadSearchRequest):
    """
    Search for potential business leads based on target industry and location.
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
