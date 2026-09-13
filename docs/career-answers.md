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
- Stateless: no conversation memory or answer persistence. The student page keeps temporary messages only until navigation or reload. Local voice input/output is documented in [local voice](local-voice.md).
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

Next: broaden verified India/Karnataka content and evaluation, then add conversation history. Free/local speech input/output is now available; see [local voice](local-voice.md). See [knowledge audit](knowledge-audit.md).

## Student advisor page, 13 September 2026

Open `/student/ai-career`, or choose **AI Career Advisor** in the student sidebar.
A student login is required; a complete profile is not required for general exploration.

- Submit a standalone English question, or use the career-duty starter questions.
- **Explain my recommendations** requests the saved recommendation summary without generating or changing rankings. Missing/outdated context links to profile, assessment and dashboard.
- Answers show numbered sources, publisher links, scope and review date. Only HTTPS source links are rendered.
- Loading disables additional submissions. Busy/network failures and unavailable answers offer an explicit retry; missing evidence is shown as a normal explanation.
- Questions stay in page memory only. Leaving the page or changing student identity clears them and aborts the browser request. Aborting the browser does not guarantee that inference already running on the server stops.
- The answer request alone has a 410-second browser timeout to accommodate the gateway's 400-second timeout. Other API timeouts are unchanged.

Validation: 116 frontend tests passed (including 8 advisor tests), and the production build passed. The build retains a large-bundle size warning. Tests cover source safety, standalone payloads, busy retries, duplicate submission prevention, request cancellation, student identity changes, unavailable/missing evidence, invalid responses and recommendation display.

Live browser validation also passed against the Docker services: student sign-in, advisor access with no completed profile, a real source-cited software-development answer, missing-recommendation setup links and a KCET missing-evidence response. The layout was inspected at desktop and 390-pixel mobile widths. The disposable test student was removed after validation.
