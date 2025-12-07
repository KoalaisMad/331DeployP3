# Deploying Panda Express to Render

This guide will walk you through deploying your Panda Express application to Render as a single unified web service (backend serves frontend).

## Architecture

Your application will be deployed as:
- **Single Web Service**: Node.js/Express backend serving React frontend
- **Backend API**: Handles all `/api/*` routes, authentication, database operations
- **Frontend**: React app served as static files from the same origin
- **Database**: External PostgreSQL at TAMU servers

## Prerequisites

- A Render account (sign up at https://render.com)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Your existing PostgreSQL database at `csce-315-db.engr.tamu.edu`

## Deployment Steps

### 1. Prepare Your Repository

Make sure all the updated files are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Configure for Render deployment - single service"
git push
```

### 2. Update Google OAuth Settings

Before deploying, you need to update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://panda-express-app.onrender.com/auth/google/callback`
   - (Replace `panda-express-app` with your actual service name)

### 3. Deploy to Render

#### Option A: Using Blueprint (Recommended - render.yaml)

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your Git repository
4. Select the `PandaExpress` folder as root directory
5. Render will detect the `render.yaml` file automatically
6. Review the service to be created:
   - `panda-express-app` (Node.js Web Service - serves both backend and frontend)
7. Click **"Apply"**

#### Option B: Manual Setup

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Configure the service:
   - **Name**: `panda-express-app`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `PandaExpress`
   - **Runtime**: `Node`
   - **Build Command**: `./render-build.sh`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

### 4. Configure Environment Variables

**Web Service Environment Variables:**

In your service settings, add these environment variables:

**Note:** Since frontend and backend are served from the same origin, you don't need `FRONTEND_URL` or `REACT_APP_BACKEND_URL` environment variables.

### 5. Verify Database Connectivity

Before deploying, ensure your TAMU database allows connections from external IPs:

1. Contact your database administrator
2. Verify that Render's IP addresses can connect to `csce-315-db.engr.tamu.edu`
3. Confirm SSL/TLS settings if required

### 6. Deploy and Monitor

1. Click **"Apply"** (Blueprint) or **"Create Web Service"** (Manual)
2. Render will start building and deploying your application
3. Monitor the logs for any errors
4. Once deployed, your app will be available at: `https://panda-express-app.onrender.com`

### 7. Verify All Connections

After deployment, verify that all components are connected properly:

**A. Check Application Health:**
Visit: `https://panda-express-app.onrender.com/health`

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T...",
  "environment": "production",
  "database": {
    "connected": true,
    "timestamp": "..."
  }
}
```

**B. Check Backend Logs:**
- Look for: `"Connected to database at: ..."`
- Look for: `"Server running on http://localhost:5000"`
- No SSL or connection errors

**C. Check Frontend:**
- Visit: `https://panda-express-app.onrender.com`
- Landing page should load
- Open browser DevTools → Console
- Should see no errors
- React app should be fully functional

### 8. Update Google OAuth

After deployment:

1. Go to Google Cloud Console
2. Update redirect URI to: `https://panda-express-app.onrender.com/auth/google/callback`
3. Replace `panda-express-app` with your actual service name

### 9. Test the Complete Flow

1. **Landing Page**: Visit your Render URL
2. **OAuth Login**: Click Manager or Cashier login
3. **Authentication**: Should redirect to Google login
4. **Callback**: Should redirect back to appropriate view
5. **API Calls**: Test inventory, orders, reports
6. **Database**: Verify data persistence

## Important Notes

### Free Tier Limitations
- Free services spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds (cold start)
- Consider upgrading to a paid plan for production use

### Database Connection
- Your app connects to an external database at `csce-315-db.engr.tamu.edu`
- Ensure the database allows connections from Render's IP addresses
- Contact your database administrator if connection fails

### Service URL
- **Application (frontend + backend)**: `https://panda-express-app.onrender.com`
- Frontend served from root path
- Backend API available at `/api/*` routes

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. **Check Environment Variables:**
   ```bash
   PGHOST=csce-315-db.engr.tamu.edu
   PGPORT=5432
   PGUSER=your_username
   PGPASSWORD=your_password
   PGDATABASE=your_database
   ```

2. **Verify Database Access:**
   - Make sure your database credentials are correct
   - Ensure the database allows connections from external IPs
   - Check that SSL is properly configured in `db.js`

3. **Check Logs:**
   - Look for "Connected to database" message
   - Check for SSL certificate errors
   - Verify connection pool is established

### Application Not Loading

If the application doesn't load:

1. **Check Build Logs:**
   - Verify frontend built successfully
   - Look for "npm run build" completion
   - Check for React build errors

2. **Check Server Logs:**
   - Verify "Server running on" message
   - Look for static file serving errors
   - Check for missing files or paths

3. **Check Browser Console:**
   - Look for 404 errors on static assets
   - Verify React app is being served
   - Check for JavaScript errors

### OAuth Issues

If Google login doesn't work:

1. **Verify Redirect URI:**
   - Should be: `https://panda-express-app.onrender.com/auth/google/callback`
   - Must match exactly in Google Cloud Console
   - Include in both "Authorized redirect URIs" and OAuth consent screen

2. **Check BACKEND_URL:**
   - Should match your actual Render service URL
   - Used to construct callback URL in passport.js

3. **Verify Credentials:**
   - `GOOGLE_CLIENT_ID` is correct
   - `GOOGLE_CLIENT_SECRET` is correct
   - Both are set in Render environment variables

### Performance Issues

If the app is slow:

1. **Free Tier Limitations:**
   - Render free tier spins down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds
   - Consider upgrading to paid tier for always-on service

2. **Database Connection:**
   - External database may add latency
   - Connection pool helps reuse connections
   - Monitor query performance

3. **Build Optimization:**
   - Ensure production build is being served
   - Check that React is in production mode
   - Verify static asset caching

### Monitoring and Logs

- Access logs from Render Dashboard → Select Service → Logs
- Monitor application logs for errors
- Use the logs to debug issues and monitor application health
- Set up monitoring alerts in Render for production deployments

## Architecture

Your deployed application consists of a single unified service:
- **Express Backend**: Serves API routes (`/api/*`), handles authentication, manages database connections
- **React Frontend**: Served as static files from the same Express server
- **Database**: External PostgreSQL at TAMU servers

The Express server serves both the React frontend and handles API requests on the same domain, eliminating CORS issues.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Express Static Files](https://expressjs.com/en/starter/static-files.html)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

## Support

For issues specific to:
- **Render Platform**: Check [Render Docs](https://render.com/docs)
- **Application**: Review application logs and error messages
- **Database**: Contact your database administrator

---

**Last Updated**: December 2025
