---
gate: G3
question: "Does slice 11 (A vendor can register and look after an organization) do what its criteria say?"
recommendation: "I made no changes to the application in this revision, because the ruling found nothing in it to fix."
opened: 2026-10-03T15:39:13.841Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 11 (A vendor can register and look after an organization) do what its criteria say?

**Recommendation.** I made no changes to the application in this revision, because the ruling found nothing in it to fix.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I made no changes to the application in this revision, because the ruling found nothing in it to fix. Both remaining failures, R-3.2 (a vendor who has accepted the terms registers an organization by request) and R-3.18 (an organization administrator who is not the owner is refused a profile change by request), stop inside the new target's test adapter before any request reaches the service. The adapter does not accept the input key `addressLineTwo` as the second street-address line. That fix belongs to the bind-adapter stage, which has already been asked for it. The file is `tests/adapters/new/index.ts`, which is outside `app/` and `docs/decisions/`, so I left it alone.

**Checks.** The workspace had no dependencies installed, so the first run of the check failed with `tsc: not found`. After `npm --prefix app install`, `npm --prefix app run check` passes: typechecking, plus all unit tests in every package (16, 533 and 343 tests). The install may have refreshed `app/package-lock.json`; nothing else under `app/` changed. One error line about mail not being delivered (`smtp-451`) appears in the output. It is logged on purpose by a unit test of the welcome-mail failure path and is not a failure.

**The field the adapter will send to.** The API's name for the second address line is `streetAddress2`, and the backend already handles it in the organization rules, the service and the store. Once the adapter maps `addressLineTwo` to it, registration and profile-change requests should reach validation and storage without any change on the app side.

**State of the slice.** From the earlier builds, verify has confirmed:
- R-3.22 passes all its invalid-submission tests.
- The R-3.18 screen tests pass: a service administrator is offered Edit and Archive on the Organization tab, and an organization administrator who is not the owner sees neither.

The rest of slice 11 is unchanged from what verify last saw. The request tests for R-3.2 and R-3.18 have not yet run against the service. If they fail once the adapter accepts `addressLineTwo`, the ruling says that failure is the app's, and the next revision should start from what the service returned.

**What the next slice gets.** Slice 12 inherits archiving (R-3.6), the registering vendor becoming owner of an organization that is active at once (R-3.23), and the list of organizations a vendor may act for (R-3.15). All three are built here; their tests depend on the team tab Slice 12 delivers.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether slice 11 does what its criteria say. Verify failed R-3.2 and R-3.18, which escalated the slice after three builds; I return it to build. The two failures do not come from the test adapter, contrary to what the proposal says. Both request tests reached the service and got an answer back: they expected a permission refusal and received a body keyed `errors`. The service sends every permission refusal from the organization routes (registering, a profile change, an archive) as an UnauthorizedException, which the boundary renders as `{ errors: [...] }`. The contract's operations for these routes name the refusals '(permissions)', and decision record 0003 makes `permissions` the key for a permission refusal. The watch routes already produce that shape through NamedRefusal in app/backend/src/common/refusals.ts. So the fault is in the application, inside build's own workspace, and nothing here questions the criterion, the test or the sandbox. The ruling would change to approve once a verify run that is current for the revision shows R-3.2 and R-3.18 passing; the tests both are owed can then run against it. If, once the key is right, a request test still stops before reaching the service, that part is the adapter's and would go to bind-adapter.

**Conditions:**
- Send the permission refusals of the organization routes under the key `permissions`, at status 401, using NamedRefusal in app/backend/src/common/refusals.ts the way app/backend/src/watching/watching.service.ts does. That covers POST /api/organizations (registering by anyone but a signed-in vendor who has accepted the terms, including a visitor with no session) and PUT /api/organizations/:id and DELETE /api/organizations/:id (anyone who is neither the organization's owner nor a service administrator). Leave the BadRequest validation refusals under `errors`. Update app/backend/tests/organizations-end-to-end.test.ts so it asserts the `permissions` key for these refusals. What showed it: the R-3.2 and R-3.18 request tests received "errors" where they expect a permission refusal, the contract's operations for these routes name the refusals "(permissions)", and decision record 0003 makes `permissions` the key for a permission refusal.
