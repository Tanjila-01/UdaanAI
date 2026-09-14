# Local career answers: first backend release

`POST /api/v1/career-intelligence/answers` through the existing gateway. Requires the
student's access token. No paid provider, API key or cloud fallback is used.

## Explore a career

```json
{
  "question": "What does a software developer do?",
  "intent": "explore",
  "pathway_id": "puc-science-comp",
  "language": "en"
}
```

The pathway filter is optional. Explore mode does not require a completed assessment
and does not restrict questions to the student's saved recommendations. It searches
verified knowledge and asks the local model to select relevant sentence IDs. The
backend assembles those exact source sentences and attaches source references. It
never displays a model-invented sentence or citation URL. This deliberately conservative,
extractive design is not yet free-form conversational generation.

The current verified corpus contains only three general occupational overviews. Indian
admission, eligibility, exam, salary and licensing questions return insufficient evidence.
The English keyword scope checks are a narrow initial guard, not a complete topic classifier.
The similarity cutoff (0.45) is a prototype heuristic, not a calibrated confidence score.
Model-selected sentences can still be incomplete or insufficiently relevant; expand
evaluation before student release. Source ID validation establishes provenance, not a
guarantee that every requested nuance was answered.

## Explain existing recommendations

```json
{
  "question": "Explain my saved recommendations",
  "intent": "explain_recommendations"
}
```

The service fetches the profile and latest assessment from authenticated `/me` endpoints.
It queries saved recommendations using the token's student ID. The request cannot
supply a student ID, profile, assessment scores, history or draft-content override.

Personalization requires a recognized stage, a current assessment and saved suggestions
matching the current attempt ID, assessment ID, scoring version and candidate scope.
Missing or stale results return `needs_update`; upstream failure returns `unavailable`.
The endpoint does not generate, overwrite or re-rank recommendations on the student's behalf.

The general explanation is assembled directly from saved rankings and supported interest
dimensions. Each recommendation includes the interest areas linked by the existing
stage mapping. Scores are labelled as questionnaire interests, never aptitude or
probabilities of success. Legacy aptitude wording from stored reason strings is not used.

To request supporting career-duty evidence, include a `pathway_id` that is among the
current saved suggestions. Use `explore` for alternatives. When no verified evidence
is available, the valid saved summary may still be returned without citations; it is
explicitly about the scoring result, not external career facts. General explanation mode
without a pathway returns the saved-results summary rather than interpreting arbitrary
follow-up questions. Conversation state and contextual follow-ups are not implemented.

## Stable response

Fields: `status`, `answer`, `sources`, `recommendations`, `context_status`.

Statuses:

| Status | Meaning |
| --- | --- |
| answered | Local model selected valid sentences; source references included. |
| recommendations_explained | Current saved results summarized; may have no external evidence. |
| insufficient_evidence | Verified knowledge cannot support the requested topic. |
| needs_update | Complete/update the profile, questionnaire or saved suggestions. |
| out_of_scope | Ask an education/career question. |
| unavailable | Local model, evidence validation, database or context service failed. |

Each source includes a numbered reference, chunk/document ID, title, section, original
publisher URLs, jurisdiction, source scope and review date. The `[1]` markers in the
answer refer to those numbered sources. No artificial confidence percentage is returned.

## Operation and limits

- English only for now; requesting Kannada is rejected rather than pretending translation works.
- Questions remain independent: saved history is not passed to the model as conversation memory. Completed answers now persist in student-owned history. Local voice input/output is documented in [local voice](local-voice.md).
- One answer request at a time per service process; excess requests receive 429 with Retry-After.
  This matches the current single-worker Docker service, not a distributed rate limiter.
- Gateway timeout is 400 seconds for answers only, covering sequential CPU embedding
  and generation. Existing search keeps 200 seconds; other routes keep their existing timeout.
- Model prompts contain the question and public source sentences, not names, email,
  access tokens or raw student profiles. Private context is processed by backend templates.
- API-level input errors use 422; missing/invalid login uses 401/403. Domain fallback
  statuses are returned with HTTP 200 so the student advisor can display the explanation.

## Validation, 12 September 2026

43 AI-service tests and 17 gateway tests passed. Real Ollama checks returned cited answers for software development, electrician tasks
and graphic design. Each took approximately 12-14 seconds in one CPU run; this is not a
load benchmark. Tests cover malformed/model-invented source IDs, schema violations,
draft/expired/weak evidence, provider failure, stale/missing/wrong-owner context,
unchanged ranking, input spoofing, authentication and busy handling.

```powershell
docker compose up -d --build --no-deps ai-career-service
docker compose restart api-gateway
docker compose exec -T ai-career-service python -m pytest tests -q
docker compose exec -T api-gateway python -m pytest tests -q
```

Next: broaden verified India/Karnataka content and evaluation, continue evaluating career coverage. Saved question history is now available, while multi-turn conversation memory remains future work. Free/local speech input/output is now available; see [local voice](local-voice.md). See [knowledge audit](knowledge-audit.md).

## Student advisor page, 13 September 2026

Open `/student/ai-career`, or choose **AI Career Advisor** in the student sidebar.
A student login is required; a complete profile is not required for general exploration.

