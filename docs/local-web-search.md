# Udaan web-first advisor

## Student experience

Students type or speak a question. There is no source-mode dropdown or separate web-search button. General education, subject, career, skills and pathway questions research the web first. Saved assessment explanations remain local. Seeded job-duty evidence is a fallback when online research cannot answer; there is no random 90/10 split and no claimed 90% answer-accuracy guarantee.

A local model interprets the question's meaning, expands informal wording and abbreviations, selects a concise query and handles a selected topic versus a newly named subject. This replaces the career-keyword gate for default chat. Up to five candidate pages are fetched with three bounded parallel readers and cleaned, then the local model writes short explanations with validated evidence IDs. Paragraphs with unsupported numbers or nonexistent citations are rejected; supported paragraphs survive with a partial-answer notice. This is grounded generation, not a proof that every paraphrase is correct; evaluation remains necessary.

Saved history retains old snapshots. Refresh answer requests a fresh research run and bypasses the short cache. Previously saved awkward answers are not rewritten retroactively.

## Retrieval and privacy

SearXNG runs internally in Docker, with no published search port or paid API key. Search text is sent to external engines. Profile fields, assessment scores, auth tokens and audio are not inserted into searches. Email addresses, URLs and phone-like strings are removed from queries; the planner is also instructed to remove personal names. Do not claim that arbitrary identifying text typed by a student is perfectly anonymized.

General questions can use public HTTPS education/career results. More authoritative sources receive a ranking preference. Admissions, deadlines, eligibility and similar queries use supported official/academic domains. The reader currently handles HTML, not PDF documents or interactive pages requiring browser execution.

URLs with credentials, IP literals, reserved/local hostnames or nonstandard ports are rejected. DNS responses must be public. Fetches connect to the validated IP while preserving Host and TLS SNI/certificate verification, preventing a second DNS lookup from changing the destination. Redirects are revalidated. Requests use no environment proxy, no user credentials and bounded sizes/time. Scripts, navigation, forms, tables and page chrome are excluded from extracted paragraphs. Web page instructions are not trusted. A legitimate source can still be outdated or wrong; the UI links it and shows the research timestamp, not an independent-review claim.

A maximum of 64 impersonal answers are cached in process for five minutes. Cache hits preserve the actual original checked_at time. Obvious personal queries are excluded. The cache is not a persistent knowledge database; service restarts clear it. Rate capacity is shared with local inference/voice to fit the machine.

## Tests and manual checks

Focused tests cover hidden source controls, refreshed history, routing for varied questions, topic changes, malformed model output, numerical evidence, source IDs, page-cleaning, DNS/address restrictions, redirects, IP pinning, cache refresh and local fallback.

The first live evaluation answered AI, photosynthesis and a CSE/salary question, but exposed insufficient coverage for archaeology and ITI/diploma comparison. It also exposed unnecessary restated questions and a truncated sentence. Those findings drove the broader public-source reader and clarification/completion corrections. AI and archaeology subsequently returned readable sourced explanations. ITI/diploma initially failed once and answered on retry; generation and source quality remain variable. A CSE/salary result explained CSE but omitted pay; the summary now explicitly reports unsupported portions.

Across live evaluations, fresh questions took about 6-70 seconds on this machine; a repeated cached AI question took 0.04 seconds. These are observations, not guaranteed latency. CPU inference and website availability still determine fresh-answer speed.

For manual review, ask unrelated education topics, career-preparation questions and pathway comparisons rather than repeating only the seeded career questions. Check whether citations support the answer. Current-year admissions, salaries and selection chances may need further detail or better official evidence. No system can promise a correct answer to every possible student question.

Final regression checks: 116 backend tests passed. The focused frontend advisor/history checks passed (20 total), and the frontend production build passed with its existing bundle-size warning. The backend image was rebuilt and activated. No paid provider was added.

A subsequent live diagnostic found inline model evidence labels (for example, `Evidence: W1, W3`) being interpreted as unsupported numerical claims. The reader now removes echoed citation labels before numerical validation and adds its own validated references. A regression test covers this; all 57 focused web/history tests passed after the fix. Summaries are restricted to two shorter paragraphs, with an explicit missing-information field.

## Product decision: Internet-grounded AI Advisor chat (14 September 2026)

