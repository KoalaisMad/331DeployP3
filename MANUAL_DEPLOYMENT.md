# Manual Render Deployment Instructions

Since the Blueprint automatic setup is having path issues, follow these manual steps:

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `panda-db`
   - **Database:** `panda_express`
   - **User:** `panda_user`
   - **Region:** Oregon (US West) or closest to you
   - **Plan:** Starter (or Free for testing)
4. Click **"Create Database"**
5. **Wait for it to provision** (takes 1-2 minutes)
6. Once ready, click on the database and note the connection details

## Step 2: Import Database Schema

After the database is created, import your schema:

```bash
# Get the External Database URL from Render dashboard
# It looks like: postgresql://user:password@host:port/database

# From your Project3Team10/PandaExpress directory:
psql postgresql://panda_user:YOUR_PASSWORD@dpg-xxxxx.oregon-postgres.render.com:5432/panda_express < dump.sql
```

Or use a GUI tool like pgAdmin, TablePlus, or DBeaver.

## Step 3: Create Web Service

1. In Render Dashboard, click **"New"** → **"Web Service"**
2. **Connect your GitHub repository:** `KoalaisMad/331DeployP3`
3. Configure the service:

### Basic Settings:
- **Name:** `panda-express` (or your choice)
- **Region:** Same as your database
- **Branch:** `main`
- **Root Directory:** `Project3Team10/PandaExpress`
- **Runtime:** Node
- **Build Command:**
  ```
  npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build
  ```
- **Start Command:**
  ```
  npm --prefix backend start
  ```

### Environment Variables:
Click **"Advanced"** and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required for static serving |
| `PGHOST` | (from database) | Click "Add from Database" → select panda-db → host |
| `PGPORT` | (from database) | Click "Add from Database" → select panda-db → port |
| `PGDATABASE` | (from database) | Click "Add from Database" → select panda-db → database |
| `PGUSER` | (from database) | Click "Add from Database" → select panda-db → user |
| `PGPASSWORD` | (from database) | Click "Add from Database" → select panda-db → password |

**Quick way:** Use the "Add from Database" button and select your `panda-db` database to auto-populate all PG* variables.

### Health Check:
- **Health Check Path:** `/api/employees`

### Plan:
- **Instance Type:** Free (or Starter for production)

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Navigate to `Project3Team10/PandaExpress`
   - Run build command (installs deps, builds frontend)
   - Run start command (starts Express server)
3. **Monitor the build logs** for any errors
4. Once deployed, you'll get a URL like: `https://panda-express.onrender.com`

## Step 5: Verify

1. Visit your app URL
2. Test API endpoints:
   - `https://your-app.onrender.com/api/employees`
   - `https://your-app.onrender.com/api/inventory`
3. The frontend should load and be able to access the API

## Troubleshooting

### Build fails with "cannot find module"
- Check that `Root Directory` is set to `Project3Team10/PandaExpress`
- Verify build command has the correct `--prefix` paths

### Database connection errors
- Verify all PG* environment variables are set correctly
- Make sure you imported `dump.sql`
- Check database is running (green status in Render)

### 502 Bad Gateway
- Check the logs for errors
- Ensure start command is correct: `npm --prefix backend start`
- Verify PORT is being read from environment (it's auto-set by Render)

### Frontend returns 404
- Make sure NODE_ENV=production is set
- Check build command successfully created `frontend/build/`
- Verify `app.use(express.static(...))` is in server.js

## Important Notes

1. **Root Directory is critical:** Must be set to `Project3Team10/PandaExpress` in the service settings
2. **First deploy may take 3-5 minutes**
3. **Free tier spins down after 15 min of inactivity** - first request after may take 30-60 seconds
4. **Database must be imported** - the app won't work without the schema

## After Successful Deployment

Your app architecture:
```
https://panda-express.onrender.com
├── / → React frontend (served from backend)
├── /api/employees → Backend API
├── /api/inventory → Backend API
└── /api/orders → Backend API
        ↓
PostgreSQL Database (panda-db)
```

## Cost Summary

**Free Tier:**
- Web Service: Free (spins down after inactivity)
- Database: Free (limited storage)
- **Total: $0/month**

**Paid Tier (recommended for production):**
- Web Service: $7/month (always on)
- Database: $7/month (1GB+ storage)
- **Total: $14/month**
