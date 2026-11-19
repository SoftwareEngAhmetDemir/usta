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

## Frontend: typed API client + hook
```ts
// frontend/src/api/client.ts
export class ApiError extends Error {
  constructor(readonly status: number, readonly detail: unknown) { super(`API ${status}`); }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T; // shortcut: trusts the backend schema; generate types from /openapi.json to keep them in sync
}
```
```ts
// frontend/src/features/users/useUsers.ts
import { useEffect, useState } from 'react';
import { request } from '../../api/client';
import type { User } from '../../api/types';

type State = { status: 'loading' } | { status: 'ok'; data: User[] } | { status: 'error'; error: Error };

export function useUsers(): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    const ctrl = new AbortController();
    request<User[]>('/users', { signal: ctrl.signal })
      .then((data) => setState({ status: 'ok', data }))
      .catch((error: unknown) => {
        if (!ctrl.signal.aborted) setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
      });
    return () => ctrl.abort();
  }, []);
  return state;
}
```
- TS API types mirror the FastAPI schemas; prefer generating them (`openapi-typescript` from `/openapi.json`). If the project already uses TanStack Query, use it instead of hand-written hooks.

## Backend: FastAPI router + service
```python
# backend/app/users/schemas.py
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1)

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
```
```python
# backend/app/users/service.py
from typing import Protocol
from .schemas import UserCreate, UserOut

class UserRepo(Protocol):
    async def find_by_email(self, email: str) -> UserOut | None: ...
    async def insert(self, data: UserCreate) -> UserOut: ...

class EmailTakenError(Exception):
    pass

class UserService:
    def __init__(self, repo: UserRepo) -> None:
        self._repo = repo

    async def create(self, data: UserCreate) -> UserOut:
        if await self._repo.find_by_email(data.email):
            raise EmailTakenError(data.email)
        return await self._repo.insert(data)
```
```python
# backend/app/users/router.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from .deps import get_user_service
from .schemas import UserCreate, UserOut
from .service import EmailTakenError, UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, service: Annotated[UserService, Depends(get_user_service)]) -> UserOut:
    try:
        return await service.create(data)
    except EmailTakenError:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")
```
- Feature-folder layout (`app/<feature>/{schemas,service,router,deps,models}.py`).
- Handlers thin; business logic in services; I/O behind `Protocol`s injected via `Depends` (tests use `app.dependency_overrides`).
- No blocking I/O inside `async def`. Settings via `pydantic-settings`, never `os.environ` scattered around.

## AI / LLM module (backend)
```python
# backend/app/ai/summarize.py
from typing import Protocol
from pydantic import BaseModel, Field, ValidationError

class LlmClient(Protocol):
    async def complete(self, *, system: str, user: str) -> str: ...

class Summary(BaseModel):
    title: str
    bullets: list[str] = Field(max_length=5)

SUMMARY_PROMPT_V1 = 'Return only JSON: {"title": string, "bullets": string[] (max 5)}.'

class SummaryParseError(Exception):
    pass

async def summarize(llm: LlmClient, text: str) -> Summary:
    raw = await llm.complete(system=SUMMARY_PROMPT_V1, user=text)
    try:
        return Summary.model_validate_json(raw)  # model output is untrusted
    except ValidationError as e:
        raise SummaryParseError(str(e)) from e
```
- Model client behind a `Protocol`; tests use a fake. Prompts are versioned constants next to their parser.
- Always schema-validate output; handle timeouts, retries with backoff and refusals explicitly.
- Stream to the frontend via `StreamingResponse`/SSE when latency matters.
- Never feed user text into tool calls, SQL or shell without validation (prompt injection).
