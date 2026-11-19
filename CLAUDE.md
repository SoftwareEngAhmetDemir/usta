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
- Frontend: `cd frontend && npm run dev | typecheck | lint | test | test:e2e`
- Backend: `cd backend && uvicorn app.main:app --reload`, `ruff check .`, `mypy .`, `pytest -q`

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

_Last updated 2026-11-19._
- **Frontend: built** for every `frontend`-labelled KAN ticket (screens for all 4 roles; see Modules). typecheck, lint, 164 Vitest tests and 10 Playwright e2e all pass. E2E and `npm run dev:mock` use a **fake backend**; nothing has run against a real API or on a real phone yet.
- **Backend: not started.** `backend/` holds only `.env` (local secrets, git-ignored) and `.env.example`. The contract it must implement is `frontend/src/api/types.ts` + the API list below.
- **Database: ready.** MySQL 8.4 (Homebrew, `brew services start mysql@8.4`, runs on login) on `127.0.0.1:3306`. Databases `usta` (dev) and `usta_test` (pytest), both utf8mb4; app user `usta`@`localhost` has rights on those two only. Connection strings and passwords are in `backend/.env` (`DATABASE_URL`, `TEST_DATABASE_URL`, `MYSQL_ROOT_PASSWORD`, `SECRET_KEY`); read them from there via pydantic-settings, never hard-code or commit them. No tables yet: create them with Alembic migrations, not by hand. The user browses data with MySQL Workbench (`brew install --cask mysqlworkbench`).
- **Git:** frontend + `.claude/` + CLAUDE.md committed on branch `init-frontend-react-with-ui-screens` (pushed to `origin`, GitHub `SoftwareEngAhmetDemir/usta`); no PR yet. Root `.gitignore` ignores `.env*` (except `.env.example`, `frontend/.env.mock`), Python caches, `.venv/` and `uploads/`.
- **Jira:** these 26 tickets are **In Progress**, assigned to the user (frontend done, backend half missing): KAN-23, 24, 26, 28, 31, 32, 33, 34, 35, 36, 38, 39, 40, 45, 46, 50, 55, 56, 61, 62, 63, 65, 66, 71, 73, 74. All other tickets are To Do. Move a ticket to Done only when its "Done when" list is met end to end (real backend, tested).
- **Try it:** `cd frontend && npm run dev:mock`, then tap a demo user (İşçi / Usta / Teknisyen / Patron). Videos and QR images don't load in mock mode (no media files).

**Next steps (suggested order):**
1. Open a PR for `init-frontend-react-with-ui-screens`; start backend work on a new branch from it (e.g. `KAN-24-backend-auth`).
2. Scaffold `backend/` per "Stack & layout": FastAPI, Pydantic v2 + pydantic-settings (reads `backend/.env`), SQLAlchemy 2 async + `asyncmy` driver, Alembic (migrations in `backend/alembic/`), pytest against `usta_test`, mypy strict, ruff with ANN401. Python venv in `backend/.venv`. The Mac's system Python is 3.9: first `brew install python@3.12` (or `uv`) and create the venv with 3.12. Mount SQLAdmin at `/admin` (Vite already proxies `/api`, `/uploads`, `/admin` to `:8000`).
3. Backend in ticket order: KAN-25/24 auth + roles → KAN-27/70 machines + machine page endpoint → KAN-29/30 QR → KAN-28 usta links → KAN-33/34 documents + outside videos → KAN-39 maintenance → KAN-66 alerts WebSocket → video upload/processing (KAN-37/74) → AI (KAN-42+, 58–60).
4. As each endpoint lands: point Playwright `webServer` at uvicorn, drop the matching stub in `frontend/e2e/backend.ts`, test on a real Android + iPhone (camera: KAN-35, PDF `#page=`: KAN-45).

## Architecture

Frontend built; backend not scaffolded yet. Flow: page component → `useApi(path, poll?)` / feature `api.ts` →
`src/api/client.ts` (`fetch('/api/...')`, cookie session) or `upload.ts` (XHR with progress) → Vite proxy (`/api`,
`/uploads`, `/admin` → `localhost:8000`, override with `VITE_BACKEND_URL`) → FastAPI. Live alerts: `AlertsProvider`
keeps a WebSocket to `/api/ws/alerts` (reconnect with backoff) and refetches `/alerts` on each message.
Routing (`src/app/AppRoutes.tsx`): `/login` public; everything else inside `RequireAuth` → `AlertsProvider` → `AppLayout`
(header + bell + toast + per-role bottom menu from `src/app/nav.ts`). `/` redirects to the role home (`HOME_BY_ROLE`).

## Modules

