# MERN Deployment Guide

This guide deploys the GPS Spoofing Detection MERN project with:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user with read and write access.
3. Open `Network Access` and allow your Render backend IPs, or use `0.0.0.0/0` during initial setup.
4. Copy the Atlas connection string and replace `<username>`, `<password>`, and the database name.

Example:

```env
MONGODB_URI=mongodb+srv://atlas-user:atlas-password@cluster0.xxxxx.mongodb.net/gps-spoofing?retryWrites=true&w=majority
```

## 2. Backend on Render

Create a new `Web Service` in Render and point it to the `server` folder.

You can also deploy directly from the checked-in [render.yaml](C:\Users\hasee\OneDrive\Desktop\project\render.yaml), which already defines the backend service, health check path, and non-secret defaults.

Recommended Render settings:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Runtime: `Node`

### Backend Environment Variables

Set these in Render:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend.vercel.app
MONGODB_URI=mongodb+srv://atlas-user:atlas-password@cluster0.xxxxx.mongodb.net/gps-spoofing?retryWrites=true&w=majority
API_PREFIX=/api/v1
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
BODY_LIMIT=1mb
GPS_DUPLICATE_WINDOW_MS=10000
DEVICE_ONLINE_WINDOW_MS=300000
DETECTION_JUMP_DISTANCE_METERS=1500
DETECTION_JUMP_WINDOW_MS=120000
DETECTION_MAX_SPEED_KMH=280
DETECTION_TIMESTAMP_DRIFT_MS=300000
DETECTION_REPEATED_COORDINATES_LIMIT=4
DETECTION_GEOFENCE_ENABLED=false
DETECTION_GEOFENCE_CENTER_LAT=0
DETECTION_GEOFENCE_CENTER_LNG=0
DETECTION_GEOFENCE_RADIUS_METERS=0
DETECTION_ACCURACY_FLUCTUATION_METERS=50
DETECTION_ACCURACY_FLUCTUATION_RATIO=3
DETECTION_TELEPORT_DISTANCE_METERS=5000
DETECTION_TELEPORT_WINDOW_MS=60000
BCRYPT_SALT_ROUNDS=12
REFRESH_COOKIE_NAME=gps_refresh_token
REFRESH_COOKIE_MAX_AGE_MS=604800000
COOKIE_SAME_SITE=none
RESET_PASSWORD_URL=https://your-frontend.vercel.app/reset-password
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=security@yourdomain.com
ALLOW_PUBLIC_REGISTRATION=false
JWT_ACCESS_SECRET=replace-with-a-long-random-production-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-production-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

Notes:

- `CLIENT_URL` supports a comma-separated list. Add preview or staging Vercel URLs if needed.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be long random values and must be different.
- Set `RESEND_API_KEY` and `EMAIL_FROM` to deliver password reset emails in production.
- In production, refresh cookies should be `httpOnly`, `secure`, and `sameSite=none` for Vercel-to-Render auth.
- Keep `ALLOW_PUBLIC_REGISTRATION=false` unless you intentionally want anonymous self-signup.

## 3. Frontend on Vercel

Create a new Vercel project and point it to the `client` folder.

The frontend now includes [vercel.json](C:\Users\hasee\OneDrive\Desktop\project\client\vercel.json) so React Router routes such as `/dashboard`, `/devices`, and `/alerts` resolve correctly in production instead of returning Vercel 404s on direct page loads.

Recommended Vercel settings:

- Framework Preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

### Frontend Environment Variables

Set these in Vercel:

```env
VITE_APP_NAME=GPS Spoofing Detection Dashboard
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://your-backend.onrender.com
```

Notes:

- `VITE_API_BASE_URL` must include `/api/v1`.
- `VITE_SOCKET_URL` must be the backend origin only, without `/api/v1`.

## 4. Local Environment Files

Backend local file:

```env
server/.env
```

Frontend local file:

```env
client/.env
```

Use the checked-in example files as the base:

- `server/.env.example`
- `client/.env.example`

## 5. CORS and Cookies

For production to work correctly:

- Render backend `CLIENT_URL` must include the Vercel frontend URL.
- Vercel frontend must use the exact Render backend URL in `VITE_API_BASE_URL` and `VITE_SOCKET_URL`.
- If you add Vercel preview deployments, include those preview origins in `CLIENT_URL`.

Example:

```env
CLIENT_URL=https://your-frontend.vercel.app,https://your-frontend-git-feature-branch.vercel.app
```

## 6. Realtime Deployment Notes

Socket.io is served from the same Render backend.

Make sure:

- `VITE_SOCKET_URL` points to the Render backend origin
- Render is deployed over HTTPS
- the backend `CLIENT_URL` includes the frontend origin

Realtime features now support:

- live alerts
- live device movement updates
- dashboard refresh events

## 7. Production Checklist

- Use Atlas production credentials, not local MongoDB
- Rotate JWT secrets before go-live
- Keep `NODE_ENV=production`
- Confirm Render health endpoint responds at `/api/v1/health`
- Confirm Vercel frontend can log in and refresh sessions
- Confirm Socket.io connects after login
- Confirm alerts and movement updates appear without manual refresh

## 8. Useful Commands

Backend local run:

```powershell
cd server
npm install
npm run dev
```

Frontend local run:

```powershell
cd client
npm install
npm run dev
```

Production build test for frontend:

```powershell
cd client
npm install
npm run build
```

Backend production start test:

```powershell
cd server
npm install
npm start
```
