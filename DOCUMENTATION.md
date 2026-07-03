# PRACTO - Healthcare Management System

## Overview

PRACTO is a comprehensive AI-powered healthcare platform designed to streamline doctor appointments, telemedicine, and medical record management. It combines modern web technologies with AI-driven features to create a complete digital healthcare ecosystem.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [API Endpoints](#api-endpoints)
5. [Database Models](#database-models)
6. [Authentication & Security](#authentication--security)
7. [AI Features](#ai-features)
8. [Payment Integration](#payment-integration)
9. [Video Consultation](#video-consultation)
10. [Environment Configuration](#environment-configuration)
11. [Setup & Installation](#setup--installation)

---

## Tech Stack

### Frontend (Patient App)
| Technology | Version | Purpose |
|------------|---------|---------|
| React.js | 19.1.1 | UI Framework |
| Vite | 7.1.7 | Build Tool |
| React Router DOM | 7.9.4 | Routing |
| Axios | 1.13.6 | HTTP Client |
| Tailwind CSS | 3.4.18 | Styling |
| React Toastify | 11.0.5 | Notifications |

### Admin Panel
| Technology | Version | Purpose |
|------------|---------|---------|
| React.js | 19.2.0 | UI Framework |
| Vite | - | Build Tool |
| Tailwind CSS | 3.4.19 | Styling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime |
| Express.js | 4.22.1 | Web Framework |
| MongoDB | - | Database |
| Mongoose | 8.5.1 | ODM |

### Third-Party Services
| Service | Purpose |
|---------|---------|
| Cloudinary | Image/File Storage |
| Stripe | Payment Processing |
| Razorpay | Alternative Payments |
| 100ms (HMS) | Video Consultations |
| OpenRouter + Mistral AI | AI Features |
| Tesseract.js | OCR for Prescriptions |
| Nodemailer | Email Service |

---

## Project Structure

```
PRACTO-main/
├── frontend/                    # Patient web application
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Home.jsx         # Landing page
│   │   │   ├── Doctors.jsx      # Doctor listing & search
│   │   │   ├── Appointment.jsx  # Book appointments
│   │   │   ├── MyAppointments.jsx # View appointments
│   │   │   ├── MyProfile.jsx    # User profile
│   │   │   └── Login.jsx        # Authentication
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── TopDoctors.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx   # Global state
│   │   └── assets/
│   └── package.json
│
├── admin/                       # Admin & Doctor portal
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── AllAppointments.jsx
│   │   │   │   ├── AddDoctor.jsx
│   │   │   │   └── DoctorsList.jsx
│   │   │   └── Doctor/
│   │   │       ├── DoctorDashboard.jsx
│   │   │       └── DoctorAppointments.jsx
│   │   └── context/
│   └── package.json
│
└── backend/                     # Node.js API server
    ├── config/
    │   ├── mongodb.js           # Database connection
    │   └── cloudinary.js        # Cloud storage
    ├── models/
    │   ├── userModel.js         # Patient schema
    │   ├── doctorModel.js       # Doctor schema
    │   ├── appointmentModel.js  # Appointment schema
    │   ├── Insurance.js         # Insurance schema
    │   └── medicalReportModel.js
    ├── controllers/
    │   ├── userController.js    # Patient operations
    │   ├── doctorController.js  # Doctor operations
    │   ├── adminController.js   # Admin operations
    │   └── symptomCheckerController.js
    ├── routes/
    │   ├── userRoute.js
    │   ├── doctorRoute.js
    │   ├── adminRoute.js
    │   └── voiceRoutes.js
    ├── middleware/
    │   ├── authUser.js
    │   ├── authDoctor.js
    │   └── authAdmin.js
    ├── utils/
    │   ├── emailService.js
    │   ├── reminderScheduler.js
    │   └── aiPrescriptionValidator.js
    ├── server.js                # Entry point
    └── package.json
```

---

## Core Features

### 1. User Authentication
- **Email Registration** with OTP verification
- **Two-Factor Authentication (2FA)** using TOTP
- **Password Reset** via email OTP
- **JWT-based** session management

### 2. Appointment Management
- **Book Appointments** with slot selection (7-9 day window)
- **Reschedule** existing appointments
- **Cancel** appointments with automatic slot release
- **Switch** between video and in-clinic consultations
- **Insurance Integration** with automatic fee discounts

### 3. Doctor Discovery
- **Search** by speciality, language, location
- **AI Symptom Matching** - get doctor recommendations based on symptoms
- **Voice Search** - book appointments using voice commands
- **Ratings & Reviews** - see doctor ratings and patient reviews

### 4. Video Consultations
- **Real-time Video Calls** powered by 100ms
- **Role-based Access** (doctor as broadcaster, patient as viewer)
- **24-hour Token Validity**
- **Automatic Mode Switching**

### 5. Medical Records
- **Upload Prescriptions** (images, PDFs)
- **Upload Test Reports** with chart data
- **AI Prescription Validation** - safety checks for dosage, contraindications
- **PDF Generation** for reports

### 6. Insurance Management
- **Add/Update/Delete** insurance policies
- **Automatic Discounts** - 90% off for insured patients
- **Coverage Validation** before booking

### 7. Admin Panel
- **Dashboard** with analytics (doctors, patients, appointments)
- **Doctor Management** - add, edit, toggle availability
- **Appointment Oversight** - view all appointments, cancel if needed
- **Medical Report Uploads** with AI validation

### 8. Notifications
- **Email Confirmations** for bookings, cancellations, reschedules
- **24-hour Reminders** via scheduled cron job
- **Payment Confirmations**

---

## API Endpoints

### User Routes (`/api/user`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new patient | No |
| POST | `/login` | Patient login | No |
| POST | `/send-otp` | Send registration OTP | No |
| POST | `/verify-otp` | Verify email OTP | No |
| POST | `/send-reset-otp` | Request password reset | No |
| POST | `/verify-reset-otp` | Verify reset OTP | No |
| POST | `/reset-password` | Reset password | No |
| GET | `/get-profile` | Get user profile | JWT |
| PUT | `/update-profile` | Update profile | JWT |
| POST | `/book-appointment` | Book appointment | JWT |
| GET | `/appointments` | List user appointments | JWT |
| POST | `/cancel-appointment` | Cancel appointment | JWT |
| POST | `/reschedule-appointment` | Reschedule | JWT |
| POST | `/switch-appointment-mode` | Video/In-clinic toggle | JWT |
| POST | `/payment-stripe` | Initiate Stripe payment | JWT |
| POST | `/verify-stripe` | Verify payment | JWT |
| POST | `/generate-2fa` | Setup 2FA | No |
| POST | `/verify-2fa` | Verify 2FA code | No |

### Doctor Routes (`/api/doctor`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Doctor login | No |
| GET | `/list` | List all doctors | No |
| POST | `/match` | AI doctor matching | No |
| GET | `/appointments` | Doctor's appointments | JWT |
| POST | `/cancel-appointment` | Cancel appointment | JWT |
| POST | `/complete-appointment` | Mark completed | JWT |
| POST | `/change-availability` | Toggle availability | JWT |
| GET | `/dashboard` | Dashboard data | JWT |
| GET | `/profile` | Get profile | JWT |
| POST | `/update-profile` | Update profile | JWT |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Admin login | No |
| GET | `/appointments` | All appointments | Bearer |
| POST | `/cancel-appointment` | Cancel any appointment | Bearer |
| POST | `/add-doctor` | Add new doctor | Bearer |
| GET | `/all-doctors` | List all doctors | Bearer |
| POST | `/change-availability` | Change doctor availability | Bearer |
| GET | `/dashboard` | Dashboard analytics | Bearer |

### Other Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/appointments` | Quick booking |
| POST | `/api/symptom-checker` | AI symptom analysis |
| GET | `/api/places/nearby` | Nearby hospitals |
| POST | `/api/reports/upload` | Upload medical report |
| GET | `/api/reports/user` | Get user reports |
| POST | `/api/chat/send` | Send chat message |
| GET | `/api/chat/:appointmentId` | Get chat history |
| POST | `/api/reviews/add` | Add doctor review |
| GET | `/api/reviews/:doctorId` | Get doctor reviews |
| POST | `/api/insurance` | Add insurance |
| GET | `/api/insurance` | List user insurance |
| POST | `/api/100ms/generate-token` | Video call token |
| GET | `/api/voice/doctors` | Voice doctor search |
| POST | `/api/voice/book-appointment` | Voice booking |

---

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  image: String,
  phone: String,
  dob: Date,
  gender: String,
  address: Object,
  bloodGroup: String,

  // Authentication
  isEmailVerified: Boolean,
  otp: String,
  otpExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: Boolean,

  // Health Info
  medicalHistory: [String],
  allergies: [String],
  currentMedications: [String]
}
```

### Doctor Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  image: String,
  speciality: String,
  degree: String,
  experience: String,
  about: String,
  fees: Number,
  available: Boolean,
  address: Object,

  slots_booked: {
    "DD_MM_YYYY": ["10:00 AM", "10:30 AM", ...]
  },

  acceptedInsurances: [String],
  languagesKnown: [String],

  reviews: [{
    userId: ObjectId,
    rating: Number (1-5),
    comment: String,
    date: Date
  }]
}
```

### Appointment Model
```javascript
{
  userId: String,
  docId: ObjectId,
  slotDate: String,        // "DD_MM_YYYY"
  slotTime: String,        // "HH:MM AM/PM"
  userData: Object,
  docData: Object,
  amount: Number,
  date: Date,
  videoConsultation: Boolean,
  cancelled: Boolean,
  payment: Boolean,
  isCompleted: Boolean,
  insurance: Object
}
```

### Insurance Model
```javascript
{
  provider: String,
  policyNumber: String (unique),
  coverageDetails: String,
  validTill: Date,
  userId: ObjectId
}
```

### Medical Report Model
```javascript
{
  userId: ObjectId,
  reportName: String,
  fileUrl: String,
  type: "prescription" | "test",
  aiValidation: {
    status: "pending" | "safe" | "warning" | "danger",
    issues: [String]
  },
  chartData: {
    bloodPressure: [{date, systolic, diastolic}],
    glucoseLevels: [{date, value}],
    thyroidLevels: [{date, tsh}],
    heartRate: [{date, bpm}]
  }
}
```

---

## Authentication & Security

### JWT Authentication Flow

```
Registration:
1. User submits email/name/password
2. OTP sent to email (6 digits, 5-min validity)
3. User verifies OTP
4. Account activated

Login:
1. User submits email/password
2. If 2FA enabled: redirect to TOTP verification
3. JWT token returned
4. Token stored in localStorage
5. Sent via 'token' header for protected routes
```

### Middleware

| Middleware | Purpose |
|------------|---------|
| `authUser` | Verifies user JWT, injects `userId` into `req.body` |
| `authDoctor` | Verifies doctor JWT |
| `authAdmin` | Verifies admin Bearer token |

### Password Security
- Minimum 8 characters required
- Hashed with bcrypt (10 salt rounds)
- Never returned in API responses

### Two-Factor Authentication
- TOTP-based using `speakeasy` library
- QR code generated for authenticator apps
- 6-digit codes with 30-second window

---

## AI Features

### 1. Symptom Checker
- **Input**: Patient describes symptoms
- **Process**: OpenRouter API calls Mistral AI
- **Output**:
  - Likely conditions with confidence levels
  - Recommended specialist types
  - Matched doctors from database

```
POST /api/symptom-checker
Body: { symptoms: "fever and headache" }

Response: {
  conditions: ["Flu", "Cold", "Migraine"],
  confidence: ["high", "moderate", "low"],
  recommendations: ["Rest", "See doctor if persists"],
  matchedDoctors: [...]
}
```

### 2. AI Prescription Validator
- **Input**: Uploaded prescription image
- **Process**:
  1. OCR extraction (Tesseract.js)
  2. Parse patient context (age, weight, allergies)
  3. AI analysis via OpenRouter
- **Output**: Safety status (safe/warning/danger) with issues

### 3. Doctor Matching
- Symptom-based specialist recommendations
- Ranked by specialization match + ratings
- Top 6 doctors returned

---

## Payment Integration

### Stripe
```
Flow:
1. POST /api/user/payment-stripe (with appointmentId)
2. Backend creates Stripe checkout session
3. User redirected to Stripe
4. On success: POST /api/user/verify-stripe
5. Appointment marked as paid
```

### Insurance Discounts
- Full coverage: 100% discount
- Partial coverage: Patient pays 10%
- Uninsured: Full fee

---

## Video Consultation

### 100ms Integration

```
Flow:
1. Appointment booked as video consultation
2. Payment verified (required for video)
3. POST /api/100ms/generate-token
4. Token generated with:
   - room_id: appointment-specific or shared
   - user_id: patient/doctor ID
   - role: "broadcaster" (doctor) / "viewer" (patient)
5. Frontend initializes 100ms SDK
6. Real-time video call established
```

### Token Structure
```javascript
{
  access_key: HMS_APP_ACCESS_KEY,
  type: "app",
  version: 2,
  room_id: "...",
  user_id: "...",
  role: "broadcaster" | "viewer",
  iat: timestamp,
  exp: timestamp + 24h
}
```

---

## Environment Configuration

Create `.env` file in `/backend`:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prescripta

# Authentication
JWT_SECRET=your-secret-key

# Admin Credentials
ADMIN_EMAIL=admin@practo.com
ADMIN_PASSWORD=your-admin-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_SECRET_KEY=xxxxx

# Payment
STRIPE_SECRET_KEY=sk_test_xxxxx
RAZORPAY_KEY_ID=xxxxx
RAZORPAY_KEY_SECRET=xxxxx
CURRENCY=usd

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-specific-password

# Video (100ms)
HMS_APP_ACCESS_KEY=xxxxx
HMS_APP_SECRET=xxxxx

# AI
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Server
PORT=4000
FRONTEND_URL=http://localhost:5173
```

---

## Setup & Installation

### Prerequisites
- Node.js v14+
- MongoDB Atlas account
- Cloudinary account
- Gmail with app-specific password

### Installation Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd PRACTO-main

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start backend server
npm run server
# Server runs on http://localhost:4000

# 5. Install frontend dependencies
cd ../frontend
npm install

# 6. Start frontend
npm run dev
# Frontend runs on http://localhost:5173

# 7. Install admin panel (optional)
cd ../admin
npm install
npm run dev
# Admin panel runs on http://localhost:5174
```

### Running in Production

```bash
# Backend
cd backend
NODE_ENV=production node server.js

# Frontend (build)
cd frontend
npm run build
# Serve dist/ folder with nginx/apache

# Admin (build)
cd admin
npm run build
```

---

## Background Jobs

### Appointment Reminder Scheduler
- **Schedule**: Every 10 minutes
- **Purpose**: Send 24-hour pre-appointment reminders
- **Location**: `/backend/utils/reminderScheduler.js`

```javascript
// Cron: */10 * * * *
// Finds appointments 23-25 hours away
// Sends email reminder to patient
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/server.js` | Express app entry point |
| `backend/controllers/userController.js` | User auth, profile, appointments |
| `backend/controllers/doctorController.js` | Doctor operations |
| `backend/middleware/authUser.js` | JWT verification |
| `backend/utils/emailService.js` | Nodemailer configuration |
| `backend/utils/reminderScheduler.js` | Cron job for reminders |
| `frontend/src/context/AppContext.jsx` | Global React state |
| `frontend/src/Pages/Appointment.jsx` | Booking interface |
| `frontend/src/Pages/MyAppointments.jsx` | View appointments |

---

## License

This project is proprietary software.

---

## Support

For issues or questions, please contact the development team.
