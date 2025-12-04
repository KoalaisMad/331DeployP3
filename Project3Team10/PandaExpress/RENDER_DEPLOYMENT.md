# Render Deployment Guide for PandaExpress

This guide will help you deploy your PandaExpress application to Render.

## Prerequisites
- A Render account (sign up at https://render.com)
- Your GitHub repository pushed with the latest changes

## Deployment Steps

### Option 1: Using render.yaml (Recommended - Automated)

1. **Push your changes to GitHub:**
   ```bash
   cd PandaExpress
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create a new Blueprint in Render:**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub repository (KoalaisMad/331DeployP3)
   - Render will detect the `render.yaml` file
   - Review the services it will create:
     - PostgreSQL database (panda-db)
     - Web service (panda-express)
   - Click "Apply" to create the services

3. **Import your database:**
   After the database is created, you'll need to import your schema:
   - Go to the database service in Render dashboard
   - Click "Connect" to get connection details
   - Use psql or a database client to run your `dump.sql` file:
   ```bash
   psql <DATABASE_URL> < dump.sql
   ```

4. **Access your deployed app:**
   - Once deployment completes, Render will provide a URL
   - Your app will be available at: `https://panda-express.onrender.com`

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database
1. In Render Dashboard, click "New" → "PostgreSQL"
2. Name: `panda-db`
3. Database: `panda_express`
4. User: `panda_user`
5. Plan: Starter (or Free for testing)
6. Click "Create Database"
7. Wait for it to provision, then note the connection details

#### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name:** `panda-express`
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build
     ```
   - **Start Command:**
     ```
     npm --prefix backend start
     ```
   - **Plan:** Free

#### Step 3: Configure Environment Variables
Add these environment variables to your web service:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PGHOST` | (from database connection info) |
| `PGPORT` | (from database connection info) |
| `PGDATABASE` | (from database connection info) |
| `PGUSER` | (from database connection info) |
| `PGPASSWORD` | (from database connection info) |

**Tip:** You can also use the "Add from Database" feature in Render to automatically populate these values.

#### Step 4: Set Health Check
- Health Check Path: `/api/employees`

#### Step 5: Deploy
- Click "Create Web Service"
- Render will automatically build and deploy your application

## Post-Deployment

### Import Database Schema
Connect to your Render PostgreSQL database and import the schema:

```bash
# Using the DATABASE_URL from Render
psql <DATABASE_URL> < dump.sql
```

Or use a GUI tool like pgAdmin or DBeaver with the connection details from Render.

### Verify Deployment
1. Check build logs for any errors
2. Visit your app URL
3. Test the API endpoints:
   - `https://your-app.onrender.com/api/employees`
   - `https://your-app.onrender.com/api/inventory`

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify build command is correct

### Database Connection Errors
- Verify environment variables are set correctly
- Check that database is running and accessible
- Ensure dump.sql has been imported

### Static Files Not Loading
- The backend serves static files from `frontend/build`
- Ensure the build command successfully creates the build folder
- Check that `app.use(express.static(...))` is in server.js

### API Routes Return 404
- Verify routes are mounted correctly in server.js
- Check that all route files exist in `backend/routes/`

## Application Architecture on Render

```
┌─────────────────────────────────────┐
│  Render Web Service                 │
│  (panda-express)                    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Node.js Backend               │ │
│  │ - Serves API routes (/api/*)  │ │
│  │ - Serves React build (static) │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ React Frontend (built)        │ │
│  │ - Served from frontend/build  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Render PostgreSQL Database         │
│  (panda-db)                         │
└─────────────────────────────────────┘
```

## Commands Reference

### Build Command
```bash
npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build
```

This command:
1. Installs backend dependencies
2. Installs frontend dependencies
3. Builds the React frontend into `frontend/build`

### Start Command
```bash
npm --prefix backend start
```

This command starts the Express server which:
- Serves API routes at `/api/*`
- Serves React static files from `frontend/build`
- Handles React Router by serving `index.html` for non-API routes

## Environment Variables Needed

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Render) | `10000` |
| `NODE_ENV` | Environment mode | `production` |
| `PGHOST` | PostgreSQL host | `dpg-xxx.oregon-postgres.render.com` |
| `PGPORT` | PostgreSQL port | `5432` |
| `PGDATABASE` | Database name | `panda_express` |
| `PGUSER` | Database user | `panda_user` |
| `PGPASSWORD` | Database password | (from Render) |

## Security Notes

- `.env` files are gitignored and not deployed
- Use Render's environment variables for sensitive data
- Database credentials are provided securely by Render

## Cost

- **Free Tier:** Suitable for development/testing
  - Web service: Free (spins down after inactivity)
  - Database: Free tier available (limited storage)

- **Paid Tier:** For production
  - Web service: $7/month (always on)
  - Database: $7/month (Starter plan)

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
