# Udaan AI Project Completion Checklist

Status date: 14 September 2026

## AI Career, Web-Search & Performance Subtask (Complete)

- [x] **Product Decision Enforced**: General AI Advisor chat is strictly web-grounded. Normal explore/chat questions automatically research the internet and generate explanations exclusively from retrieved web evidence.
- [x] **Seeded Fallback Removed**: Disabled seeded fallback (`answer_question`) for normal chat questions. Web failures return honest limitations (`unavailable` or `insufficient_evidence`) without seeded document fallback.
- [x] **Strict Citation Invariant**: Any answered response requires at least one verified internet source. Responses without sources cannot have status `answered`.
- [x] **Recommendation Separation Maintained**: Interest assessment scoring remains deterministic and local; saved recommendation explanations remain local (`answer_origin: local`) and explicitly identify saved results.
- [x] **Deterministic Query Planning**: Implemented `fast_plan` with abbreviation expansion (`AIML`, `CSE`, `ITI`, `PUC`, `BTech`, `BSc`, `BCom`, `BA`, `MTech`, `MBBS`, `NEET`, `KCET`), dropping planning latency from ~14s to <1ms (~99.9% reduction).
- [x] **Persistent Model & Memory Context**: Configured `keep_alive: "30m"` in Ollama and set `num_ctx: 2048`, cutting KV cache memory overhead and eliminating repeated cold load penalties.
- [x] **Streamlined Single-Paragraph Summaries**: Reduced summary generation schema to one concise paragraph (70–90 words max, `num_predict: 180`, top 5–6 candidate sentences), cutting CPU generation time by ~50%.
- [x] **Entity-Balanced Ranking & Resilient JSON Recovery**: Balanced multi-entity comparison queries (e.g. Science vs. Commerce vs. Arts) and added `repair_json` fallback, completely eliminating prior unanswered/unavailable question dropouts.
- [x] **Early-Stopping Concurrent Retrieval & Engine Pruning**: Pruned failing/slow SearXNG engines, added query cache (`_search_cache`), and used `as_completed()` with early-stopping (1 authoritative source for definitions, 2 for general queries), reducing retrieval latency to 1.0–2.5s.
- [x] **Perceived Speed & Frontend UX**: Immediate staged feedback ("Checking reliable sources…" -> "Preparing your answer…"), plus inline Cancel button that aborts cleanly without leaving empty history.
- [x] **Model Benchmark**: Benchmarked `qwen2.5:0.5b` vs `qwen3:1.7b`. Retained `qwen3:1.7b` because 0.5B had unacceptable quality regressions (50% schema failure, lost citations).
- [x] **Latency Goals Met**:
  - Simple fresh definitions: **12.2s – 14.5s** (Target 10–18s: **MET**).
  - Cached repeat: **0.039s** (Target < 1s: **MET**).
  - Warm median latency: **14.47s** (Down from 26–35s).
  - Cold model latency: **21.94s** (Down from 35–55s).
- [x] **Comprehensive Test Suite Verified**:
  - 124 of 124 backend tests passed in `ai-career-service`.
  - 15 of 15 frontend tests passed in `CareerAdvisor.test.jsx`.
  - Frontend production build (`vite build`) succeeded in 18.34s.
- [x] **Live Acceptance Evaluation (12 of 12 verified through API Gateway)**:
  1. *What is an AIML engineer?* — 200 OK (21.9s, cold), status `answered`, 2 web sources.
  2. *What is PUC?* — 200 OK (14.5s), status `answered`, 1 web source.
  3. *What is ITI?* — 200 OK (14.5s), status `answered`, 1 web source.
  4. *What is artificial intelligence?* — 200 OK (12.2s), status `answered`, 1 web source.
  5. *What is artificial intelligence?* (cached repeat) — 200 OK (0.039s), status `answered`, 1 web source.
  6. *What courses can I take after Commerce?* — 200 OK (12.9s), status `answered`, 1 web source.
  7. *Compare Science, Commerce and Arts.* — 200 OK (14.3s), status `answered`, 2 web sources.
  8. *What skills are needed for cybersecurity?* — 200 OK (15.8s), status `answered`, 2 web sources.
  9. *What does a marine biologist do?* — 200 OK (15.7s), status `answered`, 1 web source.
  10. *What courses can lead to graphic design?* — 200 OK (17.7s), status `answered`, 2 web sources.
  11. *Which stream should I choose after Class 10 for AI?* — 200 OK (37.2s), status `answered`, 1 web source.
  12. *What is the eligibility for KCET 2026?* — 200 OK (13.1s), status `answered`, 1 web source.
- [x] All disposable evaluation accounts and history records cleanly purged from PostgreSQL.

---

## Remaining Prioritized Subtasks

### A. Complete student journey and persistence
- [ ] Verify onboarding -> assessment (Discover My Interests) -> recommendations -> pathways -> roadmap persistence.
- [ ] Confirm assessment attempt answers, scores, and saved recommendations reload accurately on page refresh.

### B. Pathway, recommendation and roadmap consistency
- [ ] Verify recommendation freshness checks when profile/assessment inputs change.
- [ ] Confirm goal selection from Explore Pathways reflects in My Career Roadmap without desync.

### C. Student/public UI consistency and manual checklist
- [ ] Confirm clean premium student UI across Explore Pathways, Discover My Interests and My Career Roadmap matches dashboard and AI Advisor.
- [ ] Check dark-mode styling and mobile responsiveness (390px viewport).

### D. Workshop/admin end-to-end workflow
- [ ] Verify workshop request submission, scheduling, and feedback submission workflow.

### E. Authentication/session security
- [ ] Verify token refresh handling, expired token handling, and unauthenticated redirects across all student routes.

### F. Fresh database migrations, backup and restore using disposable storage
- [ ] Test Alembic migration status across all services on a clean disposable schema/container.

### G. Knowledge review and stale documentation
- [ ] Review documentation files to ensure no references to paid APIs, cloud models, or removed UI controls remain.

### H. Frontend lint configuration and final release checks
- [ ] Run `npm run lint` and verify production build bundles.
