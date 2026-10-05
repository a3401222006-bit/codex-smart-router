#!/usr/bin/env zsh

set -euo pipefail

ROOT="${0:A:h:h}"
SCRIPT="$ROOT/bin/codex-smart"

zsh -n "$SCRIPT"
node --check "$ROOT/scripts/router.mjs"

usage_output="$("$SCRIPT" 2>&1 || true)"
if [[ "$usage_output" != *"Usage: codex-smart"* ]]; then
  print -u2 "Expected usage text when no task is supplied."
  exit 1
fi

node --test "$ROOT"/tests/*.test.mjs

print "smoke test passed"
