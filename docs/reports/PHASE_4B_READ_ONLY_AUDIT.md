# Udaan AI — Phase 4B Read-Only Audit & Implementation Plan

**Document Title**: `PHASE_4B_READ_ONLY_AUDIT.md`  
**Audit Type**: Read-Only Codebase, Infrastructure & Pathway Architecture Audit  
**Target System**: Udaan AI Platform (`roadmap-service`, `api-gateway`, `frontend/web`, `postgres`)  
**Workspace**: `c:\Users\abulm\OneDrive\DCL\UdaanAI`  
**Execution Date**: August 4, 2026  

---

## 1. Executive Summary

Following the successful completion and verification of **Phase 4A (Core Integration, Database Migrations, Auth Stability, Academic Field Normalization, and The Udaan Trail Dashboard)**, this audit evaluates the codebase to establish the technical foundation for **Phase 4B: Career Roadmap Foundation**.

### Core Product Decision & Boundaries
Per explicit product requirements:
- **Zero AI / LLM Integration**: AI prompts, OpenAI APIs, AI assessment interpretation, AI career chat, and fake AI compatibility scores remain strictly excluded from Phase 4B.
- **Focus**: Build a real, database-backed, structured career and education pathway exploration engine connected end-to-end from PostgreSQL through `roadmap-service`, `api-gateway`, and the React frontend.
- **Audit Mode**: This document is a **100% read-only audit**. No source code, configuration files, Docker containers, database tables, or git commits were modified during this inspection.

---

## 2. Current Roadmap Implementation Inventory

| Asset | Location | Current State | Audit Finding |
| :--- | :--- | :---: | :--- |
| **Roadmap Microservice** | `backend/roadmap-service` | Skeleton Placeholder | FastAPI app shell running on Port `8005`. Only exposes `GET /health`. |
| **Roadmap DB Schema** | PostgreSQL `udaan_ai` | Schema Created (`roadmap`) | Isolated schema created via `init-schemas.sql`. Zero tables exist in `roadmap` schema. |
| **API Gateway Proxy** | `backend/api-gateway` | Missing Proxy Routes | Gateway routes `/auth/*` and `/students/*`, but lacks proxy routes for `/roadmap/*`. |
| **Frontend Page / Routes**| `frontend/web/src/pages` | UI Placeholder Only | Sidebar items and dashboard cards trigger a "Coming Next in Phase 4B" modal popup. |
| **API Client Functions** | `frontend/web/src/api/client.js` | Unconnected | No roadmap-related API methods exist in Axios client. |
| **Automated Tests** | `backend/roadmap-service/tests` | Health Test Only | `test_roadmap_health.py` tests `GET /health`. Zero domain tests exist. |

---

## 3. Roadmap Service Audit (`backend/roadmap-service/`)

### File & Code Inventory

1. **`app/main.py`**:
   - Initializes FastAPI app (`title="Udaan AI - Career Roadmap Service"`, `version="0.1.0"`).
   - Only includes `health_router` (`GET /health`).
   - Does not import or bind SQLAlchemy models (`Base.metadata.create_all()` is absent).
2. **`app/models/`**:
   - `__init__.py` is empty (0 bytes). No SQLAlchemy ORM models exist.
3. **`app/schemas/`**:
   - `__init__.py` is empty (0 bytes). No Pydantic request/response schemas exist.
4. **`app/services/`**:
   - `__init__.py` is empty (0 bytes). No business logic or database repositories exist.
5. **`app/api/routes/`**:
   - Contains only `health.py` returning `{"status": "healthy", "service": "roadmap-service"}`.
