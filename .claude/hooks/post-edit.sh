#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit): record the touched file for the Stop check, and reject
# explicit `any` (TypeScript) / `Any` (Python) types.
# Files changed via Bash are caught by verify.sh (modified since session-start.sh), not here.
set -uo pipefail
input=$(cat)
file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
session=$(jq -r '.session_id // "default"' <<<"$input")
[ -z "$file" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$PWD}"
rel="${file#"$root"/}"
state="${TMPDIR:-/tmp}/claude-changes-$session"
mkdir -p "$state" && echo "$rel" >> "$state/files"
[ -f "$file" ] || exit 0

case "$file" in
  *.d.ts) exit 0 ;;
  *.ts|*.tsx|*.mts|*.cts)
    # `: any`, `as any`, `<any>`, `, any`, `| any`, `any[]`; comment lines skipped.
    hits=$(perl -ne 'next if m{^\s*(//|\*|/\*)}; print "  $.: $_" if /(?:[:<,|&(]|\bas)\s*any\b(?!-)/' "$file")
    fix="a precise type, a generic, or \`unknown\` + narrowing" ;;
  *.py)
    # `: Any`, `-> Any`, `[Any]`, `| Any`, `import ... Any`; comment lines skipped.
    hits=$(perl -ne 'next if m{^\s*#}; print "  $.: $_" if /(?:[:\[,|]|->)\s*(?:typing\.)?Any\b|^\s*from\s+typing\s+import\s+.*\bAny\b/' "$file")
    fix="a precise type, a TypeVar/Generic, a Pydantic model / TypedDict, or \`object\` + isinstance narrowing" ;;
  *) exit 0 ;;
esac

if [ -n "$hits" ]; then
  { echo "Untyped \`any\`/\`Any\` is forbidden ($rel). Replace it with $fix:"; echo "$hits"; } >&2
  exit 2
fi

# React components: one exported component per file, at most 150 lines.
case "$file" in
  *.test.tsx|*.spec.tsx|*.stories.tsx) ;;
  *.tsx)
    max=150
    lines=$(wc -l < "$file" | tr -d ' ')
    comps=$(perl -ne '$n++ if /^export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w*)/ && ($1 =~ /[a-z]/ || length($1) == 1); END { print $n + 0 }' "$file")
    msg=""
    [ "$lines" -gt "$max" ] && msg+="- $rel has $lines lines (max $max). Split it: move sections into child components in their own files, logic into a use<Name> hook, and types/constants into separate files."$'\n'
    [ "$comps" -gt 1 ] && msg+="- $rel exports $comps components. Put each component in its own folder: <Name>/<Name>.tsx + <Name>.test.tsx + index.ts."$'\n'
    [ -n "$msg" ] && { printf 'Component rules broken:\n%s' "$msg" >&2; exit 2; } ;;
esac
exit 0
