#!/usr/bin/env bash
# templates/hooks/implement-guard.sh — Claude Code PreToolUse hook.
# Blocks edits outside the paths the current pipeline stage may touch.
# Stage comes from SDLC_STAGE; unset means "build", the most restrictive default.
set -uo pipefail

# The blocked-path table below is written in project-relative form, so the incoming
# path is normalised to that form first: "./spec/spec.md", "spec/../spec/spec.md" and
# an absolute path inside the project all reduce to "spec/spec.md".
rel="$(node -e '
const path = require("node:path");
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
  let p = "";
  try { const j=JSON.parse(s); const t=j.tool_input||{}; p = t.file_path||t.path||t.notebook_path||""; }
  catch { p = ""; }
  if (!p) { console.log(""); return; }
  const base = process.env.PWD || process.cwd();
  console.log(path.relative(base, path.resolve(base, p)));
});')"
[[ -z "$rel" ]] && exit 0

# A path that resolves outside the project is none of the pipeline stage's business:
# agents legitimately write scratch files to temp directories.
case "$rel" in ..|../*) exit 0 ;; esac

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
