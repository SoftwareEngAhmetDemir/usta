# usta (Usta Hafızası)

Claude Code loads this file into every session. It is the source of truth for **how this
project currently works**. Keep it current (see "Maintaining this file").

## Product

Machine knowledge app for factory workers. A worker scans a machine QR code and lands on the machine page, which shows
details, ustas (experts), videos, documents with an AI summary, maintenance history and Q&A. Content can be shown in
81 languages, chosen site-wide from the header (🌐 menu next to "Çıkış yap"; searchable drop-downs; Google's free translate endpoint; dubbed voice for most, subtitles only for ~19). The UI text (buttons, menus) stays Turkish.
- **Roles**: İşçi (worker), Usta (expert who answers and records videos), Teknisyen (records maintenance jobs), Patron (admin: machines, QR sticker sheet, users and roles).
- **"Makineye sor"** (KAN-60): answers come only from this machine's video topics, document sections and earlier usta answers, in the worker's language, with sources (video + M:SS + keyframe, document + page + section). The LLM writes the final answer, document summaries and corrects Whisper transcripts; transcription, timing, chunking, topics, snapshots and retrieval run locally without it. If no match scores high enough, the answer is "not found" and the worker is offered "Ustaya sor" (ask an usta). These are dangerous machines, so a wrong, invented answer is worse than no answer.
- **Visual reference**: product demo linked in KAN-80. Real screens follow its flows; agree any deviation with the team.
- **Constraints**: runs on localhost only and is shared through a VS Code forwarded port. No Docker, no caching layer.

## Jira

- Board: https://deepdamer.atlassian.net/jira/software/projects/KAN/boards/1 (project key `KAN`, site `deepdamer.atlassian.net`)
- Read tickets with the Atlassian MCP (`getJiraIssue`, `searchJiraIssuesUsingJql`) using `cloudId: deepdamer.atlassian.net`.
- Work on a ticket with `/ticket KAN-<n>` (the `ticket` skill).
- Name branches `KAN-<n>-short-slug` and start commit messages and PR titles with `KAN-<n>: `.
- **Claude never commits, pushes or opens PRs**; the user does (`git commit`/`git push`/`gh pr create` are denied in `.claude/settings.json`). Claude may create branches and suggest a commit message.
- A ticket's "Done when" / "Acceptance criteria" checklist is the definition of done. Every item gets a test.

## Stack & layout

| Part | Path | Tech |
|------|------|------|
| Frontend | `frontend/` | React + TypeScript (strict), Vite, Vitest + Testing Library, Playwright (e2e) |
| Backend  | `backend/`  | FastAPI, Python 3.12+, Pydantic v2, pytest, mypy `--strict`, ruff |
| Database | MySQL | accessed from the backend only |
| Live alerts | WebSocket | FastAPI WebSocket endpoint pushes alerts to the frontend |
| LLM | Gemini (Vertex AI) | `backend/app/ai/gemini.py`: final answer, document summaries, transcript correction |
| Local models (CPU) | faster-whisper small, `intfloat/multilingual-e5-base`, `BAAI/bge-reranker-v2-m3`, Tesseract | transcription, embeddings, rerank, OCR; Hugging Face cache (~4 GB) |
| Vectors | ChromaDB persistent, in-process | `backend/.chroma/`, behind `VectorStore`; MySQL keeps chunk text + metadata |
| Translation + dub voice | Google's free translate endpoints (`translate_a/single`, `translate_tts`) | no key, no Cloud console (user's decision 2026-11-22); unofficial, rate-limited, retried |
| Files | `uploads/` folder on disk | videos, documents, subtitles, dubbed audio; MySQL stores their paths |

```
frontend/
  src/components/     shared presentational components used by 2+ features (Button/, Modal/, ...)
  src/features/<feature>/          one folder per feature (machine-page, ask, recorder, ...)
    <Feature>Page.tsx              thin screen: composes the feature's components
    components/<Name>/             one component per folder: <Name>.tsx, <Name>.test.tsx, index.ts
    hooks/use<Name>.ts             data fetching and state logic (with use<Name>.test.ts)
    api.ts, types.ts, index.ts     feature API calls, types, public exports
  src/api/            typed API client + types mirroring backend schemas
  e2e/                Playwright specs (UI against the real API)
backend/
  app/main.py         FastAPI app, router registration
  app/<feature>/      schemas.py, service.py, router.py, deps.py, models.py
  app/ai/             engines behind Protocols (interfaces.py): whisper, e5, reranker, chroma, google_free, gemini, ocr
  tests/              pytest, mirrors app/
```

### Commands
- Whole app: `./dev.sh` (repo root) starts uvicorn :8000 + Vite :5173 together; Ctrl+C stops both. Open http://localhost:5173.
- Frontend: `cd frontend && npm run dev | typecheck | lint | test | test:e2e`
- Backend (venv `backend/.venv`, Python 3.12; setup: `python3.12 -m venv .venv && .venv/bin/pip install -e '.[dev]'`): `cd backend && .venv/bin/uvicorn app.main:app --reload`, `.venv/bin/ruff check .`, `.venv/bin/mypy .`, `.venv/bin/pytest -q`, migrations `.venv/bin/alembic revision --autogenerate -m <msg>` / `.venv/bin/alembic upgrade head`
- Knowledge: `cd backend && .venv/bin/python -m app.jobs.cli reprocess` (queue every video/document/usta answer again; the running backend executes) · `... reembed` (after changing `EMBEDDING_MODEL`) · `.venv/bin/python scripts/eval_retrieval.py <eval.json>` (hit@5/MRR + gate per question; stop `./dev.sh` first: one process may open the vector store). System deps: ffmpeg, tesseract + `backend/.tessdata` (eng/osd from brew, tur/ara from `tesseract-ocr/tessdata_fast`).
- Users: `cd backend && .venv/bin/python -m app.auth.cli create --name "Ad Soyad" --login <phone|email> --role patron` (asks for the password); `... set-role --login <phone|email> --role usta`. Anyone can self-register as İşçi or Usta at `/register`.

