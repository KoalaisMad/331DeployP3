# Connection Verification Checklist

Use this checklist to verify all connections are working properly after deployment.

## ✅ Pre-Deployment Checks

### Database Access
- [ ] Confirmed database allows external connections
- [ ] Database credentials are correct
- [ ] Database host is reachable: `csce-315-db.engr.tamu.edu:5432`
- [ ] SSL configuration is appropriate

### Google OAuth Setup
- [ ] OAuth client ID and secret are configured
- [ ] Redirect URI will be updated after backend deployment
- [ ] Authorized domains include your Render domain

## ✅ Post-Deployment Backend Checks

### Environment Variables Set
- [ ] `NODE_ENV` = `production`
- [ ] `PGHOST` = `csce-315-db.engr.tamu.edu`
- [ ] `PGPORT` = `5432`
- [ ] `PGDATABASE` = `group_10_db`
- [ ] `PGUSER` = `group_10`
- [ ] `PGPASSWORD` = (set correctly)
- [ ] `GOOGLE_CLIENT_ID` = (set correctly)
- [ ] `GOOGLE_CLIENT_SECRET` = (set correctly)
- [ ] `COOKIE_SECRET` = (set correctly)
- [ ] `PORT` = `5000`
- [ ] `BACKEND_URL` = (your actual backend URL)
- [ ] `FRONTEND_URL` = (your actual frontend URL)

### Backend Health Check
Visit: `https://your-backend-url.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "connected": true
  }
}
```

- [ ] Health endpoint returns 200 status
- [ ] Database shows as connected
- [ ] No errors in response

### Backend Logs Check
Open Render Dashboard → Backend Service → Logs

Look for:
- [ ] `"Connected to database at: ..."` message
- [ ] `"Server running on http://localhost:5000"` message
- [ ] No SSL/TLS errors
- [ ] No authentication errors
- [ ] No CORS errors

### Test Backend Endpoints

**API Endpoints:**
- [ ] `GET /health` → Returns healthy status
- [ ] `GET /api/inventory` → Returns inventory data (may require auth)
- [ ] `GET /api/employees` → Returns employee data (may require auth)

**Auth Endpoints:**
- [ ] `GET /auth/google/start?view=manager` → Redirects to Google
- [ ] OAuth callback works (test after Google OAuth updated)

## ✅ Post-Deployment Frontend Checks

### Environment Variables Set
- [ ] `REACT_APP_BACKEND_URL` = (your actual backend URL)

### Frontend Build Check
Open Render Dashboard → Frontend Service → Logs

Look for:
- [ ] `"Build completed successfully"`
- [ ] No build errors
- [ ] No dependency errors

### Frontend Access
Visit: `https://your-frontend-url.onrender.com`

- [ ] Page loads successfully
- [ ] No blank/white screen
- [ ] Landing page displays correctly
- [ ] Images load properly

### Browser Console Check
Open DevTools → Console

- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] API calls succeed (check Network tab)

### Network Tab Check
Open DevTools → Network tab

Make an action that calls the API:
- [ ] API requests go to correct backend URL
- [ ] Requests return 200 status (or appropriate status)
- [ ] No CORS errors
- [ ] Response data is correct

## ✅ Connection Testing

### Frontend → Backend Connection

Test by performing actions that call the backend:

1. **Landing Page**
   - [ ] Page loads
   - [ ] Buttons are clickable

2. **OAuth Flow**
   - [ ] Click "Manager" login
   - [ ] Redirects to Google
   - [ ] After auth, redirects back
   - [ ] Lands on correct page

3. **Manager View** (if logged in)
   - [ ] Inventory loads
   - [ ] Employee data loads
   - [ ] Reports load
   - [ ] Can add/edit items

4. **Cashier View** (if logged in)
   - [ ] Menu items load
   - [ ] Can create orders
   - [ ] Orders save to database

5. **Customer Kiosk**
   - [ ] Size options load
   - [ ] Menu items load
   - [ ] Can add to cart
   - [ ] Can place order

### Backend → Database Connection

Test database operations:

1. **Read Operations**
   - [ ] Inventory data loads
   - [ ] Employee data loads
   - [ ] Order history loads

2. **Write Operations**
   - [ ] Can create new order
   - [ ] Can update inventory
   - [ ] Can modify employee data

3. **Transaction Integrity**
   - [ ] Orders save correctly
   - [ ] Inventory updates correctly
   - [ ] Data persists after refresh

## ✅ Google OAuth Integration

### Google Cloud Console Updates
- [ ] Redirect URI updated: `https://your-backend-url.onrender.com/auth/google/callback`
- [ ] Authorized JavaScript origins includes backend URL
- [ ] OAuth consent screen configured

### OAuth Flow Testing
1. **Manager Login**
   - [ ] Click "Manager" button
   - [ ] Redirects to Google login
   - [ ] Can select Google account
   - [ ] Redirects back to `/manager` route
   - [ ] User is authenticated

2. **Cashier Login**
   - [ ] Click "Cashier" button
   - [ ] Redirects to Google login
   - [ ] Can select Google account
   - [ ] Redirects back to `/cashier` route
   - [ ] User is authenticated

3. **Logout**
   - [ ] Can logout successfully
   - [ ] Session cleared
   - [ ] Redirects to landing page

## ✅ Error Handling

### Expected Behaviors
- [ ] Unauthorized access redirected properly
- [ ] Invalid credentials handled gracefully
- [ ] Database errors shown to user (if appropriate)
- [ ] Network errors handled
- [ ] Loading states displayed

## 🚨 Common Issues and Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| 503 Error on `/health` | Database connection | Verify DB credentials, check DB accessibility |
| CORS errors | `FRONTEND_URL` setting | Update backend env var with exact frontend URL |
| OAuth redirects fail | Google redirect URI | Update in Google Console with backend URL |
| API calls fail | `REACT_APP_BACKEND_URL` | Update frontend env var with backend URL |
| White screen on frontend | Build errors | Check frontend build logs in Render |
| Database timeout | Network/firewall | Contact DB admin about Render IP access |

## 📊 Monitoring

Set up ongoing monitoring:
- [ ] Check health endpoint regularly
- [ ] Monitor error rates in logs
- [ ] Set up Render notifications for downtime
- [ ] Monitor database connection pool
- [ ] Track API response times

## ✅ Final Verification

All systems operational:
- [ ] Frontend loads and displays correctly
- [ ] Backend API responds to requests
- [ ] Database reads and writes work
- [ ] Google OAuth login works
- [ ] Users can perform all main functions
- [ ] No errors in logs
- [ ] Performance is acceptable

---

**Deployment Date:** ________________  
**Verified By:** ________________  
**Status:** ✅ All checks passed / ⚠️ Issues found (see notes)  
**Notes:** ________________________________________________
