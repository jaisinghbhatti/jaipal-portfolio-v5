# API Contracts & Integration Plan

## Overview
This document outlines the API contracts, mock data structure, and integration plan for Jaipal Singh's portfolio website.

## Current Mock Data Structure

### Personal Information
- Static data: name, title, email, phone, bio, personalBio, location
- Source: `/app/frontend/src/data/mockData.js`
- Usage: Hero, About, Contact sections

### Skills & Services  
- Static data: categorized skills and services with descriptions
- No backend integration needed (static content)

### Experience & Achievements
- Static data: work history and awards
- No backend integration needed (static content)

## Backend Implementation Required

### 1. Contact Form Submission

**Endpoint**: `POST /api/contact`

**Request Body**:
```json
{
  "name": "string",
  "email": "string", 
  "message": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "id": "contact_submission_id"
}
```

**Functionality**:
- Validate input data
- Store submission in MongoDB
- Send email to jaisinghbhatti@gmail.com
- Return success/error response

### 2. MongoDB Schema

**Collection**: `contact_submissions`
```javascript
{
  _id: ObjectId,
  name: String,
  email: String, 
  message: String,
  submitted_at: Date,
  status: String // 'pending', 'processed'
}
```

## Frontend Integration Changes

### ContactSection.jsx
**Current**: Mock form submission with setTimeout
**New**: Replace with actual API call to `/api/contact`

**Changes**:
- Remove mock Promise/setTimeout
- Add axios POST request to backend
- Handle real error responses
- Maintain existing UI feedback (toast notifications)

## Email Configuration

**Requirements**:
- SMTP configuration for sending emails
- Email template for contact form submissions
- Recipient: jaisinghbhatti@gmail.com

## Environment Variables Needed

**Backend (.env)**:
- `SMTP_HOST`: Email server host
- `SMTP_PORT`: Email server port  
- `SMTP_USER`: Email username
- `SMTP_PASS`: Email password
- `TO_EMAIL`: jaisinghbhatti@gmail.com

## Implementation Steps

1. **Backend Models**: Create MongoDB schema for contact submissions
2. **Email Service**: Setup SMTP configuration and email sending
3. **API Endpoint**: Implement POST /api/contact with validation
4. **Frontend Integration**: Replace mock with real API calls
5. **Testing**: Verify form submission and email delivery

## Error Handling

**Backend**:
- Input validation errors (400)
- Email sending failures (500)
- Database errors (500)

**Frontend**:
- Network errors
- Server errors  
- Form validation errors
- User-friendly error messages via toast

## Success Flow

1. User fills contact form
2. Frontend validates and submits to `/api/contact`
3. Backend validates data
4. Backend stores in MongoDB
5. Backend sends email to jaisinghbhatti@gmail.com
6. Backend returns success response
7. Frontend shows success toast
8. Form resets for next submission