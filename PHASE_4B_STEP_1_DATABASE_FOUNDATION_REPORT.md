# Udaan AI — Phase 4B Step 1: Roadmap Service Database Foundation Report

**Document Title**: `PHASE_4B_STEP_1_DATABASE_FOUNDATION_REPORT.md`  
**Phase**: Phase 4B — Step 1: Roadmap Service Database Foundation  
**Target Microservice**: `roadmap-service` (`backend/roadmap-service/`)  
**Workspace**: `c:\Users\abulm\OneDrive\DCL\UdaanAI`  
**Execution Date**: August 4, 2026  

---

## 1. Initial Audit Findings

Prior to making any edits, a read-only audit of `backend/roadmap-service/` was performed:
- **`app/models/`**: `__init__.py` was empty (0 bytes); no SQLAlchemy ORM models existed.
- **`requirements.txt`**: Did not include `alembic`.
- **Alembic Setup**: No `alembic.ini`, `alembic/` directory, or migration scripts were present.
- **App Startup (`app/main.py`)**: `Base.metadata.create_all()` was not present, adhering to strict Alembic schema management conventions.

---

## 2. Architecture Decisions

1. **Schema Isolation**: All tables strictly target PostgreSQL schema `roadmap` (`__table_args__ = {"schema": "roadmap"}`) without cross-schema foreign keys or joins to `student.student_profiles`.
2. **Environment Configuration**: Alembic reads `DATABASE_URL` and `DB_SCHEMA` from environment variables, avoiding hardcoded database credentials.
3. **No App Startup Table Creation**: Schema management is strictly delegated to Alembic migrations (`alembic upgrade head`). `app/main.py` remains unmutated.
4. **Clean Cascade & Ordering**: `Pathway` owns `options` (ordered by `display_order`) and `milestones` (ordered by `step_number`) with `cascade="all, delete-orphan"`.
5. **No AI or Unrelated Code Mutations**: Zero AI features, seed data, API endpoints, Gateway proxy routes, or frontend files were added or modified.

---

## 3. Files Changed & Inventory

