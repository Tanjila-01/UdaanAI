# Service Responsibilities — Udaan AI

This document details the responsibilities, current Phase 1 implementation, and future scope for each of the 8 microservices.

---

## 1. API Gateway Service (`api-gateway`)

* **Phase 1 Scope**: Entry point for client requests, root health endpoint (`GET /health`), CORS handling.
* **Future Scope**: Request forwarding/proxying, JWT verification, rate limiting, logging.
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 2. Authentication Service (`auth-service`)

* **Phase 1 Scope**: Service skeleton, configuration, health endpoint (`GET /health`).
* **Future Scope**: Student & admin registration, login, JWT token issuance & refresh, password hashing, RBAC.
* **Database Schema**: `auth`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 3. Student Profile Service (`student-service`)

* **Phase 1 Scope**: Service skeleton, DB connection configuration, health endpoint (`GET /health`).
* **Future Scope**: Student profile CRUD, academic details (Class 8–12 / SSLC / PUC), board/school info, saved preferences.
* **Database Schema**: `student`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 4. Assessment Service (`assessment-service`)

* **Phase 1 Scope**: Service skeleton, health endpoint (`GET /health`).
* **Future Scope**: Question bank management, student response collection, interest/skill/personality scoring.
* **Database Schema**: `assessment`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 5. AI Career Intelligence Service (`ai-career-service`)

* **Phase 1 Scope**: Service skeleton, AI provider config placeholder, health endpoint (`GET /health`).
* **Future Scope**: AI career recommendation logic, compatibility scoring rules, skill gap analysis, LLM context integration.
* **Database Schema**: `career_ai`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 6. Career Roadmap Service (`roadmap-service`)

* **Phase 1 Scope**: Service skeleton, health endpoint (`GET /health`).
* **Future Scope**: "Your Path After Class 10" interactive explorer backend, career milestone tracking, goals, certifications.
* **Database Schema**: `roadmap`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 7. Institution Service (`institution-service`)

* **Phase 1 Scope**: Service skeleton, health endpoint (`GET /health`).
* **Future Scope**: Public institution directory info, workshop management, workshop registration & tracking.
* **Database Schema**: `institution`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`

---

## 8. Admin and Analytics Service (`admin-analytics-service`)

* **Phase 1 Scope**: Service skeleton, health endpoint (`GET /health`).
* **Future Scope**: Admin portal APIs, platform analytics aggregation, reporting, activity audit logs.
* **Database Schema**: `admin_analytics`
* **Endpoints (Phase 1)**: `GET /health`, `/docs`