Required config when scaffolding: `tsconfig` `"strict": true`, ESLint `@typescript-eslint/no-explicit-any: "error"`,
`mypy` `strict = true` and ruff rule `ANN401` (no `Any`) in `backend/pyproject.toml`, Playwright `webServer` starting both apps.

## Engineering rules (always apply)

Work like a senior frontend + backend + AI engineer.

1. **No `any`.** TypeScript: no `any`, `as any`, `@ts-ignore`; use precise types, generics, unions, `unknown` + narrowing.
   Python: full type hints, no `Any`, no bare `# type: ignore`. A hook rejects `any`/`Any` on every edit.
2. **Reusable units.** Components take typed props and stay presentational; data fetching lives in hooks; backend
   handlers are thin, logic in services, I/O behind injected `Protocol`s. Grep for an existing helper before writing one.
   Patterns: `reusable-component` skill.
3. **Thin frontend.** All complex logic (business rules, calculations, filtering/sorting/aggregation, permissions,
   validation rules, matching, AI) lives in the backend. The frontend only renders API data, holds UI state and sends
   user input. If the UI needs derived data, add it to an endpoint. Details: `reusable-component` skill.
4. **One feature = its own folder; one component = its own file; keep it short.** Each feature lives in
   `frontend/src/features/<feature>/` with separate components. A component file exports **one** component and is at
   most **150 lines**. If it grows, split out child components, move logic into a `use<Name>` hook, and move types and
   constants into their own files. Features never import another feature's internals, only its `index.ts`. Anything
   shared moves to `src/components/`.
5. **Validate at trust boundaries.** Pydantic on every request/response (`response_model`), env via `pydantic-settings`,
   LLM output schema-validated, never trusted.
6. **Think about impact before every add/change/remove.** Find every caller, test, mock, route and the FE↔BE contract
   it touches and update them in the same change (`impact-analyzer` agent). API changes go backend first, then frontend types/client.
7. **Tests with every change.** Unit tests for new/changed behavior (Vitest beside the file; pytest under
   `backend/tests/`), Playwright e2e for every affected user flow, and delete tests of removed code. Use the `test-writer` agent.
8. **Never make checks pass by weakening them** (skipping tests, loosening assertions, adding ignores).
9. For any non-trivial change follow the `feature` skill (`/feature <task>`). For a Jira ticket use `/ticket KAN-<n>`.

### What runs automatically (`.claude/settings.json`)
- **After each Edit/Write**: `.claude/hooks/post-edit.sh` rejects `any` (TS) / `Any` (Python), rejects a `.tsx`
  component file over 150 lines or exporting more than one component, and records the file.
- **At session start** (`session-start.sh`, once registered under `SessionStart` in `settings.json`): marks the time, so
  `verify.sh` also sees files changed through Bash (scripts, `alembic revision`), not only Edit/Write.
- **When Claude tries to finish**: `.claude/hooks/verify.sh` checks that changed source has matching tests and that
  CLAUDE.md was updated, then runs frontend typecheck/lint/test/test:e2e and backend ruff/mypy/pytest. On failure it
  sends Claude back to fix it (max 3 times, then Claude must report what is still failing).

## Current status (update at the end of each working day)

