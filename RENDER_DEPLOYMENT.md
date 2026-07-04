# Deploying PRACTO to Render

This repo has **three** deployable apps:

| App | Folder (Root Directory) | Type on Render |
|---|---|---|
| Backend API (Node/Express) | `PRACTO-main/backend` | Web Service |
| Patient frontend (Vite/React) | `PRACTO-main/frontend` | Static Site |
| Admin / Doctor panel (Vite/React) | `admin` | Static Site |

There are two ways to deploy: the **Blueprint** (one file, all three at once) or **manual** (create each service in the dashboard). Do the prerequisites first either way.

---

## 0. Prerequisites (do these once)

1. **Whitelist Render in MongoDB Atlas.** The backend connects to your Atlas cluster. In Atlas → **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Render's outbound IPs are dynamic on the free plan, so this is required or the backend can't reach the database.
2. **Push your code to GitHub** (already done — repo `practo-capstone`). Render deploys from GitHub.
3. Know that **free web services sleep after ~15 min idle** and take ~30–60 s to wake on the next request. The static sites are always-on.

---

## Option A — Blueprint (recommended, uses `render.yaml`)

1. In the Render dashboard: **New** → **Blueprint**.
2. Connect the `practo-capstone` repo. Render reads `render.yaml` and proposes three services: `practo-backend`, `practo-frontend`, `practo-admin`.
3. Click **Apply**. The backend deploys with the secrets from its committed `.env`; the two static sites build.
4. When the **backend** finishes, copy its URL (e.g. `https://practo-backend.onrender.com`).
5. For **each static site** (`practo-frontend`, `practo-admin`): **Environment** → set `VITE_BACKEND_URL` to that backend URL → **Manual Deploy → Deploy latest commit** (Vite bakes the URL in at build time, so a rebuild is required).

Done. Open the frontend and admin URLs.

---

## Option B — Manual (create services one by one)

### 1. Backend (do this first — you need its URL)
- **New → Web Service**, connect the repo.
- **Root Directory:** `PRACTO-main/backend`
- **Runtime:** Node · **Build:** `npm install` · **Start:** `node server.js`
- **Instance type:** Free
- **Environment variables:** the committed `PRACTO-main/backend/.env` already supplies everything (Mongo, JWT, Cloudinary, Stripe, 100ms, Gmail…). Render provides its own `PORT`, which the server already uses. *(More secure alternative: add those keys here in the dashboard and delete `.env` from the repo.)*
- Deploy, then copy the service URL, e.g. `https://practo-backend.onrender.com`.

### 2. Patient frontend
- **New → Static Site**, connect the repo.
- **Root Directory:** `PRACTO-main/frontend`
- **Build:** `npm install && npm run build` · **Publish Directory:** `dist`
- **Environment variable:** `VITE_BACKEND_URL = https://practo-backend.onrender.com` (your backend URL). This overrides the committed `localhost` value at build time.
- **Redirects/Rewrites:** add a rule — Source `/*`, Destination `/index.html`, Action **Rewrite** (so refreshing on `/verify`, `/my-appointments`, etc. doesn't 404).
- Deploy.

### 3. Admin / Doctor panel
- Same as the frontend, but **Root Directory:** `admin`.
- Set `VITE_BACKEND_URL` to the same backend URL.
- Add the same `/* → /index.html` rewrite rule.
- Deploy.

---

## After deploying

- **Test:** open the frontend URL → the doctor list should load (confirms it's reaching the backend). Log in, book, chat, video call.
- **CORS** is open (`app.use(cors())`), so no extra config is needed.
- Optionally set the backend's `FRONTEND_URL` env var to your deployed frontend URL (used only for the OpenRouter referer header).

## Known limitations (unchanged by deployment)
- **AI Symptom Checker / prescription validation** fall back to the rule-based path until you add a valid `OPENROUTER_API_KEY`.
- **Nearby Hospitals** needs a valid `GOOGLE_API_KEY` (the committed one is expired).
- The **ML doctor-matching** Python service (`PRACTO-main/backend/ml`) is not part of this deploy; it's optional and unused by the UI.
- **Security:** your `.env` secrets are committed to the repo — rotate them and consider moving them to Render's dashboard-only env vars.
