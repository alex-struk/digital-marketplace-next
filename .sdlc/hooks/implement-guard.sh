#!/usr/bin/env bash
# templates/hooks/implement-guard.sh — Claude Code PreToolUse hook.
# Blocks edits outside the paths the current pipeline stage may touch.
# Stage comes from SDLC_STAGE; unset means "build", the most restrictive default.
set -uo pipefail

path="$(node -e '
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
  try { const j=JSON.parse(s); const t=j.tool_input||{}; console.log(t.file_path||t.path||t.notebook_path||""); }
  catch { console.log(""); }
});')"
[[ -z "$path" ]] && exit 0
rel="${path#"$PWD"/}"

stage="${SDLC_STAGE:-build}"
case "$stage" in
  build|verify|review-and-ship)
    blocked='^(spec/|tests/acceptance/|constitution\.md$|\.sdlc/config\.yaml$|\.github/workflows/)' ;;
  derive-tests)
    blocked='^(app/|tests/adapters/|tests/seed/|spec/|constitution\.md$|\.sdlc/)' ;;
  bind-adapter)
    blocked='^(app/|tests/acceptance/|spec/|constitution\.md$|\.sdlc/)' ;;
  intent|archaeology|ratify|design|plan)
    blocked='^(app/|tests/acceptance/|tests/adapters/|\.github/workflows/|\.sdlc/config\.yaml$)' ;;
  *)
    blocked='^$' ;;
esac

if [[ "$rel" =~ $blocked ]]; then
  echo "sdlc implement guard: stage '$stage' may not edit '$rel'. Run the stage that owns this path, or set SDLC_STAGE." >&2
  exit 2
fi
exit 0
