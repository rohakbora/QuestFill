# QuestFill — AI-Powered Questionnaire Answering Tool

> **Live App:** [https://quest-fill-59z5.vercel.app/](https://quest-fill-59z5.vercel.app/)

---

## What I Built

QuestFill is a full-stack AI tool that automates the completion of structured questionnaires — security reviews, vendor assessments, compliance forms — using a company's own reference documents as the ground truth.

A user uploads their reference documents (PDFs or TXT files) and a questionnaire (PDF, Excel, or CSV). The system parses each question, retrieves the most relevant passages from the uploaded documents using semantic vector search, and generates a grounded answer with a citation for each question. Answers that cannot be supported by the reference documents return `"Not found in references."` rather than hallucinating.

After generation, the user can review and manually edit any answer, then export the completed questionnaire as a PDF, DOCX, or XLSX file — with all questions, answers, and citations preserved in order.

**Industry chosen:** B2B SaaS (document management / security)

**Fictional company:** **SecureDocs AI** — a cloud-based document management platform that helps enterprise teams store, collaborate on, and audit sensitive documents with bank-grade security.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, deployed on Vercel |
| Backend API | Python / FastAPI |
| Auth | Supabase Auth (JWT) |
| Database | Supabase (Postgres) |
| File Storage | Supabase Storage |
| Vector Store | Qdrant (cloud) |
| Embeddings | Google Gemini `gemini-embedding-001` (3072-dim) |
| LLM | Google Gemini `gemini-2.0-flash-lite` |
| Export | `python-docx`, `openpyxl`, `reportlab` |

---

## Architecture Overview

```
User Upload (PDF/TXT)
        │
        ▼
   PDF Parser (pdfplumber)
        │
        ▼
   Sliding Window Chunker (~500 tokens, 100-token overlap)
        │
        ▼
   Gemini Embedding (gemini-embedding-001)
        │
        ▼
   Qdrant Vector Store (upsert with SHA-256 chunk dedup)

                    ┌──────────────────────────┐
                    │  Generate / Improve Run  │
                    └──────────────────────────┘
                                │
               For each question in the questionnaire:
                                │
                    ┌───────────▼───────────┐
                    │  Semantic Retrieval   │
                    │  (Qdrant, top-3,      │
                    │   threshold 0.45)     │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Prompt + LLM Call    │
                    │  (Gemini Flash)       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Parse ANSWER +       │
                    │  CITATION from output │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Save to Supabase     │
                    │  answers table        │
                    └───────────────────────┘
```

---

## Features

### Core (Phase 1 & 2)
- **User auth** — sign up / log in via Supabase Auth; all data is user-scoped
- **Document upload** — PDF and TXT reference documents; SHA-256 dedup at file and chunk level
- **Questionnaire upload** — PDF, XLSX, XLS, or CSV; auto-parsed into individual questions
- **AI answer generation** — semantic retrieval + Gemini LLM, one answer + citation per question
- **"Not found in references"** — returned when retrieval confidence is below threshold
- **Review & edit** — inline answer editing before export
- **Export** — download completed questionnaire as PDF, DOCX, or XLSX with questions, answers, and citations in original order

### Nice-to-Have (implemented)
- **Confidence score** — based on the top cosine similarity score from Qdrant retrieval
- **Evidence snippets** — raw passage from the reference doc shown alongside the answer
- **Partial regeneration** — re-run AI only on selected questions (the `/answers/improve` endpoint)

---

## User Flow

1. Sign up or log in
2. Upload one or more reference documents (your source of truth)
3. Upload a questionnaire file
4. Click **Generate Answers** — the system processes every question automatically
5. Review answers; edit any that need correction
6. Click **Export** and choose PDF, DOCX, or XLSX
7. Download the completed questionnaire

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Log in, receive JWT |
| POST | `/documents/upload` | Upload a reference document |
| GET | `/documents/` | List all uploaded documents |
| DELETE | `/documents/{doc_id}` | Delete a document and its vectors |
| POST | `/questionnaires/upload` | Upload and parse a questionnaire |
| GET | `/questionnaires/` | List all questionnaires |
| GET | `/questionnaires/{q_id}/questions` | Get questions for a questionnaire |
| POST | `/answers/generate` | Generate answers for a full questionnaire |
| POST | `/answers/improve` | Regenerate answers for specific questions |
| PUT | `/answers/{answer_id}` | Edit an answer manually |
| GET | `/answers/{questionnaire_id}` | Get latest answers for a questionnaire |
| POST | `/export/` | Export completed questionnaire (PDF/DOCX/XLSX) |

---

## Database Schema (Supabase / Postgres)

```
users           (managed by Supabase Auth)
documents       id, user_id, file_name, file_type, file_url, file_hash, is_global, created_at
questionnaires  id, user_id, file_id, name, created_at
questions       id, questionnaire_id, question_text, order_index
answers         id, question_id, answer_text, citation, confidence, evidence, version, created_at
runs            id, questionnaire_id, created_at
```

---

## Assumptions

- Reference documents are uploaded and embedded once; they persist across questionnaire runs for the same user.
- Retrieval uses a cosine similarity threshold of **0.45**. Questions with no passage above this score return `"Not found in references."` — intentionally conservative to avoid hallucination.
- The chunking strategy (375 words, 75-word overlap) is optimised for dense compliance documents. Very short or image-heavy PDFs may yield fewer useful chunks.
- The questionnaire parser handles numbered lists (`1.`, `Q1:`), bullet points, and plain-line formats. Tables inside PDFs are not supported.
- Global / admin-uploaded reference documents (flagged `is_global = true`) are automatically visible to all users at retrieval time, intended for shared company-wide knowledge.
- Exports are also persisted to Supabase Storage (`exports` bucket) in addition to being streamed to the browser.

---

## Trade-offs

| Decision | Rationale |
|---|---|
| Qdrant over pgvector | Qdrant's dedicated vector engine handles high-dimensional Gemini embeddings (3072-dim) more efficiently. pgvector would simplify the stack but HNSW index performance degrades at this dimensionality. |
| Gemini embeddings + Gemini LLM | Single API provider reduces latency and integration complexity. The 3072-dim embedding space gives high semantic resolution for domain-specific compliance text. |
| Sliding window chunking (not sentence-level) | Compliance documents have long, flowing paragraphs. Word-boundary chunks preserve context better than sentence splits for retrieval. |
| Score threshold for "Not found" | A hard retrieval threshold is more reliable than asking the LLM to admit ignorance — LLMs tend to confabulate even when instructed not to. Retrieval failure is a clearer signal. |
| Versioned answers | Every generation and edit creates a new version row rather than overwriting. This gives a lightweight audit trail without a full version history UI. |
| Chunk-level SHA-256 dedup | Prevents the same passage from being stored multiple times if the same document is re-uploaded, keeping the vector store clean. |

---

## What I'd Improve with More Time

- **Streaming responses** — stream LLM tokens to the frontend so users see answers as they generate rather than waiting for the full batch.
- **Table and image extraction** — use a multimodal model or a dedicated table parser (e.g., `camelot`) to handle structured data in PDFs.
- **Version history UI** — surface the `version` column so users can compare previous runs side-by-side.
- **Coverage summary dashboard** — show total questions, answered with citations, and "not found" counts at a glance before export.
- **Re-ranking** — add a cross-encoder re-ranker pass after initial retrieval to improve answer quality on ambiguous questions.
- **Multi-file citations** — currently the citation points to a single source per answer; a real implementation should surface all contributing passages.
- **Rate limiting and queue** — for large questionnaires (50+ questions), use a background job queue (e.g., Celery + Redis) instead of blocking the HTTP request.
- **SSO / team workspaces** — support shared reference document libraries across an organisation rather than per-user document silos.

---

## Local Development

```bash
# Backend
pip install -r requirements.txt
cp .env.example .env   # fill in Supabase, Qdrant, Gemini credentials
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

**Required environment variables:**

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
QDRANT_URL=
QDRANT_API_KEY=
GEMINI_API_KEY=
```