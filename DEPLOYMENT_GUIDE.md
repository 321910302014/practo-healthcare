# Deployment Guide: Prescripto Healthcare System

This guide outlines the steps to deploy the full-stack Prescripto application, including the Backend API, the Patient Frontend, and the Admin Portal.

---

## 🏗️ 1. Backend Deployment (Node.js API)

Recommended platforms: **Render**, **Heroku**, or **DigitalOcean App Platform**.

### Steps:
1.  **Prepare the Backend:**
    *   Ensure all environment variables in `.env` are ready to be added to the hosting provider's "Environment Variables" section.
    *   Make sure `mongodb.js` uses the `MONGODB_URI` from the environment.
2.  **Deployment (Example: Render):**
    *   Create a "Web Service" on Render.
    *   Connect your GitHub repository.
    *   **Root Directory:** `PRACTO-main/backend`
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
3.  **Environment Variables:** Add all variables from your `backend/.env` (e.g., `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_API_KEY`, etc.).
4.  **CORS:** Update the `FRONTEND_URL` and `ADMIN_URL` in the backend environment to match the final deployed URLs of your frontend apps.

---

## 💻 2. Frontend Deployment (Patient App)

Recommended platforms: **Vercel** or **Netlify**.

### Steps:
1.  **Deployment (Example: Vercel):**
    *   Create a "New Project" on Vercel.
    *   Connect your GitHub repository.
    *   **Root Directory:** `PRACTO-main/frontend`
    *   **Framework Preset:** `Vite`
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
2.  **Environment Variables:**
    *   Add `VITE_BACKEND_URL`: `https://your-backend-url.onrender.com`
    *   Add other `VITE_` variables as needed.

---

## 🛠️ 3. Admin & Doctor Portal Deployment

Recommended platforms: **Vercel** or **Netlify**.

### Steps:
1.  **Deployment (Example: Netlify):**
    *   Create a "New Site from Git".
    *   **Base Directory:** `admin` (or `PRACTO-main/admin` depending on folder structure).
    *   **Build Command:** `npm run build`
    *   **Publish Directory:** `dist`
2.  **Environment Variables:**
    *   Add `VITE_BACKEND_URL`: `https://your-backend-url.onrender.com`
    *   Add `VITE_ADMIN_EMAIL` and matching credentials if hardcoded for initial setup.

---

## ⚙️ 4. Post-Deployment Checklist

1.  **Database Access:** In MongoDB Atlas, go to "Network Access" and allow the IP addresses of your hosting providers (or allow `0.0.0.0/0` for testing).
2.  **Cloudinary:** Ensure your production environment variables for Cloudinary are correct.
3.  **Stripe/Razorpay:** Switch from `Test Keys` to `Live Keys` in your respective dashboards when ready for production.
4.  **100ms (Video):** Update the Video configuration to allow traffic from your production domains.
5.  **Reminders:** Ensure the `cron` job in `server.js` starts correctly. Some platforms like Render (free tier) sleep, which might pause your background jobs.

---

## 🧹 5. Common Issues

*   **Mixed Content:** Ensure all API calls are made via `https`.
*   **Routing:** If using Vercel/Netlify, create a `vercel.json` or `_redirects` file to handle SPA routing if pages don't refresh correctly.
    *   *Vercel `vercel.json`:*
      ```json
      {
        "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
      }
      ```
