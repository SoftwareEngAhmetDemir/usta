#!/usr/bin/env bash
# SessionStart: mark the time, so the Stop check (verify.sh) also sees files changed through Bash
# (sed, python scripts, alembic revision), not only those changed with Edit/Write.
set -uo pipefail
session=$(jq -r '.session_id // "default"' <<<"$(cat)")
state="${TMPDIR:-/tmp}/claude-changes-$session"
mkdir -p "$state"
[ -f "$state/start" ] || touch "$state/start"  # keep the first mark when a session is resumed
exit 0
