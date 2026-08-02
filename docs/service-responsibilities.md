# Service Responsibilities — Udaan AI

This document details the responsibilities, current Phase 2 implementation, and future scope for each of the 8 microservices.

---

## 1. API Gateway Service (`api-gateway`)

* **Phase 2 Status**: Active Proxy & Entrypoint
* **Current Scope**: Entry point for client requests, reverse proxy routing `/api/v1/auth/*` -> `auth-service` and `/api/v1/students/*` -> `student-service`, root health endpoint (`GET /health`), CORS handling.
* **Future Scope**: Rate limiting, request payload sanitization, response aggregation.
* **Endpoints**: `GET /health`, `/docs`, `ALL /api/v1/auth/*`, `ALL /api/v1/students/*`

---

## 2. Authentication Service (`auth-service`)

* **Phase 2 Status**: Active Service
* **Current Scope**: Student registration (`POST /auth/register`), student login (`POST /auth/login`), JWT access token issuance (30 min), refresh token issuance (7 days), token refresh (`POST /auth/refresh`), stateless logout (`POST /auth/logout`), and session verification (`GET /auth/me`).
* **Database Schema**: `auth` (Table: `users`)
* **Endpoints**: `GET /health`, `/docs`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`

---

## 3. Student Profile Service (`student-service`)

* **Phase 2 Status**: Active Service
* **Current Scope**: Student profile onboarding (`POST /students/profile`), profile retrieval (`GET /students/profile/me`), profile updates (`PUT /students/profile/me`), completion percentage calculation (100%), and JWT token verification.
* **Database Schema**: `student` (Table: `student_profiles`)
* **Endpoints**: `GET /health`, `/docs`, `POST /students/profile`, `GET /students/profile/me`, `PUT /students/profile/me`

---

## 4. Assessment Service (`assessment-service`)

* **Phase 2 Status**: Phase 1 Health Skeleton (Unchanged)
* **Future Scope**: Question bank management, student response collection, interest/skill/personality scoring.
* **Database Schema**: `assessment`
* **Endpoints**: `GET /health`, `/docs`

---

## 5. AI Career Intelligence Service (`ai-career-service`)

* **Phase 2 Status**: Phase 1 Health Skeleton (Unchanged)
* **Future Scope**: AI career recommendation logic, compatibility scoring rules, skill gap analysis, LLM context integration.
* **Database Schema**: `career_ai`
* **Endpoints**: `GET /health`, `/docs`

---

## 6. Career Roadmap Service (`roadmap-service`)

* **Phase 2 Status**: Phase 1 Health Skeleton (Unchanged)
* **Future Scope**: "Your Path After Class 10" interactive explorer backend, career milestone tracking, goals, certifications.
* **Database Schema**: `roadmap`
* **Endpoints**: `GET /health`, `/docs`

---

## 7. Institution Service (`institution-service`)

* **Phase 2 Status**: Phase 1 Health Skeleton (Unchanged)
* **Future Scope**: Public institution directory info, workshop management, workshop registration & tracking.
* **Database Schema**: `institution`
* **Endpoints**: `GET /health`, `/docs`

---

## 8. Admin and Analytics Service (`admin-analytics-service`)

* **Phase 2 Status**: Phase 1 Health Skeleton (Unchanged)
* **Future Scope**: Admin portal APIs, platform analytics aggregation, reporting, activity audit logs.
* **Database Schema**: `admin_analytics`
* **Endpoints**: `GET /health`, `/docs`
