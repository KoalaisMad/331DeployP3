# Render Deployment - Quick Start

## ✅ SETUP COMPLETE!

Your app is now fully configured to deploy as a **single unified service** on Render with frontend and backend hosted together.

## What Was Done

1. ✅ **Single Service Configuration** - Backend serves both API and frontend static files
2. ✅ **Frontend API Calls** - All updated to use same-origin (no cross-origin issues)
3. ✅ **Configuration Files** - render.yaml created for Blueprint deployment
4. ✅ **API Integration** - 11 frontend files updated to use `API_URL` from config
5. ✅ **Static File Serving** - Express configured to serve React build

## Files Modified

✅ `render.yaml` - Defines single web service for combined deployment
✅ `backend/server.js` - Added static file serving and catch-all route
✅ `frontend/src/config.js` - Updated for same-origin API calls
✅ `backend/routes/passport.js` - Dynamic OAuth callback URL
✅ `backend/routes/authentication.js` - Updated redirect URLs
✅ `backend/db.js` - Added SSL support for external database
✅ **11 frontend components** - All updated to use dynamic API_URL

## Quick Deploy Steps

### 1. ✅ Code Already Configured!

All code changes complete. Frontend and backend ready for unified deployment!

### 2. Push to Git

```bash
cd /Users/jyoshithamadhavarapu/Desktop/331DeployP3/Project3Team10
git add .
git commit -m "Configure for Render deployment with unified frontend and backend"
git push
```

### 3. Deploy on Render

**Option A: Blueprint (Recommended)**
1. Go to https://dashboard.render.com/
2. Click **New +** → **Blueprint**
3. Connect your repository
4. Select the repository
5. Click **Apply**

**Option B: Manual Setup**
1. Click **New +** → **Web Service**
2. Connect your repository
3. Configure:
   - Name: `panda-express-app`
   - Root Directory: `PandaExpress`
   - Build Command: `./render-build.sh`
   - Start Command: `cd backend && npm start`
4. Click **Create Web Service**

### 4. Configure Environment Variables

**Single Service** (panda-express-app):
- `NODE_ENV` = `production`
- `PGHOST` = `csce-315-db.engr.tamu.edu`
- `PGPORT` = `5432`
- `PGDATABASE` = `your_database_name`
- `PGUSER` = `your_username`
- `PGPASSWORD` = `your_password`
- `GOOGLE_CLIENT_ID` = `your_google_client_id`
- `GOOGLE_CLIENT_SECRET` = `your_google_client_secret`
- `COOKIE_SECRET` = `unifyforPAndas`
- `PORT` = `5000`
- `BACKEND_PORT` = `5000`
- `BACKEND_URL` = (your actual Render URL - e.g., `https://panda-express-app.onrender.com`)

### 5. Verify Deployment

After deployment completes:

1. **Check Health Endpoint:**  
   Visit `https://panda-express-app.onrender.com/health`
   
   Should show:
   ```json
   {
     "status": "healthy",
     "database": { "connected": true }
   }
   ```

2. **Visit Your App:**  
   Go to `https://panda-express-app.onrender.com`

3. **Update Google OAuth:**  
   - Go to Google Cloud Console
   - Add redirect URI: `https://panda-express-app.onrender.com/auth/google/callback`

### 6. Test Everything

✅ Landing page loads  
✅ Login works (Manager/Cashier)  
✅ OAuth redirects correctly  
✅ API calls succeed (check browser console)  
✅ Database persists data  

## Your Service URL

After deployment:
- **Application**: `https://panda-express-app.onrender.com`
  - Frontend served from root (`/`)
  - Backend API at `/api/*`

## Verification Checklist

✅ Service deployed and healthy  
✅ **Database connection verified** - Visit `/health` endpoint  
✅ `BACKEND_URL` environment variable set  
✅ Google OAuth redirect URI updated  
✅ Frontend loads correctly  
✅ API calls work (no errors in console)  
✅ Test login functionality  
✅ Test ordering flow  
✅ Test data persistence  

## Need More Help?

- **Full deployment guide**: `RENDER_DEPLOYMENT.md`
- **Connection verification**: `CONNECTION_VERIFICATION.md`
- **Render docs**: https://render.com/docs

## Architecture

```
┌─────────────────┐
│   Users Visit   │
│  Your Render URL│
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│  Single Web Service          │
│  ┌──────────────────────┐    │
│  │  Express Backend     │    │
│  │  - Serves API routes │    │
│  │  - Serves frontend   │    │
│  └──────────┬───────────┘    │
│             │                 │
│             │ serves          │
│             ▼                 │
│  ┌──────────────────────┐    │
│  │  React Frontend      │    │
│  │  (static files)      │    │
│  └──────────────────────┘    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  PostgreSQL Database         │
│  TAMU External Server        │
└──────────────────────────────┘
```

---

**Last Updated:** December 2025

**Status**: Ready to deploy! 🚀  
**Last Updated**: December 7, 2025
