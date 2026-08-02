# Phase 2 — Authentication & Student Profile Foundation

This document details the architecture, database models, API contracts, token lifecycle, gateway proxy routing, and testing strategy for **Phase 2 of Udaan AI**.

---

## 1. Overview & Service Scope

Phase 2 implements the first complete student journey:
**Student Registration → Student Login → Authenticated Session → Student Profile Onboarding → Protected Student Dashboard Shell → Logout.**

### Microservice Ownership Matrix:
- **`auth-service`** (Active): Owns credentials, user identities, roles (`student`, `admin`), password hashing (bcrypt), and JWT access/refresh token issuance. Schema: `auth`.
- **`student-service`** (Active): Owns student profile data (Class, Board, Institution, District). Validates JWT tokens using shared secret without issuing tokens or duplicating credential tables. Schema: `student`.
- **`api-gateway`** (Active): Exposes `/api/v1/auth/*` and `/api/v1/students/*`, forwarding request bodies and `Authorization` headers cleanly to target microservices.
- **Remaining 5 Microservices**: Remain Phase 1 skeletons (`assessment-service`, `ai-career-service`, `roadmap-service`, `institution-service`, `admin-analytics-service`).

---

## 2. Authentication & Token Lifecycle

1. **Token Issuance**: `auth-service` issues short-lived JWT Access Tokens (30 min) and Refresh Tokens (7 days) signed with `JWT_SECRET_KEY` using algorithm `HS256`.
2. **Access Token Claims**:
   - `sub`: User ID (UUID string)
   - `email`: User Email
   - `role`: Role (`student` or `admin`)
   - `type`: Token type (`"access"` or `"refresh"`)
   - `iat` / `exp`: Issued at / Expiration timestamps
3. **Stateless Logout**:
   - `POST /auth/logout` requires a Bearer access token and returns HTTP 200 confirming token discard.
   - Client discards access and refresh tokens from `localStorage` / memory.

---

## 3. Database Schemas

### `auth` Schema (`auth.users`)
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) (UNIQUE, NOT NULL)
- `hashed_password`: VARCHAR(255) (NOT NULL)
- `full_name`: VARCHAR(255) (NOT NULL)
- `role`: VARCHAR(50) (NOT NULL, default `'student'`)
- `is_active`: BOOLEAN (NOT NULL, default `TRUE`)
- `created_at` / `updated_at`: TIMESTAMP WITH TIME ZONE

### `student` Schema (`student.student_profiles`)
- `id`: UUID (Primary Key)
- `user_id`: UUID (UNIQUE, NOT NULL, Index)
- `full_name`: VARCHAR(255) (NOT NULL)
- `current_level`: VARCHAR(100) (NOT NULL) — e.g. "Class 10"
- `class_or_year`: VARCHAR(50) (NOT NULL) — e.g. "10th Standard"
- `board`: VARCHAR(150) (NOT NULL) — e.g. "Karnataka State Board (SSLC)"
- `institution_name`: VARCHAR(255) (NOT NULL)
- `district`: VARCHAR(150) (NOT NULL) — Karnataka District
- `state`: VARCHAR(100) (NOT NULL, default `'Karnataka'`)
- `preferred_language`: VARCHAR(50) (NULLABLE)
- `is_complete`: BOOLEAN (NOT NULL, default `FALSE`)
- `completion_percentage`: INTEGER (NOT NULL, default `0`)
- `created_at` / `updated_at`: TIMESTAMP WITH TIME ZONE

---

## 4. API Endpoints (via Gateway `/api/v1`)

### Auth API (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Register new student (`full_name`, `email`, `password`, `confirm_password`).
- `POST /api/v1/auth/login`: Authenticate student (`email`, `password`). Returns `{ access_token, refresh_token, user }`.
- `POST /api/v1/auth/refresh`: Exchange refresh token for new access token.
- `POST /api/v1/auth/logout`: Discard session.
- `GET /api/v1/auth/me`: Get current authenticated user details.

### Student API (`/api/v1/students`)
- `POST /api/v1/students/profile`: Create/initialize student academic profile.
- `GET /api/v1/students/profile/me`: Get current authenticated student's profile.
- `PUT /api/v1/students/profile/me`: Update student profile.

---

## 5. Testing & Verification

Run all unit tests across the 8 microservices:
```powershell
python -m pytest backend/
```

Run frontend production build:
```powershell
cd frontend/web
npm run build
```
