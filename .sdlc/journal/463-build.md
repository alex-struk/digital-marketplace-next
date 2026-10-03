---
stage: "build"
title: "build slice 12"
at: "2026-10-03T18:22:49.169Z"
cost: 0.5914948
turns: 25
session: "490feef1-1730-4be1-8895-11528623c702"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

I made no changes to the application in this revision, because the ruling gave the build stage nothing to change.

**Why nothing changed.** The ruling sent slice 12 back for one reason: R-3.11 kept failing in verify. It placed that fault in the test adapter, not in the application. I opened the failure outline at `.sdlc/evidence/slice-12/R-3.11.txt` and it agrees with the ruling. On the organization's team tab, the "Team members" region already shows the alert "That change could not be made" with "This is the sole owner for the organization, and cannot be removed." That is the refusal R-3.11 requires. The test still read an empty value because the adapter reads the region's alerts as soon as it asks for the removal. It does not wait for the server to answer, and the alert only appears once that answer arrives. R-3.11 has failed, passed and failed again across three verify runs with no change to the removal path, so it is a timing problem. Another build cannot fix it.

The fix belongs to bind-adapter. In `tests/adapters/new/index.ts`, `organizationEdit.fieldError` or `removeTeamMember` needs to wait for the removal request to finish, or for an alert to appear in the team region, before reading. The ruling has already filed that with bind-adapter. That file is not in a path this stage owns, so I left it alone. I also did not make the application work around the race, for example by refusing the sole owner's removal on the page before the server answers. That would change a working removal path just to suit the adapter's timing, and the ruling asked me to leave the rest as it is.

**What is already built.** The previous round's fix for R-3.10 is still in place, and R-3.10 now passes in verify. That fix re-fetches the team and keeps it while the confirmation dialog is open, has unit tests for this, and stops drawing the dialog once it closes. The other slice-12 criteria are as the earlier rounds built them, and are recorded in decisions 0050 to 0052 under `docs/decisions/`.

**Check.** The workspace had no dependencies installed, so I installed them from the lockfile under `app/` and ran `npm --prefix app run check`. Typechecking passes for the migrations, backend and frontend packages, and every unit test passes:

| Package | Test files | Tests |
|---|---|---|
| Migrations | 2 | 16 |
| Backend | 37 | 563 |
| Frontend | 22 | 375 |

**What would settle it.** Once bind-adapter's change is in, a verify run should show all 19 criteria passing. If R-3.11 still fails after the adapter waits for the answer, the fault comes back to build. The next thing to look at would then be what the page draws in the team region after the refused removal.

## Fix turn

The check now passes. It typechecks every package under `app/` and runs all their tests: migrations 16 of 16, backend 563 of 563, frontend 375 of 375.

**Journal addition:** The "Could not parse CSS stylesheet" and "Not implemented" lines in the failed check were only harmless warnings from the frontend's simulated browser in tests, and every frontend test passed. The real failure was in the migrations package. Its schema test (`app/migrations/tests/schema.test.mjs`) starts an in-process PostgreSQL on a fixed port, 55432. When I re-ran the check, that test failed with "address already in use", so a run fails whenever something else already holds that port. I changed only that test: it now asks the operating system for a free port before starting the database and connects there, so it no longer collides with anything. Nothing in the application changed. The R-3.11 condition is still with bind-adapter, as the ruling directed.