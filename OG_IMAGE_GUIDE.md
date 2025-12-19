# Open Graph Image Setup Guide

## What You Need

An **og-image.jpg** file that will show when you share your website/blogs on social media.

### Image Specifications:
- **Size**: 1200 x 630 pixels (recommended by Facebook/LinkedIn)
- **Format**: JPG or PNG
- **File name**: `og-image.jpg`
- **Location**: `/app/frontend/public/og-image.jpg`

---

## Option 1: Create Your Own Image

### Tools to Use:
1. **Canva** (https://canva.com)
   - Search for "LinkedIn Post" template (1200x630)
   - Add your photo, name, title
   - Export as JPG

2. **Figma** (https://figma.com)
   - Create 1200x630 canvas
   - Design your professional card
   - Export as JPG

### What to Include:
- Your professional photo
- Your name: "Jaipal Singh"
- Your title: "Digital Marketing Expert"
- Your website: "jaisingh.in"
- Professional background (gradient, clean design)

---

## Option 2: Use AI to Generate

Use AI image generators like:
- DALL-E
- Midjourney
- Canva AI

**Prompt:**
```
Professional LinkedIn banner for Jaipal Singh, Digital Marketing Expert, 
modern gradient background, clean typography, 1200x630 pixels, 
professional business card style
```

---

## Option 3: Use Your Blog Thumbnails

Since you already have blog thumbnails in Sanity, you can:
1. Use one of your existing blog images as the default
2. Or create a generic professional banner

---

## How to Add the Image:

### Step 1: Create/Download your image
Make sure it's 1200x630 pixels and named `og-image.jpg`

### Step 2: Add to your project
Place it in: `/app/frontend/public/og-image.jpg`

### Step 3: Deploy
Save to GitHub and Vercel will deploy it

---

## Testing Your Image:

### LinkedIn Post Inspector:
1. Go to: https://www.linkedin.com/post-inspector/
2. Enter your URL: https://jaisingh.in/blog/your-blog-slug
3. Click "Inspect"
4. If old image shows, click "Clear Cache"

### Facebook Sharing Debugger:
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Click "Scrape Again" to refresh

### Twitter Card Validator:
1. Go to: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Preview the card

---

## Current Setup:

I've updated your `index.html` to reference:
```html
<meta property="og:image" content="https://jaisingh.in/og-image.jpg" />
```

**Once you add the image file, it will show instead of the Emergent badge!**

---

## Quick Temporary Fix:

If you want to test immediately, you can use one of your existing blog thumbnails:

1. Find a blog thumbnail URL from Sanity
2. Update `/app/frontend/public/index.html`:
   ```html
   <meta property="og:image" content="YOUR_SANITY_IMAGE_URL" />
   ```

This will show that image when sharing until you create a custom one.
