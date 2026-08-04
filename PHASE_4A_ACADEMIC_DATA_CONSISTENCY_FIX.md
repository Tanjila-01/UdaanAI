# Udaan AI — Phase 4A Academic Profile Data Consistency Fix Report

**Document Title**: `PHASE_4A_ACADEMIC_DATA_CONSISTENCY_FIX.md`  
**Issue**: Invalid academic field combinations when changing `current_level` (e.g. `Class 10` + `Commerce` stream)  
**Target System**: Udaan AI Student Service & Frontend Web  
**Workspace**: `c:\Users\abulm\OneDrive\DCL\UdaanAI`  
**Execution Date**: August 4, 2026  

---

## 1. Root Cause

1. **Backend Absence of Normalization on Profile Updates**:
   - `StudentService.update_profile` was using `model_dump(exclude_unset=True)` to update profile fields.
   - When a student updated `current_level` from `PUC 2` to `Class 10`, `stream` was not present in the update request payload (or was unset).
   - Because no normalization logic executed before `db.commit()`, the old `stream` value (`"Commerce"`) remained in the PostgreSQL database column, leading to an inconsistent state (`Class 10` + `"Commerce"` stream).

2. **Frontend State Retention**:
   - `EditProfileDrawer.jsx` retained previous conditional field values in component state when `current_level` select input changed.

---

## 2. Validation & Normalization Rules Implemented

A single authoritative normalization and validation method `StudentService.normalize_and_validate_academic_fields` was implemented in the backend (`backend/student-service/app/services/student_service.py`):

1. **Class 8, Class 9, Class 10**:
   - `stream = None`
   - `diploma_branch = None`
   - `iti_trade = None`
2. **PUC 1, PUC 2**:
   - `stream` is **Required** (*Science, Commerce, Arts*). Raises `HTTP 400 Bad Request` if missing.
   - `diploma_branch = None`
   - `iti_trade = None`
3. **Diploma**:
   - `diploma_branch` is **Required** (*e.g., Computer Science & Engineering*). Raises `HTTP 400 Bad Request` if missing.
   - `stream = None`
   - `iti_trade = None`
4. **ITI**:
   - `iti_trade` is **Required** (*e.g., Electrician, Fitter*). Raises `HTTP 400 Bad Request` if missing.
   - `stream = None`
   - `diploma_branch = None`

Both `create_or_update_profile` and `update_profile` run this normalization prior to database commit, ensuring PostgreSQL columns are automatically cleared when transitioning between education levels.

---

## 3. Files Changed

| File Path | Action | Rationale |
| :--- | :---: | :--- |
| `backend/student-service/app/services/student_service.py` | Modified | Implemented `normalize_and_validate_academic_fields` and updated `calculate_completion` to validate conditional fields per `current_level`. |
| `backend/student-service/tests/test_student_api.py` | Modified | Added automated unit test `test_academic_field_normalization_and_transitions` covering all 5 level transitions and error paths. |
| `frontend/web/src/components/EditProfileDrawer.jsx` | Modified | Added `handleLevelChange` to clear hidden conditional fields in form state when `current_level` changes, and explicitly construct payload per level. |
| `frontend/web/src/pages/OnboardingPage.jsx` | Modified | Updated payload construction and validation rules for conditional education fields. |

---

## 4. Test Results

### 1. Automated Backend Test Suite
- **Command Executed**: `python -m pytest backend/`
- **Result**: **`12 passed in 5.76s`** (100% pass rate across 12 test functions).
- **Covered Scenarios**:
  - `PUC 2` creation with `stream="Commerce"` -> `stream="Commerce"`, `diploma_branch=None`, `iti_trade=None`.
  - Transition `PUC 2` -> `Class 10` -> `stream` automatically cleared (`None` in DB).
  - Transition `Class 10` -> `Diploma` without `diploma_branch` -> `HTTP 400 Bad Request`.
  - Transition `Class 10` -> `Diploma` WITH `diploma_branch` -> `diploma_branch` set, `stream=None`.
  - Transition `Diploma` -> `ITI` without `iti_trade` -> `HTTP 400 Bad Request`.
  - Transition `Diploma` -> `ITI` WITH `iti_trade` -> `iti_trade` set, `diploma_branch` automatically cleared.

### 2. Frontend Production Build
- **Command Executed**: `npm run build` (inside `frontend/web/`)
- **Result**: **`built in 6.87s`** with **`0 build errors`**.

---

## 5. Database Modification Status

- **Manual Data Alteration**: **None**. No manual `UPDATE` commands were executed against the PostgreSQL database.
- **Automatic Fix on Next API Call**: Any subsequent profile update or edit via API Gateway will trigger `StudentService.normalize_and_validate_academic_fields`, immediately cleaning non-matching conditional fields in PostgreSQL.

---

## 6. Remaining Limitations

- Existing database records saved prior to this patch will remain unchanged until the next profile edit or update operation unless a data cleanup script is explicitly requested.