6. **`requirements.txt`**:
   - Contains `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `psycopg2-binary`, `httpx`, `pytest`.
   - **Missing**: `alembic` is not listed in `requirements.txt`.
7. **Alembic Status**:
   - No `alembic.ini`, `alembic/` directory, or migration scripts exist in `backend/roadmap-service`.

---

## 4. API Gateway Audit (`backend/api-gateway/`)

### Code Findings & Routing Gaps

1. **`app/core/config.py`**:
   - `Settings` class declares `AUTH_SERVICE_URL: str = "http://localhost:8001"` and `STUDENT_SERVICE_URL: str = "http://localhost:8002"`.
   - **Missing**: `ROADMAP_SERVICE_URL` is declared in `docker-compose.yml` (`http://roadmap-service:8005`), but is **not** present in `app/core/config.py`.
2. **`app/api/routes/proxy.py`**:
   - Defines proxy handlers for `/auth/*` and `/students/*`.
   - **Missing**: No proxy routes exist for `/roadmap/*`.
3. **Expected Gateway Naming Convention**:
   - Based on existing proxy routes, Phase 4B must add:
     ```python
     async def _proxy_roadmap(path: str, request: Request) -> Response:
         target_url = f"{settings.ROADMAP_SERVICE_URL.rstrip('/')}/roadmap/{path}"
         return await forward_request(target_url, request)

     @router.get("/roadmap/{path:path}", operation_id="proxy_roadmap_get")
     ...
     ```

---

## 5. Frontend Audit (`frontend/web/src/`)

### Code Findings & UI Touchpoints

1. **Routes (`AppRoutes.jsx`)**:
   - Routes `/`, `/register`, `/login`, `/onboarding`, `/dashboard` exist.
   - **Missing**: No `/pathways` or `/roadmap` route exists in `AppRoutes.jsx`.
2. **Sidebar Navigation (`Sidebar.jsx`)**:
   - Nav items `"Explore Pathways"` and `"Roadmap & Options"` trigger `handleNavClick` which displays a "Coming Next in Phase 4B" modal popup.
3. **Dashboard Hero & Milestones (`UdaanTrailHero.jsx` & `UdaanTrailMilestones.jsx`)**:
   - `"Explore Pathways"` button triggers the modal popup.
   - "THE UDAAN TRAIL" 6-stage milestone bar displays stage 3 (*Explore Possibilities: Discover SSLC, PUC Streams, Diploma & ITI trades*).
4. **Dashboard Placeholder Cards (`DashboardPage.jsx`)**:
   - Includes a card titled *"Personalized Pathway Map"* with text *"Detailed step-by-step post-Class 10 or PUC action plans will generate upon roadmap service connection"*.
5. **API Client (`api/client.js`)**:
   - Axios client has methods for Auth and Student APIs, but zero methods calling `/api/v1/roadmap/*`.

---

## 6. Database and Infrastructure Audit

### Environment & Schema Setup

1. **`docker-compose.yml`**:
   - Container `udaan-roadmap-service` configured on Port `8005:8005`.
   - Environment variables set: `DATABASE_URL=postgresql://udaan_user:change_me_in_dev@postgres:5432/udaan_ai`, `DB_SCHEMA=roadmap`.
   - Healthcheck: `depends_on: postgres: condition: service_healthy`.
2. **PostgreSQL Initialization (`infrastructure/postgres/init-schemas.sql`)**:
   - Schema `CREATE SCHEMA IF NOT EXISTS roadmap;` is executed on initial DB setup.
   - **Current DB State**: Schema `roadmap` exists inside `udaan_ai` database, but contains 0 tables.

---

## 7. Existing Functionality Matrix

| Feature Component | Roadmap Service | API Gateway | Frontend Web | Database | Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Health Check (`GET /health`)** | Implemented | N/A | Implemented (Home) | N/A | Fully Implemented |
| **Pathway Explorer UI Page** | None | None | Modal Placeholder | None | Placeholder / Skeleton |
| **Profile-Aware Pathway Filtering** | None | None | None | None | Not Implemented |
| **Post-SSLC Options (PUC/Diploma/ITI)**| None | None | Static UI Text | None | Not Implemented |
| **Post-PUC Science Options** | None | None | Static UI Text | None | Not Implemented |
| **Post-PUC Commerce Options** | None | None | Static UI Text | None | Not Implemented |
| **Post-PUC Arts Options** | None | None | Static UI Text | None | Not Implemented |
| **Roadmap Milestone Action Steps** | None | None | Static UI Text | None | Not Implemented |
| **Saved Pathway Bookmarks** | None | None | Modal Placeholder | None | Not Implemented |

