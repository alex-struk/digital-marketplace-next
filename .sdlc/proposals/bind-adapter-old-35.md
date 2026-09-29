---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I bound all 32 missing contract members in `tests/adapters/old/index.ts` and named each one `bound` in `tests/adapters/old/bindings.yaml`."
opened: 2026-09-29T02:48:50.404Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I bound all 32 missing contract members in `tests/adapters/old/index.ts` and named each one `bound` in `tests/adapters/old/bindings.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I bound all 32 missing contract members in `tests/adapters/old/index.ts` and named each one `bound` in `tests/adapters/old/bindings.yaml`. None is reported unbound, and every route involved resolved on the target at localhost:4300. The code has not been compiled or run: the workspace has no TypeScript installed, and running a type check or a syntax check needed approval nobody was here to give. It still needs a type check and a test run. The existing bindings were kept; everything here is added on top of them.

**Proposal edit screens (Sprint With Us and Team With Us).** I opened the seeded submitted Sprint With Us proposal (`swuOpenSubmitted`) as its vendor, the competing-vendor persona. After pressing "Edit", the screen shows the same numbered steps as the create screen, and "2. Team" has the same "Organization*" chooser and "Add Team Member(s)" per phase. So `choose_organization`, `add_phase_team_member`, `set_scrum_master` and `add_team_member_for_resource` open editing first, then reuse the create screen's code. I only looked at the Team With Us edit form through the shared code, not in the browser.
- `organization` reads the legal name shown under "Organization" in the Proposal tab's header.
- `field_error` goes through every step of the open form and reports each message against its field, as "organization: …". A closed form (the save went through) reads empty.

I did not see a refused organization change on screen. None of the seeded open proposals belongs to a vendor with more than one qualifying organization, and I chose not to create proposals on the shared target to set one up. The binding relies on the field-message reader that already works on the create screens.

**`rank` on both proposal view screens.** As the administrator, the header shows "1st" above "Ranking" on a fully evaluated proposal, and "—" on one still waiting for a stage score. I checked this on the seeded Sprint With Us opportunity at the team scenario and the seeded Team With Us opportunity at the challenge. The dash is returned as empty.

**Organization edit logo.** As the organization owner on Northern Pines, "Edit Organization" shows "Choose Image". I gave it a `.txt` file and saved. The service refused it: "Please select a different logo image." appeared under the control, with an "Unable to Update Organization" notice.
- `change_logo` opens the form if needed and offers the file through the harness's `uploadFile`.
- `save_changes` now stops waiting as soon as either the form closes or an "unable / could not" notice appears. Before, a refused save waited 30 seconds.
- `save_changes` also saves the logo message, because `current_logo` has to cancel the open form to read the stored logo. `current_logo` then returns the stored-file address, or empty when only the placeholder image is showing.

**The request pages.** I checked each against the live service before binding it.
- **`affiliation-approval-request`:** sends `PUT /api/affiliations/:id` with the tag `approve`.
  - Accepting an already active membership came back 400 "Membership is not pending."
  - The owner accepting someone else's invitation, and a signed-out request, both came back 401 with the permission message.
  - I did not accept a real pending invitation, so the success path (reading `membershipStatus`) was not seen live.
- **`membership_identifier`:** reads the `id` from the invitation's 201 answer.
- **`proposal-evaluation-request`:** sends `scoreCodeChallenge`, `scoreTeamScenario` or `scoreChallenge` to `/api/proposals/:program/:id`.
  - The team scenario score on `swuScreenedIntoScenarioEarly` came back with the wrong-stage message.
  - A proposal not carried into that stage got the general permission message.
  - A made-up tag came back as a parse failure, which confirms the real tag names are recognised.
  - An accepted score was not seen live either.
- **`user-account-self-request`:** reads the user's `id` and `notificationsOn` from `/api/sessions/current`. Signed out, that endpoint answers `null`, so both read empty.
- **`user-account-request`:** reads `/api/users/:id`. The person themselves and the administrator get the record; another vendor and a signed-out visitor get 401.
- Both account pages ask the service again on every read, so they show what it holds at that moment.

**Two things a reviewer should know.**
- The target is not exactly as seeded. My logo test was refused, so nothing was stored from it, but everything else I sent (refused scores, refused approvals) also changed nothing.
- Signing out through `/sign-out` takes a moment to clear the session; an immediate read still showed the old user. Adapter code that already existed pauses after going to `/sign-out`, but one of my own checks read the session too soon and still saw the old user. I did not change sign-out.

I changed nothing outside `tests/adapters/old/`.
