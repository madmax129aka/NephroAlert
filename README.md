# NephroAlert — CKD Progression Predictor

**Catch Kidney Decline Before It Becomes Kidney Failure**

NephroAlert is an AI-powered CKD (Chronic Kidney Disease) progression monitoring system designed for rural Primary Health Centers in India. It analyzes biomarker trajectories across multiple patient visits to detect dangerous kidney decline patterns before they cross clinical thresholds.

> Research prototype for the ACS-AMRI Seed Grant Project at Dr. MGR Educational & Research Institute.

---

## Quick Start

### Prerequisites
- **Java 17+** (JDK)
- **Maven 3.9+**
- **MySQL 8.0+** (or MySQL Workbench)
- **Node.js 18+** (for frontend)

### Database Setup (MySQL Workbench)

1. Open MySQL Workbench
2. Create a new schema/database:
```sql
CREATE DATABASE nephroalert;
```
3. The application will auto-create all tables on first run (`spring.jpa.hibernate.ddl-auto=update`)

### Backend Setup (Spring Boot)

```bash
cd server

# Configure database connection (edit if needed)
# src/main/resources/application.properties
# spring.datasource.username=root
# spring.datasource.password=root

# Run the server
mvn spring-boot:run
```

Server starts on **http://localhost:5000**

On first run, the database auto-seeds with 8 demo patients.

### Frontend Setup (React + Vite)

```bash
cd client
npm install
npm run dev
```

Client starts on **http://localhost:5173**

### Demo Credentials
```
Email:    demo@nephroalert.com
Password: Demo@123
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | **Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA** |
| Database | **MySQL 8.0** (via MySQL Workbench) |
| ML/AI | Custom scoring algorithm (Java) — no Python dependency |
| Auth | JWT (jjwt) with BCrypt password hashing |
| Build | Maven |

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

---

## Project Structure

```
nephroalert/
├── client/                          # React frontend (Vite)
│   └── src/
│       ├── components/              # Reusable UI + chart components
│       ├── pages/                   # All route pages
│       ├── context/                 # Auth context
│       ├── services/                # API client (axios)
│       └── utils/                   # eGFR calculation, PDF export
├── server/                          # Spring Boot backend
│   ├── pom.xml                      # Maven dependencies
│   └── src/main/java/com/nephroalert/
│       ├── NephroAlertApplication.java
│       ├── config/                  # DataSeeder (auto-seeds on empty DB)
│       ├── controller/              # REST controllers (Auth, Patient, Dashboard, Alert, Export)
│       ├── dto/                     # Request/Response DTOs
│       ├── entity/                  # JPA entities (Doctor, Patient, Visit, Alert)
│       ├── repository/              # Spring Data JPA repositories
│       ├── security/                # JWT filter, SecurityConfig, JwtUtil
│       └── service/                 # PredictionService, AuthService
└── package.json                     # Root scripts
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Doctor registration |
| POST | /api/auth/login | Login (returns JWT) |
| GET | /api/auth/me | Validate token |
| GET | /api/patients | List all patients |
| POST | /api/patients | Create patient |
| GET | /api/patients/:id | Patient detail + visits + prediction |
| PUT | /api/patients/:id | Update patient |
| DELETE | /api/patients/:id | Delete patient + related data |
| POST | /api/patients/:id/visits | Add visit → runs ML prediction → creates alert |
| GET | /api/patients/:id/visits | Get all visits for patient |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/alerts | All alerts |
| PUT | /api/alerts/:id/read | Mark alert read |
| PUT | /api/alerts/read-all | Mark all alerts read |
| GET | /api/export/csv | Anonymized research CSV |
| GET | /api/health | Health check |

---

## ML Algorithm Pipeline

```
Patient visits entered
        ↓
Algorithm 1 — linearRegressionSlope() → trend direction & speed
        +
Algorithm 4 — % change calculation for each biomarker
        ↓
Algorithm 2 — calculateEGFR() → CKD-EPI 2021 formula
        ↓
Algorithm 3 — predictCKDProgression() → 5-factor scoring system (0-100)
        ↓
Final Risk Score + Risk Level + Explanation + Recommendation
        ↓
Doctor sees: Charts + Gauge + Alert + Recommendation
```

---

## MySQL Schema (Auto-generated by Hibernate)

Tables created automatically:
- `doctors` — Healthcare provider accounts
- `patients` — Patient demographics + current risk status
- `visits` — Blood test results per visit + eGFR + risk at that visit
- `alerts` — AI-generated alerts for high/critical patients

---

## License

Research use only — ACS-AMRI Seed Grant Project.
