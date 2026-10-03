---
gate: G3
question: "Does slice 12 (An organization can build its team) do what its criteria say?"
recommendation: "I fixed the one failure the ruling returned, R-3.10."
opened: 2026-10-03T18:06:48.149Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 12 (An organization can build its team) do what its criteria say?

**Recommendation.** I fixed the one failure the ruling returned, R-3.10.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I fixed the one failure the ruling returned, R-3.10. The full `npm --prefix app run check` now passes: typecheck plus 16 migrations tests, 563 backend tests and 375 frontend tests. I could not run the acceptance suite or open a page here, so whether the other 18 criteria still pass needs a new verify run.

**Cause.** The captured page showed the status "You have left Cormorant Bay Membership Ends Ltd." while the table still listed that organization with a Leave button. In `OrganizationsSection.confirm` (`app/frontend/src/screens/user-profile.tsx`), the code closed the dialog and set that status, and only then fetched the memberships again. So for the length of one request, the page said the person had left while still showing them as a member.

**Fix.** A new exported function, `membershipsAfter`, applies the confirmed answer to the list already on the page:
- **Leave or decline:** the membership is removed.
- **Accept:** the membership becomes active.

`confirm` now updates the list and sets the status in the same render, so neither can appear without the other. The re-fetch still runs afterwards and replaces the list when it succeeds. If it fails, the updated local list stays on the page, where before the whole section was replaced by a "could not be loaded" error.

**The empty "Join ?" dialog.** The failure outline also showed an empty "Join ?" dialog left after closing. The confirmation dialog was always mounted and only switched off with `isOpen`, so while it closed it fell back to the accept wording with a blank name. It is now drawn only while a question is being asked, so closing removes it completely. Focus handling on close is unchanged.

**Unit tests**, added to `app/frontend/tests/team.test.tsx`:
- **Leave:** confirms leaving with the re-fetch held pending. When "You have left Aurora." appears, the table no longer contains Aurora or its Leave button, the other row is still there, and no dialog is left in the page. It then releases the re-fetch and checks the result holds. The old code would fail this test, because the held re-fetch kept Aurora listed.
- **Decline:** arrives from an invitation message's decline link with the re-fetch never answering. When the decline is announced, the invitation is already gone from the table, along with its pending badge and the dialog.
- **`membershipsAfter`:** a direct test of the leave, decline and accept outcomes.

I changed nothing outside `app/`, and the change needed no new decision record. The design departures recorded in decision 0052 for this slice are unchanged. Nothing new is left for the next slice.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does slice 12 do what its criteria say? Ruling: return, with the remaining work addressed to bind-adapter rather than build. The owed R-3.10 condition is carried out: R-3.10 now passes in verify, and the proposal adds the held-re-fetch unit tests and stops drawing the confirmation dialog once it closes. The one failure left, R-3.11, is not the application's. The failure outline at .sdlc/evidence/slice-12/R-3.11.txt shows the team region already holding the alert 'That change could not be made — This is the sole owner for the organization, and cannot be removed.', with the owner's row still listed as Owner, which is what R-3.11 requires. The adapter's organizationEdit.fieldError (tests/adapters/new/index.ts:5444) reads the team region's alerts at once, with no wait for the DELETE answer to render, so it can read "" before the refusal is drawn. R-3.11 has gone fail (verify run 2), pass (run 3), fail (run 4) without the removal path changing, which is a race and not a defect, so another build would not settle it. The verify account's suspicion that the adapter is at fault is what decided this. What would change the ruling: a fieldError that waits for the refusal, then a verify run in which all 19 claimed criteria pass. If R-3.11 still fails once the adapter waits, the fault returns to build.

**Conditions:**
- condition-met build-slice-12-3#1: OrganizationsSection.confirm in app/frontend/src/screens/user-profile.tsx now applies the confirmed answer to the list through membershipsAfter in the same render as the status. The confirmation dialog is drawn only while a question is asked. app/frontend/tests/team.test.tsx holds the re-fetch pending for leave and for decline and checks the organization is already gone when the status appears. R-3.10 passes in tests/results/new/slice-12.json.
- addressed-to bind-adapter: organizationEdit.fieldError in tests/adapters/new/index.ts (around line 5444) reads the Team members region's role=alert elements immediately after removeTeamMember. removeTeamMember (orgInRow, then confirmIfAsked) does not wait for the DELETE /api/affiliations/<id> answer, and the refusal alert is drawn only once that answer arrives. In verify of slice 12 (proposal build-slice-12-4) R-3.11 read "" at line 12, yet the failure outline .sdlc/evidence/slice-12/R-3.11.txt taken moments later shows alert 'That change could not be made' with 'This is the sole owner for the organization, and cannot be removed.' inside region 'Team members'. R-3.11 has failed, passed and failed across three verify runs with the application's removal path unchanged. Make removeTeamMember wait for the membership request to settle, or make fieldError wait for an alert to appear in the team region within the normal timeout, before reading, so a refusal drawn after the response is read rather than missed.
