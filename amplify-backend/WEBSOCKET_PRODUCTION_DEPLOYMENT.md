# Fix WebSocket Connection in Production (Render)

## Issue

WebSocket connections failing on deployed frontend (Vercel) when trying to connect to backend (Render):

```
wss://connectify-re80.onrender.com/ws
```

Error: "WebSocket is closed before the connection is established"

## Root Cause

1. Backend changes for WebSocket support haven't been deployed to Render yet
2. Render may need special WebSocket configuration

---

## Solution Steps

### 1. Push Backend Changes (DONE ✓)

The WebSocket fixes have been committed and are being pushed to `flutter-implementation` branch.

### 2. Deploy to Render

#### Option A: Automatic Deployment (if configured)

If you have auto-deploy enabled on Render:

1. Push will trigger automatic deployment
2. Wait 2-3 minutes for build to complete
3. Check Render dashboard for deployment status

#### Option B: Manual Deployment

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Find your service: `connectify-re80`
3. Click **Manual Deploy** → **Deploy latest commit**
4. Select branch: `flutter-implementation` (or your production branch)
5. Wait for deployment to complete

### 3. Verify Render WebSocket Configuration

**IMPORTANT**: Render needs special configuration for WebSocket support.

#### Check Render Service Settings:

1. Go to your service in Render Dashboard
2. Navigate to **Settings**
3. Verify:
   - **Environment**: Docker
   - **Port**: `8080` (or whatever PORT env var is set)
   - **Health Check Path**: `/health`

#### Add Environment Variables (if not already set):

Go to **Environment** tab and ensure these are set:

```
PORT=8080
MONGO_URI=<your-mongo-uri>
REDIS_URL=<your-redis-uri>
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_JWT_SECRET=<your-supabase-jwt-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
```

### 4. Enable WebSocket Support on Render

Render **automatically supports WebSockets** as long as:

- ✅ Your app properly upgrades HTTP connections to WebSocket
- ✅ You're using the correct protocol (`wss://` for HTTPS services)
- ✅ CORS headers allow WebSocket upgrade headers

The code changes I made ensure all of these:

```go
// Added WebSocket-specific CORS headers
AllowHeaders: "Origin,Content-Type,Accept,Authorization,Upgrade,Connection,Sec-WebSocket-Key,Sec-WebSocket-Version,Sec-WebSocket-Extensions"

// Added buffer sizes to WebSocket upgrader
ReadBufferSize:  1024,
WriteBufferSize: 1024,
```

---

## Testing After Deployment

### Test WebSocket Connection

Once deployed, open browser console on https://amplify-music.vercel.app and check:

1. **Should see**: `Connected to WebSocket`
2. **Should NOT see**: Connection errors or "WebSocket is closed"

### Verify Backend Logs on Render

1. Go to Render Dashboard → Your Service → **Logs**
2. Look for:
   ```
   Server starting on port 8080
   WebSocket endpoint: ws://localhost:8080/ws
   Client <id> connected for user <userId>
   ```

---

## Common Issues & Solutions

### Issue: Still getting connection errors after deploy

**Solution**:

1. Check Render logs for errors
2. Verify environment variables are set
3. Try manually redeploying
4. Check if Redis/MongoDB are accessible

### Issue: WebSocket connects but immediately disconnects

**Solution**:

1. Check Supabase JWT token is valid
2. Verify `SUPABASE_JWT_SECRET` matches your Supabase project
3. Check backend logs for authentication errors

### Issue: WebSocket works locally but not in production

**Solution**:

1. Ensure `PROD_WS_URL` in Vercel env vars is set to: `wss://connectify-re80.onrender.com/ws`
2. Check browser console for exact error message
3. Verify CORS headers are being sent (use browser DevTools Network tab)

---

## Frontend Environment Variables (Vercel)

Make sure these are set in Vercel Project Settings → Environment Variables:

```
VITE_PROD_API_URL=https://connectify-re80.onrender.com
VITE_PROD_WS_URL=wss://connectify-re80.onrender.com/ws
VITE_SUPABASE_URL=https://gbeucvixvbzrfwknxzde.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

After adding/updating env vars in Vercel, **redeploy the frontend**:

1. Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → **Redeploy**

---

## Quick Checklist

- [ ] Backend changes pushed to Git
- [ ] Backend deployed on Render
- [ ] Render environment variables configured
- [ ] Render deployment successful (check logs)
- [ ] Vercel environment variables set
- [ ] Vercel frontend redeployed
- [ ] Test WebSocket connection on production
- [ ] Check Render logs for WebSocket connections
