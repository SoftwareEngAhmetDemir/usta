#!/usr/bin/env bash
# Starts backend (uvicorn :8000) and frontend (Vite :5173) together. Ctrl+C stops both. `--phone`: see below.
set -uo pipefail
cd "$(dirname "$0")"

[ -x backend/.venv/bin/uvicorn ] || {
  echo "backend/.venv missing: cd backend && python3.12 -m venv .venv && .venv/bin/pip install -e '.[dev]'" >&2
  exit 1
}
[ -x frontend/node_modules/.bin/vite ] || { echo "frontend deps missing: cd frontend && npm install" >&2; exit 1; }

# Bring the dev DB to the latest schema first (same as a deploy), so new columns never crash the server.
(cd backend && .venv/bin/alembic upgrade head) || exit 1

(cd backend && exec .venv/bin/uvicorn app.main:app --reload --port 8000) &
backend=$!
# --phone: serve a production build on :5173 (3 files) instead of Vite dev (hundreds of modules). The VS Code tunnel
# drops some of those with 504, leaving the app blank or the QR decoder unloaded. No hot reload: rerun after changes.
if [ "${1:-}" = "--phone" ]; then
  (cd frontend && node_modules/.bin/vite build) || exit 1
  (cd frontend && exec node_modules/.bin/vite preview --port 5173 --strictPort) & # same proxy as dev (preview inherits it)
else
  (cd frontend && exec node_modules/.bin/vite) & # same as `npm run dev`, minus npm so the signal reaches Vite
fi
frontend=$!
trap 'kill -TERM $backend $frontend 2>/dev/null; wait' EXIT INT TERM
wait
