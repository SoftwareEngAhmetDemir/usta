---
name: feature
description: End-to-end workflow for adding, changing or removing code in this React + TypeScript (frontend/) and FastAPI (backend/) repo - impact analysis, strictly typed implementation, unit + e2e tests, review, and CLAUDE.md update. Use for any non-trivial code change, or when the user types /feature.
---

# Feature workflow

Follow every step. The Stop hook (`.claude/hooks/verify.sh`) blocks finishing while tests, CLAUDE.md or checks are missing or failing, so do them up front.

1. **Context**: CLAUDE.md is already loaded. Re-read its Architecture, Modules, API and Decisions sections for the area you touch, then read the actual files, because CLAUDE.md can lag the code.
2. **Impact**: for anything beyond a one-file local change, run the `impact-analyzer` agent with the planned change. Every "Breaks" and "FE↔BE contract" item becomes part of the task.
3. **Design**: pick the smallest design that fits existing patterns. Grep for an existing helper/component first. For new reusable pieces follow the `reusable-component` skill. On the frontend, list the components before coding: the feature gets its own folder `frontend/src/features/<feature>/`, each component in its own `components/<Name>/` folder, one component per file, at most 150 lines (the hook rejects longer files). Backend first when the API changes: schema → route → service → tests, then frontend types/client → UI.
4. **Implement**: TS with no `any`; Python fully annotated with no `Any`; Pydantic at API boundaries; update all callers found in step 2 in the same change.
5. **Unit tests**: frontend `*.test.tsx` beside the code (Vitest); backend `backend/tests/**/test_*.py` (pytest). Delete tests of removed code. Use the `test-writer` agent for larger changes.
6. **E2E**: add/update `frontend/e2e/*.spec.ts` (Playwright, UI + real API) for every affected user flow.
7. **Verify**:
   - `cd frontend && npm run typecheck && npm run lint && npm test && npm run test:e2e`
   - `cd backend && ruff check . && mypy . && pytest -q`
   Fix root causes. Never weaken a test or add `any`/`Any`/`@ts-ignore`/`# type: ignore` to pass.
8. **Review**: for multi-file changes run the `ts-reviewer` agent and fix its findings.
9. **CLAUDE.md**: update Architecture / Modules / API / Decisions to describe the *current* logic (not a changelog; git has history). Remove entries for deleted code.
10. **Report**: what changed, impact handled, tests added, command results, anything left undone.
