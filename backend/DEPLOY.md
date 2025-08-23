# Backend Deployment Guide

## 🚀 Deploy to Railway.app (Recommended)

### Step 1: Prepare Your Repository
Your backend is now ready for deployment with:
- ✅ `railway.json` configuration file
- ✅ Dynamic port configuration (`${PORT:8080}`)
- ✅ CORS enabled for production
- ✅ Java 17 & Spring Boot 3.5.3
- ✅ PostgreSQL & H2 database support

### Step 2: Push to GitHub
```bash
cd backend
git add .
git commit -m "prepare backend for Railway deployment"
git push
```

### Step 3: Deploy to Railway
1. **Sign up at [railway.app](https://railway.app)**
2. **Connect GitHub account**
3. **Create New Project → Deploy from GitHub**
4. **Select your repository**
5. **Choose the `/backend` folder** (if prompted)
6. **Railway will auto-detect Java and build**

### Step 4: Get Your Backend URL
After deployment (2-3 minutes):
- Railway will provide a URL like: `https://your-app-name.railway.app`
- Test it: `https://your-app-name.railway.app/api/games/create`

### Step 5: Update Frontend
Edit `frontend/.env.production`:
```env
VITE_BACKEND_URL=https://your-app-name.railway.app
```

Then rebuild and redeploy frontend:
```bash
cd frontend
npm run build
# Deploy to Netlify
```

## 🔄 Alternative: Render.com

If Railway doesn't work:

1. **Sign up at [render.com](https://render.com)**
2. **New → Web Service**
3. **Connect GitHub repository**
4. **Settings:**
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -Dserver.port=$PORT -jar target/backend-0.0.1-SNAPSHOT.jar`
   - Environment: Java 17

## 💰 Cost Comparison

| Service | Free Tier | Pros | Cons |
|---------|-----------|------|------|
| **Railway** | $5 credit/month | Auto-scaling, fast | Credit limit |
| **Render** | 750 hours/month | Always-on option | Sleeps after 15min |
| **Heroku** | None | Most popular | $7/month minimum |

## 🧪 Testing Your Deployment

After deployment, test these endpoints:
- `GET /api/games/test` - Health check
- `POST /api/games/create` - Create game
- `WebSocket /chess-websocket` - Real-time connection

## 🚨 Common Issues

1. **Build fails**: Check Java version in Railway logs
2. **CORS errors**: Your configuration should handle Netlify domains
3. **WebSocket fails**: Ensure SockJS fallback is working

Your backend is production-ready! 🎉