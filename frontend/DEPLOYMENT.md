# Deployment & Environment Configuration

## Quick Fix for Production Issue

The production deployment on Netlify cannot connect to `localhost:8080` because that's only accessible from your local machine. Here are your options:

### Option 1: Same-WiFi Testing (Quick Fix)
For testing between devices on the same WiFi network:

1. Find your local IP address:
   ```bash
   npm run get-ip
   ```

2. Edit `.env.local` and uncomment the line:
   ```
   VITE_BACKEND_URL=http://192.168.178.99:8080
   ```
   (Replace with your actual IP from step 1)

3. Make sure your backend allows connections from all IPs by checking `application.properties`:
   ```
   server.address=0.0.0.0
   ```

4. Rebuild and redeploy frontend:
   ```bash
   npm run build
   # Then deploy to Netlify
   ```

5. Start your backend locally:
   ```bash
   cd ../backend
   ./mvnw spring-boot:run
   ```

Now devices on the same WiFi can connect to your local backend.

### Option 2: Full Production Deployment
For a complete production solution, deploy your backend to a cloud service:

1. **Deploy backend to:**
   - Heroku (free tier)
   - Railway.app
   - Render.com
   - DigitalOcean App Platform

2. **Update environment variables:**
   Edit `.env.production`:
   ```
   VITE_BACKEND_URL=https://your-deployed-backend.herokuapp.com
   ```

3. **Rebuild and redeploy frontend**

## Environment Variables

- `.env` - Default development settings
- `.env.local` - Local network testing (git ignored)
- `.env.production` - Production deployment settings

## Current Issue Analysis

The production problems you experienced:
1. ✅ Frontend deploys successfully to Netlify
2. ❌ Frontend tries to connect to `localhost:8080` (not accessible from other devices)
3. ❌ Room joining accepts any ID (backend validation needed)
4. ❌ No move synchronization between devices (WebSocket connection fails)
5. ❌ Coach can make multiple white moves (server-side turn validation needed)

This configuration update fixes issues #2 and #3. The backend validation improvements would address #4 and #5.