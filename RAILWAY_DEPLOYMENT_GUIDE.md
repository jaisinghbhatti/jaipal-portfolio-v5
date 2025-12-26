# 🚀 Deploy Resume Builder Backend to Railway

## Step-by-Step Guide for Jaipal

---

## PART 1: Get Your Emergent LLM Key

Before deploying, you need your Emergent LLM Key (this powers the AI features).

1. Go to your Emergent profile
2. Click on **Universal Key** 
3. Copy the key (starts with `sk-emergent-...`)
4. Save it somewhere safe - you'll need it in Step 6

---

## PART 2: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Click **"Login"** (top right)
3. Choose **"Login with GitHub"** (easiest option)
4. Authorize Railway to access your GitHub

### Step 2: Create New Project
1. Once logged in, click **"New Project"** (purple button)
2. Select **"Deploy from GitHub repo"**
3. If asked, authorize Railway to access your repositories
4. Find and select your repository: **jaisinghbhatti/jaipal-portfolio-v5**

### Step 3: Configure the Backend Folder
1. Railway will detect your repo
2. Click on the service that was created
3. Go to **Settings** tab
4. Scroll to **"Root Directory"**
5. Change it to: `backend`
6. Click **"Save"**

### Step 4: Set Environment Variables
1. Go to **Variables** tab
2. Click **"+ New Variable"**
3. Add this variable:
   - **Name:** `EMERGENT_LLM_KEY`
   - **Value:** (paste your Emergent LLM key from Part 1)
4. Click **"Add"**

### Step 5: Deploy
1. Go to **Deployments** tab
2. Click **"Deploy"** or it may auto-deploy
3. Wait 2-3 minutes for deployment to complete
4. You'll see a green checkmark when done ✅

### Step 6: Get Your Backend URL
1. Go to **Settings** tab
2. Scroll to **"Domains"** section
3. Click **"Generate Domain"**
4. Railway will create a URL like: `your-app-name.up.railway.app`
5. **Copy this URL** - you'll need it for Part 3

---

## PART 3: Update Your Vercel Frontend

### Step 1: Add Environment Variable to Vercel
1. Go to **https://vercel.com**
2. Select your **jaipal-portfolio** project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `REACT_APP_BACKEND_URL`
   - **Value:** `https://your-app-name.up.railway.app` (the Railway URL from Step 6)
5. Click **"Save"**

### Step 2: Redeploy
1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## PART 4: Test It!

1. Go to **https://jaisingh.in/resume-builder**
2. Paste your resume text
3. Paste a job description
4. Click **"Continue to Customize"**
5. You should see the ATS match score! 🎉

---

## Troubleshooting

### "Analysis Failed" Error
- Check Railway dashboard → Logs tab for errors
- Make sure EMERGENT_LLM_KEY is set correctly in Railway

### "Failed to Parse File" Error
- File parsing should work once backend is deployed
- Try with a different PDF/DOCX file
- Or use the "paste text" option instead

### Backend Not Responding
- Check Railway dashboard to ensure deployment is "Active"
- Check the domain is generated and accessible
- Try visiting `https://your-railway-url.up.railway.app/api/` - should show `{"message":"Hello World"}`

---

## Cost

- **Railway Free Tier:** 500 hours/month (enough for personal use)
- **No credit card required** to start
- Your backend will only run when someone uses the Resume Builder

---

## Need Help?

If you get stuck on any step, let me know and I'll help you through it!
