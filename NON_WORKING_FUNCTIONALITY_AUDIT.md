# PRACTO — Non-Working Functionality Audit

> **Update (same day):** the following items were FIXED after this audit was written:
> - **1.1 AI Symptom Checker** — now works via a built-in rule-based analyzer whenever the OpenRouter call fails; doctor matching fixed (stems like "cardio" now match "Cardiologist"). Add a valid `OPENROUTER_API_KEY` to restore the LLM path (response includes `source: "ai" | "local-fallback"`).
> - **2.6 / 2.7 Video consultations** — new backend endpoint `POST /api/100ms/join-appointment` creates a dedicated 100ms room per appointment (verified live against the 100ms API); "Join Video Call" buttons added to patient My Appointments and doctor Appointments; admin/doctor VideoCall page added at `/video-call/:appointmentId`; patient VideoCall page now joins the appointment room with the real user name (fixed `user`→`userData`).
> - **3.1 DoctorAppointments crash** — missing `React` import fixed; **3.4** admin Dashboard join button now opens the real route; **3.6** upload icon replaced; **2.3** missing `assets` import in MyAppointments fixed.
> Everything else below is still open.

Audited on 2026-07-01. Method: full read of backend/frontend/admin source, production builds of both React apps, live boot of the backend, and live probes of every external service (MongoDB, Gmail SMTP, Stripe, OpenRouter, Google Places, 100ms, ML service). Every finding below includes file:line evidence; "live-verified" means it was reproduced against the running server.

## Legend

- **CRASH** — throws / white-screens / kills the process
- **BROKEN** — feature can never succeed
- **PARTIAL** — works only in some paths or silently misbehaves
- **DEAD** — unreachable UI or code that nothing calls

---

## 1. Dead external services (live-verified)

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 1.1 | **AI Symptom Checker** | BROKEN | OpenRouter returns `401 "User not found"` — the `OPENROUTER_API_KEY` in `backend/.env` is invalid/revoked. Every `POST /api/symptom-checker` fails with "Failed to fetch diagnosis from AI." |
| 1.2 | **Nearby Hospitals (Google Places)** | BROKEN (silent) | Google responds `REQUEST_DENIED: "The provided API key is expired."` `routes/places.js` never checks `data.status`, so `/api/places/nearby` returns `{results: []}` — the feature silently shows nothing. |
| 1.3 | **AI Doctor Matching (ML service)** | BROKEN | `POST /api/doctor/match` → 500. The Flask service (`ml/matchService.py`) is never started by anything; `ml/requirements.txt` is missing `flask-cors` (`matchService.py:2` imports it → ModuleNotFoundError on install); and the Python service hardcodes a *different* MongoDB cluster (`matchService.py:18`, credentials committed!) than the backend's `MONGODB_URI`. Also: no frontend UI ever calls `/api/doctor/match`. Dead end-to-end. |
| 1.4 | Working services | OK | MongoDB connects; Gmail SMTP login verified OK (OTP/reminder emails can send); Stripe secret key valid (TEST mode); 100ms JWT signing works. |