- Submit a standalone English question, or use the career-duty starter questions.
- **Explain my recommendations** requests the saved recommendation summary without generating or changing rankings. Missing/outdated context links to profile, assessment and dashboard.
- Answers show numbered sources, publisher links, scope and review date. Only HTTPS source links are rendered.
- Loading disables additional submissions. Busy/network failures and unavailable answers offer an explicit retry; missing evidence is shown as a normal explanation.
- The open conversation view clears on navigation or identity change. Completed answers can be reopened from Previous questions. Aborting the browser does not guarantee that inference already running on the server stops.
- The answer request alone has a 410-second browser timeout to accommodate the gateway's 400-second timeout. Other API timeouts are unchanged.

Validation: 116 frontend tests passed (including 8 advisor tests), and the production build passed. The build retains a large-bundle size warning. Tests cover source safety, standalone payloads, busy retries, duplicate submission prevention, request cancellation, student identity changes, unavailable/missing evidence, invalid responses and recommendation display.

Live browser validation also passed against the Docker services: student sign-in, advisor access with no completed profile, a real source-cited software-development answer, missing-recommendation setup links and a KCET missing-evidence response. The layout was inspected at desktop and 390-pixel mobile widths. The disposable test student was removed after validation.

## Connected assessment journey

The student sidebar labels the existing assessment **Discover My Interests**. Assessment results with saved recommendations and the dashboard's saved-match section include **Understand my matches with Udaan**. This opens `/student/ai-career?intent=explain_recommendations` and requests the authenticated student's saved explanation once, then removes that navigation intent. Ordinary advisor visits do not send a request automatically. Existing backend freshness checks still require updated inputs when recommendations are stale. Successful explanations link onward to pathways and the roadmap; no scoring or rankings were changed.

## Saved question history

Completed `answered` and `recommendations_explained` responses are saved automatically to `career_ai.advisor_history` with the authenticated owner, question, request fields, answer, sources and timestamp. Fallback/error responses are not saved. No audio is stored. New successful answers return `history_id`; if saving fails, the answer is still returned with a null ID and the UI explains that it was not saved.

- `GET /api/v1/career-intelligence/history?offset=0`: newest 20 summaries plus `has_more`.
- `GET /api/v1/career-intelligence/history/{id}`: the owner's saved question and answer snapshot.
- `DELETE /api/v1/career-intelligence/history/{id}`: delete that owner's saved item.

Every route uses the authenticated subject. Other owners receive 404 for reads and deletes and never appear in the list. No user ID is accepted from the client. The UI labels old answers as snapshots that may be outdated. Reopening does not run the model or reuse historical answers as current evidence. Start fresh clears the view only; Previous questions provides explicit deletion.

Migration: `docker compose run --rm --no-deps ai-career-service alembic upgrade head` adds table/index revision 003. Build the updated service first, apply the migration, then recreate the service. Existing recommendation tables and scoring are unchanged.

Validation: 54 AI-service tests, 21 focused history/advisor/voice frontend tests and the production build passed. Tests cover persistence, owner isolation, deletion, pagination, authentication, failed storage, UI reopening and request cancellation. The production build retains its existing large-bundle warning.

Reopened snapshots include **Get updated answer**. This submits the original question and intent to the existing backend again, which rechecks current student context and verified knowledge. It appends a new response and preserves the old snapshot, including when the new response requires updated recommendations. No old answer text or source content is sent as current evidence. Validation: 14 focused advisor/history tests passed.

## Follow-up questions and current handoff

Implemented explicit **Ask a follow-up** on saved, sourced career-exploration answers. The composer displays the selected topic and lets the student clear it. The backend accepts only a saved-answer ID owned by the authenticated student, derives one career topic from source titles, and retrieves verified evidence again. Old answer text is not passed as current evidence. Multiple/unsupported topics return `needs_clarification`; deleted or other-owner records return 404. This is topic continuity, not unrestricted conversation memory. Personalized scoring summaries still use the separate explanation action.

Verified before the usage-limit block: 59 AI-service tests, 24 focused frontend tests and production build passed. A real local request followed “What does a software developer do?” with “Do they also document their work?” and received a fresh cited answer. Admission requirements still returned insufficient evidence. All temporary test history was deleted.

Screenshot fix activated on 13 September 2026: the exact question “how much year course is and will i get selected ?” now returns HTTP 200 with `needs_clarification`. The response requests the course/college and explains that selection cannot be predicted or guaranteed. It does not call the model or save a history record. All 63 AI-service tests passed; the service was rebuilt and recreated. A live request through the gateway confirmed the behavior. The earlier usage-limit block is resolved.

Frontend validation after the dashboard refresh: 29 focused dashboard/advisor/history/voice tests and 10 existing student-journey integration tests passed. The production build passed with the existing large-bundle warning. Actual microphone/read-aloud and visual device checks are delegated to the student developer; see [manual review](student-dashboard-review.md).

Remaining product work: broaden verified India/Karnataka course/admission knowledge; evaluate answer coverage and accuracy; check actual microphone and read-aloud on student devices; add Kannada only after suitable local speech/language support is verified; consider fuller conversation memory after topic follow-ups are evaluated. Production deployment, load/security hardening and retention policy review remain separate release work. No paid provider or billing integration is configured.

## Web-search update, 14 September 2026

The advisor now researches general education and career questions online first, using local inference and an internal SearXNG service. The source-mode dropdown and separate web-search button are removed. Saved assessment explanations stay local; seeded evidence is a fallback. The earlier usage-limit block is resolved. See [local web search](local-web-search.md) for current verification, privacy and limitations.
