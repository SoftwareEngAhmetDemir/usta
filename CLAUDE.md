# usta (Usta Hafızası)

Claude Code loads this file into every session. It is the source of truth for **how this
project currently works**. Keep it current (see "Maintaining this file").

## Product

Machine knowledge app for factory workers. A worker scans a machine QR code and lands on the machine page, which shows
details, ustas (experts), videos, documents with an AI summary, maintenance history and Q&A. Content can be shown in
Turkish, English or Arabic. The UI language is Turkish.
- **Roles**: İşçi (worker), Usta (expert who answers and records videos), Teknisyen (records maintenance jobs), Patron (admin: machines, QR sticker sheet, users and roles).
- **"Makineye sor"** (KAN-60): answers come only from this machine's video pieces, document pages and earlier usta answers, in the worker's language, with sources (video + mm:ss, document + page). If no match scores high enough, the answer is "not found" and the worker is offered "Ustaya sor" (ask an usta). These are dangerous machines, so a wrong, invented answer is worse than no answer.
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
| LLM | Gemini | called only from `backend/app/ai/`, behind a `Protocol` |
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
  app/ai/             LLM clients (behind Protocols), prompts, output parsers
  tests/              pytest, mirrors app/
```

### Commands
- Whole app: `./dev.sh` (repo root) starts uvicorn :8000 + Vite :5173 together; Ctrl+C stops both. Open http://localhost:5173.
- Frontend: `cd frontend && npm run dev | typecheck | lint | test | test:e2e`
- Backend (venv `backend/.venv`, Python 3.12; setup: `python3.12 -m venv .venv && .venv/bin/pip install -e '.[dev]'`): `cd backend && .venv/bin/uvicorn app.main:app --reload`, `.venv/bin/ruff check .`, `.venv/bin/mypy .`, `.venv/bin/pytest -q`, migrations `.venv/bin/alembic revision --autogenerate -m <msg>` / `.venv/bin/alembic upgrade head`
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
- **When Claude tries to finish**: `.claude/hooks/verify.sh` checks that changed source has matching tests and that
  CLAUDE.md was updated, then runs frontend typecheck/lint/test/test:e2e and backend ruff/mypy/pytest. On failure it
  sends Claude back to fix it (max 3 times, then Claude must report what is still failing).

## Current status (update at the end of each working day)

_Last updated 2026-11-21._
- **Frontend: built** for every `frontend`-labelled KAN ticket (screens for all 4 roles; see Modules). typecheck, lint, 171 Vitest tests and 11 Playwright e2e all pass. E2E and `npm run dev:mock` still use a **fake backend**; nothing has run on a real phone yet.
- **Backend: every endpoint of the contract is built** (branch `KAN-24-backend-auth`, not committed): auth, machines, QR, documents, videos + pipelines, questions, Makineye sor, maintenance, alerts + WebSocket, patron panel, `/uploads`, SQLAdmin `/admin`. ruff, mypy strict and 68 pytest tests pass (real ffmpeg, fake AI); a live smoke run over HTTP passed too. Built from `types.ts` + the mock handlers, **not** from Jira (Jira blocked): check each ticket's "Done when" once Jira works. **No GEMINI_API_KEY yet**: with AI off, Makineye sor answers "not found", videos play without subtitles/dubbing, documents get no summary. Gemini calls are untested against the real API. Not done: login rate limiting, Playwright against the real backend.
- **Database: ready.** MySQL 8.4 (Homebrew, `brew services start mysql@8.4`, runs on login) on `127.0.0.1:3306`. Databases `usta` (dev) and `usta_test` (pytest), both utf8mb4; app user `usta`@`localhost` has rights on those two only. Connection strings and passwords are in `backend/.env` (`DATABASE_URL`, `TEST_DATABASE_URL`, `MYSQL_ROOT_PASSWORD`, `SECRET_KEY`); read them from there via pydantic-settings, never hard-code or commit them. Tables come only from Alembic migrations, never by hand (pytest upgrades `usta_test` to head at session start). Dev DB `usta` is at migration head (2026-11-21). An older hand-made `users` table (id, name, email, age, created_at; 2 rows) was renamed to `users_old`, not from a migration; drop it when no longer needed. The user browses data with MySQL Workbench (`brew install --cask mysqlworkbench`).
- **Git:** frontend + `.claude/` + CLAUDE.md committed on branch `init-frontend-react-with-ui-screens` (pushed to `origin`, GitHub `SoftwareEngAhmetDemir/usta`); no PR yet. Root `.gitignore` ignores `.env*` (except `.env.example`, `frontend/.env.mock`), Python caches, `.venv/` and `uploads/`.
- **Jira (synced 2026-11-21, workflow To Do → In Progress → In Review → Done):** **In Review** (every "Done when" item built + tested against the real backend; waiting for commit/PR/review): KAN-24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41, 62, 66, 70, 71, 74, 76, 78. **In Progress**: KAN-23 (demo-reuse decision not recorded), 27 (archive missing; SQLAdmin delete cascades history), 35/73 (real Android + iPhone test), 42 (Gemini API key, not Vertex; no live TR/AR test), 43 (pypdf, not PyMuPDF; no "no text" flag), 44 (no part-by-part for long manuals), 45/50/55/56/61/63/65 (need a live Gemini run), 46 (no Chatterbox language check), 48 (Gemini, not faster-whisper), 49, 53 (atempo 1.0–1.6 not 0.90–1.25, no Gemini shortening, muxed mp4 not audio/<lang>.m4a), 58 (~600-char chunks, no end time/overlap), 59, 60/77 (10 pilot questions), 64 (answer files not indexed). **To Do**: KAN-21, 22, 51 (Demucs), 52 (Chatterbox voice clone), 67–69 (pilot), 79, 80, epics. Move to Done only after merge + the remaining items.
- **Try it:** `./dev.sh` runs the real stack. Make a patron (`app.auth.cli set-role --role patron`), open `/admin` to create machines and assign ustas, then use the app. Mock UI without backend: `cd frontend && npm run dev:mock`, then tap a demo user (İşçi / Usta / Teknisyen / Patron). Videos and QR images don't load in mock mode (no media files).

**Next steps (suggested order):**
1. User opens the PR for `init-frontend-react-with-ui-screens` (Claude does not; `gh` is not logged in). Rotate the MySQL root password: its real value was committed in `backend/.env.example` (commit `a38fdcb`, pushed); the template now says `CHANGE_ME`.
2. Put `GEMINI_API_KEY` in `backend/.env`, restart, and try the AI paths for real (transcription timestamps, TTS, ask threshold `ASK_MIN_SCORE`); failed transcriptions retry once at startup.
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
`ai`, `jobs`, alert `hub`), built once in `create_app`. Slow work (video pipelines, document processing, translations,
search indexing) runs as in-process background jobs (`core/jobs.JobRunner`) with state in MySQL; unfinished work is
resumed at startup. Pages never call the AI while rendering: translations are stored (`translations` table) by jobs
after a write, reads only look them up (`translations.service.Localizer`).

## Modules

- `backend/app/` — `main.py` (`create_app(database_url?, ai?, resume_jobs?)`, `API_ROUTERS` under `/api`, `/uploads` at root, SQLAdmin, Turkish 422 handler, `resume()`), `config.py` (`Settings`: DB URLs, uploads, `public_url`, `gemini_*`, `ask_min_score`, `max_upload_mb`), `context.py` (`AppContext`), `deps.py` (`CtxDep`, `SessionDep`, `not_found`, `forbidden`), `db.py`, `models.py` (imports all models for Alembic), `uploads_router.py` (login-only file serving with Range).
- `app/core/` — `schemas.py` (`PersonRef`, `AuthorizedPerson`, `LocalizedText`, `UtcDateTime` → ISO +00:00, `utcnow`), `languages.py` (`LANGUAGES` tr/en/ar, `localized`), `storage.py` (`save_upload`, `abs_path` no escape, `url`), `jobs.py` (`JobRunner.spawn/drain`).
- `app/ai/` — `protocol.py` (`AI` Protocol: transcribe, translate, embed, speak, answer, summarize, read_image; `DisabledAI`; `AIUnavailableError`), `gemini.py` (`GeminiAI`, JSON-schema outputs validated with Pydantic), `prompts.py`. Tests use `tests/fakes.FakeAI`.
- `app/auth/` (KAN-24) — `models.py` (`Role`, `User` + `authorization_document`, `AuthSession`), `passwords.py` (scrypt), `schemas.py` (`normalize_login`, `RegisterIn` with `SELF_SERVICE_ROLES`, `Me`), `service.py`, `deps.py` (`CurrentUser`, `require_role`, `PatronUser`), `router.py` (+ `me_router`: `/languages`, `/me/language`), `cli.py` (`create` / `set-role`).
- `app/machines/` — `models.py` (`Machine`, `machine_ustas`, `ExternalVideo`), `permissions.py` (`actions`, `can_answer`, `is_usta_of`), `service.py` (`machine_page`, `embed_url`), `qr.py` (SVG + A4 sticker PDF, QR → `{PUBLIC_URL}/m/{id}`), `router.py`.
- `app/videos/` — `models.py` (`Video`, `VideoStep` pipeline state, `TranscriptSegment`), `media.py` (ffmpeg: transcode, thumbnail, audio, `mix_dub`, `vtt`), `pipeline.py` ("upload": transcode→transcribe→index; "<lang>": translate→subtitles→audio→dub→mix; `run`, `resume_unfinished`), `service.py` (tracks, availability, `detail`, `processing`), `router.py` (`create_video` reused by answers).
- `app/documents/` — `models.py` (`Document`, `DocumentPage`, `DocumentSummaryText` per language), `service.py` (`process` job: pypdf pages / AI image read → search chunks → summary in every language), `router.py`.
- `app/questions/` — `models.py` (`Question` incl. answer fields), `service.py` (`QaEntry`, `MyQuestion`, `InboxQuestion`, `answerable_by`, `after_answer` job), `router.py` (ustaya sor, inbox, answer, `/ustas/{id}`).
- `app/ask/` (KAN-60) — `service.ask`: embed question → `search.nearest` (≥ `ask_min_score`) → `ai.answer` → only cited, existing sources; anything else = `not_found` + ustas. `app/search/` — `SearchChunk` (video / document / usta_answer + embedding JSON), `transcript_chunks`, `page_chunks`, `replace_chunks`, `nearest`.
- `app/translations/` — `Translation` store, `translate` (cached), `translate_everywhere` job, `Localizer`. `app/maintenance/` — `MaintenanceRecord`, `MaintenanceAttachment`, router (openers = machine ustas + patrons + technicians). `app/alerts/` — `Alert`, `hub.AlertHub` (per-user sockets), `service.notify`, router (+ `WS /ws/alerts`, cookie auth).
- `app/admin/` — `router.py` (`/admin/machines` stats + search, `/admin/users`, `/admin/qr-stickers.pdf`), `views.py` (SQLAdmin, `PatronOnly` auth reusing the session cookie; machine photo / authorization document uploads via `on_model_change`; deleting videos/documents removes their files).
- `backend/migrations/` (Alembic; `alembic.ini` points here) — `versions/` (one file per schema change), async `env.py` (URL from settings, or `config.attributes["url"]`; offline `--sql` works), `README.md` (cloud deploy: run `alembic upgrade head` before starting; SQL-only fallback). `backend/tests/` — `conftest.py` (temp `UPLOADS_DIR`, migrates `usta_test`, empties tables after each test, `app`/`ctx`/`client_as(user)`/`make_user`/`make_machine`/`sample_video` fixtures), `fakes.py` (`FakeAI`), one test file per feature.
- `frontend/src/api/` — `types.ts` (FE↔BE contract, mirrors future Pydantic schemas), `client.ts` (`request`, `postJson`, `postForm`, `ApiError`, `errorMessage` → Turkish), `upload.ts` (`uploadWithProgress`), `useApi` (GET + poll as number or fn of data), `useAction`.
- `frontend/src/components/` — shared UI: Button, Pill, SectionTitle, EmptyState, PageTitle, Spinner, ErrorMessage, AsyncView, Field, Localized (lang+dir), ProgressBar, StepList, AuthorizedBadge, MaintenanceTimeline, QaCard.
- `frontend/src/lib/` — `format.ts` (tr-TR dates, m:ss durations), `labels.ts` (document type / outside source labels).
- `frontend/src/app/` — `App` (BrowserRouter), `AppRoutes`, `AppLayout`, `NavBar`, `HomeRedirect`, `nav.ts`.
- `features/auth` — `AuthProvider`, `useAuth`/`useMe`, `RequireAuth` (remembers target, e.g. scanned machine), `LoginPage` (KAN-24), `RegisterPage` + `RegisterForm` (self sign-up, role chips İşçi/Usta, default İşçi; keeps the remembered target), `AuthShell` (frame of both), `redirect.ts` (`fromState`). Login ↔ register links pass router state along.
- `features/alerts` — `AlertsProvider`, `useAlertSocket`, `AlertBell`, `AlertToast`, `AlertsPage` (KAN-66).
- `features/scan` — `ScanPage`: worker home, machine-code fallback for the QR (KAN-29).
- `features/machine-page` — `MachinePage` (details, ustas, language switch, Makineye sor, videos + outside videos, documents + summary, maintenance, Q&A; empty states + role actions from `actions`) (KAN-31/71, 28, 34, 40, 45, 46, 65).
- `features/video-player` — `VideoPage` (`?t=` start second), Player (per-language muxed stream + WebVTT), TrackPicker, PreparationCard (steps, retry), Transcript (KAN-38, 50, 55, 56).
- `features/documents` — `DocumentPage` (`?page=`), SummaryCard (RTL), DocumentViewer (inline PDF/image + download) (KAN-33, 45).
- `features/ask` — `AskPage`, `useAsk`, AnswerCard, SourceCard (video+mm:ss / document+page / usta answer), NotFoundCard (Ustaya sor) (KAN-61, 62).
- `features/my-questions` — `MyQuestionsPage` "Sorularım" (KAN-62).
- `features/usta` — `UstaHomePage` (inbox, his machines, answered), `ReplyPage` (text / video / file) , `UstaProfilePage` (KAN-28, 63, 65).
- `features/recorder` — `RecorderPage` (machine list from `/me/machines`; "Kaydet" needs a chosen machine and says so; an usta with no assigned machine sees why), `useCamera` (back camera default, flip), `useRecorder` (MediaRecorder or picked file), `useVideoUpload` (progress, retry keeps clip), ProcessingPanel (KAN-35, 36, 73, 74).
- `features/maintenance` — `TechHomePage`, `MaintenanceFormPage` (doer/time from session; returns to machine page with the new record highlighted) (KAN-26, 39).
- `features/admin` — patron panel: `AdminMachinesPage` (stats, backend search, table, document upload, outside video), `StickersPage` (QR images + PDF), `UsersPage` (KAN-30, 32, 33, 34). Editing records lives in SQLAdmin `/admin` (KAN-41).
- `frontend/src/test/` — `fixtures.ts` (example data shared by Vitest and Playwright), `utils.tsx` (`mockApi`, `renderAt`, `renderAuthed`).
- `frontend/e2e/` — Playwright specs per role; `backend.ts` stubs `/api` + the alerts WebSocket until the backend exists.
- `frontend/src/mock/` — `npm run dev:mock` only (`.env.mock` sets `VITE_MOCK=1`, loaded lazily from `main.tsx`): `db.ts` (state from test fixtures, kept in localStorage; demo logins isci/usta/teknisyen/patron), `handlers.ts` (fake API, same contract), `transport.ts` (fetch/XHR/alerts-WebSocket shims). `auth/components/DemoLogin` shows one-tap role logins in this mode.

## API

- `GET /api/health` → {status: "ok"} (also checks the DB) — Playwright webServer readiness, smoke test

Contract the frontend calls (all under `/api`, cookie session; types in `frontend/src/api/types.ts`). Errors are `{detail: "<Turkish message>"}` (422 too). All implemented. Files: `GET /uploads/<path>` (login required, Range). SQLAdmin: `/admin` (patrons only).
- `POST /auth/register` RegisterIn {name, login, password, role: worker|usta} → 201 Me (sets cookie; 409 login taken; 422 for technician/patron) · `POST /auth/login` LoginIn → Me (401) · `POST /auth/logout` → 204 · `GET /auth/me` → Me | 401 — `features/auth` (KAN-24, built)
- `PATCH /me/language` {language} → Me · `GET /languages` → Language[] — machine page language switch
- `GET /machines/{id}` → MachinePage (404 = not found) · `GET /machines/lookup?code=` → {id} — machine page, ask, scan
- `POST /machines/{id}/ask` AskIn → AskResult · `POST /machines/{id}/questions` AskIn → QuestionSent — ask
- `GET /me/questions` → MyQuestion[] · `GET /me/inbox` → InboxQuestion[] · `GET /questions/{id}` → InboxQuestion · `POST /questions/{id}/answer` multipart(text?, video?, file?) — my-questions, usta
- `GET /ustas/{id}` → UstaProfile — usta home/profile
- `GET /videos/{id}` → VideoDetail · `POST /videos/{id}/languages/{lang}` → Preparation · `POST /videos/{id}/languages/{lang}/steps/{step}/retry` → Preparation — player
- `POST /machines/{id}/videos` multipart(title, file) → VideoProcessing · `GET /videos/{id}/processing` → VideoProcessing · `GET /me/machines` → machine refs — recorder
- `GET /documents/{id}` → DocumentDetail — documents
- `GET /machines/{id}/maintenance-form` → MaintenanceFormOptions · `POST /machines/{id}/maintenance` multipart(description, opened_by_id, attachment?) → MaintenanceRecord · `GET /me/maintenance` → MaintenanceRecord[] — maintenance
- `GET /alerts` → AlertList · `POST /alerts/{id}/read` → AlertList · `WS /ws/alerts` pushes Alert — alerts
- `GET /admin/machines?q=` → AdminMachineList · `GET /admin/users` → AdminUser[] · `POST /machines/{id}/documents` multipart(type, title, file) → DocumentSummary · `POST /machines/{id}/external-videos` ExternalVideoIn → ExternalVideo · `GET /machines/{id}/qr.svg` · `GET /admin/qr-stickers.pdf` — admin

## Decisions

- 2026-11-19: Frontend built before the backend; `src/api/types.ts` is the contract the backend must implement. E2E stubs `/api` via `page.route` (e2e/backend.ts) until FastAPI exists; then add uvicorn to Playwright `webServer` and drop the stubs. E2E runs its own Vite on port 5199 so a dev server on 5173 doesn't block it.
- 2026-11-19: Backend decides everything domain-shaped: role actions (`MachinePage.actions`), alert target (`Alert.path`), default tracks, text direction (`LocalizedText.dir`), search, unread count. Frontend only renders.
- 2026-11-19: Dubbed audio is served as one muxed stream per language (`VideoLanguageTrack.stream_url`), so no client-side audio/video sync; switching keeps the position.
- 2026-11-19: Lint is oxlint (template default) with `typescript/no-explicit-any: error`, `--deny-warnings`; `jsx-a11y/media-has-caption` off because user-recorded clips and camera previews have no caption files (subtitles come via KAN-50 tracks).
- 2026-11-21: Fake data must never reach the real backend: e2e `backend.ts` also stubs `/uploads/*` (404, recorded in `calls`), and `vite --mode mock` has no proxy at all. (Fixture media URLs used to leak to :8000 and show as 401s in its log.)
- 2026-11-21: Migrations folder is `backend/migrations/` (was `backend/alembic/`, renamed for clarity and so it no longer shadows the `alembic` package). Deploys run `alembic upgrade head` before the app starts; `TEST_DATABASE_URL` is optional so a server needs only `DATABASE_URL` + `SECRET_KEY`.
- 2026-11-21: No `<StrictMode>` in `main.tsx`: its dev double-mount sent every API request twice (user-visible in the backend log). e2e `opening a page calls each API once` guards it.
- 2026-11-19: Logging out drops the remembered "return to" page, so the next login goes to that user's role home.
- 2026-11-19: Session is an httpOnly cookie on the Vite origin (proxy), so it survives reloads and works over the VS Code forwarded port; the WebSocket uses the page origin (wss on https).

- 2026-11-21: Backend routes all live under `/api` (Vite proxies without rewriting). SQLAdmin at `/admin` lets in only patrons. Ruff ignores RUF001–003 (Turkish/Arabic letters are intentional) and RUF012 in `admin/views.py` (SQLAdmin config style).
- 2026-11-21: Permissions: record video = patron or an usta assigned to the machine; upload documents / outside videos / QR = patron; maintenance = technician or patron; answer = the machine's ustas (patron if it has none). Self-registered ustas see nothing to answer until the patron assigns them machines in `/admin`.
- 2026-11-21: AI = Gemini behind `app.ai.protocol.AI`. Without a key `DisabledAI` fails every call and callers fall back safely (ask → not_found; video stays playable; summary "none"). An ask answer must cite at least one of the given sources, else it is dropped.
- 2026-11-21: Dubbing ducks the original audio under TTS (prebuilt Gemini voice, not the usta's own voice); real voice separation/cloning is out of scope (label is "Dublaj", not "ustanın sesiyle"). Upload pipeline marks the video playable after transcode; AI steps add subtitles/search after.
- 2026-11-21: Vector search is cosine over JSON embeddings in Python per machine (no vector DB, per "no extra infrastructure"); fine for hundreds of chunks per machine.

- 2026-11-21: Self sign-up (`/register`) lets the user pick İşçi or Usta (`SELF_SERVICE_ROLES` in `app/auth/schemas.py`); Teknisyen/Patron only via the patron (CLI `set-role` or SQLAdmin `/admin` → Kullanıcılar). User's decision; not in the KAN-80 demo, so tell the team. Risk: anyone can become an Usta who answers questions; revisit (patron approval) before real use.
- 2026-11-21: Sessions are DB rows (`auth_sessions`, sha256 of a random token), not signed cookies, so logout really ends a session. Cookie `usta_session`: httpOnly, SameSite=Lax, 90 days, not `secure` (plain http behind the Vite proxy). Passwords use stdlib scrypt (no extra dependency).
- 2026-11-21: Login is normalized (phone digits only, e-mail lower case) in the Pydantic schema, so `0532 123 45 67` and `05321234567` are the same account.

## Maintaining this file

After every code change, in the same task:
- Update **Architecture / Modules / API / Decisions** so they describe the code as it is now.
- Update **Current status** (what is done, git/Jira state, next steps) so the next session can pick up where this one stopped.
- Remove entries for deleted code. Do not keep a changelog here; git history has that.
- Keep it short: one line per item, details belong in the code.