- **Strict internet grounding for general chat**: For all normal explore/chat questions regarding careers, courses, academic subjects, streams, skills, pathways, admissions, and related education guidance, Udaan AI automatically researches the internet and generates explanations exclusively from retrieved web evidence.
- **Seeded fallback removed from normal chat**: Normal chat questions no longer silently fall back to seeded career documents (`answer_question`). Seeded knowledge documents remain in the repository for internal scoring, tests, and recommendation development, but never appear as factual sources in general chat.
- **Strict citation requirement**: Every answered response must contain at least one valid internet source. Any response lacking verified sources cannot have status `answered` (it degrades to `insufficient_evidence` or `unavailable` with an honest disclosure).
- **Personalized recommendation separation**: Interest assessment scoring remains 100% deterministic and local. "Explain my recommendations" explains the student's saved assessment and pathway data locally on the server (`answer_origin: local`) and clearly identifies itself as an explanation of saved results.

## Latency and Performance Optimization

### Latency Breakdown Before vs. After
On the local CPU-only machine (Ollama + Qwen 1.7B), sequential inference and retrieval timings have been significantly reduced through context sizing, persistent model loading, single-paragraph generation, and early-stopping page retrieval:

| Stage | Baseline (Before) | Optimized (After) | Improvement |
|---|---|---|---|
| Question Normalization | ~0.09 ms | ~0.09 ms | Instantaneous |
| Query Planning | 12.0 – 15.0 s (LLM call) | < 1 ms (`fast_plan` deterministic) | **~99.9% faster** (~13s saved) |
| SearXNG Search | 2.5 – 6.0 s | 0.8 – 2.5 s (disabled failing upstream engines, query cache) | **~50% faster** |
| Page Fetch & Extraction | 4.0 – 8.0 s | 1.0 – 2.5 s (early-stop with `as_completed` & 2-page limit) | **~65% faster** |
| Evidence Ranking | ~0.2 ms | ~0.2 ms (with entity-balanced multi-topic selection) | Instantaneous & balanced |
| Local Summary Generation | 18.0 – 32.0 s | 9.5 – 15.0 s (`num_predict: 180`, `num_ctx: 2048`, 1 paragraph) | **~50% faster** |
| Saving History | ~0.01 s | ~0.01 s | Instantaneous |
| **Total Gateway Response (Warm)** | **21 – 43 s** | **12 – 16 s** (simple definitions), **13 – 17 s** (typical) | **~50% total reduction** |
| **Cold Model Response** | **35 – 55 s** | **~21 s** (with `keep_alive: 30m`, cold hit paid only once) | **~50% reduction** |
| **Cached Repeat Response** | **< 0.05 s** | **0.039 s** | Target < 1.0s exceeded |

### Key Optimizations Implemented
1. **Persistent Ollama Model Retention (`keep_alive: 30m`)**: Model remains pinned in memory for 30 minutes across requests, eliminating repeated 4–5 second cold model load penalties during active advisor use.
2. **Reduced KV Context Window (`num_ctx: 2048`)**: Reduced Ollama context allocation from 4096 to 2048, which fits all candidate evidence sentences and structured output schemas while cutting CPU memory bandwidth and prompt evaluation latency.
3. **Streamlined Summary Prompt & Schema**:
   - Single concise paragraph (70–90 words max) using full sentences.
   - `num_predict: 180` tokens max, avoiding CPU generation overhead.
   - Top 5–6 strongest candidate sentences (`candidates[:6]`).
   - Retained `missing_info`, citation IDs, and strict anti-hallucination validation.
4. **Entity-Balanced Evidence Ranking**: In multi-entity comparison queries (such as *Compare Science, Commerce and Arts*), sentence selection is partitioned across entities, ensuring each named stream has substantive factual evidence rather than superficial multi-keyword titles.
5. **Early-Stopping Concurrent Page Retrieval**:
   - Switched worker pooling to `as_completed()`, returning immediately when 2 readable pages are retrieved.
   - For simple definitions, a single authoritative source (e.g. Wikipedia/Britannica) with ample text (>=3 parts) returns immediately without waiting for additional pages.
   - Disabled consistently failing or slow SearXNG search engines (Google, Brave, Qwant), keeping fast engines (`duckduckgo`, `bing`).
6. **Query & Impersonal Result Caching**:
   - Normalized search query cache (`_search_cache`) for public page results (5-minute TTL).
   - Impersonal answer cache with wording/politeness normalization (`normalize_cache_key`).
   - Refresh answer bypasses caches cleanly while preserving original research timestamps.