## 2. Patient frontend (PRACTO-main/frontend)

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 2.1 | **Stripe payment is never confirmed** | BROKEN | `MyAppointments.jsx:55-73` redirects to Stripe Checkout, but **nothing in the codebase ever calls `POST /api/user/verify-stripe`**, and there is no `/verify` route in `App.jsx`. After paying, the user lands on a blank page and the appointment remains unpaid forever. |
| 2.2 | **Home page white-screen landmine** | CRASH | `components/TopDoctors.jsx:33` uses `assets.verified_icon` but never imports `assets` → any doctor with `verified: true` crashes the Home page (`ReferenceError: assets is not defined`). |
| 2.3 | **My Appointments white-screen landmine** | CRASH | Same missing-`assets` bug at `Pages/MyAppointments.jsx:121` (`item.docData.verified`). |
| 2.4 | **Build fails on Linux/deploy** | CRASH (deploy) | `Pages/Home.jsx:2` — `import Header from '../components/header'` (lowercase) vs file `Header.jsx`. Works on macOS only; `vite build` fails on any case-sensitive host (Vercel/Netlify/Docker). |
| 2.5 | **Insurance discount unusable** | BROKEN | No page ever calls `POST /api/insurance` — there is no UI to add a policy, so the booking-page dropdown (`Appointment.jsx:328-344`) is always empty and the 90%-off privilege is unreachable. Also field mismatch: model stores `provider` (`models/Insurance.js:4`) but UI renders `ins.insuranceProvider` → would display "undefined". |
| 2.6 | **Booked video consultations can't be joined** | BROKEN | Booking sends `isVideoConsultation: true`, but `MyAppointments.jsx` renders no Join/Chat/Reschedule/Switch-mode buttons. `reschedule-appointment`, `switch-appointment-mode`, `get-appointment/:id` backend endpoints have zero callers. |
| 2.7 | **Video call is a demo room** | PARTIAL | `Doctors.jsx:261` / `Appointment.jsx:277` navigate to `/video-call/<Date.now()>` — a fake id; everyone joins the single hardcoded `VITE_HMS_ROOM_ID` room; no auth gate; doctor never notified. `VideoCall.jsx:21` destructures `user` from context (context exports `userData`) → always joins as anonymous "Patient". |
| 2.8 | **No password recovery / OTP / 2FA UI — and new signups are a dead end** | BROKEN | Active `Login.jsx` only does plain login/register. All 7 backend OTP/2FA endpoints have no UI (the old UI is ~278 lines of commented-out code referencing routes that don't exist). Worse (live-verified): `POST /api/user/register` creates the account unverified and emails an OTP, but there is no screen to enter it, and `loginUser` rejects accounts with `isEmailVerified: false` — so **no user who registers through the UI can ever log in**. A user who forgets their password is locked out; a user with `twoFactorEnabled` can never complete login (backend returns no token; client stores `"undefined"`). |
| 2.9 | **Related Doctors** | DEAD + latent CRASH | Only usage is commented out (`Appointment.jsx:414`); the component itself has a typo `relDocslice(0,5)` (`RelatedDoctors.jsx:45`) that throws the moment it's re-enabled. |
| 2.10 | **Reviews never displayed** | PARTIAL | Star submission works, but `GET /api/reviews/:doctorId` is never called anywhere; ratings shown come from `doc.rating`/`doc.reviewsCount` on the doctor list (always 0 unless voice route used). Submitted reviews are invisible. (And the backend listing endpoint 500s anyway — see 4.1.) |
| 2.11 | Insurance filter dropdown on Doctors page | DEAD-UI | Sends `?insuranceProvider=` to `/api/doctor/list`, which ignores query params — selection changes nothing. |
| 2.12 | Fallback doctors are ghosts | PARTIAL | With backend down/empty, Home shows 15 hardcoded doctors (`AppContext.jsx:21-37`) whose ids (`doc1`…) fail Mongo casts when booked; `/doctors` page has no fallback → inconsistent. |
| 2.13 | MyReports icon | DEAD-UI | `MyReports.jsx:38` uses `assets.appointment_icon` which doesn't exist in `assets.js` → broken image on prescription cards. |
| 2.14 | Razorpay | DEAD | `index.html:11` loads checkout.js; no code uses `window.Razorpay`; no backend route; `razorpay` npm package installed but never imported. |
| 2.15 | Contact/Footer controls | DEAD-UI | "Explore Jobs" button and all Footer links have no handlers/hrefs. |
| 2.16 | Unused backend surface | DEAD | Never called from any UI: `/api/doctor/match`, `/api/doctor/by-language`, `/api/doctor/nearby`, `/api/places/nearby`, all `/api/voice/*`, `/api/appointments*`, `/api/user/get-appointment/:id`. |

## 3. Admin / Doctor panel (admin/)

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 3.1 | **Doctor Appointments page crashes the whole app** | CRASH | `pages/Doctor/DoctorAppointments.jsx:1` imports no default `React`, but line 51 renders `<React.Fragment>` → `ReferenceError` as soon as the doctor has ≥1 appointment → white screen. Kills access to cancel/complete/chat/report-upload. |
| 3.2 | **Doctor profile save always 401s** | BROKEN | `DoctorProfile.jsx:24` sends legacy `{headers:{dToken}}`; backend `authDoctor` only accepts `Authorization: Bearer`. Even fixed, backend `updateDoctorProfile` (`doctorController.js:248`) reads `docId` from body (never sent) → silent no-op; and it only updates `fees/address/available`, never `about`. |
| 3.3 | **Five doctor pages are unreachable shells** | DEAD + BROKEN | `DoctorPatients`, `DoctorReports`, `DoctorReviews`, `DoctorSchedule`, `DoctorSettings`: not imported in `App.jsx`, no routes, no sidebar links — and they call six endpoints that don't exist (`/api/doctor/patients`, `/reports`, `/reviews`, `/update-schedule`, `/change-password`, `/update-notifications`, `/update-privacy`) → all would 404. |
| 3.4 | **Admin "Join Video Call" button** | BROKEN | `Admin/Dashboard.jsx:84-93` opens `/video-call?room=…` — no such route exists in admin `App.jsx` → empty page. The admin app never uses `/api/100ms/generate-token`. |
| 3.5 | Logo click blanks doctor panel | DEAD-UI | Route `/` renders the admin Dashboard; for a doctor (no aToken) it renders nothing and never redirects (`Navbar.jsx:25`, `App.jsx:43`). |
| 3.6 | Upload icon missing | DEAD-UI | `DoctorAppointments.jsx:74` uses `assets.upload_icon` — not exported by `assets.js`. |
| 3.7 | Login error handling | PARTIAL | `Login.jsx:27,38` has no try/catch — backend down = button silently does nothing. |
| 3.8 | Missing fallback avatars | PARTIAL | `AllAppointments.jsx:50,71` falls back to `/default-avatar.png` / `/default-doctor.png`; `admin/public/` contains only `vite.svg`. |
| 3.9 | Admin CRUD (dashboard, appointments, cancel, add/list doctors, availability) | OK | Verified header/path/payload match backend exactly. |

## 4. Backend (PRACTO-main/backend)

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 4.1 | **Review listing 500s** | BROKEN | `reviewController.js:56` populates ref `"User"`/`"Doctor"`, but registered models are lowercase `"user"`/`"doctor"` (`models/doctor.js`, which registers `"Doctor"`, is never imported). Runtime-verified `MissingSchemaError` → every `GET /api/reviews/:doctorId` returns 500. Reviews can be written but never read. |
| 4.2 | **`POST /api/doctor/seed` = unauthenticated wipe + process crash** | CRASH + data loss | `doctorRoute.js:33-62`: `Doctor.deleteMany({})` deletes ALL doctors, then `insertMany` fails validation (sample docs miss required `email/password/speciality/...`) → unhandled rejection in an async Express-4 handler → Node ≥15 kills the server. One anonymous POST nukes the doctor table and downs the API. |
| 4.3 | **`POST /api/appointments/book` always 500s** | BROKEN | `doctorController.bookAppointment:37` does ``new Date(`${slotDate}T${slotTime}`)`` with `"14_6_2025T10:00 AM"` → Invalid Date → NaN → Mongoose CastError on `date`. Runtime-verified. Also hard-requires `insuranceId` and embeds the doctor's bcrypt hash in `docData`. |
| 4.4 | **`GET /api/doctor/nearby` always returns []** | BROKEN | Queries `address.location` geo coordinates that no live write-path ever creates (live-verified empty). The schema with geo fields is the never-imported `models/doctor.js`. |
| 4.5 | **Voice booking corrupts data** | DATA-BUG | `voiceRoutes.js:82-95`: (a) `slots_booked` mutation on a Mixed path without `markModified` → never persists → same slot voice-bookable forever; (b) `date: Date.now()` (booking time, not slot time) → reminders never fire; (c) `userData: {}` gets stripped by minimize → patient info missing everywhere; (d) full doctor doc incl. password hash embedded + echoed. Also zero-padded date keys (`05_07_2026`) vs web's unpadded (`5_7_2026`) → cross-channel double-booking. |
| 4.6 | **Report emails always lose attachments** | BROKEN | `medicalReportController.js:95` passes an attachments array as `sendEmail`'s 4th arg, but the signature is `(to, subject, text, pdfBuffer, pdfFilename, …)`; guard `if (pdfBuffer && pdfFilename)` is false → email always sent with no attachments. |
| 4.7 | **Summary-PDF generation cannot run** | BROKEN | Live-verified: `puppeteer.launch()` → "Could not find Chrome (ver. 137…)" — the browser was never downloaded on this machine. Every summary PDF fails ("PDF generation failed"). |
| 4.8 | **Reminder emails duplicate ~12×** | PARTIAL | `reminderScheduler.js:35-56` runs every 10 min over a ±1 h window with no `reminderSent` flag and no `isCompleted` filter. (Ironically `jobs/reminderJob.js` fixes both — but is imported by nothing.) |
| 4.9 | **Unauthenticated booking endpoint corrupts slots** | DATA-BUG | `POST /api/appointments` (`appointmentRoutes.js:26-97`): no auth, no availability check, never updates `slots_booked` → double-booking; also embeds `otp`, `resetOtp`, `twoFactorSecret` in `userData` (only deselects `password`). |
| 4.10 | **Symptom-checker doctor suggestions ~always empty** | PARTIAL | `symptomCheckerController.js:95-97` prefix-regexes `^cardiology` against speciality values like "Cardiologist" → no match; also selects nonexistent `location` field. |
| 4.11 | Phantom dependency `node-fetch` | LATENT CRASH | `utils/aiPrescriptionValidator.js:3` imports `node-fetch`, absent from package.json — resolves only via tesseract.js's transitive dep. Any dedupe/upgrade → server won't boot (import chain reaches server.js). |
| 4.12 | 700 KB base64 default avatar | DATA-BUG | `models/userModel.js:5` inlines a ~700 KB data-URI as the default user image (file is 743 KB); it's copied into every appointment's `userData` → admin dashboard/appointments responses reach multi-MB after a few bookings. |
| 4.13 | `by-language` / password leak | PARTIAL + security | `doctorRoute.js:65-76` works (live-verified) but returns full doctor docs **including bcrypt password hashes and emails** (no `.select("-password")`). |
| 4.14 | verifyStripe trusts the client | Security/PARTIAL | `verifyStripe` marks appointments paid based on a client-sent `success` flag with no Stripe-side verification. |
| 4.15 | Chat endpoints unauthenticated | Security | `/api/chat/send` + `/api/chat/:appointmentId` have no auth — anyone with an appointmentId can read/write a consultation chat. REST-only (no socket.io) — matches both UIs' 3-second polling. |
| 4.16 | 2FA generate/verify unauthenticated | Security | Anyone knowing an email can rebind the TOTP secret (`userRoute.js:63-99`). |
| 4.17 | Admin addDoctor without photo | PARTIAL | Stores `image: ""` explicitly, bypassing the model default → blank avatars (`adminController.js:91,108`). |
| 4.18 | Dead code | DEAD | Never imported anywhere: `routes/100msToken.js` (CommonJS — would crash if imported), `controllers/videoController.js`, `models/appointment.js`, `models/doctor.js`, `models/hospital.js`, `models/hospitalModel.js`, `models/symptomHistoryModel.js`, `jobs/reminderJob.js`. Unused deps: `openai`, `razorpay`, `mongose` (typo package). `HMS_MANAGEMENT_TOKEN` env never read. |
| 4.19 | `scripts/uploadDoctorImages.js` | PARTIAL | Image paths hardcoded to this machine's `~/.gemini/antigravity/...` — fails anywhere else. |
| 4.20 | Frontend ships a LIVE Stripe publishable key | Config risk | `frontend/.env` `VITE_STRIPE_PUBLIC_KEY=pk_live_…` while the backend key is TEST mode; the pk is currently unused by code, but committed live keys are a hazard. |

## 5. Boot / build status (live-verified)

- Backend boots clean, connects to MongoDB, all route imports resolve. No import-time crash.
- `vite build` succeeds for both frontend and admin **on macOS** (see 2.4 for the Linux-fatal `header` casing bug).
- All three apps have deps installed; root `package.json` and inner `PRACTO-main/package.json` are stray leftovers used by nothing.
