#!/usr/bin/env bash
# templates/hooks/implement-guard.sh — PreToolUse hook for Claude Code and for Codex.
# Blocks edits outside the paths the current pipeline stage may touch.
# Stage comes from SDLC_STAGE; unset means "build", the most restrictive default.
set -uo pipefail

# Every path the tool call would write, one per line, in project-relative form, since the
# table below is written in that form: "./spec/spec.md", "spec/../spec/spec.md" and an
# absolute path inside the project all reduce to "spec/spec.md".
#
# A Claude edit tool names its one path (`file_path`, `path`, `notebook_path`). A Codex
# session edits through a patch, handed to the hook as the tool's input — the patch as a
# string, or a shell command carrying one — so every string in the input is also read for
# the paths a patch names: added, updated, deleted, or moved to.
paths="$(node -e '
const path = require("node:path");
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
  let t = {};
  try { t = JSON.parse(s).tool_input || {}; } catch { t = {}; }
  const found = [];
  if (t && typeof t === "object") {
    const named = t.file_path || t.path || t.notebook_path;
    if (typeof named === "string" && named) found.push(named);
  }
  const header = /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+?)\s*$/gm;
  const walk = (v) => {
    if (typeof v === "string") { for (const m of v.matchAll(header)) found.push(m[1]); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(t);
  const base = process.env.PWD || process.cwd();
  for (const p of found) console.log(path.relative(base, path.resolve(base, p)));
});')"
[[ -z "$paths" ]] && exit 0

stage="${SDLC_STAGE:-build}"

# Two shapes of rule. `blocked` is a deny list: everything matching it is refused and
# everything else allowed. `allowed` is the inverse, for a stage whose territory is one
# directory — writing "everything except app/" as a deny regex is not expressible in the
# POSIX ERE `[[ =~ ]]` uses, which has no negative lookahead. A stage sets one or the
# other, never both. `.` as a deny pattern matches every non-empty path: block all.
allowed=''
blocked=''
reason=''
case "$stage" in
  build|verify|review-and-ship)
    blocked='^(spec/|tests/acceptance/|constitution\.md$|\.sdlc/config\.yaml$|\.github/workflows/|sources/)' ;;
  derive-tests)
    # derive-tests is blind: its workspace never even materialises app/, tests/adapters/
    # or spec/, and its own territory is only the acceptance suite it writes.
    #
    # These two stages run in a temporary workspace built by `git archive`, which carries
    # no .claude/settings.json and therefore never installs this hook. Containment for
    # them is the workspace itself (what is not there cannot be edited) plus the scope
    # post-checks the runner applies to what comes back. The rows stay here because they
    # document the intent, and because the same stage name can be run in the project.
    allowed='^tests/acceptance/' ;;
  bind-adapter)
    # bind-adapter is blind the same way: its workspace never materialises app/,
    # tests/acceptance/ or spec/ (only spec/contract/, read-only, for `prepare` to
    # regenerate tests/generated/ from) — its own territory is the adapter it writes.
    allowed='^tests/adapters/' ;;
  intent)
    # intent may write intent/ and the constitution glossary, and nothing else. Written
    # as an allow rule rather than a deny list: a deny list only refuses the paths
    # somebody thought to name, so `design/`, `plan/`, `evidence/` and every path added
    # later were all writable by an intent turn that wandered.
    allowed='^(intent/|constitution\.md$)' ;;
  archaeology)
    # archaeology reads the old app under sources/ read-only and may write only spec/ —
    # every other path, named or not, is out of its territory.
    allowed='^spec/' ;;
  contract)
    # contract completes spec/contract/, writes synthetic seed data under tests/seed/, and
    # writes the oracle's compose override under .sdlc/oracle/ — nothing else, including
    # sources/old, which stays read-only the same way it does for archaeology.
    allowed='^(spec/contract/|tests/seed/|\.sdlc/oracle/)' ;;
  ratify|calibrate)
    # Deterministic stages with no agent: nothing is written by a session at all. What
    # they do write, they write from the runner's own process, never through a tool call.
    blocked='^' ;;
  design|plan)
    blocked='^(app/|tests/acceptance/|tests/adapters/|\.github/workflows/|\.sdlc/config\.yaml$|sources/)' ;;
  probe)
    # The probe stage exists to prove the runner: one file under app/, nothing else.
    allowed='^app/' ;;
  rule)
    # A persona ruling on a proposal reads and answers. It writes nothing at all.
    blocked='.' ;;
  *)
    # A stage nobody wrote a row for gets no territory. The previous default allowed
    # every path, so a typo in SDLC_STAGE silently turned the guard off.
    blocked='.'
    reason="unknown stage '$stage'; add it to the guard table" ;;
esac

while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  # A path that resolves outside the project is none of the pipeline stage's business:
  # agents legitimately write scratch files to temp directories.
  case "$rel" in ..|../*) continue ;; esac
  if [[ -n "$allowed" ]]; then
    [[ "$rel" =~ $allowed ]] && continue
  elif [[ ! "$rel" =~ $blocked ]]; then
    continue
  fi
  if [[ -n "$reason" ]]; then
    echo "sdlc implement guard: $reason" >&2
  else
    echo "sdlc implement guard: stage '$stage' may not edit '$rel'. Run the stage that owns this path, or set SDLC_STAGE." >&2
  fi
  exit 2
done <<< "$paths"
exit 0
