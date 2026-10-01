---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-10-01T01:47:34.528Z"
cost: 0.5401652
turns: 24
session: "8f143f13-fb3e-4c7b-89be-cd823b62bc0e"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I fixed the R-8.23 file-name problem in `tests/adapters/new/index.ts`, but I couldn't run the typechecker or try a 256-character name against the running target, so the fix is unverified.

**The cause.** Both places in the adapter that hand over a file passed the test's file name to the shared `uploadFile` helper in `tests/fixtures/upload.ts`. That helper writes a file of that name in the system temp folder, and file names there are limited to 255 bytes. A 256-character name failed with ENAMETOOLONG on this machine before anything reached the service. The ruling named `offerFile`, the browser file-chooser path. The API path (`uploadGiven`, used by every file-upload action) had the same flaw, so I fixed both.

**The change.** A new helper, `fileGiven`, still asks the shared harness for the file's contents, so every adapter sends the same bytes for the same type and size. It asks under a short stand-in name with the same ending, such as `offered.txt`, then reads the bytes back and returns the test's real name, a type looked up from the ending, and the bytes.
- **API path:** `uploadGiven` now uses those bytes. The upload still sends the test's own name both as the file's name in the request and as the `name` field, which is the second route the ruling suggested.
- **Browser path:** `offerFile` now hands Playwright the name, type and bytes directly instead of a path on disk, through `setFiles` on the file chooser or `setInputFiles` on a labelled file input. This is the first route the ruling suggested. The name reaches the page exactly as the test gave it, whatever its length.

I also corrected the comment above `uploadGiven` so it describes the new behaviour. Nothing else changed: no other method, and not `bindings.yaml`, since every member's bound or unbound status is the same as before.

**What I could not check.** The typechecker (`tsc`) needed approval this session could not get, so I checked the edits by reading them:
- Playwright accepts a name/type/bytes object in both `setFiles` and `setInputFiles`.
- No reference to the old on-disk path is left.
- `extname`, `readFileSync` and `uploadFile` are all still used.

I also tried to send a long-name upload to the target from the browser tool, but its code sandbox has neither `Buffer` nor `TextEncoder`, so I couldn't build the bytes there. Whether the service then refuses the name with the 1–255 characters message is for R-8.23's own run to show. The adapter no longer stands in its way.

I changed nothing outside `tests/adapters/new/`, and no route in the surface needed checking again for this revision. Request 1 is addressed in this run, not deferred.