_Last updated 2026-11-22._
- **Frontend: built** for every `frontend`-labelled KAN ticket (screens for all 4 roles; see Modules). typecheck, lint, 207 Vitest tests and 16 Playwright e2e all pass. E2E and `npm run dev:mock` still use a **fake backend**; nothing has run on a real phone yet.
- **Backend: every endpoint of the contract is built** (branch `KAN-24-backend-auth`, not committed): auth, machines, QR, documents, videos + pipelines, questions, Makineye sor, maintenance, alerts + WebSocket, patron panel, `/uploads`, SQLAdmin `/admin`. ruff, mypy strict and 131 pytest tests pass (real ffmpeg + Tesseract + in-memory Chroma, fake models). 2026-11-22: every In Review ticket's "Done when" was re-checked against Jira on a real stack (80 HTTP checks + browser walk-through of machine page, player, documents, maintenance, stickers, SQLAdmin); fixed: SQLAdmin links jumping to the backend origin, sticker selection (KAN-30), maintenance read-only + Turkish labels + http-only outside links in SQLAdmin (KAN-41), password reset in SQLAdmin (KAN-24). **Knowledge pipelines rebuilt to the user's spec (2026-11-22)**: Whisper sentences + speaking rate, Gemini correction of misheard words, TextTiling topics, snapshots, hybrid search (Chroma vectors + BM25, RRF) → cross-encoder rerank → gate → Gemini, document extraction for PDF/scanned PDF/DOCX/XLSX/CSV/TXT/photos, MySQL job queue + WS progress, dubbing timing (atempo 0.85–1.25, borrow from next pause, original audio kept as track 2). Live-checked with the real models on a 57 s two-topic Turkish narration + a 3-page manual: 15 s processing, both topics found, answers cited in tr/en, retrieval eval hit@5 = 1.0 / MRR 0.925 on 20 questions, near-miss questions refused, dub timing verified with a stand-in voice. Vertex (`VERTEX_PROJECT_ID`/`VERTEX_REGION` from the user's stageHandSdk) is used only for Gemini answers/summaries. Translation and dub speech use Google's free endpoints (no Cloud APIs to enable); dev video 1 is dubbed into en + ar with them (2026-11-22, 0 late clips; re-mixed voice-only the same day). Known: Whisper small mishears some words ("basın çaltı"); a beep alone was not tested with Whisper's VAD. Not done: login rate limiting, Playwright against the real backend.
- **Database: ready.** MySQL 8.4 (Homebrew, `brew services start mysql@8.4`, runs on login) on `127.0.0.1:3306`. Databases `usta` (dev) and `usta_test` (pytest), both utf8mb4; app user `usta`@`localhost` has rights on those two only. Connection strings and passwords are in `backend/.env` (`DATABASE_URL`, `TEST_DATABASE_URL`, `MYSQL_ROOT_PASSWORD`, `SECRET_KEY`); read them from there via pydantic-settings, never hard-code or commit them. Tables come only from Alembic migrations, never by hand (pytest upgrades `usta_test` to head at session start). Dev DB `usta` is at migration head `fda009f1dda2` (transcript `raw_text`, 2026-11-22); its 1 video (now LLM-corrected, en + ar dubs redone), 1 document and 1 usta answer were re-indexed with `app.jobs.cli reprocess`. `migrations/env.py` `include_object` keeps autogenerate from dropping tables our models don't define (`users_old`). An older hand-made `users` table (id, name, email, age, created_at; 2 rows) was renamed to `users_old`, not from a migration (the new migration deliberately leaves it); drop it when no longer needed. The user browses data with MySQL Workbench (`brew install --cask mysqlworkbench`).
- **Git:** frontend + `.claude/` + CLAUDE.md committed on branch `init-frontend-react-with-ui-screens` (pushed to `origin`, GitHub `SoftwareEngAhmetDemir/usta`); no PR yet. Root `.gitignore` ignores `.env*` (except `.env.example`, `frontend/.env.mock`), Python caches, `.venv/` and `uploads/`.
- **Jira (synced 2026-11-22, statuses unchanged; today's fixes posted as comments on KAN-24, 25, 27, 29, 30, 33, 35, 41, 62; the user tests and moves In Review → Done themselves, Claude never moves to Done; workflow To Do → In Progress → In Review → Done):** **In Review** (every "Done when" item built + tested against the real backend; waiting for commit/PR/review): KAN-24, 25, 26, 27 (edit only in SQLAdmin; ustas may create = deviation), 28, 29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41, 62, 66, 70, 71, 74, 76, 78. **In Progress**: KAN-23 (demo-reuse decision not recorded), 35/73 (real Android + iPhone test), 42 (Vertex works, LLM only), 43 (pdfplumber + Tesseract OCR, not PyMuPDF), 44 (no part-by-part for long manuals), 45/50/55/56 (dubbing/subtitles work via the free endpoints; verify on a phone), 46 (no Chatterbox language check), 48 (faster-whisper small now, as the ticket says; verify "Done when"), 49, 53 (atempo 0.85–1.25 per the user's spec, not 0.90–1.25; no Gemini shortening; dub track also stored as videos/<id>/<lang>.m4a), 58/59 (topic/section chunks with end time + overlap now; verify), 60/61/63/65/77 (live answers checked; 10 pilot questions), 64 (answer files now go through document ingestion; verify). **To Do**: KAN-21, 22, 51 (Demucs), 52 (Chatterbox voice clone), 67–69 (pilot), 79, 80, epics. Move to Done only after merge + the remaining items.
- **Test accounts** on the dev DB `usta` (http://localhost:5173), for manual/browser testing (user's decision to keep them here): İşçi `eng.ahmed.demir@gmail.com` / `A3eilm2s2y` · Usta `5362714612` / `A3eilm2s2y`. No patron/technician test account yet: make one with `app.auth.cli`. Isolated smoke testing: run a second uvicorn on :8001 with `DATABASE_URL` = the test DB and a temp `UPLOADS_DIR`, plus `VITE_BACKEND_URL=http://localhost:8001 vite --port 5174`; empty `usta_test` afterwards (pytest only empties tables *after* each test, so leftover rows fail the first test).
- **Try it:** `./dev.sh` runs the real stack. Make a patron (`app.auth.cli set-role --role patron`), open `/admin` to create machines and assign ustas, then use the app. Mock UI without backend: `cd frontend && npm run dev:mock`, then tap a demo user (İşçi / Usta / Teknisyen / Patron). Videos and QR images don't load in mock mode (no media files).

**Next steps (suggested order):**
1. User opens the PR for `init-frontend-react-with-ui-screens` (Claude does not; `gh` is not logged in). Rotate the MySQL root password: its real value was committed in `backend/.env.example` (commit `a38fdcb`, pushed); the template now says `CHANGE_ME`.
2. Upload a real usta video + manual, ask in Arabic/English, and tune `ASK_MIN_SCORE` / `TOPIC_DEPTH_SD` with the pilot questions (`scripts/eval_retrieval.py`).
3. Restore Jira access and check every ticket's "Done when" against the built backend; then move tickets.
4. Point Playwright `webServer` at uvicorn + a seeded `usta_test`, replace `frontend/e2e/backend.ts` stubs with real calls; test on a real Android + iPhone (camera: KAN-35, PDF `#page=`: KAN-45).

## Architecture

Flow: page component → `useApi(path, poll?)` / feature `api.ts` →
`src/api/client.ts` (`fetch('/api/...')`, cookie session) or `upload.ts` (XHR with progress) → Vite proxy (`/api`,
`/uploads`, `/admin` → `localhost:8000`, override with `VITE_BACKEND_URL`) → FastAPI. Live alerts: `AlertsProvider`
keeps a WebSocket to `/api/ws/alerts` (reconnect with backoff) and refetches `/alerts` on each message.
Routing (`src/app/AppRoutes.tsx`): `/login` and `/register` public; everything else inside `RequireAuth` → `AlertsProvider` → `AppLayout`
(header + bell + toast + per-role bottom menu from `src/app/nav.ts`). `/` redirects to the role home (`HOME_BY_ROLE`).
Backend: thin routers → services → SQLAlchemy async (MySQL) / `AppContext` (`app/context.py`: settings, sessionmaker,
`ai: AIServices`, `jobs: JobQueue`, alert `hub`), built once in `create_app`. Slow work (video pipelines, document
ingestion, translations, answer indexing, re-embedding) is a row in the MySQL `jobs` table, claimed by one worker loop
**inside the backend process** (ChromaDB persistent mode and the alert hub are single-process: a second process
writing vectors broke reads, checked 2026-11-22); heavy work runs in threads/ffmpeg subprocesses. Interrupted jobs are
requeued at startup; chunks of an older embedding model are re-embedded. Pages never call AI while rendering:
translations are stored (`translations` table) by jobs after a write, reads only look them up (`Localizer`).
Makineye sor: question (+ its machine translation into the content language) → vector top-20 + BM25 top-20 per
phrasing → RRF → cross-encoder rerank → top 5 → gate (`ASK_MIN_SCORE`, no LLM below) → Gemini (cite or drop) →
sources built from our own records → `ask_logs`.

## Modules

- `backend/app/` — `main.py` (`create_app(database_url?, ai?, background?)`, `API_ROUTERS` under `/api`, `/uploads` at root, SQLAdmin, Turkish 422 handler, `startup()`: requeue + re-embed + worker + model warm-up), `config.py` (`Settings`: DB URLs, uploads, `public_url`, `gemini_*`, `vertex_*`, model names, `chroma_dir`, `tessdata_dir`, topic/snapshot/ask thresholds, `max_upload_mb`), `context.py` (`AppContext`), `deps.py` (`CtxDep`, `SessionDep`, `not_found`, `forbidden`), `db.py`, `models.py` (imports all models for Alembic), `uploads_router.py` (login-only file serving with Range).
- `app/core/` — `schemas.py` (`PersonRef`, `AuthorizedPerson`, `LocalizedText`, `UtcDateTime` → ISO +00:00, `utcnow`), `languages.py` (`LANGUAGES`: 81 codes valid for Google's free endpoint and Whisper, native + Turkish name (`tr_name`), tr/en/ar first; `ISO639_2` MP4 tags; `VOICED` = the free speech endpoint speaks it, checked live; `localized`), `storage.py` (`save_upload`, `abs_path` no escape, `url`).
- `app/ai/` — `interfaces.py` (Protocols `Transcriber`, `Embedder`, `Reranker`, `VectorStore`, `Translator`, `TTSEngine`, `LLMClient`; `AIServices` bundle; `AIUnavailableError`), `factory.build(settings)`, `whisper.py` (faster-whisper, VAD + word timestamps, reads our 16 kHz WAV itself: its PyAV decoder breaks with current PyAV), `local_models.py` (`E5Embedder` query/passage prefixes, `CrossEncoderReranker` sigmoid 0..1; lazy, thread-safe), `chroma.py` (`ChromaVectorStore`, cosine, `machine_id` filter), `google_free.py` (`GoogleFreeTranslator` one call per text, `GoogleFreeTTS` ≤180-char pieces → MP3 → 24 kHz WAV via ffmpeg; 4 in parallel, retry on 429/5xx), `gemini.py` (`GeminiLLM` answer/summarize/`refine_transcript` in batches of 60 sentences, `client()` key or Vertex, SDK retry on 429/5xx), `ocr.py` (Tesseract), `disabled.py`, `prompts.py` (answer rules: sources only, newer wins, numbered steps, keep safety warnings, cite; questions to "you" are about the usta in the video, answered in the third person). Tests use `tests/fakes.FakeAI` (`.services`).
- `app/jobs/` — `models.Job` (queued/processing/done/failed, progress, step, error, attempts), `queue.JobQueue` (enqueue, claim `FOR UPDATE SKIP LOCKED`, `run_one`, `drain` for tests, `requeue_interrupted`, worker loop; `JobFailedError` = message shown to users), `registry.register_jobs`, `router.py` (`GET /jobs/{id}`, `WS /ws/jobs/{id}`), `cli.py` (`reprocess`, `reembed`; never opens the vector store).
- `app/auth/` (KAN-24) — `models.py` (`Role`, `User` + `authorization_document`, `AuthSession`), `passwords.py` (scrypt), `schemas.py` (`normalize_login`, `RegisterIn` with `SELF_SERVICE_ROLES`, `Me`), `service.py`, `deps.py` (`CurrentUser`, `require_role`, `PatronUser`), `router.py` (+ `me_router`: `/languages`, `/me/language`), `cli.py` (`create` / `set-role`).
- `app/machines/` — `models.py` (`Machine`, `machine_ustas`, `ExternalVideo`), `permissions.py` (`actions` incl. `qr`, `can_answer`, `is_usta_of`), `service.py` (`machine_page`, `embed_url`, `search_condition` shared with admin search), `qr.py` (SVG + A4 sticker PDF, QR → `{PUBLIC_URL}/m/{id}`), `router.py`.
- `app/videos/` — `models.py` (`Video` + `language_hint`, `speaking_rate`; `VideoStep`; `TranscriptSegment` = one sentence with logprob, words, rate, pauses, `raw_text` = Whisper's words when corrected; `TopicSegment`; `Snapshot`; `DubbedVersion`), pure `timeline.py` (`build_sentence_timeline`, `compute_speaking_rate`, `format_timestamp`, `transcript_lines`), `topics.py` (TextTiling: embeddings + 5-letter word stems, depth scores, min/max length), `dubbing.py` (`fit_clip_to_slot`, `plan_dub` borrow-and-warn, `vtt`/`srt`), `snapshots.py` (ffmpeg frames, numpy Laplacian sharpness; no OpenCV: its FFmpeg libs clash with PyAV's), `media.py` (ffmpeg: transcode, 16 kHz WAV, retime, `place_clips`, `dub_track`, `mux_dub` 2 audio tracks), `refine.accept_refinement` (guard: non-empty, length 0.5–2x of Whisper's), `pipeline.py` ("upload": transcode→audio→transcribe→refine (LLM; optional, never fails the video)→topics→snapshots→index; "<lang>": translate→subtitles→voice→mix; `job`, `start`, `reset_for_reprocess`), `cleanup.remove_video`, `service.py`, `router.py` (`create_video` reused by answers, `DELETE /videos/{id}`).
- `app/documents/` — `models.py` (`Document` + `file_name`, `language`; `DocumentPage`; `DocumentSummaryText` per language), `extract.py` (pdfplumber text/headings/tables→markdown, scanned pages + photos via Tesseract, DOCX, XLSX, CSV, TXT; `SUPPORTED`, `BY_EXTENSION`), `service.py` (`process`/`job`: extract → pages → chunks → summary (LLM) → MT per language; `remove_document`), `router.py` (upload, `DELETE /documents/{id}`).
- `app/questions/` — `models.py` (`Question` incl. answer fields), `service.py` (`QaEntry`, `MyQuestion`, `InboxQuestion`, `answerable_by`, `recipients`, jobs `translate_question` and `after_answer` (answer text → chunk; answer file → a Document through ingestion)), `router.py` (ustaya sor, inbox, answer, `/ustas/{id}`).
- `app/ask/` (KAN-60, 76-78) — `service.answer_question` (see Architecture; `_translated` question for retrieval; sources from our records only), `models.AskLog` (question, retrieved ranks/scores, LLM called, answer, cited chunks, confidence, feedback), router (+ `POST /ask/{id}/feedback`). `app/search/` — `models.Chunk` (machine, source type + owner, topic, title, start/end sec, page, section, language, snapshot paths, text, embedding model version), `service.py` (`ChunkIn`, `Owner`, `embed_and_store`, `delete_chunks`, `reembed_stale`, `hybrid_search`, `rerank`), pure `keyword.py` (`tokenize` keeps codes like E-204, accent-free `normalize`, `BM25`, `rrf_merge`), pure `chunking.py` (`chunk_video` ≤400 tokens + 1-sentence overlap, `chunk_document` per heading+page ≤500 tokens, tables split by rows with header), `evaluation.py` (hit@k, MRR), `jobs.py` (`reembed`). `backend/scripts/eval_retrieval.py`.
- `app/translations/` — `Translation` store, `translate(db, translator, ...)` (machine translation, cached; source `AUTO_DETECT`), `languages_in_use` (tr + every user's language: eager translations only go there), `translate_everywhere(items, targets?)`, `Localizer`, `backfill.py` (job `language_backfill`: questions, answers and document summaries into a language a user just chose). `app/maintenance/` — `MaintenanceRecord`, `MaintenanceAttachment`, router (openers = machine ustas + patrons + technicians). `app/alerts/` — `Alert`, `hub.AlertHub` (per-user sockets), `service.notify`, router (+ `WS /ws/alerts`, cookie auth).
- `app/admin/` — `router.py` (`/admin/machines` stats + search, `/admin/users`, `/admin/qr-stickers.pdf`), `views.py` (SQLAdmin, `PatronOnly` auth reusing the session cookie; machine photo / authorization document uploads via `on_model_change`; user form has a non-column "Yeni şifre" field (empty = unchanged, hash never shown); outside-video links must be http(s); maintenance records read-only; deleting videos/documents removes their files).
- `backend/migrations/` (Alembic; `alembic.ini` points here) — `versions/` (one file per schema change), async `env.py` (URL from settings, or `config.attributes["url"]`; offline `--sql` works), `README.md` (cloud deploy: run `alembic upgrade head` before starting; SQL-only fallback). `backend/tests/` — `conftest.py` (temp `UPLOADS_DIR`, migrates `usta_test`, empties tables after each test, `app`/`ctx`/`client_as(user)`/`make_user`/`make_machine`/`sample_video` fixtures), `fakes.py` (`FakeAI` with fake transcriber/embedder/reranker/translator/TTS/LLM + real in-memory Chroma), one test file per feature + pure-function tests (`test_timeline`, `test_topics`, `test_dubbing`, `test_retrieval_pure`, `test_snapshots`, `test_evaluation`, `test_jobs`).
- `frontend/src/api/` — `types.ts` (FE↔BE contract, mirrors future Pydantic schemas), `client.ts` (`request`, `postJson`, `postForm`, `ApiError`, `errorMessage` → Turkish), `upload.ts` (`uploadWithProgress`), `useApi` (GET + poll as number or fn of data), `useAction`.
- `frontend/src/components/` — shared UI: SearchSelect (drop-down with a search box, ARIA combobox + listbox; `filter.ts` folds case/Turkish i/accents and searches label, hint (Turkish name) and code; used for every language choice), Button, Pill, SectionTitle, EmptyState, PageTitle, Spinner, ErrorMessage, AsyncView, Field, Localized (lang+dir), ProgressBar, StepList, AuthorizedBadge, MaintenanceTimeline, QaCard.
- `frontend/src/lib/` — `format.ts` (tr-TR dates, m:ss durations), `labels.ts` (document type / outside source labels).
- `frontend/src/app/` — `App` (BrowserRouter), `AppRoutes`, `AppLayout`, `NavBar`, `HomeRedirect`, `nav.ts`.
- `features/auth` — `AuthProvider`, `useAuth`/`useMe`, `RequireAuth` (remembers target, e.g. scanned machine), `LoginPage` (KAN-24), `RegisterPage` + `RegisterForm` (self sign-up, role chips İşçi/Usta, default İşçi; keeps the remembered target), `AuthShell` (frame of both), `redirect.ts` (`fromState`). Login ↔ register links pass router state along.
- `features/alerts` — `AlertsProvider` (context `received` counts live alerts; usta home refetches its inbox on it), `useAlertSocket`, `AlertBell`, `AlertToast`, `AlertsPage` (KAN-66).
- `features/machine-new` — `NewMachinePage` + `MachineForm` (code + name required), `api.createMachine`; linked from usta home (`MachineChips` "+ Makine ekle") and the patron panel (KAN-27).
- `features/scan` — `ScanPage`: worker home (KAN-29). `QrScanner` + `useQrScanner`: back camera + native `BarcodeDetector` in the page, sends the QR text to `/machines/lookup`; explains when it can't run (plain http, or no BarcodeDetector as on iPhone Safari → phone's own camera). `CodeForm`: typed-code fallback.
- `features/language` — `LanguageMenu` (header 🌐 menu: the site's content language) + `useLanguageSwitch` (`PATCH /me/language`; `AppLayout` keys the page by language so it reloads in it), `languageOption`.
- `features/machine-page` — `MachinePage` (details, ustas, Makineye sor, videos + outside videos, documents + summary, maintenance, Q&A; empty states + role actions from `actions`; `ArchiveMachine` "Makineyi kaldır" with a confirm step → home; `MachineQr` QR + one-sticker PDF when `actions.qr`) (KAN-31/71, 28, 34, 40, 45, 46, 65).
- `features/video-player` — `VideoPage` (`?t=` start second; `useVideoPlayer` polls while any track is preparing and switches to a language picked from the menus once it is ready), Player (per-language muxed stream + WebVTT), TrackPicker, PreparationCard (steps, retry), Transcript (KAN-38, 50, 55, 56).
- `features/documents` — `DocumentPage` (`?page=`), SummaryCard (RTL), DocumentViewer (inline PDF/image; other types download only), `DocumentUploadPage` `/m/:id/documents/new` (machine page "Belge yükle"; reuses admin's `DocumentUploadForm`/`uploadDocument`/`useFormSubmit` via `features/admin` index) (KAN-33, 45).
- `features/ask` — `AskPage`, `useAsk`, AnswerCard (+ `Feedback` 👍/👎 via `useFeedback`), SourceCard (video + backend `timestamp_label` + keyframe / document + page + section / usta answer), NotFoundCard (Ustaya sor) (KAN-61, 62).
- `features/my-questions` — `MyQuestionsPage` "Sorularım" (KAN-62).
- `features/usta` — `UstaHomePage` (inbox, his machines, `MachineSearch` over all machines, answered; also the patron's "Sorular" page), `ReplyPage` (text / video / file; question shown in any language via `useQuestionIn`), `UstaProfilePage` (KAN-28, 63, 65).
- `features/recorder` — `RecorderPage` (machine first: from `?machine=` (machine page "Video çek", reached by QR) or the `/me/machines` list; until a machine the user may record on is chosen there is no camera, record button or file picker, only a hint linking to `/scan`; an usta with no assigned machine sees why), `useCamera` (back camera default, flip), `useRecorder` (MediaRecorder or picked file), `useVideoUpload` (progress, retry keeps clip), ProcessingPanel (KAN-35, 36, 73, 74).
- `features/maintenance` — `TechHomePage`, `MaintenanceFormPage` (doer/time from session; returns to machine page with the new record highlighted) (KAN-26, 39).
- `features/admin` — patron panel: `AdminMachinesPage` (stats, backend search, table, document upload, outside video), `StickersPage` (QR images + PDF of the ticked machines), `UsersPage` (KAN-30, 32, 33, 34). Editing records lives in SQLAdmin `/admin` (KAN-41).
- `frontend/src/test/` — `fixtures.ts` (example data shared by Vitest and Playwright), `utils.tsx` (`mockApi`, `renderAt`, `renderAuthed`).
- `frontend/e2e/` — Playwright specs per role; `backend.ts` stubs `/api` + the alerts WebSocket until the backend exists.
- `frontend/src/mock/` — `npm run dev:mock` only (`.env.mock` sets `VITE_MOCK=1`, loaded lazily from `main.tsx`): `db.ts` (state from test fixtures, kept in localStorage; demo logins isci/usta/teknisyen/patron), `handlers.ts` (fake API, same contract), `transport.ts` (fetch/XHR/alerts-WebSocket shims). `auth/components/DemoLogin` shows one-tap role logins in this mode.

## API

- `GET /api/health` → {status: "ok"} (also checks the DB) — Playwright webServer readiness, smoke test

Contract the frontend calls (all under `/api`, cookie session; types in `frontend/src/api/types.ts`). Errors are `{detail: "<Turkish message>"}` (422 too). All implemented. Files: `GET /uploads/<path>` (login required, Range). SQLAdmin: `/admin` (patrons only).
- `POST /auth/register` RegisterIn {name, login, password, role: worker|usta} → 201 Me (sets cookie; 409 login taken; 422 for technician/patron) · `POST /auth/login` LoginIn → Me (401) · `POST /auth/logout` → 204 · `GET /auth/me` → Me | 401 — `features/auth` (KAN-24, built)
- `PATCH /me/language` {language} → Me (queues `language_backfill`; `Me.language_name` = native name) · `GET /languages` → Language[] (81, with `tr_name`) — header language menu · `VideoLanguageTrack.audio` = `unavailable` for languages without a voice; tracks carry `language_tr_name`
- `POST /machines` MachineIn {code, name, type, model, serial, location} → 201 {id} (usta/patron; an usta becomes its usta; 409 code taken) · `POST /machines/{id}/archive` → 204 (`actions.archive`: its ustas or the patron) (KAN-27) · `GET /machines?q=` → MachineHit[] (usta/patron, any machine, max 50) · `GET /machines/{id}/qr.svg` / `sticker.pdf` (`actions.qr`: its ustas or the patron)
- `GET /machines/{id}` → MachinePage (404 = not found; archived machines still open) · `GET /machines/lookup?code=` → {id} (code = sticker code, or the scanned QR URL `…/m/{id}` from any host) — machine page, ask, scan
- `POST /machines/{id}/ask` AskIn → AskResult (answered: answer, sources, confidence, ask_id; not_found: ustas, ask_id) · `POST /ask/{id}/feedback` {feedback: helpful|not_helpful} → 204 (asker only) · `POST /machines/{id}/questions` AskIn → QuestionSent — ask
- `GET /me/questions` → MyQuestion[] · `GET /me/inbox` → InboxQuestion[] · `GET /questions/{id}[?lang=]` → InboxQuestion (`lang`: the question machine-translated into it now, source auto-detected; 422 unknown, 503 translator down) · `POST /questions/{id}/answer` multipart(text?, video?, file?) — my-questions, usta
- `GET /ustas/{id}` → UstaProfile — usta home/profile
- `GET /videos/{id}` → VideoDetail · `POST /videos/{id}/languages/{lang}` → Preparation · `POST /videos/{id}/languages/{lang}/steps/{step}/retry` → Preparation — player
- `POST /machines/{id}/videos` multipart(title, file, language?) → VideoProcessing (+ `job_id`) · `GET /videos/{id}/processing` → VideoProcessing · `GET /me/machines` → machine refs — recorder · `DELETE /videos/{id}` → 204 (patron / machine usta; chunks, vectors, topics, snapshots, dubs, files)
- `GET /jobs/{id}` → JobOut {status, progress, step, error} · `WS /ws/jobs/{id}` pushes JobOut until done/failed (cookie auth)
- `GET /documents/{id}` → DocumentDetail · `DELETE /documents/{id}` → 204 (patron / machine usta) — documents
- `GET /machines/{id}/maintenance-form` → MaintenanceFormOptions · `POST /machines/{id}/maintenance` multipart(description, opened_by_id, attachment?) → MaintenanceRecord · `GET /me/maintenance` → MaintenanceRecord[] — maintenance
- `GET /alerts` → AlertList · `POST /alerts/{id}/read` → AlertList · `WS /ws/alerts` pushes Alert — alerts
- `GET /admin/machines?q=` → AdminMachineList · `GET /admin/users` → AdminUser[] · `POST /machines/{id}/documents` multipart(type, title, file: PDF/DOCX/XLSX/CSV/TXT/image) → DocumentSummary · `POST /machines/{id}/external-videos` ExternalVideoIn → ExternalVideo · `GET /admin/qr-stickers.pdf?ids=1&ids=2` (no ids = all) — admin

## Decisions

- 2026-11-19: Frontend built before the backend; `src/api/types.ts` is the contract the backend must implement. E2E stubs `/api` via `page.route` (e2e/backend.ts) until FastAPI exists; then add uvicorn to Playwright `webServer` and drop the stubs. E2E runs its own Vite on port 5199 so a dev server on 5173 doesn't block it.
- 2026-11-19: Backend decides everything domain-shaped: role actions (`MachinePage.actions`), alert target (`Alert.path`), default tracks, text direction (`LocalizedText.dir`), search, unread count. Frontend only renders.
- 2026-11-19: Dubbed audio is served as one muxed stream per language (`VideoLanguageTrack.stream_url`), so no client-side audio/video sync; switching keeps the position.
- 2026-11-19: Lint is oxlint (template default) with `typescript/no-explicit-any: error`, `--deny-warnings`; `jsx-a11y/media-has-caption` off because user-recorded clips and camera previews have no caption files (subtitles come via KAN-50 tracks).
- 2026-11-21: Fake data must never reach the real backend: e2e `backend.ts` also stubs `/uploads/*` (404, recorded in `calls`), and `vite --mode mock` has no proxy at all. (Fixture media URLs used to leak to :8000 and show as 401s in its log.)
- 2026-11-21: Migrations folder is `backend/migrations/` (was `backend/alembic/`, renamed for clarity and so it no longer shadows the `alembic` package). Deploys run `alembic upgrade head` before the app starts; `TEST_DATABASE_URL` is optional so a server needs only `DATABASE_URL` + `SECRET_KEY`.
- 2026-11-21: Tarama has an in-page QR scanner (native `BarcodeDetector`, no new dependency). The camera (scanner and recorder) only works in a secure context: on a phone open the **https** VS Code forwarded URL (Vite `allowedHosts: .devtunnels.ms`), not `http://<LAN IP>:5173`. iPhone Safari has no BarcodeDetector: there the phone's own camera opens the QR URL (the original design); add `jsqr` if in-page scanning is needed on iPhone.
- 2026-11-21: No `<StrictMode>` in `main.tsx`: its dev double-mount sent every API request twice (user-visible in the backend log). e2e `opening a page calls each API once` guards it.
- 2026-11-19: Logging out drops the remembered "return to" page, so the next login goes to that user's role home.
- 2026-11-19: Session is an httpOnly cookie on the Vite origin (proxy), so it survives reloads and works over the VS Code forwarded port; the WebSocket uses the page origin (wss on https).

- 2026-11-21: Backend routes all live under `/api` (Vite proxies without rewriting). SQLAdmin at `/admin` lets in only patrons. The Vite `/admin` proxy keeps the browser's Host (no `changeOrigin`) and passes `X-Forwarded-Proto`, because SQLAdmin builds absolute links; with `changeOrigin` its links pointed at :8000. Ruff ignores RUF001–003 (Turkish/Arabic letters are intentional) and RUF012 in `admin/views.py` (SQLAdmin config style).
- 2026-11-21: Ustas and the patron add machines in the app (`/machines/new`, user's decision; KAN-27 says patron only, so tell the team); an usta who adds one becomes its usta. "Makineyi kaldır" archives (`machines.archived_at`): gone from every list, lookup and the sticker PDF, but its page, videos, documents and history stay; the patron restores it by clearing "Arşivlendi" in `/admin`. Editing machine details is still SQLAdmin only.
- 2026-11-21: `./dev.sh` runs `alembic upgrade head` before starting uvicorn, so a new migration never crashes the dev server.
- 2026-11-22 (user's decision): the patron can do everything; an usta adds machines, searches all machines, and prints the QR / sticker of their own machines. Permissions: record video = patron or the machine's usta; QR + sticker = patron or the machine's usta (sheet of many = patron panel); upload documents = patron or the machine's usta; outside videos = patron; maintenance = technician or patron; answer = the machine's ustas or the patron (any question; patron inbox = all open questions, alerts still go to the machine's ustas, patron only when it has none). Nobody is ever a recipient of, sees in their inbox, or answers their own question; "Ustaya sor" never lists the asker; if nobody else could answer (e.g. the only usta and no patron) `POST /machines/{id}/questions` → 409. Patron menu: Yönetim · Sorular (`/usta`) · Video çek · Bildirim. Self-registered ustas see nothing to answer until the patron assigns them machines in `/admin`.
- 2026-11-22 (user's spec + choices: rework inside this app, light model set; MT/TTS via Google's free endpoints): the LLM (Gemini; `GEMINI_API_KEY` wins over Vertex `VERTEX_PROJECT_ID`/`VERTEX_REGION` + gcloud ADC) writes the final answer, document summaries (KAN-44) and, by the user's later request, corrects Whisper transcripts sentence by sentence (times kept, Whisper text kept in `raw_text`, suspicious corrections rejected, skipped without the LLM). Translations/dubs are made from the corrected text. Transcription (faster-whisper), embeddings (multilingual-e5-base), rerank (bge-reranker-v2-m3), OCR (Tesseract), topics, snapshots, chunking and retrieval are local, no LLM. Without Gemini: answers → "not found", no summaries; search, transcription, translation and dubbing still work. An answer must cite at least one given source, else it is dropped; its sources come from our records, never from LLM text.
- 2026-11-22: Vectors in ChromaDB (persistent, in-process, `backend/.chroma`) behind `VectorStore`; chunk text + metadata in MySQL `chunks` (same id). Keyword side is BM25 in Python per machine (exact tokens like E-204), not MySQL FULLTEXT (its tokenizer splits/drops short codes). `ASK_MIN_SCORE` 0.08 on the rerank score, tuned live (unrelated ≤ 0.044, paraphrases 0.09–0.33; Gemini still refused 5/5 near-misses).
- 2026-11-22: Topics: TextTiling over e5 embeddings **and** 5-letter word stems (embeddings alone saw no topic change in a real two-topic video), boundary at depth > mean + 0.5 sd, 20 s–3 min. PySceneDetect not used (optional in the spec). Every question is also machine-translated (source language auto-detected, not taken from the profile) into each content language, for retrieval only.
- 2026-11-22: Jobs: MySQL `jobs` table + one worker loop inside the backend process, not a separate process (Chroma + alert hub are single-process). Dubbing: Google's free translate + speech endpoints (one default voice per language; user's decision: no Cloud console, Vertex only for the answer), clips fitted with atempo 0.85–1.25, a clip that still doesn't fit pushes the next one (warning when it overruns the next pause), the dub track is the translated voice only, no original sound under it (user's decision 2026-11-22; machine noise would need KAN-51 Demucs), MP4 with dub track first + original track second, `.vtt` + `.srt`, cached per (video, language) in `dubbed_versions`. Upload marks the video playable after transcode.

- 2026-11-22 (user's request: any language, as drop-downs): 81 languages; every language choice (header site language, video subtitles/audio, reply page question) is a searchable drop-down (`components/SearchSelect`, own ~150 lines, no new dependency; user asked for search 2026-11-23); the machine page's own "İçerik dili" bar was replaced by the header menu (2026-11-23). Languages Google's free speech can't speak (az, fa, ku, uz, ps, kk, ky, tk, ka, hy, …) get translated subtitles only (pipeline translate → subtitles). Content is translated ahead only into languages in use; choosing a new one queues a backfill. Tailwind/shadcn not added (user offered; full restyle is a separate task, its preflight would change every screen).
- 2026-11-21: Self sign-up (`/register`) lets the user pick İşçi or Usta (`SELF_SERVICE_ROLES` in `app/auth/schemas.py`); Teknisyen/Patron only via the patron (CLI `set-role` or SQLAdmin `/admin` → Kullanıcılar). User's decision; not in the KAN-80 demo, so tell the team. Risk: anyone can become an Usta who answers questions; revisit (patron approval) before real use.
- 2026-11-21: Sessions are DB rows (`auth_sessions`, sha256 of a random token), not signed cookies, so logout really ends a session. Cookie `usta_session`: httpOnly, SameSite=Lax, 90 days, not `secure` (plain http behind the Vite proxy). Passwords use stdlib scrypt (no extra dependency).
- 2026-11-21: Login is normalized (phone digits only, e-mail lower case) in the Pydantic schema, so `0532 123 45 67` and `05321234567` are the same account.

## Maintaining this file

After every code change, in the same task:
- Update **Architecture / Modules / API / Decisions** so they describe the code as it is now.
- Update **Current status** (what is done, git/Jira state, next steps) so the next session can pick up where this one stopped.
- Remove entries for deleted code. Do not keep a changelog here; git history has that.
- Keep it short: one line per item, details belong in the code.