---

## 8. Missing Functionality Matrix

| Component | Missing Requirement | Required Action in Phase 4B |
| :--- | :--- | :--- |
| **`roadmap-service` Models** | No SQLAlchemy ORM models in `app/models/` | Create `Pathway`, `PathwayOption`, `PathwayMilestone` models in schema `roadmap`. |
| **`roadmap-service` Schemas**| No Pydantic schemas in `app/schemas/` | Create `PathwayResponse`, `PathwayOptionResponse`, `PathwayDetailResponse`. |
| **`roadmap-service` Seed Data**| Database schema `roadmap` has 0 tables/rows | Create database seeding script for Karnataka SSLC & PUC options. |
| **`roadmap-service` Routes** | `app/api/routes/roadmap.py` missing | Implement `GET /roadmap/pathways` and `GET /roadmap/pathways/{id}`. |
| **`roadmap-service` Alembic** | No Alembic migration setup | Add `alembic.ini` and initial migration `001_initial_roadmap_tables.py`. |
| **API Gateway Proxy** | `/api/v1/roadmap/*` missing from `proxy.py` | Declare proxy routes and add `ROADMAP_SERVICE_URL` to `config.py`. |
| **Frontend Route & Page** | `/pathways` route missing in `AppRoutes.jsx` | Create `PathwaysPage.jsx` and connect `api/client.js`. |

---

## 9. Integration Gaps and Technical Risks

1. **Academic Level String Inconsistency Risk**:
   - In Phase 4A, backend `StudentService` normalized `current_level` values strictly to:
     `"Class 8"`, `"Class 9"`, `"Class 10"`, `"PUC 1"`, `"PUC 2"`, `"Diploma"`, `"ITI"`.
   - **Risk**: If `roadmap-service` queries use non-standard strings like `"10"` or `"10th Standard"`, profile-aware filtering will fail.
   - **Fix**: `roadmap-service` query filters must strictly map against normalized level strings.
2. **API Gateway URL Config Gap**:
   - `app/core/config.py` in API Gateway currently lacks `ROADMAP_SERVICE_URL`. Without adding this setting, the Gateway cannot forward requests to `http://roadmap-service:8005`.
3. **Authentication Forwarding Requirement**:
   - The Pathway Explorer can be publicly readable (`GET /api/v1/roadmap/pathways`), but profile-aware endpoints (`GET /api/v1/roadmap/pathways/me`) require decoding the student's JWT token forwarded by the Gateway.
4. **Service Schema Isolation**:
   - `roadmap-service` must strictly operate inside PostgreSQL schema `roadmap` and must not attempt cross-schema joins to `student.student_profiles` directly in SQL. Frontend/Gateway should pass profile attributes (`current_level`, `stream`) as query parameters.

---

## 10. Recommended Minimal Phase 4B Scope

To create a complete, useful, and demonstrable feature without overengineering:

1. **Database-Backed Pathway Knowledge Base**:
   - Create 3 normalized SQLAlchemy models in `roadmap-service` under schema `roadmap`:
     - `roadmap.pathways` (Category/Level container e.g., Post-Class 10, Post-PUC Science, Post-PUC Commerce, Post-PUC Arts).
     - `roadmap.pathway_options` (Specific education branch e.g., Science PUC, Computer Science Diploma, Electrician ITI).
     - `roadmap.pathway_milestones` (Action steps e.g., Entrance exams, polytechnic admission, key subjects).
   - Seed database with real Karnataka SSLC and PUC education pathways.
