# Deployment Guide: Sponsorship Intelligence Platform

Follow these steps to deploy the full-stack application to production.

## 1. Production Database (PostgreSQL)
We recommend using **Render Managed PostgreSQL**, **Supabase**, or **Neon**.

1. Create a new PostgreSQL database.
2. Copy the **External Connection String**.
3. It should look like: `postgresql://user:password@hostname:5432/dbname?sslmode=require`

---

## 2. Backend Deployment (Render)
1. **New Web Service**: Connect your GitHub repository.
2. **Environment**: `Node`.
3. **Build Command**: `npm install && npm run build` (This runs `prisma generate`).
4. **Start Command**: `npm start` (This runs migrations and starts the server).
5. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: A long, random string (e.g., generated with `openssl rand -base64 32`).
   - `FRONTEND_URL`: Your final Vercel frontend URL (e.g., `https://your-app.vercel.app`).
   - `NODE_ENV`: `production`.
   - `PORT`: `5000` (Render will handle this, but explicit is fine).

---

## 3. Frontend Deployment (Vercel)
1. **New Project**: Connect your GitHub repository.
2. **Framework Preset**: `Vite`.
3. **Root Directory**: `frontend`.
4. **Environment Variables**:
   - `VITE_API_BASE_URL`: Your Render backend URL + `/api` (e.g., `https://your-backend.onrender.com/api`).
5. **Build & Output Settings**: Default (Vercel detects Vite automatically).

---

## 4. Post-Deployment Verification
1. Ensure the backend URL is correctly set in the frontend's `VITE_API_BASE_URL`.
2. Verify that the `FRONTEND_URL` in the backend matches the Vercel domain to allow CORS.
3. Check the "My Tracker" page to ensure the database connection and JWT auth are working in the new environment.
