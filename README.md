# GPS Spoofing Detection & Visualization Dashboard

A production-ready MERN platform for GPS spoofing detection, realtime monitoring, alert triage, fleet/device management, and operational reports.

## Stack

- Frontend: React + Vite + React Router + Redux Toolkit + Tailwind CSS + Leaflet
- Backend: Node.js + Express.js + Socket.io
- Database: MongoDB + Mongoose
- Auth: JWT access tokens, refresh tokens, and RBAC roles `SUPER_ADMIN`, `SECURITY_ANALYST`, `VIEWER`

## Folder Structure

```text
project/
|-- client/
|   |-- package.json
|   |-- .env.example
|   `-- src/
|       |-- app/
|       |-- components/
|       |-- hooks/
|       |-- pages/
|       |-- routes/
|       |-- services/
|       |-- styles/
|       `-- utils/
|-- server/
|   |-- package.json
|   |-- .env.example
|   `-- src/
|       |-- api/
|       |-- config/
|       |-- constants/
|       |-- middlewares/
|       |-- models/
|       |-- services/
|       |-- sockets/
|       `-- utils/
|-- DEPLOYMENT_GUIDE_MERN.md
|-- package.json
|-- render.yaml
`-- README.md
```

## Local Setup

Install dependencies:

```powershell
npm install
```

Create env files:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Edit `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/gps-spoofing
JWT_ACCESS_SECRET=your-long-random-access-secret
JWT_REFRESH_SECRET=your-long-random-refresh-secret
```

Start development:

```powershell
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1`
- Socket.io: `http://localhost:5000`

Production-style local preview:

```powershell
npm run start
```

## Demo Login

If the backend or MongoDB is offline, the React client can still run in demo preview mode:

- `admin@gpsshield.local` / `Admin123!`
- `analyst@gpsshield.local` / `Analyst123!`
- `viewer@gpsshield.local` / `Viewer123!`

For real backend login, register the first account through `/api/v1/auth/register`; the first user becomes `SUPER_ADMIN`.

## Available Scripts

```powershell
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## API Overview

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

Dashboard and GPS:

- `GET /api/v1/dashboard/overview`
- `GET /api/v1/gps/live`
- `POST /api/v1/gps/data`

Users:

- `GET /api/v1/users`
- `GET /api/v1/users/:userId`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId`
- `PATCH /api/v1/users/:userId/block`
- `PATCH /api/v1/users/:userId/unblock`
- `DELETE /api/v1/users/:userId`

Devices:

- `GET /api/v1/devices`
- `GET /api/v1/devices/:deviceId`
- `POST /api/v1/devices`
- `PATCH /api/v1/devices/:deviceId`
- `DELETE /api/v1/devices/:deviceId`

Alerts:

- `GET /api/v1/alerts`
- `GET /api/v1/alerts/:alertId`
- `PATCH /api/v1/alerts/:alertId/resolve`
- `PATCH /api/v1/alerts/:alertId/false-positive`
- `PATCH /api/v1/alerts/:alertId/escalate`
- `DELETE /api/v1/alerts/:alertId`

Reports:

- `POST /api/v1/reports`
- `GET /api/v1/reports`
- `GET /api/v1/reports/:reportId`
- `GET /api/v1/reports/:reportId/export?format=pdf|csv|excel`

Profile and Settings:

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`
- `GET /api/v1/health`

## Realtime Events

The Socket.io server requires a valid JWT access token in `auth.token`.

Server emits:

- `system:connected`
- `gps:movement`
- `alerts:created`
- `alerts:updated`
- `alerts:deleted`
- `dashboard:refresh`

## Production Notes

- See `DEPLOYMENT_GUIDE_MERN.md` for Vercel, Render, and MongoDB Atlas deployment.
- Never commit real `.env` files or production secrets.
- Use strong unique values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- In production, configure Render `CLIENT_URL` to match the Vercel frontend URL.
