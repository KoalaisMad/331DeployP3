# Panda Express OAuth Deployment Checklist

## Pre-Deployment (Local Testing)
- [ ] Run `npm start` in PandaExpress directory
- [ ] Test Manager login with Google OAuth
- [ ] Test Cashier login with Google OAuth  
- [ ] Verify both routes redirect correctly after OAuth
- [ ] Check console for no errors in browser DevTools
- [ ] Verify API calls work (employees, inventory, etc.)

## Before Deploying to Render

### 1. Google OAuth Setup
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Navigate to OAuth 2.0 Credentials
- [ ] Add BOTH callback URIs:
  - `http://localhost:5000/auth/google/callback` (for local testing)
  - `https://your-service-name.onrender.com/auth/google/callback` (for production)
  
  **IMPORTANT:** Replace `your-service-name` with your actual Render service name

### 2. Git Preparation
- [ ] Commit all changes: `git add . && git commit -m "Enable OAuth for deployment"`
- [ ] Push to main branch: `git push origin main`

### 3. Database Verification
- [ ] Confirm TAMU database accepts external connections
- [ ] Verify test user accounts exist with Manager role:
  - jyoshitha.m@tamu.edu
  - andrew.bae17@tamu.edu
  - benjaminvkumar@gmail.com
  - sriya.param@tamu.edu

## During Render Deployment

### 1. Create Service
- [ ] Login to Render Dashboard
- [ ] New → Blueprint (or Web Service)
- [ ] Select Git repository
- [ ] Set Root Directory to: `Project3Team10/PandaExpress`
- [ ] Use render.yaml for configuration

### 2. Set Critical Environment Variables
After service is created, go to Service Settings → Environment:

- [ ] **BACKEND_URL**: Set to your Render service URL
  - Example: `https://panda-express-app.onrender.com`
  - (This MUST match your actual Render domain)

- [ ] **FRONTEND_URL**: Set to same as BACKEND_URL
  - Example: `https://panda-express-app.onrender.com`

- [ ] Database variables (sync from .env):
  - PGHOST
  - PGPORT
  - PGDATABASE
  - PGUSER
  - PGPASSWORD

- [ ] OAuth variables (sync from .env):
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - COOKIE_SECRET (can be auto-generated)

### 3. Update Google OAuth
- [ ] Note your Render service URL
- [ ] Go to Google Cloud Console
- [ ] Update OAuth redirect URI to: `https://your-service-name.onrender.com/auth/google/callback`

## Post-Deployment Testing

### 1. Health Check
- [ ] Visit `https://your-service-name.onrender.com` in browser
- [ ] Landing page loads
- [ ] No console errors in DevTools

### 2. OAuth Flow Testing
- [ ] Click "Manager" button
- [ ] Redirects to Google login ✓
- [ ] Complete Google OAuth
- [ ] Redirects back to Manager dashboard ✓
- [ ] Can see employees, inventory data ✓

- [ ] Click "Cashier" button (back on landing)
- [ ] Redirects to Google login ✓
- [ ] Complete OAuth
- [ ] Redirects back to Cashier dashboard ✓

### 3. API Verification
- [ ] Employees list loads from database
- [ ] Inventory items display
- [ ] Orders can be created
- [ ] Reports load data

### 4. Session Persistence
- [ ] Refresh page - should stay logged in
- [ ] Click logout - redirects to landing page
- [ ] Try accessing /manager while logged out - redirects to login

## Troubleshooting

### "Invalid Access" Error
- Check that ProtectedRoute is removed from App.js
- Verify BACKEND_URL is set correctly in Render
- Check browser console for CORS errors

### OAuth Callback Fails
- Verify BACKEND_URL matches your Render domain exactly
- Confirm OAuth redirect URI in Google Cloud Console
- Check Render logs for error messages

### Database Connection Issues
- Verify PGHOST, PGUSER, PGPASSWORD in Render environment
- Confirm TAMU database accepts external connections
- Check Render logs for connection errors

### Cold Start Issues
- Free tier services spin down after 15 minutes
- First request may take 30-60 seconds
- Monitor Render logs during initial requests

## Important Notes

- **NEVER commit .env with real credentials** - ensure .gitignore is set
- **BACKEND_URL must be exact** - OAuth callback URL validation is strict
- **Test locally first** - verify OAuth works on localhost:3000/5000
- **Keep Google OAuth secrets safe** - don't share publicly
- **Monitor Render logs** - helps diagnose deployment issues

## Render Dashboard Links

- Logs: https://dashboard.render.com/services/web (select your service)
- Environment Variables: Service → Settings → Environment
- Redeploy: Service → Manual Deploy

---

**Last Updated:** December 8, 2025
**Deployment Type:** Single Render Web Service (Frontend + Backend)
**OAuth:** Google OAuth 2.0 with Passport.js
