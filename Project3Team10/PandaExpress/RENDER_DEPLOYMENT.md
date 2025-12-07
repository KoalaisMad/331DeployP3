# Deploying Panda Express to Render

This guide will walk you through deploying your Panda Express application to Render.

## Prerequisites

- A Render account (sign up at https://render.com)
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Your existing PostgreSQL database at `csce-315-db.engr.tamu.edu`

## Deployment Steps

### 1. Prepare Your Repository

Make sure all the updated files are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Configure for Render deployment"
git push
```

### 2. Update Google OAuth Settings

Before deploying, you need to update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://your-app-name.onrender.com/auth/google/callback`
   - (Replace `your-app-name` with your actual Render service name)

### 3. Deploy to Render

#### Option A: Using Blueprint (Recommended - render.yaml)

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your Git repository
4. Render will detect the `render.yaml` file automatically
5. Click **"Apply"**

#### Option B: Manual Setup

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository
4. Configure the service:
   - **Name**: `panda-express-app` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `PandaExpress`
   - **Runtime**: `Node`
   - **Build Command**: `./render-build.sh`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or choose paid plan for better performance)

### 4. Configure Environment Variables

### 5. Make the Build Script Executable

If you encounter permission issues, you may need to make the build script executable:

```bash
chmod +x PandaExpress/render-build.sh
git add PandaExpress/render-build.sh
git commit -m "Make build script executable"
git push
```

### 6. Deploy and Monitor

1. Click **"Create Web Service"** or **"Apply Blueprint"**
2. Render will start building and deploying your application
3. Monitor the logs for any errors
4. Once deployed, your app will be available at: `https://your-app-name.onrender.com`

### 7. Post-Deployment Configuration

After your first successful deployment:

1. Update `FRONTEND_URL` environment variable with your actual Render URL
2. Update the CORS settings if needed
3. Test Google OAuth login
4. Verify database connectivity

## Important Notes

### Free Tier Limitations
- Free services spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds (cold start)
- Consider upgrading to a paid plan for production use

### Database Connection
- Your app connects to an external database at `csce-315-db.engr.tamu.edu`
- Ensure the database allows connections from Render's IP addresses
- Contact your database administrator if connection fails

### Troubleshooting

**Build Fails:**
- Check the build logs in Render dashboard
- Ensure `render-build.sh` has execution permissions
- Verify all dependencies are listed in `package.json`

**App Crashes:**
- Check runtime logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure database credentials are correct

**Google OAuth Doesn't Work:**
- Verify redirect URIs in Google Cloud Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
- Ensure `FRONTEND_URL` matches your Render URL

**CORS Errors:**
- Update `FRONTEND_URL` environment variable
- Restart the service after updating environment variables

### Monitoring and Logs

- Access logs from Render Dashboard → Your Service → Logs
- Use the logs to debug issues and monitor application health
- Set up monitoring alerts in Render for production deployments

## Architecture

Your deployed application consists of:
- **Web Service**: Node.js backend (Express) serving both API and React frontend
- **Static Files**: React frontend built and served from `frontend/build`
- **Database**: External PostgreSQL at TAMU servers

## Support

For issues specific to:
- **Render Platform**: Check [Render Docs](https://render.com/docs)
- **Application**: Review application logs and error messages
- **Database**: Contact your database administrator

---

**Last Updated**: December 2025