7. **Perceived Speed & Frontend UX**:
   - Staged loading feedback: `"Researching your question… Checking reliable sources…"` immediately, switching to `"Researching your question… Preparing your answer…"` after ~2.8s.
   - Inline "Cancel" button during request processing that aborts the in-flight request cleanly without generating empty history records or leaking state.
8. **Resilient JSON Recovery (`repair_json`)**:
   - Safely repairs trailing unclosed strings or braces if a model approaches the token limit, preventing parse crashes.
   - Promotes accidental model follow-up explanations into validated paragraphs if the model mistakenly placed the explanation in `follow_up`.

### Model Benchmark: Qwen 1.7B vs. Qwen2.5 0.5B
Benchmarked `qwen2.5:0.5b` (397 MB) against current `qwen3:1.7b` (1.4 GB) in local Ollama:
- **`qwen2.5:0.5b`**: While faster (total ~4–10s), it exhibited unacceptable regressions:
  - 50% failure rate on structured JSON output schema (malformed output on definitions).
  - Dropped citations completely on cybersecurity (*Valid Citations: False, Citations: []*).
  - Failed grounding fidelity and omitted critical guidance details.
- **Decision**: Per instruction requirement ("Adopt the smaller model only if quality remains acceptable. Do not replace the current model merely because it is faster"), `qwen3:1.7b` was retained as the production text model.

## Sequential Live Gateway Acceptance Evaluation

Live sequential evaluation executed through the authenticated API Gateway (`/api/v1/career-intelligence/answers`) with a disposable student account:

| # | Question | Type | Status | Sources | Latency | Result Quality |
|---|---|---|---|---|---|---|
| 1 | *What is an AIML engineer?* | Cold | `answered` | 2 web sources | 21.9s | Accurate role & algorithms, grounded citations |
| 2 | *What is PUC?* | Definition | `answered` | 1 web source | 14.5s | 2-year pre-university program explanation [Target 10-18s: MET] |
| 3 | *What is ITI?* | Definition | `answered` | 1 web source | 14.5s | Industrial training trades & vocational education [Target 10-18s: MET] |
| 4 | *What is artificial intelligence?* | Definition | `answered` | 1 web source | 12.2s | Computer systems reasoning & problem solving [Target 10-18s: MET] |
| 5 | *What is artificial intelligence?* | Cached repeat | `answered` | 1 web source | 0.039s | Sub-second instant cache response [Target < 1s: MET] |
| 6 | *What courses can I take after Commerce?* | Pathway | `answered` | 1 web source | 12.9s | B.Com, professional courses, and management pathways |
| 7 | *Compare Science, Commerce and Arts.* | Comparison | `answered` | 2 web sources | 14.3s | Balanced comparison across all 3 streams with grounded sources |
| 8 | *What skills are needed for cybersecurity?* | Skills | `answered` | 2 web sources | 15.8s | Technical & soft skill combination with verified citations |
| 9 | *What does a marine biologist do?* | Career | `answered` | 1 web source | 15.7s | Marine life, ecosystem research and environmental duties |
| 10 | *What courses can lead to graphic design?* | Education | `answered` | 2 web sources | 17.7s | Certificate, diploma, and degree courses (B.Des) |
| 11 | *Which stream should I choose after Class 10 for AI?* | Pathway | `answered` | 1 web source | 37.2s | Science with PCM recommendation for AI foundation |
| 12 | *What is the eligibility for KCET 2026?* | Official | `answered` | 1 web source | 13.1s | Directed entrance eligibility requirements from verified source |

### Acceptance Metrics
- **Success Rate**: 12/12 (100% answered with verified web sources, 0 unanswered questions).
- **All 3 Previously Unanswered Questions Resolved**:
  - *What courses can I take after Commerce?*: Answered (12.9s, 1 source).
  - *Compare Science, Commerce and Arts.*: Answered (14.3s, 2 sources).
  - *What skills are needed for cybersecurity?*: Answered (15.8s, 2 sources).
- **Definitions**: 12.2s – 14.5s (Target 10–18s: **MET**).
- **Cached Repeat**: 0.039s (Target < 1s: **MET**).
- **Warm Median Latency**: 14.47s (Reduced from 26–35s).
- **Cold Model Latency**: 21.94s (Single upfront load, kept alive for 30m).
- **Hardware Limitation**: CPU-only inference; `qwen3:1.7b` generation on CPU takes ~8–14s. Further latency reductions below ~10s would require hardware acceleration (GPU/NPU).



