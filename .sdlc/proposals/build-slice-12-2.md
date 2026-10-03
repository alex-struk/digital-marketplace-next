---
gate: G3
question: "Does slice 12 (An organization can build its team) do what its criteria say?"
recommendation: "I couldn't confirm the cause: the test adapter isn't in this workspace and nothing here runs a browser."
opened: 2026-10-03T17:36:25.181Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 12 (An organization can build its team) do what its criteria say?

**Recommendation.** I couldn't confirm the cause: the test adapter isn't in this workspace and nothing here runs a browser.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've changed the team tab for the two failures the ruling gave to the application, R-3.7 and R-3.30. I couldn't confirm the cause: the test adapter isn't in this workspace and nothing here runs a browser. So the fix closes the most likely cause, which the ruling also named, without proving it. `npm --prefix app run check` passes: typecheck plus all unit tests in the three packages (16, 563 and 368).

**What the evidence showed.**
- **R-3.7:** the owner invited two addresses at once, but the team table listed only one pending invitee, even after the test read the table a second time. The second invitation never reached the service, or never came back.
- **R-3.30:** after an unregistered address was invited, the team table showed only the seeded pending invitee and no warning.
- **The backend is fine.** Its own tests show it refuses an unregistered address with `inviteeNotRegistered`, emails a sign-up invitation, and creates no membership. The front end turns that refusal into the warning.
- **So the loss is on the page.** The dialog sent invitations one after another, and kept the results (refusals, the unregistered warning, the wrong-membership-type error) only in the tab's in-memory state. If the page is redrawn or moves on after Send, a second invitation still waiting on the first is never sent, and the warning disappears. That fits both failures.

**What I changed:**
- **All invitations go at once.** The dialog now sends every address in parallel and reports when all are answered, so none waits on another. The lists of refusals and unregistered addresses keep the order the addresses were typed in.
- **The result survives a reload.** It is now saved in `sessionStorage` for that organization when the answers come back, and read again when the team tab is drawn. Opening the invite dialog again, or making any other change on the tab, clears it. A saved result older than ten minutes is ignored. If storage can't be used, the tab simply shows the result until the page is redrawn, as before.
- **A field may hold several addresses.** Addresses separated by commas, semicolons or spaces are each invited, and each must be valid before anything is sent.

The new helpers are in `app/frontend/src/lib/invitations.ts` and are used by the team tab in `app/frontend/src/screens/organization-team.tsx`. The reasoning is recorded in `docs/decisions/0051-invitations-are-sent-together-and-their-outcome-outlives-a-reload.md`.

**Tests added:**
- **`app/frontend/tests/invitations.test.ts`:** reading addresses from a field, removing duplicates, the field error messages, and saving, reading back, expiring and rejecting malformed saved results.
- **Team tab tests in `app/frontend/tests/team.test.tsx`:**
  - Both invitations go out before either is answered, then both invitees appear as Pending and the team size stays at 1.
  - Addresses pasted together into one field are each invited.
  - The warning naming an unregistered address is still there after the page is drawn from scratch, no row appears for that address, and opening the dialog again clears it.
- **Adjusted:** the existing three-address test now checks which invitations were sent rather than their order, and storage is cleared before each test.

**Not mine to do.** The other fourteen conditions in the ruling are addressed to other stages, and I left them alone. Thirteen are adapter bindings: reading the Membership column for the Pending and Owner badges, the capability list items, the New owner select, the admin-rights statement checkbox inside its dialog, the not-found page as the refusal, matching team rows by name rather than email, the decline-confirmation dialog, and reading the R-3.30 warning alert instead of a field error. The current adapter reads R-3.30 as a field error, so that criterion can't pass until it is re-bound, even with the warning now on the page. The fourteenth, R-3.11 (refusing to remove the sole owner), needs the contract to add a way of seeing that refusal, because the owner's row deliberately offers no Remove button. I changed nothing else for those criteria.