2. **Roadmap Microservice API**:
   - `GET /roadmap/pathways` (Filterable by `education_level` & `stream`).
   - `GET /roadmap/pathways/{id}` (Retrieve detailed pathway timeline and milestones).
3. **API Gateway Integration**:
   - Add `ROADMAP_SERVICE_URL` to `config.py`.
   - Forward `/api/v1/roadmap/*` to `roadmap-service:8005/roadmap/*`.
4. **Frontend Pathway Explorer Page**:
   - Create `PathwaysPage.jsx` (`/pathways`).
   - Auto-filter pathways based on the student's authenticated `current_level` and `stream`.
   - Render interactive pathway timelines using "THE UDAAN TRAIL" design system (`#005F60` Deep Teal, `#F97316` Warm Orange, `#F8FAF8` Background).
5. **Testing**:
   - Unit tests for `roadmap-service` API endpoints and database queries.
   - Vite production build check.

---

## 11. Proposed User Flow (Phase 4B)

```text
Student Logs In → DashboardPage.jsx (/dashboard)
       │
       ├────────────────────────────────────────┐
       │ Clicks "Explore Pathways" CTA           │ Auto-detects profile level (e.g. Class 10 or PUC 2 Science)
       ▼                                        ▼
PathwaysPage.jsx (/pathways) ◄──────────────────┘
       │
       │ API Client fetch: GET /api/v1/roadmap/pathways?level=Class%2010
       ▼
API Gateway (Port 8000)
       │ (Proxy route: /api/v1/roadmap/*)
       ▼
Roadmap Service (Port 8005)
       │ (Query schema: roadmap.pathways & roadmap.pathway_options)
       ▼
PostgreSQL Database (`udaan_ai` -> schema `roadmap`)
       │
       ▼ Returns JSON Pathway Options
Renders Interactive "Udaan Trail Pathway Explorer" on Frontend
 (PUC Science/Commerce/Arts, Polytechnic Diploma, ITI Trades with Milestones & Action Steps)
```

---

## 12. Proposed API Contract

### 1. List Pathways (Filtered by Education Level & Stream)
- **Endpoint**: `GET /api/v1/roadmap/pathways`
- **Query Parameters**:
  - `education_level` (optional, str) — e.g. `"Class 10"`, `"PUC 2"`
  - `stream` (optional, str) — e.g. `"Science"`, `"Commerce"`, `"Arts"`
- **Response (`200 OK`)**:
  ```json
  {
    "education_level": "Class 10",
    "total_options": 4,
    "pathways": [
      {
        "id": "c10-puc",
        "title": "Pre-University College (PUC)",
        "category": "Pre-University",
        "duration": "2 Years",
        "description": "11th and 12th standard education under Karnataka State Pre-University Board.",
        "options": [
          { "name": "Science Stream", "code": "PCMB / PCMC", "desc": "Prepares for Engineering, Medicine, & Pure Sciences." },
          { "name": "Commerce Stream", "code": "CEBA / SEBA", "desc": "Prepares for Finance, CA, Business Admin, & Banking." },
          { "name": "Arts Stream", "code": "HEPS / EGAS", "desc": "Prepares for Humanities, Law, Civil Services, & Design." }
        ]
      },
      {
        "id": "c10-diploma",
        "title": "Polytechnic Diploma",
        "category": "Technical",
        "duration": "3 Years",
        "description": "Practical engineering diploma under DTE Karnataka leading to lateral entry BE/B.Tech.",
        "options": [
          { "name": "Computer Science & Engineering", "code": "CS", "desc": "Software development, networking, and IT skills." },
          { "name": "Mechanical Engineering", "code": "ME", "desc": "Manufacturing, automotive, and machine design." }
        ]
      },
      {
        "id": "c10-iti",
        "title": "Industrial Training Institute (ITI)",
        "category": "Vocational",
        "duration": "1-2 Years",
        "description": "Vocational trade training under DET Karnataka for immediate technical job entry.",
        "options": [
          { "name": "Electrician", "code": "ELEC", "desc": "Electrical wiring, industrial installation, & maintenance." },
          { "name": "Fitter", "code": "FIT", "desc": "Precision assembly, machining, and plant maintenance." }
        ]
      }
    ]
  }
  ```

