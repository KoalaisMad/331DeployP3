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

### Check Health Status First:
- `https://your-app.onrender.com/api/health` - Should return `{"status":"ok","frontendBuildExists":true}`

If `frontendBuildExists` is `false`, the build command didn't run properly!

### Test API Endpoints:
- `https://your-app.onrender.com/api/employees` - Should return employee data
- `https://your-app.onrender.com/api/inventory` - Should return inventory data

### Test Frontend:
- `https://your-app.onrender.com/` - Should serve the React frontend

## What Changed?

Previously: Files were in `Project3Team10/PandaExpress/` (nested)
Now: Files are at repository root (backend/, frontend/, etc.)

This fixes Render's path resolution - everything is where it expects!

## Troubleshooting

### "Not Found" Error (Most Common)
This means the frontend build is missing!

**Quick Fix:**
1. Visit `https://your-app.onrender.com/api/health`
2. Check if `frontendBuildExists: false`
3. If false, the build command didn't complete - check Render build logs

**Solution:**
- Ensure build command is: `npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build`
- Check Render logs for build errors
- Trigger a manual redeploy in Render dashboard

### Build Failures:
1. Check the build logs in Render dashboard for specific errors
2. Make sure environment variables are set correctly
3. Verify TAMU database is accessible from Render's IPs

### Manager Portal Not Working:

**Most Common Issue:** Frontend was built with hardcoded `localhost:5000` URLs before the fix.

**Solution:**
1. In Render dashboard, trigger **"Manual Deploy" → "Clear build cache & deploy"**
2. This rebuilds frontend with the correct relative API paths (`/api` instead of `localhost:5000/api`)
3. Wait for deployment to complete
4. Test manager features

**Check Browser Console:**
Open browser DevTools (F12) and check Console/Network tabs for:
- CORS errors
- 404 Not Found errors  
- Failed fetch calls
- Database connection errors

**Verify Environment Variables on Render:**
Make sure these are set in Render dashboard:
- `PGHOST=csce-315-db.engr.tamu.edu`
- `PGPORT=5432`
- `PGDATABASE=group_10_db`
- `PGUSER=group_10`
- `PGPASSWORD=koalas428TheWWWin`

**Test API Endpoints Directly:**
- `/api/health` - Check server status
- `/api/employees` - Should return employee list
- `/api/inventory` - Should return inventory data
- `/api/reports/z-report-status` - Should return report status

### Local Testing:
```bash
# Build frontend first
cd frontend && npm install && npm run build && cd ..

# Start backend
cd backend && npm install && npm start
```
Visit `http://localhost:5000` - should work!

## Need Help?

The deployment should work now! If you still have issues:
1. Check `/api/health` endpoint first
2. Review Render build logs for specific errors
3. Verify all environment variables are set
