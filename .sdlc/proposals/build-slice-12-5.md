---
gate: G3
question: "Does slice 12 (An organization can build its team) do what its criteria say?"
recommendation: "I made no changes to the application in this revision, because the ruling gave the build stage nothing to change."
opened: 2026-10-03T18:22:49.305Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 12 (An organization can build its team) do what its criteria say?

**Recommendation.** I made no changes to the application in this revision, because the ruling gave the build stage nothing to change.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 12 (An organization can build its team) do what its criteria say? Ruling: approve. Verify recorded a pass for this proposal against application tree e442f07, the branch's current app tree: all 19 claimed criteria were exercised and met, including R-3.11, which previously failed because of the adapter's timing. Approving means asking whether the rest of the code holds up, and it does. In team.service.ts each refusal follows the criterion it enforces. Inviting is open to the owner, its administrators and a service administrator. Only a vendor account that is active and has no current membership in the organization can be invited (R-3.8). Only member or owner can be named (R-3.17). An unregistered address is emailed an invitation to sign up, gets no membership, and the inviter is warned (R-3.30). The owner cannot accept on the invitee's behalf, and a membership that is no longer pending cannot be accepted (R-3.9). Ending a membership marks it inactive rather than deleting it, and the sole owner is refused (R-3.10, R-3.11). Nobody can change their own administrator rights or the owner's (R-3.12). Only a service administrator can transfer ownership, and only to an active member (R-3.13). The rules functions are shared with the screens, so a screen offers only what the service would allow. Rights changes and ownership transfers write their changelog entry in the same transaction as the change itself. The new affiliationEvents migration is additive, and it skips creation where the table already exists, so a database left by the old application keeps its own. The invitation email carries both an accept and a decline link and no unsubscribe offer (R-3.35, R-6.16). Unit tests cover the seams the slice adds: team-service.test.ts against an in-memory store, organizations-end-to-end.test.ts against the seed data, and the frontend team and invitations tests. No code is built for another slice: the qualification tabs are left for slice 13. No secret or real personal data appears; the addresses are example.test placeholders. The only change in this revision is to the database-schema test, which now asks the OS for a free port instead of always using 55432, and it touches no application behaviour. What would change the ruling: a later verify of this tree in which R-3.11 fails again even once the adapter waits for the server's answer. That would point back at what the team page shows after a refused removal.

**Conditions:**
none