### 2. Get Pathway Details & Milestones
- **Endpoint**: `GET /api/v1/roadmap/pathways/{pathway_id}`
- **Response (`200 OK`)**:
  ```json
  {
    "id": "c10-puc",
    "title": "Pre-University College (PUC)",
    "milestones": [
      { "step": 1, "title": "SSLC Exam Completion", "desc": "Achieve qualifying score in Class 10 State Board exams." },
      { "step": 2, "title": "Stream Selection", "desc": "Choose Science, Commerce, or Arts based on career interest." },
      { "step": 3, "title": "PUC College Admission", "desc": "Apply via SATS / Karnataka PU department admission rounds." },
      { "step": 4, "title": "Target Competitive Exams", "desc": "Prepare for KCET, NEET, JEE, or CPT depending on chosen stream." }
    ]
  }
  ```

---

## 13. Proposed Database Model (`schema="roadmap"`)

```text
┌─────────────────────────────────────────────────────────┐
│                    roadmap.pathways                     │
├─────────────────────────────────────────────────────────┤
│ id (VARCHAR(50) PK)                                     │
│ education_level (VARCHAR(50) INDEX)                     │ -- 'Class 10', 'PUC 2', etc.
│ title (VARCHAR(150))                                    │ -- e.g. 'Polytechnic Diploma'
│ category (VARCHAR(50))                                  │ -- 'Technical', 'Pre-University'
│ duration (VARCHAR(50))                                  │ -- '3 Years'
│ description (TEXT)                                      │
│ created_at (TIMESTAMP)                                  │
└───────────────────────────┬─────────────────────────────┘
                            │ 1 : N
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 roadmap.pathway_options                 │
├─────────────────────────────────────────────────────────┤
│ id (UUID PK)                                            │
│ pathway_id (VARCHAR(50) FK -> roadmap.pathways.id)      │
│ option_name (VARCHAR(150))                              │ -- 'Computer Science & Eng'
│ stream_or_code (VARCHAR(50))                            │ -- 'CS', 'PCMC', 'CEBA'
│ description (TEXT)                                      │
│ eligibility (VARCHAR(255))                              │
└───────────────────────────┬─────────────────────────────┘
                            │ 1 : N
                            ▼
┌─────────────────────────────────────────────────────────┐
│               roadmap.pathway_milestones                │
├─────────────────────────────────────────────────────────┤
│ id (UUID PK)                                            │
│ pathway_id (VARCHAR(50) FK -> roadmap.pathways.id)      │
│ step_number (INTEGER)                                   │ -- 1, 2, 3, 4
│ title (VARCHAR(150))                                    │ -- 'SSLC Exam Completion'
│ description (TEXT)                                      │
│ key_action (VARCHAR(255))                               │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Recommended Implementation Order (Phase 4B)

1. **Step 1: Database Models & Seeding in `roadmap-service`**:
   - Define SQLAlchemy models in `backend/roadmap-service/app/models/roadmap.py` under schema `roadmap`.
   - Add Alembic setup to `backend/roadmap-service`.
   - Write seed script `backend/roadmap-service/app/db/seed_pathways.py` with real Karnataka education data.
2. **Step 2: Pydantic Schemas & Service Logic**:
   - Define Pydantic response models in `app/schemas/roadmap.py`.
   - Implement `RoadmapService` query methods in `app/services/roadmap_service.py`.
3. **Step 3: FastAPI Routes in `roadmap-service`**:
   - Create `app/api/routes/roadmap.py` (`GET /roadmap/pathways`, `GET /roadmap/pathways/{id}`).
   - Include router in `app/main.py`.
4. **Step 4: API Gateway Configuration**:
   - Add `ROADMAP_SERVICE_URL` to `backend/api-gateway/app/core/config.py`.
   - Add `_proxy_roadmap` handlers in `backend/api-gateway/app/api/routes/proxy.py`.
5. **Step 5: Frontend Page & Navigation (`frontend/web`)**:
   - Add `getPathwaysApi` to `frontend/web/src/api/client.js`.
   - Create `PathwaysPage.jsx` (`/pathways`).
   - Add `/pathways` route to `AppRoutes.jsx`.
   - Connect Sidebar and Dashboard CTAs to navigate directly to `/pathways`.
6. **Step 6: Automated Testing & Build Verification**:
   - Write Pytest suite `test_roadmap_api.py`.
   - Run `python -m pytest backend/` and `npm run build`.

---

## 15. Test and Verification Plan

### 1. Backend Automated Unit & API Tests
- `test_roadmap_health`: Verify `GET /health` on Port 8005.
- `test_get_pathways_by_level`: Verify `GET /roadmap/pathways?education_level=Class%2010` returns SSLC options (PUC, Diploma, ITI).
- `test_get_pathways_for_puc_science`: Verify `GET /roadmap/pathways?education_level=PUC%202&stream=Science` returns Engineering, Medicine, Computer Applications options.
- `test_get_pathway_detail_milestones`: Verify `GET /roadmap/pathways/c10-puc` returns ordered 4-step milestone trail.

### 2. API Gateway Proxy Verification
- Verify Gateway forwards `http://localhost:8000/api/v1/roadmap/pathways` to `roadmap-service:8005/roadmap/pathways`.

