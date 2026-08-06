# Udaan AI — Phase 4B Step 2: Seed Data, Schemas & Roadmap Service Report

**Document Title**: `PHASE_4B_STEP_2_SEED_SCHEMAS_SERVICE_REPORT.md`  
**Phase**: Phase 4B — Step 2: Karnataka Seed Data, Pydantic Schemas & Service Query Logic  
**Target Microservice**: `roadmap-service` (`backend/roadmap-service/`)  
**Workspace**: `c:\Users\abulm\OneDrive\DCL\UdaanAI`  
**Execution Date**: August 4, 2026  

---

## 1. Executive Summary

Phase 4B Step 2 has been completed successfully. We have added comprehensive, realistic Karnataka education pathway seed data, created Pydantic v2 schemas for response serialization, and implemented the core `RoadmapService` query layer with efficient relationship eager loading (`selectinload`).

All implementations remain 100% strictly contained within `backend/roadmap-service/`. No gateway, frontend, Docker Compose, or unrelated microservice files were modified.

---

## 2. Seed Dataset & Idempotency Strategy

### Karnataka Education Pathways Seeded (`app/db/seed_pathways.py`)
6 comprehensive Karnataka post-SSLC and post-PUC pathways were added:

1. **`c10-puc`**: Pre-University College (PUC) — 3 Options (*Science PCMB/PCMC, Commerce CEBA/SEBA, Arts HEPS/EGAS*), 3 Milestones.
2. **`c10-diploma`**: Polytechnic Diploma Engineering — 3 Options (*Computer Science, Mechanical/Civil, Electronics & Communication*), 3 Milestones.
3. **`c10-iti`**: Industrial Training Institute (ITI) Trade — 3 Options (*Electrician, Fitter/Turner, COPA*), 3 Milestones.
4. **`puc-science-eng`**: Engineering & Technology Degrees (B.E / B.Tech) — 3 Options (*CS/AI, ECE, Mechanical/Civil*), 3 Milestones.
5. **`puc-commerce-fin`**: Commerce, Accounting & Business Management — 3 Options (*B.Com, CA/CS, BBA*), 3 Milestones.
6. **`puc-arts-hum`**: Humanities, Law, Media & Civil Services — 3 Options (*BA LL.B, BA Journalism, BA Political Science Civil Track*), 3 Milestones.

**Total Seed Count**: 6 Pathways, 18 Pathway Options, 18 Pathway Milestones.

### Idempotency Strategy
- `RoadmapService.seed_initial_data(db)` checks for existing `Pathway` records by `id`.
- If a pathway exists, top-level attributes, options, and milestones are updated in-place without generating duplicate primary key or unique constraint violations.
- Running the seed process multiple times results in the exact same clean count (6 pathways).

---

## 3. Pydantic Schemas (`app/schemas/pathway.py`)

Created Pydantic v2 response and request schemas with `model_config = ConfigDict(from_attributes=True)`:

- **`PathwayOptionResponse`**: Serializes `id`, `pathway_id`, `option_name`, `stream_or_code`, `description`, `eligibility`, `display_order`.
- **`PathwayMilestoneResponse`**: Serializes `id`, `pathway_id`, `step_number`, `title`, `description`, `key_action`.
- **`PathwaySummaryResponse`**: Serializes top-level pathway attributes without heavy nested arrays.
- **`PathwayDetailResponse`**: Serializes full pathway object containing nested `options: List[PathwayOptionResponse]` and `milestones: List[PathwayMilestoneResponse]`.
- **`PathwayListResponse`**: Container schema returning total count, active filter parameters, and `pathways: List[PathwayDetailResponse]`.

---

## 4. Roadmap Query & Service Logic (`app/services/roadmap_service.py`)

Implemented clean service methods in `RoadmapService`:

1. **`get_pathways(db, education_level=None, stream=None)`**:
   - Executes `selectinload(Pathway.options)` and `selectinload(Pathway.milestones)` to eagerly fetch child options and milestones in 2 queries, eliminating N+1 performance bottlenecks.
   - Filters by `education_level` (maps `"Class 8"` and `"Class 9"` to include post-SSLC choices).
   - Filters by `stream` (e.g., `"Science"`, `"Commerce"`, `"Arts"`).
2. **`get_pathway_by_id(db, pathway_id)`**:
   - Retrieves a single `Pathway` by ID with options and milestones loaded. Returns `None` if not found.
3. **`seed_initial_data(db)`**:
   - Idempotently populates the database with initial pathway data.

---

## 5. Files Changed & Inventory

### Modified Files (4)
- `backend/roadmap-service/app/models/__init__.py`
- `backend/roadmap-service/app/schemas/__init__.py`
- `backend/roadmap-service/app/services/__init__.py`
- `backend/roadmap-service/requirements.txt`

### Created Files (5)
- `backend/roadmap-service/app/db/seed_pathways.py`
- `backend/roadmap-service/app/schemas/pathway.py`
- `backend/roadmap-service/app/services/roadmap_service.py`
- `backend/roadmap-service/tests/test_roadmap_seed_and_service.py`
- `PHASE_4B_STEP_2_SEED_SCHEMAS_SERVICE_REPORT.md`

---

## 6. Test & Verification Results

### Pytest Execution
- **Command Executed**: `python -m pytest backend/`
- **Result**: **`17 passed in 3.57s`** (100% pass rate across all microservices).
- **Verified Tests**:
  - `test_seed_idempotency_and_counts`: Passed (verified 6 pathways, 18 options, 18 milestones on 1st & 2nd seed run).
  - `test_service_queries_and_filtering`: Passed (verified level and stream filtering, ID lookup, and missing pathway `None` handling).
  - `test_pydantic_schema_serialization`: Passed (verified Pydantic v2 `from_attributes` serialization).

---

## 7. Explicit Scope Confirmation

- ❌ FastAPI Routes: NOT added in this step (reserved for Step 3).
- ❌ API Gateway Proxy Routes: NOT added in this step.
- ❌ Frontend Code (`frontend/web`): NOT modified.
- ❌ AI / LLM Features: NOT added.
- ❌ Unrelated Microservices: NOT touched (`auth-service`, `student-service`, `assessment-service`, etc. untouched).
