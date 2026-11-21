#!/usr/bin/env bash
# Starts backend (uvicorn :8000) and frontend (Vite :5173) together. Ctrl+C stops both.
set -uo pipefail
cd "$(dirname "$0")"

[ -x backend/.venv/bin/uvicorn ] || {
  echo "backend/.venv missing: cd backend && python3.12 -m venv .venv && .venv/bin/pip install -e '.[dev]'" >&2
  exit 1
}
[ -x frontend/node_modules/.bin/vite ] || { echo "frontend deps missing: cd frontend && npm install" >&2; exit 1; }

(cd backend && exec .venv/bin/uvicorn app.main:app --reload --port 8000) &
backend=$!
(cd frontend && exec node_modules/.bin/vite) & # same as `npm run dev`, minus npm so the signal reaches Vite
frontend=$!
trap 'kill -TERM $backend $frontend 2>/dev/null; wait' EXIT INT TERM
wait