### 3. Frontend Build & E2E Verification
- Execute `npm run build` in `frontend/web/`.
- Verify student login -> Dashboard -> click "Explore Pathways" -> Navigates to `/pathways` -> Displays profile-aware pathway options based on real DB profile.

---

## 16. Explicit List of Files Likely to be Modified in Phase 4B Implementation

### Backend (`backend/roadmap-service` & `backend/api-gateway`)
- `backend/roadmap-service/requirements.txt`
- `backend/roadmap-service/app/main.py`
- `backend/roadmap-service/app/models/roadmap.py` *(New)*
- `backend/roadmap-service/app/schemas/roadmap.py` *(New)*
- `backend/roadmap-service/app/services/roadmap_service.py` *(New)*
- `backend/roadmap-service/app/api/routes/roadmap.py` *(New)*
- `backend/roadmap-service/app/db/seed_pathways.py` *(New)*
- `backend/roadmap-service/alembic.ini` *(New)*
- `backend/roadmap-service/alembic/` *(New)*
- `backend/roadmap-service/tests/test_roadmap_api.py` *(New)*
- `backend/api-gateway/app/core/config.py`
- `backend/api-gateway/app/api/routes/proxy.py`

### Frontend (`frontend/web`)
- `frontend/web/src/api/client.js`
- `frontend/web/src/routes/AppRoutes.jsx`
- `frontend/web/src/components/Sidebar.jsx`
- `frontend/web/src/pages/DashboardPage.jsx`
- `frontend/web/src/pages/PathwaysPage.jsx` *(New)*

---

## 17. Explicit List of Files That Must NOT be Changed During This Audit

To preserve working Phase 4A functionality:
- `backend/auth-service/` (All files)
- `backend/student-service/` (All files)
- `backend/assessment-service/` (All files)
- `backend/ai-career-service/` (All files)
- `backend/institution-service/` (All files)
- `backend/admin-analytics-service/` (All files)
- `infrastructure/postgres/init-schemas.sql`
- `docker-compose.yml`
- `frontend/web/src/pages/LoginPage.jsx`
- `frontend/web/src/pages/RegisterPage.jsx`
- `frontend/web/src/pages/OnboardingPage.jsx`
- `frontend/web/src/context/AuthContext.jsx`
- `frontend/web/src/components/ProtectedRoute.jsx`
- `frontend/web/src/components/PublicOnlyRoute.jsx`
