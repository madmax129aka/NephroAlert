# NephroAlert — CKD Progression Predictor

**Catch Kidney Decline Before It Becomes Kidney Failure**

NephroAlert is an AI-powered CKD (Chronic Kidney Disease) progression monitoring system designed for rural Primary Health Centers in India. It analyzes biomarker trajectories across multiple patient visits to detect dangerous kidney decline patterns before they cross clinical thresholds.

> Research prototype for the ACS-AMRI Seed Grant Project at Dr. MGR Educational & Research Institute.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas connection string)

### Setup

```bash
# 1. Install all dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 2. Configure environment
# Edit .env file with your MongoDB URI
# Default: mongodb://localhost:27017/nephroalert

# 3. Run both server and client
npm run dev
```

- **Server:** http://localhost:5000
- **Client:** http://localhost:5173

### Demo Credentials
```
Email:    demo@nephroalert.com
Password: Demo@123
```

The database auto-seeds with 8 demo patients (varied risk levels) on first run.

---

## Features

- **ML-Powered Risk Prediction** — Analyzes eGFR, creatinine, HbA1c, ACR trajectories using linear regression slopes and multi-factor scoring
- **Real-time eGFR Calculation** — CKD-EPI 2021 formula auto-calculates as doctor types creatinine value
- **CKD Stage Detection** — Automatic Stage 1-5 classification from eGFR
- **Biomarker Trend Charts** — Line charts for all 6 key biomarkers with normal range reference lines
- **Alert System** — Automatic alerts when AI detects dangerous progression patterns
- **Risk Scoring** — 0-100 composite score with Low/Moderate/High/Critical categorization
- **PDF Report Export** — Generate professional patient reports for referrals
- **Research Data Export** — Anonymized CSV download for research analysis

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| ML/AI | Custom scoring algorithm (JavaScript) — no Python dependency |
| Auth | JWT with bcrypt |

## Project Structure

```
nephroalert/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Reusable UI + chart components
│       ├── pages/          # All route pages
│       ├── context/        # Auth context
│       ├── services/       # API client
│       └── utils/          # eGFR calculation, PDF export
├── server/                 # Express backend
│   └── src/
│       ├── models/         # Mongoose schemas
│       ├── routes/         # API endpoints
│       ├── services/       # ML prediction engine
│       ├── middleware/     # Auth, error handling
│       ├── seed/           # Demo data seeder
│       └── config/         # Database connection
├── .env                    # Environment variables
└── package.json            # Root workspace scripts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Doctor registration |
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/auth/me | Validate token |
| GET | /api/patients | List all patients |
| POST | /api/patients | Create patient |
| GET | /api/patients/:id | Patient detail + visits + prediction |
| POST | /api/patients/:id/visits | Add visit → runs ML prediction |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/alerts | All alerts |
| PUT | /api/alerts/read-all | Mark all alerts read |
| GET | /api/export/csv | Anonymized research CSV |

---

## License

Research use only — ACS-AMRI Seed Grant Project.
