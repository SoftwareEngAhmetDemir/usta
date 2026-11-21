---
name: reusable-component
description: Patterns for reusable, strictly typed units in this repo - React + TypeScript components and hooks (frontend/), FastAPI routers/services with Pydantic (backend/), and AI/LLM modules. Use when creating a new component, hook, API client, endpoint, service or prompt module.
---

# Reusable, strictly typed units

General
- One responsibility per unit; dependencies injected, not imported singletons.
- No `any` (TS) / `Any` (Python). TS: generics, discriminated unions, `unknown` + narrowing, `satisfies`. Python: precise types, `TypeVar`/`Generic`, `Protocol`, Pydantic models, `object` + `isinstance`.
- External data is validated at the boundary (Pydantic on the backend; typed API client on the frontend).
- Tests sit with the unit (frontend) or mirror it under `backend/tests/`.

## Frontend is thin: all complex logic lives in the backend

The frontend only renders what the API returns and sends user input back. It has no business logic.
- Backend owns: business rules, calculations, filtering/sorting/grouping/aggregation of data, permissions/role checks, validation rules, state transitions, language selection/translation, search and matching, anything AI.
- Frontend owns: UI state (open/closed, selected tab, form input), calling the API, loading/error display, simple formatting for display (dates, mm:ss).
- If a hook needs more than fetch + UI state, or a component needs an `if` on domain data beyond show/hide, add or extend an endpoint so the backend returns the ready-to-render shape.
- Form checks on the frontend are only for UX; the backend validates again and is the source of truth.

## Frontend: one feature, many small components

Every feature gets its own folder and is split into small components. Rules (the post-edit hook enforces the first two):
- **One exported component per `.tsx` file.**
- **At most 150 lines per component file.** Aim for under 80.
- The page component only composes; it holds no fetching and no long JSX.
- Logic and state go in `hooks/use<Name>.ts`; types in `types.ts`; constants and labels in `constants.ts`.
- A component used by two or more features moves to `src/components/`.
- Other code imports a feature only through its `index.ts`.

Example: machine page (KAN-71)
```
frontend/src/features/machine-page/
  MachinePage.tsx                 // ~30 lines: useMachine(id) + layout of the sections below
  components/
    MachineHeader/                MachineHeader.tsx, MachineHeader.test.tsx, index.ts
    UstaList/                     ...
    VideoList/                    ...
    DocumentList/                 ...
    MaintenanceHistory/           ...
    QuestionsSection/             ...
  hooks/useMachine.ts             // fetch + loading/error/data state, with useMachine.test.ts
  api.ts  types.ts  index.ts
```
```tsx
// MachinePage.tsx: composition only
export function MachinePage({ machineId }: { machineId: string }) {
  const state = useMachine(machineId);
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') return <ErrorState error={state.error} />;
  const { machine } = state.data;
  return (
    <main>
      <MachineHeader machine={machine} />
      <UstaList ustas={machine.ustas} />
      <VideoList videos={machine.videos} />
      <DocumentList documents={machine.documents} />
      <MaintenanceHistory records={machine.maintenance} />
      <QuestionsSection machineId={machine.id} />
    </main>
  );
}
```
How to split a component that is getting long:
1. Each visual section (header, list, list item, form, empty state) becomes a child component.
2. `useState`/`useEffect`/handlers become a `use<Name>` hook that returns the values and callbacks.
3. Repeated JSX in a `.map()` becomes an `<ItemName>` component.
4. Big inline objects (options, labels, translations) move to `constants.ts`.

## Frontend: presentational component
```tsx
// frontend/src/components/Button/Button.tsx
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', loading = false, icon, children, disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} data-variant={variant} disabled={disabled || loading} aria-busy={loading}>
      {icon}
      {children}
    </button>
  );
}
```
- Extend native element props so consumers keep `onClick`, `aria-*`, `type`.
- Semantic HTML, keyboard support, visible focus, labels.
- No fetching inside presentational components.

## Frontend: API calls and hooks (reuse these, don't write new ones)
- `src/api/client.ts`: `request<T>`, `postJson`, `postForm`, `ApiError`, `errorMessage` (shows the backend's Turkish
  `detail`). `src/api/upload.ts`: `uploadWithProgress` (XHR, progress, cookie). `useApi(path, poll?)` for GETs (aborts on
  unmount, keeps data on a failed background refresh), `useAction` for mutations.
- Feature calls live in `features/<feature>/api.ts`; types come from `src/api/types.ts`, the FE↔BE contract.
- A contract change updates **four** places in the same change: `types.ts`, `src/mock/handlers.ts` (dev:mock),
  `e2e/backend.ts` (e2e stubs) and `src/test/fixtures.ts` if the example data changes shape.

## Backend: router + service (this repo's real pattern)
Look at `app/maintenance/` or `app/questions/` before writing a new feature; copy their shape.
- `app/<feature>/models.py` (SQLAlchemy 2, `Mapped[...]`, naive-UTC `DateTime` with `default=utcnow`),
  `service.py` (Pydantic out-models + plain async functions taking `AsyncSession`), `router.py` (thin), registered in
  `app/main.py` `API_ROUTERS`; new models imported in `app/models.py` so Alembic sees them.
- Dependencies: `SessionDep` (request-scoped session), `CtxDep` (`AppContext`: `settings`, `sessionmaker`, `ai`, `jobs`,
  `hub`), `CurrentUser` / `PatronUser` / `require_role(...)`. Permissions per machine: `app/machines/permissions.py`
  (`actions`, `can_answer`), never ad-hoc role checks in a router.
- Errors: `raise not_found("Makine")` / `forbidden()` / `HTTPException(code, "<Turkish sentence>")`. Validation messages
  in Turkish via `AfterValidator`/`BeforeValidator` raising `ValueError` (the 422 handler shows its text).
- Timestamps out: `UtcDateTime`. Text in a language: `LocalizedText` via `localized()` / `Localizer`.
- Files: `core/storage.save_upload` / `abs_path` / `url`; never build upload paths by hand.
- Slow work (ffmpeg, AI, translations): `ctx.jobs.spawn(job(ctx, id), name=...)`. A job opens its own session with
  `async with ctx.sessionmaker() as db`, never reuses the request's. State lives in MySQL so it survives restarts.
- After `await db.rollback()` every loaded ORM object is expired, and touching an attribute raises in async: keep ids in
  plain variables before the risky call, or re-load with `db.get(Model, id, populate_existing=True)`.
- Live alerts: `alerts.service.notify(db, ctx.hub, user_ids, text, path)`; the backend decides `path`.
- Schema change: edit models → `alembic revision --autogenerate` **against `usta_test` at head** (not the dev DB, which
  may hold hand-made tables) → read the file; any `op.drop_*` needs the user's OK → `alembic upgrade head`.

## AI / LLM (backend)
- Everything goes through `app.ai.protocol.AI` (one Protocol: transcribe, translate, embed, speak, answer, summarize,
  read_image). `GeminiAI` implements it; `DisabledAI` (no key) raises `AIUnavailableError`; tests use `tests/fakes.FakeAI`.
- New AI capability: add the method to the Protocol, `DisabledAI`, `GeminiAI` and `FakeAI`; prompt text in `prompts.py`.
- Output is untrusted: JSON schema in the request, then `Model.model_validate_json`, else `AIUnavailableError`.
- Callers catch `AIUnavailableError` and fall back to a **safe** result (ask → `not_found`, summary → `none`), never a guess.
- Pages never call the AI while rendering: translate/summarize in a job after the write, read stored results.
- Never let model output pick files, SQL or shell arguments.
