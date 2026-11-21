#!/usr/bin/env bash
# Stop: if this session edited frontend/ (TS) or backend/ (Python) source, require tests for that side
# and a CLAUDE.md update, then run typecheck/lint/unit/e2e. Blocks finishing (max 3 times) until they pass.
# Sees Edit/Write (post-edit.sh) and Bash edits (files newer than the session-start.sh mark).
set -uo pipefail
input=$(cat)
session=$(jq -r '.session_id // "default"' <<<"$input")
state="${TMPDIR:-/tmp}/claude-changes-$session"
root="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$root" || exit 0

# Changed files = recorded by post-edit.sh (Edit/Write) + anything modified since session-start.sh (Bash edits).
changed_since_start() {
  [ -f "$state/start" ] || return 0
  find frontend/src frontend/e2e backend/app backend/tests backend/migrations CLAUDE.md -newer "$state/start" \
    -type f -not -path '*/__pycache__/*' -not -path '*/node_modules/*' 2>/dev/null
}
files=$( { cat "$state/files" 2>/dev/null; changed_since_start; } | sort -u | grep -v '^$' )
[ -n "$files" ] || exit 0
# Passed or given up: start a fresh baseline, so the next round only checks what changes after this.
reset() { rm -f "$state/files" "$state/blocks"; touch "$state/start"; }
fe_test='^frontend/.*\.(test|spec)\.[cm]?tsx?$'
be_test='^backend/(.*/)?(tests?/.*|test_[^/]*|[^/]*_test)\.py$'
fe_src=$(grep -E '^frontend/.*\.[cm]?tsx?$' <<<"$files" | grep -vE "\.d\.ts$|$fe_test|\.config\.[cm]?ts$" || true)
be_src=$(grep -E '^backend/.*\.py$' <<<"$files" | grep -vE "$be_test|(^|/)(alembic|migrations)/|conftest\.py$" || true)
if [ -z "$fe_src$be_src" ]; then reset; exit 0; fi

problems=""
add() { problems+="- $1"$'\n'; }
list() { tr '\n' ' ' <<<"$1"; }

[ -n "$fe_src" ] && ! grep -qE "$fe_test" <<<"$files" &&
  add "Frontend changed ($(list "$fe_src")) but no *.test.ts(x) / e2e *.spec.ts was added or updated."
[ -n "$be_src" ] && ! grep -qE "$be_test" <<<"$files" &&
  add "Backend changed ($(list "$be_src")) but no pytest file (tests/test_*.py) was added or updated."
grep -qE '(^|/)CLAUDE\.md$' <<<"$files" ||
  add "CLAUDE.md was not updated. Reflect the added/changed/removed logic in its Architecture, Modules, API and Decisions sections."

# E2E lives in the frontend (Playwright drives the UI against the real API), so it runs for either side.
if [ -f frontend/package.json ]; then
  has() { jq -e --arg s "$1" '.scripts[$s]' frontend/package.json >/dev/null 2>&1; }
  for s in test test:e2e; do has "$s" || add "frontend/package.json has no \"$s\" script (Vitest / Playwright). Add it."; done
  fe_scripts="test:e2e"
  [ -n "$fe_src" ] && fe_scripts="typecheck lint test test:e2e"
  for s in $fe_scripts; do
    has "$s" || continue
    out=$(cd frontend && CI=1 npm run -s "$s" 2>&1) || add "\`npm run $s\` (frontend) failed:"$'\n'"$(tail -n 40 <<<"$out")"
  done
else
  add "No frontend/package.json: scaffold the React + TypeScript app with typecheck, lint, test (Vitest) and test:e2e (Playwright) scripts."
fi

if [ -n "$be_src" ]; then
  py() { # prefer the project's venv, then uv, then PATH
    if [ -x ".venv/bin/$1" ]; then ".venv/bin/$@"
    elif [ -f uv.lock ] && command -v uv >/dev/null; then uv run "$@"
    elif command -v "$1" >/dev/null; then "$@"
    else echo "$1 not installed"; return 127; fi
  }
  for cmd in "ruff check ." "mypy ." "pytest -q"; do
    out=$(cd backend && py $cmd 2>&1) || add "\`$cmd\` (backend) failed:"$'\n'"$(tail -n 40 <<<"$out")"
  done
fi

if [ -z "$problems" ]; then reset; exit 0; fi

n=$(( $(cat "$state/blocks" 2>/dev/null || echo 0) + 1 ))
if [ "$n" -gt 3 ]; then
  reset  # give up so Claude can't loop forever; it must report the failures to the user
  exit 0
fi
echo "$n" > "$state/blocks"
printf 'Not done yet (verify attempt %s/3). Fix these, then finish. If one cannot be fixed, tell the user why:\n%s' "$n" "$problems" >&2
exit 2
