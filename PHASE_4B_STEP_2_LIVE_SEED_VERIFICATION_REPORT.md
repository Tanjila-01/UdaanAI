# Udaan AI — Phase 4B Step 2 Live Database Seed Verification Report

**Document Title**: `PHASE_4B_STEP_2_LIVE_SEED_VERIFICATION_REPORT.md`  
**Phase**: Phase 4B Step 2 — Live Database Seeding & Runtime Seed Runner  
**Target System**: `roadmap-service` (`backend/roadmap-service/`) & PostgreSQL (`udaan-postgres`)  
**Workspace**: `c:\Users\abulm\OneDrive\DCL\UdaanAI`  
**Execution Date**: August 4, 2026  

---

## 1. Root Cause of Empty Live Tables

- **Initial State**: Alembic migration `001_initial_roadmap_tables` was applied to the live PostgreSQL database (`udaan_ai`), creating empty tables in schema `roadmap` (`roadmap.pathways`, `roadmap.pathway_options`, `roadmap.pathway_milestones`).
- **Cause**: Seed data logic (`RoadmapService.seed_initial_data(db)`) was previously only invoked inside Pytest unit tests against an in-memory SQLite database (`test_engine`). No runtime CLI script or entrypoint existed in `roadmap-service` to run the seed routine against the live PostgreSQL database container.

---

## 2. Existing Seed Workflow Findings

- `backend/roadmap-service/app/db/seed_pathways.py` contained the full 6-pathway dataset.
- `backend/roadmap-service/app/services/roadmap_service.py` contained `RoadmapService.seed_initial_data(db)`.
- **Missing Asset**: There was no standalone CLI module to execute `seed_initial_data` using the service's database configuration (`app.db.session.SessionLocal`).

---

## 3. Runtime Seed Mechanism Added

Created CLI runner module [`backend/roadmap-service/app/db/seed_runner.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/app/db/seed_runner.py):
- Connects using `SessionLocal` from `app.db.session`.
- Calls `RoadmapService.seed_initial_data(db)`.
- Logs progress and returns exit code `0` on success, or `1` on failure.
- Runnable directly inside Docker containers via:
  ```powershell
  docker compose exec roadmap-service python -m app.db.seed_runner
  ```

---

## 4. Files Changed

### Created / Modified Files (100% Roadmap Service Only)
- [`backend/roadmap-service/app/db/seed_runner.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/app/db/seed_runner.py) — CLI seed runner script *(New)*.
- [`backend/roadmap-service/tests/test_roadmap_seed_and_service.py`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/backend/roadmap-service/tests/test_roadmap_seed_and_service.py) — Added `test_seed_runner_execution`.
- [`PHASE_4B_STEP_2_LIVE_SEED_VERIFICATION_REPORT.md`](file:///c:/Users/abulm/OneDrive/DCL/UdaanAI/PHASE_4B_STEP_2_LIVE_SEED_VERIFICATION_REPORT.md) — Live seed report *(New)*.

---

## 5. Live Seed Command & Execution Output

### Execution Command:
```powershell
docker compose exec roadmap-service python -m app.db.seed_runner
```

### Command Output:
```text
INFO: Starting database seeding for roadmap-service...
INFO: Successfully seeded 6 pathways into PostgreSQL database!
```

---

## 6. Live PostgreSQL Database Verification Output

### 1. Pathways Table (`roadmap.pathways`):
```sql
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "SELECT id, education_level, stream, title FROM roadmap.pathways ORDER BY id;"
```

**Output**:
```text
        id        | education_level |  stream  |                      title                      
------------------+-----------------+----------+-------------------------------------------------
 c10-diploma      | Class 10        |          | Polytechnic Diploma Engineering
 c10-iti          | Class 10        |          | Industrial Training Institute (ITI) Trade
 c10-puc          | Class 10        |          | Pre-University College (PUC)
 puc-arts-hum     | PUC 2           | Arts     | Humanities, Law, Media & Civil Services
 puc-commerce-fin | PUC 2           | Commerce | Commerce, Accounting & Business Management
 puc-science-eng  | PUC 2           | Science  | Engineering & Technology Degrees (B.E / B.Tech)
(6 rows)
```

### 2. Pathway Options Breakdown (`roadmap.pathway_options`):
```sql
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "SELECT pathway_id, COUNT(*) AS option_count FROM roadmap.pathway_options GROUP BY pathway_id ORDER BY pathway_id;"
```

**Output**:
```text
    pathway_id    | option_count 
------------------+--------------
 c10-diploma      |            3
 c10-iti          |            3
 c10-puc          |            3
 puc-arts-hum     |            3
 puc-commerce-fin |            3
 puc-science-eng  |            3
(6 rows)
```

### 3. Pathway Milestones Breakdown (`roadmap.pathway_milestones`):
```sql
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "SELECT pathway_id, COUNT(*) AS milestone_count FROM roadmap.pathway_milestones GROUP BY pathway_id ORDER BY pathway_id;"
```

**Output**:
```text
    pathway_id    | milestone_count 
------------------+-----------------
 c10-diploma      |               3
 c10-iti          |               3
 c10-puc          |               3
 puc-arts-hum     |               3
 puc-commerce-fin |               3
 puc-science-eng  |               3
(6 rows)
```

### 4. Total Counts Comparison (First-Run vs Second-Run Idempotency):
```sql
docker compose exec postgres psql -U udaan_user -d udaan_ai -c "SELECT (SELECT COUNT(*) FROM roadmap.pathways) AS pathways, (SELECT COUNT(*) FROM roadmap.pathway_options) AS options, (SELECT COUNT(*) FROM roadmap.pathway_milestones) AS milestones;"
```

| Run Iteration | Pathways Count | Pathway Options Count | Pathway Milestones Count | Result |
| :--- | :---: | :---: | :---: | :---: |
| **First Run** | 6 | 18 | 18 | Successfully Populated |
| **Second Run** | 6 | 18 | 18 | 100% Idempotent (0 Duplicates) |

---

## 7. Final Pytest Verification

```powershell
python -m pytest backend/
```
**Result**: **`19 passed in 3.17s`** (100% pass rate across all microservices).

---

## 8. Scope Verification

- `frontend/web/` — Untouched (0 modifications).
- `backend/api-gateway/` — Untouched (0 modifications).
- `backend/auth-service/` — Untouched (0 modifications).
- `backend/student-service/` — Untouched (0 modifications).
- `backend/assessment-service/` — Untouched (0 modifications).
- `docker-compose.yml` & `init-schemas.sql` — Untouched (0 modifications).

---

## 9. Conclusion

**Phase 4B Step 2 is fully verified, including live PostgreSQL seed data, and is ready for Step 3A.**
