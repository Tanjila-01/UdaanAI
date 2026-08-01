# Phase 1 Setup & Development Guide — Udaan AI

This guide walks through setting up, running, testing, and troubleshooting the Udaan AI Phase 1 monorepo on both Windows (PowerShell) and Linux/macOS environments.

---

## 1. Environment Preparation

1. Ensure Docker Desktop is installed and running (if using Docker Compose).
2. Clone or locate the repository root: `c:\Users\abulm\OneDrive\DCL\UdaanAI`.
3. Create your local environment file:

### On Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

### On Linux / macOS (Bash):
```bash
cp .env.example .env
```

---

## 2. Running with Docker Compose

Launch all 10 containers (PostgreSQL, 8 Microservices, React Frontend):

```bash
docker compose up -d --build
```

### Validate Docker Configuration:
```bash
docker compose config
```

### Check Container Status:
```bash
docker compose ps
```

### View Logs:
```bash
docker compose logs -f --tail=100
```

All 10 services (`udaan-postgres`, `udaan-api-gateway`, `udaan-auth-service`, `udaan-student-service`, `udaan-assessment-service`, `udaan-ai-career-service`, `udaan-roadmap-service`, `udaan-institution-service`, `udaan-admin-analytics-service`, `udaan-frontend`) should display `Up`.

---

## 3. Running Locally Without Docker

### Frontend (`frontend/web`)
```powershell
# In PowerShell or Bash:
cd frontend/web
npm install
npm run dev
```

Access the React Frontend shell at `http://localhost:5173`.

### Backend Microservices
Run each service in a separate terminal window:

#### Windows (PowerShell):
```powershell
cd backend\<service-name>
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port <PORT> --reload
```

#### Linux / macOS (Bash):
```bash
cd backend/<service-name>
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port <PORT> --reload
```

---

## 4. Running Health Tests

To execute unit health tests across all 8 microservices:

```powershell
# Using Python module runner (Recommended on Windows/Linux):
python -m pytest backend/

# Or via Makefile (if make is installed):
make test
```

---

## 5. Troubleshooting & Networking Rules

- **Browser vs Docker Networking**:
  - The React frontend code runs in the user's web browser and connects to `http://localhost:8000`. Do NOT configure browser API calls to `http://api-gateway:8000`.
  - Docker service names (`postgres`, `auth-service`, etc.) are only accessible internally between backend containers inside the Docker network.
- **Port Conflict**: If port `8000` or `5432` is already in use, update `.env` and `docker-compose.yml` accordingly.
- **PostgreSQL Connection**: Phase 1 `/health` endpoints do not block on PostgreSQL startup.