### Modified Files (2)
- [`backend/roadmap-service/requirements.txt`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/requirements.txt) — Added `alembic>=1.12.0`.
- [`backend/roadmap-service/app/models/__init__.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/app/models/__init__.py) — Exported `Pathway`, `PathwayOption`, `PathwayMilestone`.

### Created Files (5)
- [`backend/roadmap-service/app/models/pathway.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/app/models/pathway.py) — SQLAlchemy models (`Pathway`, `PathwayOption`, `PathwayMilestone`).
- [`backend/roadmap-service/alembic.ini`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/alembic.ini) — Alembic configuration file.
- [`backend/roadmap-service/alembic/env.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/alembic/env.py) — Migration environment loader with schema `roadmap` targeting.
- [`backend/roadmap-service/alembic/script.py.mako`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/alembic/script.py.mako) — Alembic migration template.
- [`backend/roadmap-service/alembic/versions/001_initial_roadmap_tables.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/alembic/versions/001_initial_roadmap_tables.py) — Initial migration script for `roadmap` schema tables, indexes, and unique constraints.
- [`backend/roadmap-service/tests/test_roadmap_models.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/tests/test_roadmap_models.py) — Unit tests for model metadata, relationships, and constraints.

---

## 4. Database Model Details

### 1. `Pathway` (`roadmap.pathways`)
- `id`: `String(50)`, Primary Key (stable meaningful ID e.g. `"c10-puc"`, `"c10-diploma"`, `"c10-iti"`).
- `education_level`: `String(50)`, Indexed, Not Null (e.g. `"Class 8"`, `"Class 9"`, `"Class 10"`, `"PUC 1"`, `"PUC 2"`, `"Diploma"`, `"ITI"`).
- `stream`: `String(50)`, Indexed, Nullable (e.g. `"Science"`, `"Commerce"`, `"Arts"`).
- `title`: `String(150)`, Not Null.
- `category`: `String(50)`, Not Null (e.g. `"Pre-University"`, `"Technical"`, `"Vocational"`).
- `duration`: `String(50)`, Nullable.
- `description`: `Text`, Not Null.
- `created_at`: `DateTime(timezone=True)`, Server Default `now()`, Not Null.
- **Relationships**: `options` (1:N `PathwayOption`), `milestones` (1:N `PathwayMilestone`).

### 2. `PathwayOption` (`roadmap.pathway_options`)
- `id`: `UUID`, Primary Key.
- `pathway_id`: `String(50)`, Foreign Key to `roadmap.pathways.id` (`ondelete="CASCADE"`), Not Null.
- `option_name`: `String(150)`, Not Null.
- `stream_or_code`: `String(50)`, Nullable.
- `description`: `Text`, Not Null.
- `eligibility`: `String(255)`, Nullable.
- `display_order`: `Integer`, Default `1`, Not Null.
- **Constraint**: Unique constraint `uq_pathway_option_display_order` (`pathway_id` + `display_order`).

### 3. `PathwayMilestone` (`roadmap.pathway_milestones`)
- `id`: `UUID`, Primary Key.
- `pathway_id`: `String(50)`, Foreign Key to `roadmap.pathways.id` (`ondelete="CASCADE"`), Not Null.
- `step_number`: `Integer`, Not Null.
- `title`: `String(150)`, Not Null.
- `description`: `Text`, Not Null.
- `key_action`: `String(255)`, Nullable.
- **Constraint**: Unique constraint `uq_pathway_milestone_step_number` (`pathway_id` + `step_number`).

---

## 5. Migration Details (`001_initial_roadmap_tables.py`)

- **Schema Check**: Executes `CREATE SCHEMA IF NOT EXISTS roadmap;`.
- **Tables Created**:
  1. `roadmap.pathways`
  2. `roadmap.pathway_options`
  3. `roadmap.pathway_milestones`
- **Indexes Created**:
  - `ix_roadmap_pathways_education_level` on `roadmap.pathways (education_level)`
  - `ix_roadmap_pathways_stream` on `roadmap.pathways (stream)`
- **Foreign Keys**:
  - `pathway_options.pathway_id` -> `roadmap.pathways.id` (`ON DELETE CASCADE`)
  - `pathway_milestones.pathway_id` -> `roadmap.pathways.id` (`ON DELETE CASCADE`)
- **Clean Downgrade**: Drops `pathway_milestones`, `pathway_options`, indexes, and `pathways` without dropping the shared `roadmap` schema.

---

## 6. Commands Executed & Test Results

### 1. Pytest Test Suite Execution
- **Command**: `python -m pytest backend/`
- **Output**: **`14 passed in 2.77s`**
- **Verified**:
  - Metadata test `test_roadmap_models_metadata` passed.
  - Relationship and SQLite memory table creation test `test_roadmap_models_orm_relationships` passed.

---

## 7. PostgreSQL & Container Verification Instructions

To apply the migration and verify the PostgreSQL tables in your Docker Compose environment:

```powershell
# 1. Build roadmap-service container image
docker compose build roadmap-service

# 2. Recreate roadmap-service container
docker compose up -d --force-recreate roadmap-service

# 3. Apply Alembic migration
docker compose exec roadmap-service python -m alembic -c alembic.ini upgrade head

# 4. Verify current Alembic revision
docker compose exec roadmap-service python -m alembic -c alembic.ini current

# 5. List tables in roadmap schema
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "\dt roadmap.*"

# 6. Inspect table structures
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "\d roadmap.pathways"
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "\d roadmap.pathway_options"
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "\d roadmap.pathway_milestones"

# 7. Check alembic_version table
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "SELECT * FROM roadmap.alembic_version;"
```

---

## 8. Known Limitations & Explicit Scope Confirmation

- **Known Limitations**: Seed data is intentionally not included in Step 1. Tables in schema `roadmap` will be empty until Step 2 (Seed Data & API Endpoints).
- **Explicit Scope Confirmation**:
  - ❌ Seed data: NOT added.
  - ❌ API Endpoints (`GET /roadmap/pathways`): NOT added.
  - ❌ Gateway Proxy Routes: NOT added.
  - ❌ Frontend Code (`frontend/web`): NOT modified.
  - ❌ AI / LLM Features: NOT added.
  - ❌ Unrelated Microservices: NOT modified (`auth-service`, `student-service`, `assessment-service`, etc. untouched).
