# Udaan AI — AI-Powered Career Development and Future Skills Platform

Udaan AI is an **AI-Powered Career Development and Future Skills Platform for Karnataka students**, primarily supporting Karnataka Board students in Classes 8–10 and PUC students in Classes 11–12.

## Phase 1 Scope & Status

Phase 1 focuses on:
- Monorepo initialization
- 8 microservices technical foundation
- Shared infrastructure & Docker orchestration
- PostgreSQL schema-per-service architecture
- React + Vite web application shell with live API Gateway health connectivity
- Standardized health endpoints and automated testing baseline

*Note: Phase 1 establishes technical infrastructure and connectivity. Full product features (login, assessments, recommendations, AI companion) will be implemented in subsequent phases.*

---

## Technology Stack

- **Frontend**: React (Vite, JavaScript only), React Router, Tailwind CSS, Axios.
- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic (pydantic-settings), SQLAlchemy.
- **Database**: PostgreSQL 15 (Docker container with isolated schemas per microservice).
- **Infrastructure**: Docker & Docker Compose.

---

## Monorepo Architecture

```text
udaan-ai/
├── frontend/
│   └── web/                   # React + Vite application shell
├── backend/
│   ├── api-gateway/           # Port 8000: Gateway entrypoint & BFF
│   ├── auth-service/          # Port 8001: Authentication & identity management
│   ├── student-service/       # Port 8002: Student profiles & preferences
│   ├── assessment-service/    # Port 8003: Self-discovery assessments & scoring
│   ├── ai-career-service/     # Port 8004: Recommendations & AI insights
│   ├── roadmap-service/       # Port 8005: Career path guidance & milestones
│   ├── institution-service/   # Port 8006: Public institution info & workshops
│   └── admin-analytics-service/ # Port 8007: Admin portal & analytics engine
├── shared/
│   ├── contracts/             # Shared API contracts & schemas
│   └── config/                # Shared constants & configs
├── infrastructure/
│   ├── postgres/              # Schema setup scripts
│   └── docker/                # Container configurations
├── docs/                      # Technical documentation
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

Run health check unit tests across all 8 microservices:

```bash
# Using Makefile:
make test

# Or using pytest directly:
pytest backend/api-gateway/tests/
pytest backend/auth-service/tests/
pytest backend/student-service/tests/
pytest backend/assessment-service/tests/
pytest backend/ai-career-service/tests/
pytest backend/roadmap-service/tests/
pytest backend/institution-service/tests/
pytest backend/admin-analytics-service/tests/
```

---

## Phase 1 Limitations

Phase 1 is strictly limited to initial monorepo setup and service connectivity. The following are **out of scope** for Phase 1:
- User registration, authentication, JWT tokens, RBAC.
- Student profile CRUD, onboarding, dashboards.
- Assessment question banks, scoring engines, result generation.
- AI LLM API integrations, recommendation scoring formulas.
- Career path generation, progress tracking, badges.
- Institution partnership workflows, admin dashboards.

Phase 2 will begin feature implementation starting with Authentication and Student Profile services.
