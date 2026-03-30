# Lead Sniper PRD - jaisingh.in/leads

## Original Problem Statement
Build a landing page for Jaisingh.in with the URL jaisingh.in/leads - "The Universal Lead Sniper: Agent Workflow (V7)". A B2B lead generation tool that:
1. Accepts Discovery Parameters (Business Name, Location, Core Offering, Target Industry, Search Radius)
2. Uses Google Maps/Places API to find businesses within target industry and radius
3. Generates AI-powered power pitch messages
4. Displays results in Excel-ready table with WhatsApp links

## User Personas
- **Primary**: B2B Sales Professionals / Business Owners seeking local leads
- **Use Case**: Jai Packaging Industries targeting shoe manufacturers, e-commerce businesses needing packaging solutions

## Core Requirements (Static)
- [x] Discovery Parameters Form
- [x] Google Places API integration for business search
- [x] AI-powered pitch generation (Gemini 3 Flash)
- [x] Results table with: Business Name, Distance, Phone, Industry, Power Pitch, WhatsApp Link
- [x] One-click WhatsApp outreach links
- [x] CSV export functionality
- [x] Dark tactical theme matching Jaisingh.in branding

## What's Been Implemented (December 2025)

### Backend (FastAPI)
- `/api/leads/search` - Main lead search endpoint with Google Places integration
- `/api/leads/history` - Search history tracking
- `places_service.py` - Google Places API wrapper (geocoding, text search, distance calculation)
- `lead_service.py` - AI pitch generation with Gemini 3 Flash, WhatsApp link generator

### Frontend (React)
- `/leads` route with LeadSniper landing page
- Hero section with tactical command center design
- Discovery Parameters form (4-column bento grid)
- Results table (8-column bento grid, data terminal style)
- Export CSV functionality
- AI-Enhanced Pitches toggle

### Integrations
- Google Places API (Geocoding + Text Search)
- Gemini 3 Flash via Emergent LLM Key

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core lead search functionality
- [x] WhatsApp link generation
- [x] Results display

### P1 (High Priority)
- [ ] Save favorite leads to database
- [ ] Bulk WhatsApp messaging queue
- [ ] Search templates/presets

### P2 (Medium Priority)
- [ ] Lead scoring/ranking algorithm
- [ ] Integration with CRM systems
- [ ] Email outreach option alongside WhatsApp

### P3 (Nice to Have)
- [ ] Analytics dashboard for search history
- [ ] Multi-language pitch support
- [ ] Team collaboration features

## Next Tasks
1. Add lead saving/favorites feature
2. Implement bulk export with WhatsApp message scheduling
3. Add search history view in UI