- `frontend/src/api/` — `types.ts` (FE↔BE contract, mirrors future Pydantic schemas), `client.ts` (`request`, `postJson`, `postForm`, `ApiError`, `errorMessage` → Turkish), `upload.ts` (`uploadWithProgress`), `useApi` (GET + poll as number or fn of data), `useAction`.
- `frontend/src/components/` — shared UI: Button, Pill, SectionTitle, EmptyState, PageTitle, Spinner, ErrorMessage, AsyncView, Field, Localized (lang+dir), ProgressBar, StepList, AuthorizedBadge, MaintenanceTimeline, QaCard.
- `frontend/src/lib/` — `format.ts` (tr-TR dates, m:ss durations), `labels.ts` (document type / outside source labels).
- `frontend/src/app/` — `App` (BrowserRouter), `AppRoutes`, `AppLayout`, `NavBar`, `HomeRedirect`, `nav.ts`.
- `features/auth` — `AuthProvider`, `useAuth`/`useMe`, `RequireAuth` (remembers target, e.g. scanned machine), `LoginPage` (KAN-24).
- `features/alerts` — `AlertsProvider`, `useAlertSocket`, `AlertBell`, `AlertToast`, `AlertsPage` (KAN-66).
- `features/scan` — `ScanPage`: worker home, machine-code fallback for the QR (KAN-29).
- `features/machine-page` — `MachinePage` (details, ustas, language switch, Makineye sor, videos + outside videos, documents + summary, maintenance, Q&A; empty states + role actions from `actions`) (KAN-31/71, 28, 34, 40, 45, 46, 65).
- `features/video-player` — `VideoPage` (`?t=` start second), Player (per-language muxed stream + WebVTT), TrackPicker, PreparationCard (steps, retry), Transcript (KAN-38, 50, 55, 56).
- `features/documents` — `DocumentPage` (`?page=`), SummaryCard (RTL), DocumentViewer (inline PDF/image + download) (KAN-33, 45).
- `features/ask` — `AskPage`, `useAsk`, AnswerCard, SourceCard (video+mm:ss / document+page / usta answer), NotFoundCard (Ustaya sor) (KAN-61, 62).
- `features/my-questions` — `MyQuestionsPage` "Sorularım" (KAN-62).
- `features/usta` — `UstaHomePage` (inbox, his machines, answered), `ReplyPage` (text / video / file) , `UstaProfilePage` (KAN-28, 63, 65).
- `features/recorder` — `RecorderPage`, `useCamera` (back camera default, flip), `useRecorder` (MediaRecorder or picked file), `useVideoUpload` (progress, retry keeps clip), ProcessingPanel (KAN-35, 36, 73, 74).
- `features/maintenance` — `TechHomePage`, `MaintenanceFormPage` (doer/time from session; returns to machine page with the new record highlighted) (KAN-26, 39).
- `features/admin` — patron panel: `AdminMachinesPage` (stats, backend search, table, document upload, outside video), `StickersPage` (QR images + PDF), `UsersPage` (KAN-30, 32, 33, 34). Editing records lives in SQLAdmin `/admin` (KAN-41).
- `frontend/src/test/` — `fixtures.ts` (example data shared by Vitest and Playwright), `utils.tsx` (`mockApi`, `renderAt`, `renderAuthed`).
- `frontend/e2e/` — Playwright specs per role; `backend.ts` stubs `/api` + the alerts WebSocket until the backend exists.
- `frontend/src/mock/` — `npm run dev:mock` only (`.env.mock` sets `VITE_MOCK=1`, loaded lazily from `main.tsx`): `db.ts` (state from test fixtures, kept in localStorage; demo logins isci/usta/teknisyen/patron), `handlers.ts` (fake API, same contract), `transport.ts` (fetch/XHR/alerts-WebSocket shims). `auth/components/DemoLogin` shows one-tap role logins in this mode.

## API

Contract the frontend calls (all under `/api`, cookie session; types in `frontend/src/api/types.ts`). Backend still to implement.
- `POST /auth/login` LoginIn → Me · `POST /auth/logout` → 204 · `GET /auth/me` → Me | 401 — `features/auth`
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
- 2026-11-19: Logging out drops the remembered "return to" page, so the next login goes to that user's role home.
- 2026-11-19: Session is an httpOnly cookie on the Vite origin (proxy), so it survives reloads and works over the VS Code forwarded port; the WebSocket uses the page origin (wss on https).

## Maintaining this file

After every code change, in the same task:
- Update **Architecture / Modules / API / Decisions** so they describe the code as it is now.
- Update **Current status** (what is done, git/Jira state, next steps) so the next session can pick up where this one stopped.
- Remove entries for deleted code. Do not keep a changelog here; git history has that.
- Keep it short: one line per item, details belong in the code.
