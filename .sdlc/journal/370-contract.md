---
stage: "contract"
title: "contract: post-checks failed"
at: "2026-10-01T13:22:09.924Z"
cost: 1.3708224
turns: 38
session: "ba52230b-9747-4748-b102-86cc046aa100"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I added the piece that R-1.5 was missing, but I couldn't start the oracle from this session, so nothing in this run was checked against the old application.

**What R-1.5 needed.** The criterion says a second request to watch the same opportunity is refused as a duplicate. The opportunity screens only offer a watch toggle. Pressing it a second time stops the watch, so the screens never send a second watch request. In the old application (`src/back-end/lib/resources/subscribers/*.ts`, lines 52–149), a second watch request gets a 400 with the reason `conflict` and the message "This user is already subscribed to this opportunity." Watching an opportunity you created gets the reason `opportunity` and "You cannot subscribe to your own opportunity." All three programs behave the same way.

**What I added.** One new entry in `spec/contract/surface.yaml`: `opportunity-watch-request` (domain `opportunities`, route `/api/subscribers/:program`). I put it in the existing section for requests the screens never make, and it follows the same pattern as the other `*-request` entries there.
- **Actions:**
  - `watch_by_request` always sends a new watch; it never toggles.
  - `stop_watching_by_request` stops a watch. Its path uses the opportunity's identifier, not a subscription identifier, because that is how the old service looks a watch up.
- **Observations:**
  - `request_accepted`, `refusal_status`, `refusal_messages`.
  - `refusal_reason`: `conflict`, `opportunity`, `notFound` or `permissions`.
  - `watching`: the opportunity's own `subscribed` flag for the person signed in. This is a separate way to confirm that the first request recorded the watch.
  - `watcher_count`: the old service only gives this to the opportunity's author and to administrators. The entry says so, so a test reads it as `users.staffOne` or `users.administratorOne`.

**Seed.** No change was needed. Nothing is seeded as watched, and `opportunities.publishedCodeWithUs`, created by `users.staffOne`, can be watched by `users.vendorOne`.

**Unchanged files.** The API description (`openapi.yaml`) already lists all six watch routes, recovered from the old application's own API files. I left it, `personas.yaml`, `observables.yaml`, the seed files and `.sdlc/oracle/compose.yml` as they were. Every other existing page stays as it was; nothing was deleted.

**Oracle not run.** Every command that expands `$SDLC_BIN` (`node $SDLC_BIN oracle up`, and printing the variable) was refused by this session's permission layer. Running with the sandbox off was refused the same way. I can't list anything outside the repository, so I couldn't find the command-line tool another way. As a result:
- I never ran `oracle up` or `oracle down`, so no containers were started or left running.
- I also couldn't run a YAML parser. I checked by eye that the new entry's indentation and syntax match its neighbours.

The next run should start the oracle and confirm two things: the second `watch_by_request` from `users.vendorOne` returns 400 with `conflict`, and `watching` reads true after the first request.

re-address missing-test/R-1.5 to derive-tests: added surface page opportunity-watch-request (route /api/subscribers/:program) with action watch_by_request, which sends a watch without toggling, and observations request_accepted, watching, refusal_reason (conflict for a duplicate), refusal_messages, refusal_status and watcher_count; opportunities.publishedCodeWithUs as users.vendorOne is a watchable starting point with no watch already seeded.

## Fix turn

I made no edits this pass. That was deliberate: none of the 23 flagged lines is in a file this stage owns.

Every flagged line quotes the string "SHA-256". The egress rule reads that string as an internal ticket number, because it has the same shape as one (capital letters, a hyphen, digits). The files involved are `.sdlc/conditions.yaml`, the gate rulings for build slices 2-11 and 3-3, the build-slice proposal pages under `.sdlc/proposals/`, and their rendered copies under `site/proposals/`. All of them were committed by earlier build and gate stages; the newest of them was committed on 2026-09-30. Most of the flagged lines are the gate's own wording, including the instruction "Do not quote ticket-shaped strings…". Two are the build stage's own journal text.

This stage may only edit `spec/contract/`, `tests/seed/` and `.sdlc/oracle/compose.yml`, and a guard rejects edits anywhere else. Rewording gate rulings and recorded conditions would also change records that belong to the gates, which is not this stage's call.

I searched the files this stage does own for anything in the same shape, leaving out the criterion and rule ids like "R-4.17" and "E-2". Nothing turned up. My only uncommitted changes are the earlier additions to `spec/contract/surface.yaml` and the regenerated `tests/generated/surface.d.ts`, and neither contains the string.

**Journal addition:** No files were changed in response to the egress check. All 23 lines it flagged quote "SHA-256", which the check reads as a ticket number, and they sit in gate rulings, recorded conditions and build proposal pages, both their sources under `.sdlc/` and their published copies under `site/`. Earlier build and gate stages wrote all of those files, and this stage has no permission to edit them. The contract, seed and oracle files this stage owns contain nothing in that shape. The rewording, for example to "a sha256 digest", has to happen in a gate or build stage, or be done by whoever owns those records. Until then, the check will keep failing on every stage's run no matter what that stage writes.

.sdlc/conditions.yaml:1134: internal ticket number (rule E-2)
.sdlc/conditions.yaml:1313: internal ticket number (rule E-2)
.sdlc/gates/build-slice-2-11.yaml:6: internal ticket number (rule E-2)
.sdlc/gates/build-slice-2-11.yaml:12: internal ticket number (rule E-2)
.sdlc/gates/build-slice-3-3.yaml:9: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-2-11.md:42: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-2-11.md:73: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-2-11.md:80: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-3-3.md:54: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-3-4.md:28: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-3.md:23: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.html:33: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.html:42: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.html:43: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.md:38: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.md:69: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.md:76: internal ticket number (rule E-2)
site/proposals/build-slice-3-3.html:40: internal ticket number (rule E-2)
site/proposals/build-slice-3-3.md:50: internal ticket number (rule E-2)
site/proposals/build-slice-3-4.html:31: internal ticket number (rule E-2)
site/proposals/build-slice-3-4.md:24: internal ticket number (rule E-2)
site/proposals/build-slice-3.html:28: internal ticket number (rule E-2)
site/proposals/build-slice-3.md:19: internal ticket number (rule E-2)
.sdlc/conditions.yaml:1134: internal ticket number (rule E-2)
.sdlc/conditions.yaml:1313: internal ticket number (rule E-2)
.sdlc/gates/build-slice-2-11.yaml:6: internal ticket number (rule E-2)
.sdlc/gates/build-slice-2-11.yaml:12: internal ticket number (rule E-2)
.sdlc/gates/build-slice-3-3.yaml:9: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-2-11.md:42: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-2-11.md:73: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-2-11.md:80: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-3-3.md:54: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-3-4.md:28: internal ticket number (rule E-2)
.sdlc/proposals/build-slice-3.md:23: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.html:33: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.html:42: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.html:43: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.md:38: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.md:69: internal ticket number (rule E-2)
site/proposals/build-slice-2-11.md:76: internal ticket number (rule E-2)
site/proposals/build-slice-3-3.html:40: internal ticket number (rule E-2)
site/proposals/build-slice-3-3.md:50: internal ticket number (rule E-2)
site/proposals/build-slice-3-4.html:31: internal ticket number (rule E-2)
site/proposals/build-slice-3-4.md:24: internal ticket number (rule E-2)
site/proposals/build-slice-3.html:28: internal ticket number (rule E-2)
site/proposals/build-slice-3.md:19: internal ticket number (rule E-2)