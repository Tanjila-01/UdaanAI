# UdaanAI RAG Knowledge Base — Starter Content

This folder is a starter knowledge base for the RAG implementation described in
`UdaanAI_AI_Chat_and_RAG_Architecture.pdf`. It follows the folder layout proposed
in the plan:

```
backend/ai-career-service/knowledge/
├── careers/       -> 12 career documents
├── streams/        -> 4 PUC stream documents (PCMC, PCMB, Commerce, Arts)
├── education/       -> 7 degree/diploma pathway documents
├── iti/             -> 2 ITI trade documents
├── puc/              -> 1 PUC system overview
└── karnataka/     -> 2 Karnataka-specific documents (KCET, state education structure)
```

28 documents total, each written in the chunk-friendly Markdown format shown in
the plan (one `#` title + several `##` sections), so `loader.py` and
`chunker.py` can split by heading without extra parsing logic.

Career documents (`careers/`) carry the most sections since they are the
documents most likely to be retrieved directly in response to a student
question: Description, Day-to-day work, Recommended school path, Important
subjects, Important skills, Suitable interests, Alternative pathways, Typical
entry routes and exams, Career progression, Industry sectors and typical
employers, Related job titles, Recommended certifications and further
learning, Challenges and considerations, and Karnataka context.

## How to use this with the ingestion pipeline

1. Copy this folder to `backend/ai-career-service/knowledge/` in the repo.
2. `loader.py` reads each `.md` file.
3. `chunker.py` should chunk **per `##` section** rather than by fixed token
   count — each section (Description, Recommended school path, Important
   subjects, etc.) is a self-contained fact useful for retrieval.
4. Store metadata per chunk: `source_file`, `category` (careers / streams /
   education / iti / puc / karnataka), and `title` (the `#` heading) — this
   lets `retriever.py` filter by category when the student's question is
   clearly about a stream vs. a specific career vs. an exam.
5. Embed and store in PostgreSQL + pgvector as planned in Stage 1-2.

## Coverage and known gaps

- Career docs lean toward Science/PCMC/PCMB-linked careers (engineering, tech,
  medical) with a few Commerce/Arts options (CA, teacher, designer, lawyer).
  Add more Commerce/Arts/vocational careers (banking, hotel management,
  agriculture, fashion design, government services/UPSC-KPSC, performing
  arts) to balance coverage for non-Science students.
- Facts here (exam names, degree durations, eligibility) reflect general,
  commonly known India/Karnataka education norms as of 2026 and should be
  reviewed against official sources (KEA, PUE Board, NMC/NEET, ICAI) before
  production use, per the plan's own "Educational content... needs review"
  note.
- No embeddings/chunk IDs are pre-generated — this is raw source content only,
  matching the plan's Stage 1 scope (knowledge base creation), not Stage 2
  (embedding pipeline).
- Career docs deliberately omit specific salary figures. Pay varies too much
  by employer, city and experience to state reliably without a verified,
  dated source, and a wrong number is worse than none in a system giving
  advice to students. Add a verified, dated salary-range source per career
  if this is wanted later.
