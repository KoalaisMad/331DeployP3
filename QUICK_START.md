# Quick Start - Deploy to Render

## 🚀 Fast Track Deployment (5 minutes)

### Step 1: Go to Render Dashboard
Visit: https://dashboard.render.com

### Step 2: Create New Blueprint
1. Click **"New"** → **"Blueprint"**
2. Connect your GitHub account if not already connected
3. Select repository: **KoalaisMad/331DeployP3**
4. Render will detect `Project3Team10/PandaExpress/render.yaml`
5. Click **"Apply"**

### Step 3: Wait for Services to Create
Render will automatically create:
- ✅ PostgreSQL database (`panda-db`)
- ✅ Web service (`panda-express`)

This takes 2-3 minutes.

### Step 4: Import Database Schema
Once the database is ready:

1. Click on the **panda-db** database service
2. Click **"Connect"** → **"External Connection"**
3. Copy the **PSQL Command** or **Connection String**
4. Run locally:
   ```bash
   cd Project3Team10/PandaExpress
   psql <YOUR_DATABASE_URL> < dump.sql
   ```

### Step 5: Access Your App
- Your app will be live at: `https://panda-express.onrender.com`
- First load may take 30-60 seconds (cold start on free tier)

## ✅ That's It!

Your full-stack app is now deployed with:
- Backend API at `/api/*`
- React frontend served automatically
- PostgreSQL database connected

## 📝 Build & Start Commands (for reference)

If you create services manually instead:

**Build Command:**
```
npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build
```

**Start Command:**
```
npm --prefix backend start
```

## 🔧 Troubleshooting

**App won't start?**
- Check you imported `dump.sql` into the database
- Verify environment variables are set

**Need help?**
See the full guide in `RENDER_DEPLOYMENT.md`

## 💰 Pricing

Free tier includes:
- Web service (spins down after 15 min of inactivity)
- Database with 1GB storage

Upgrade to paid ($7/month each) for:
- Always-on service
- More database storage
