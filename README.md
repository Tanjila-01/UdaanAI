# Udaan AI — AI-Powered Career Development and Future Skills Platform

Udaan AI is an **AI-Powered Career Development and Future Skills Platform for Karnataka students**, primarily supporting Karnataka Board students in Classes 8–10 and PUC students in Classes 11–12.

## Implementation Status Overview

| Domain / Microservice | Status | Implemented Features |
| :--- | :--- | :--- |
| **Monorepo & Infrastructure** | **Implemented** | 10 Docker containers, Makefile, environment configs, health check automation. |
| **Database Architecture** | **Implemented** | PostgreSQL 15 container with 7 schema-isolated microservice boundaries (`auth`, `student`, `roadmap`, `assessment`, `career_ai`, `institution`, `admin_analytics`). |
| **API Gateway Service** (`api-gateway`) | **Implemented** | Reverse proxy routing for `/api/v1/auth/*`, `/api/v1/students/*`, `/api/v1/roadmaps/*`, and `/api/v1/assessments/*`, CORS, error fallbacks. |
| **Auth Service** (`auth-service`) | **Implemented** | Registration, login, bcrypt password hashing, 30-min JWT access & 7-day refresh tokens, stateless logout, `/auth/me` session check. |
| **Student Profile Service** (`student-service`) | **Implemented** | Student profile onboarding (Class 8–10 SSLC, Class 11–12 PUC Science/Commerce/Arts), profile completeness score calculation (0–100%), JWT decoding. |
| **Career Roadmap Service** (`roadmap-service`) | **Implemented** | Dynamic SQL pathway exploration (`GET /roadmaps/pathways`), detailed pathway option milestones, eligibility rules. |
| **React Web App** (`frontend/web`) | **Implemented** | Login, Register, multi-step Onboarding, Student Dashboard, interactive Pathways Explorer (`/pathways`). |
| **Assessment Service** (`assessment-service`) | **Partially Implemented** | Health skeleton active; `/assessment` UI shell and API Gateway proxy routes ready. |
| **AI Career Service** (`ai-career-service`) | **Planned / Postponed** | Health skeleton active; LLM integrations & recommendation engine planned for future phase. |
| **Institution Service** (`institution-service`) | **Planned / Postponed** | Health skeleton active; public directory & workshop features planned for future phase. |
| **Admin & Analytics Service** (`admin-analytics-service`) | **Planned / Postponed** | Health skeleton active; admin portal APIs planned for future phase. |

---

## Detailed System Breakdown

### 1. Fully Implemented Features
- **User Authentication & Session Management**:
  - `POST /api/v1/auth/register` — Account creation with email, phone, role validation, and password hashing (`bcrypt`).
  - `POST /api/v1/auth/login` — Issues HMAC-SHA256 (`HS256`) Access Tokens (30 min) and Refresh Tokens (7 days).
  - `GET /api/v1/auth/me` — Stateless session user verification.
- **Student Profile Management**:
  - `POST /api/v1/students/profile` — Onboarding data collection tailored for Karnataka Board (Class 8–10) and PUC (Class 11–12 Science, Commerce, Arts).
  - `GET /api/v1/students/profile/me` — Academic profile retrieval with real-time profile completeness metric calculation.
- **Career Pathways Explorer**:
  - `GET /api/v1/roadmaps/pathways` — Dynamic pathway lookup filtered by `education_level` and `stream`.
  - `GET /api/v1/roadmaps/pathways/{id}` — Pathway details with branch options, eligibility badges, and numbered step-by-step milestones.
- **Student Frontend Application**:
  - Global `AuthContext` managing authentication state.
  - Automatic Axios Bearer token header injection via `src/api/client.js`.
  - Responsive desktop 12-column layout & mobile inline panel expansions.

### 2. Partially Implemented Features
- **Assessment Interface**:
  - Frontend UI route (`/assessment`) registered in React Router.
  - Backend API Gateway proxy routes configured (`/api/v1/assessments/*`).

