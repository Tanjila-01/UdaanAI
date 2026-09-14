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
