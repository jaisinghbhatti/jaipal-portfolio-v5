import os
import logging
import urllib.parse
from typing import List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


class LeadService:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        
    async def generate_power_pitch(
        self,
        user_business_name: str,
        user_core_offering: str,
        target_business_name: str,
        target_industry: str
    ) -> str:
        """Generate a personalized power pitch message using AI."""
        
        # Standard template-based pitch (fast, reliable)
        pitch = f'Hi {target_business_name} team, Greetings From {user_business_name}. We are veterans specializing in {user_core_offering}. We offer premium service with world-class products that fit your needs. Can we share our 2026 Price List/Portfolio?'
        
        return pitch
    
    async def generate_ai_enhanced_pitch(
        self,
        user_business_name: str,
        user_core_offering: str,
        target_business_name: str,
        target_industry: str
    ) -> str:
        """Generate an AI-enhanced personalized pitch using Gemini 3 Flash."""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"lead-pitch-{target_business_name}",
                system_message="""You are a B2B sales copywriter. Generate a SHORT, professional WhatsApp outreach message. 
Keep it under 50 words. Be warm but professional. Include a call-to-action asking if they want a price list/portfolio.
Do NOT use emojis. Start with 'Hi [business] team,'."""
            ).with_model("gemini", "gemini-3-flash-preview")
            
            user_message = UserMessage(
                text=f"""Generate a brief B2B outreach message:
- Sender: {user_business_name}
- Sender's Offering: {user_core_offering}
- Target Business: {target_business_name}
- Target Industry: {target_industry}

Make it relevant to why this industry needs the offering."""
            )
            
            response = await chat.send_message(user_message)
            return response.strip()
            
        except Exception as e:
            logger.error(f"AI pitch generation failed: {str(e)}")
            # Fallback to template
            return await self.generate_power_pitch(
                user_business_name,
                user_core_offering,
                target_business_name,
                target_industry
            )
    
    def generate_whatsapp_link(self, phone: str, message: str) -> str:
        """Generate a WhatsApp click-to-chat link with pre-filled message."""
        # Clean phone number - remove spaces, dashes, etc.
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Add country code if not present (assuming India)
        if clean_phone and not clean_phone.startswith('91') and len(clean_phone) == 10:
            clean_phone = '91' + clean_phone
        
        # URL encode the message
        encoded_message = urllib.parse.quote(message)
        
        return f"https://wa.me/{clean_phone}?text={encoded_message}"
    
    async def process_leads(
        self,
        leads: List[Dict[str, Any]],
        user_business_name: str,
        user_core_offering: str,
        use_ai_pitch: bool = False
    ) -> List[Dict[str, Any]]:
        """Process leads and add power pitches and WhatsApp links."""
        processed_leads = []
        
        for lead in leads:
            if use_ai_pitch:
                pitch = await self.generate_ai_enhanced_pitch(
                    user_business_name,
                    user_core_offering,
                    lead["name"],
                    lead["industry"]
                )
            else:
                pitch = await self.generate_power_pitch(
                    user_business_name,
                    user_core_offering,
                    lead["name"],
                    lead["industry"]
                )
            
            whatsapp_link = ""
            if lead.get("phone"):
                whatsapp_link = self.generate_whatsapp_link(lead["phone"], pitch)
            
            processed_lead = {
                **lead,
                "power_pitch": pitch,
                "whatsapp_link": whatsapp_link
            }
            
            processed_leads.append(processed_lead)
        
        return processed_leads


lead_service = LeadService()