### 3. Planned / Postponed Features
- Self-discovery scoring algorithm & question bank in `assessment-service`.
- AI recommendation LLM integration in `ai-career-service`.
- Public institution directory & workshop enrollment in `institution-service`.
- Aggregated analytics dashboard & audit logs in `admin-analytics-service`.

---

## Technology Stack

- **Frontend**: React 18 (Vite, JavaScript), React Router v6, Tailwind CSS, Axios, Lucide React icons.
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy ORM, `httpx`.
- **Database**: PostgreSQL 15 (Docker container with 7 isolated schemas per microservice boundary).
- **Infrastructure**: Docker & Docker Compose orchestration.

---

## Monorepo Architecture

```text
udaan-ai/
├── frontend/
│   └── web/                   # React 18 + Vite application shell
├── backend/
│   ├── api-gateway/           # Port 8000: Gateway entrypoint & BFF proxy
│   ├── auth-service/          # Port 8001: Authentication & identity management
│   ├── student-service/       # Port 8002: Student profiles & academic preferences
│   ├── assessment-service/    # Port 8003: Self-discovery assessments (Skeleton)
│   ├── ai-career-service/     # Port 8004: Recommendations & AI insights (Skeleton)
│   ├── roadmap-service/       # Port 8005: Career path guidance & milestones
│   ├── institution-service/   # Port 8006: Public institution info & workshops (Skeleton)
│   └── admin-analytics-service/ # Port 8007: Admin portal & analytics engine (Skeleton)
├── shared/
│   ├── contracts/             # Shared API contracts & schemas (Placeholder)
│   └── config/                # Shared constants & configs (Placeholder)
├── infrastructure/
│   ├── postgres/              # Schema setup scripts (init-schemas.sql)
│   └── docker/                # Container configurations
├── docs/                      # Technical documentation & phase reports
│   └── reports/               # Historical phase execution reports
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

---

## Service Port Mapping & Health Endpoints

| Component / Service | Port | Health Endpoint | Swagger Docs |
| ------------------- | ---- | --------------- | ------------ |
| **React Web App** | `5173` | N/A | N/A |
| **API Gateway** | `8000` | `http://localhost:8000/health` | `http://localhost:8000/docs` |
| **Auth Service** | `8001` | `http://localhost:8001/health` | `http://localhost:8001/docs` |
| **Student Service** | `8002` | `http://localhost:8002/health` | `http://localhost:8002/docs` |
| **Assessment Service** | `8003` | `http://localhost:8003/health` | `http://localhost:8003/docs` |
| **AI Career Intelligence Service** | `8004` | `http://localhost:8004/health` | `http://localhost:8004/docs` |
| **Career Roadmap Service** | `8005` | `http://localhost:8005/health` | `http://localhost:8005/docs` |
| **Institution Service** | `8006` | `http://localhost:8006/health` | `http://localhost:8006/docs` |
| **Admin & Analytics Service** | `8007` | `http://localhost:8007/health` | `http://localhost:8007/docs` |
| **PostgreSQL Database** | `5432` | Container health check | N/A |

---

## Prerequisites

- **Node.js**: `v18+` or `v20+`
- **Python**: `3.11+`
- **Docker & Docker Compose**: Installed and running

---

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Run with Docker Compose (Recommended)

Start the entire microservice stack and frontend with a single command:

```bash
docker compose up -d --build
```

Access the applications:
- **Frontend App**: `http://localhost:5173`
- **API Gateway Docs**: `http://localhost:8000/docs`

To view container logs:

```bash
docker compose logs -f
```

To stop all containers:

```bash
docker compose down
```

---

### 3. Run Locally Without Docker

#### Backend Microservices

For each microservice in `backend/<service-name>`:

```bash
cd backend/<service-name>
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port <PORT> --reload
```

#### Frontend

```bash
cd frontend/web
npm install
npm run dev
```

---

## Running Automated Tests

Run unit & health check test suites across microservices:

```bash
# Using Makefile:
make test

# Or using pytest directly:
pytest backend/api-gateway/tests/
pytest backend/auth-service/tests/
pytest backend/student-service/tests/
pytest backend/roadmap-service/tests/
```

