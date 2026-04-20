# GPS Spoofing Detection & Visualization Dashboard

A production-ready full-stack platform for detecting GNSS spoofing, triaging incidents in realtime, managing fleet inventory, exporting reports, and tuning alert policy through a futuristic operations console.

## Current Repo Note

This repository currently contains two application tracks:

- `client/` + `server/`: the active MERN implementation
- `frontend/` + `backend/` + `database/`: an older Next.js + Prisma prototype kept for reference

If you want to run the current GPS Spoofing Detection MERN app, use `client/` and `server/`.
Do not use the root `npm run dev` command for the MERN version because the root workspace scripts still target the older prototype.

### MERN Quick Start

Backend:

```powershell
Copy-Item server/.env.example server/.env
cd server
npm install
npm run dev
```

Before starting the backend, edit `server/.env` and set:

- `MONGODB_URI` to your local MongoDB or MongoDB Atlas connection string
- `JWT_ACCESS_SECRET` to a long random secret
- `JWT_REFRESH_SECRET` to a different long random secret

Frontend:

```powershell
Copy-Item client/.env.example client/.env
cd client
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

Backend URL:

- `http://localhost:5000/api/v1`

If the backend is offline, the frontend can still run in preview mode with demo credentials:

- `admin@gpsshield.local` / `Admin123!`
- `analyst@gpsshield.local` / `Analyst123!`
- `viewer@gpsshield.local` / `Viewer123!`

## Highlights

- Futuristic Next.js dashboard with animated 3D backgrounds, theme-aware dark/light mode, skeleton screens, hover polish, and realtime feed updates
- Secure Express API with JWT auth, RBAC, Zod request validation, rate limiting, Helmet, compression, and protected report exports
- PostgreSQL + Prisma data model for users, devices, detections, system thresholds, and notification preferences
- Admin panel for user and device management with inline editing, search, promotion/demotion, enable/disable, and device status controls
- Settings console for global thresholds plus user notification preferences
- Filter-aware CSV and PDF exports for operational reporting

## Stack

- Frontend: Next.js (React) + Tailwind CSS + Framer Motion + Three.js + React Leaflet/OpenStreetMap
- Backend: Node.js + Express.js + Socket.io
- Database: PostgreSQL + Prisma ORM
- Auth: JWT with role-based access (`ADMIN`, `USER`)

## Folder Structure

```text
project/
|-- backend/
|   |-- package.json
|   |-- .env.example
|   `-- src/
|       |-- app.js
|       |-- server.js
|       |-- config/
|       |-- constants/
|       |-- controllers/
|       |-- middleware/
|       |-- routes/
|       |-- services/
|       |-- sockets/
|       |-- utils/
|       `-- validation/
|-- database/
|   |-- .env.example
|   |-- package.json
|   |-- docker-compose.yml
|   |-- prisma/
|   |   `-- schema.prisma
|   `-- seed/
|       `-- seed.js
|-- frontend/
|   |-- package.json
|   |-- .env.local.example
|   |-- next.config.mjs
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- jsconfig.json
|   |-- postcss.config.js
|   `-- tailwind.config.js
|-- package.json
`-- README.md
```

## Basic Setup

PowerShell:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item database/.env.example database/.env
Copy-Item frontend/.env.local.example frontend/.env.local
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Production entrypoints:

```powershell
npm run build
npm run start
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`
- Socket.io: `ws://localhost:5000`

Seeded credentials:

- Admin: `admin@gpsshield.local` / `Admin123!`
- User: `analyst@gpsshield.local` / `User123!`

## Production Notes

- Frontend ships with security headers through `next.config.mjs`
- Backend validates runtime env values and rejects unsafe production JWT defaults
- Report downloads are authenticated, rate-limited, and marked `Cache-Control: private, no-store`
- REST APIs are versioned under `/api/v1`
- Detection/device/user list endpoints support pagination and search
- Heavy visuals are lazy-loaded to reduce initial bundle work

## API Structure

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Users

- `GET /api/v1/users` (`ADMIN`)
- `POST /api/v1/users` (`ADMIN`)
- `PATCH /api/v1/users/:id` (`ADMIN`)

### Devices

- `GET /api/v1/devices`
- `POST /api/v1/devices` (`ADMIN`)
- `PATCH /api/v1/devices/:id` (`ADMIN`)

### Detections

- `GET /api/v1/detections`
  - Query: `page`, `pageSize`, `search`, `severity`, `status`
- `GET /api/v1/detections/summary`
- `POST /api/v1/detections` (`ADMIN`)
- `PATCH /api/v1/detections/:id/status` (`ADMIN`)

### Settings

- `GET /api/v1/settings/system`
- `PUT /api/v1/settings/system` (`ADMIN`)
- `GET /api/v1/settings/notifications`
- `PUT /api/v1/settings/notifications`

### Reports

- `GET /api/v1/reports/detections.csv`
- `GET /api/v1/reports/detections.pdf`
  - Query: `search`, `severity`, `status`, `limit`

### Health

- `GET /api/v1/health`

### Socket Events

- Client connects with JWT in `auth.token`
- Server emits `connection:ready`
- Server emits `detection:created`
- Server emits `detection:status`

## UX Features

- Animated 3D mission background and rotating hero visualization
- Global loading screen plus route-level and component-level skeletons
- Theme toggle with persisted dark/light preference
- Filterable live dashboard with export-aware query state
- Admin console with search and inline edit flows
- Settings console for thresholds and notification routing

## Architecture Notes

- MVC-style Express backend with controllers, services, middleware, validation, and socket layer separation
- Database assets isolated in `/database` for schema, migrations, and Dockerized Postgres
- Frontend consumes backend strictly through REST + Socket.io
- Prisma queries are pagination-aware and use selective field retrieval for better performance
