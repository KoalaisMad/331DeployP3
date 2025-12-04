# Render Deployment Guide - Updated for Flat Structure

## ✅ Repository has been restructured for easy deployment!

All PandaExpress files are now at the **repository root** - no nested folders! This eliminates the path issues we had before.

## Quick Deploy Steps

### Step 1: Go to Render Dashboard
1. Visit [https://dashboard.render.com](https://dashboard.render.com)
2. Sign in with your GitHub account

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `KoalaisMad/331DeployP3`
3. Click **"Connect"**

### Step 3: Configure the Service

**Name:** `panda-express` (or any name you prefer)

**Language:** `Node`

**Branch:** `main`

**Root Directory:** **LEAVE EMPTY** ✅ (files are now at repo root!)

**Build Command:**
```bash
npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build
```

**Start Command:**
```bash
npm --prefix backend start
```

**Instance Type:** `Free`

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:



### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Watch the build logs - should succeed now!
3. Once deployed, you'll get a URL like: `https://panda-express.onrender.com`

## Verify Deployment

Test these endpoints:
- `https://your-app.onrender.com/` - Should serve the React frontend
- `https://your-app.onrender.com/api/employees` - Should return employee data
- `https://your-app.onrender.com/api/inventory` - Should return inventory data

## What Changed?

Previously: Files were in `Project3Team10/PandaExpress/` (nested)
Now: Files are at repository root (backend/, frontend/, etc.)

This fixes Render's path resolution - everything is where it expects!

## Troubleshooting

If build fails:
1. Check the build logs in Render dashboard
2. Make sure environment variables are set correctly
3. Verify TAMU database is accessible from Render's IPs

## Need Help?

The deployment should work now! If you still have issues:
1. Check Render build logs for specific errors
2. Verify database credentials
3. Ensure frontend builds successfully locally with `cd frontend && npm run build`
