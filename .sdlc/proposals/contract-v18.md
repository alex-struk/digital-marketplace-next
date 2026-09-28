---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I supplied what both owed tests needed."
opened: 2026-09-28T20:12:52.289Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I supplied what both owed tests needed.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I supplied what both owed tests needed. The oracle started cleanly from a fresh database with this run's seed loaded, and I took it down afterwards; no oracle containers are left running.

**Starting point.** The contract already had 80 pages across all eight domains, with sign-in routes for every persona, a recovered API description, the observables and 14 seed files. This run only had to deliver the two owed items, R-2.14 and R-2.18. Nothing was deleted or renamed. `personas.yaml`, `openapi.yaml` (which already describes the three proposal-create routes the new pages use), `observables.yaml` and `.sdlc/oracle/compose.yml` are unchanged. Sign-in is also unchanged: every reachable persona signs in through a session route (`/auth/createsessionadmin`, `/auth/createsessiongov`, `/auth/createsessionvendor/N`) on the oracle, and by sandbox username on the rebuilt target.

**What I added to `spec/contract/surface.yaml`.** Both items had the same gap: the proposal screens only let a vendor choose values the service would accept, so the refusals could never be put to the service. The fix was one request-level page per shape of proposal, like the existing evaluation request pages:

- **`proposal-cwu-request`** (`/api/proposals/code-with-us`) submits a Code With Us proposal with its proponent given exactly as stated. The proponent is either an organization identifier or an individual whose fields can be blank or malformed. It reports:
  - `request_accepted` and `proposal_identifier`;
  - `refusal_by_field` (each message together with the field it names), `refusal_messages` and `refusal_status`.
- **`proposal-team-request`** (`/api/proposals/:program`, where program is sprint-with-us or team-with-us) submits a proposal whose team members are given as seed user handles, repeats included. It reports the same observations.

Five screens also gained an observation:
- `field_errors_by_field` on `proposal-cwu-create`;
- `submission_refusal` on `proposal-swu-edit` and `proposal-twu-edit`;
- `team_member_choices` on `proposal-swu-create` and `proposal-twu-create`.

These new entries have `test_id: null` for the design gate to fill in.

**What I added to the seed.** `tests/seed/014-proposal-team-candidates.sql` adds three placeholder vendor accounts and two memberships of the organization qualified for both programs:
- `users.teamCandidatePending`: invited to that organization and hasn't answered (PENDING);
- `users.teamCandidateFormer`: their membership there has ended (INACTIVE), which is what the application records when a member leaves;
- `users.teamCandidateOutsider`: a member of no organization.

No proposal names any of them, so the application still produces every refusal itself. All three have new-opportunity notices off, so the announcement counts other tests depend on (140 selected, 139 with an address, 3 batches) still hold. The manifest also has a new `unassigned_identifiers.organizationNeverCreated`: a well-formed organization identifier that is never inserted, for "an organization that does not exist."

**Two behaviours of the old service a test writer needs to know.** I recorded both as facts in the page comments:
- **An organization that doesn't exist is refused against the wrong fields.** Before validating, the service swaps an unknown organization proponent for a blank individual, so the refusal names the individual's fields rather than "organization". I confirmed this on the running oracle. I also confirmed that a vendor naming an organization they don't belong to is accepted (201), as R-2.14 says.
- **A Sprint With Us phase naming the same person twice fails when stored, not when validated.** Validation has no uniqueness check for these phases, as R-2.18 says. But the database keys a phase's team by person, so the service should answer with a storage error (503) rather than a validation refusal. This comes from reading the source and schema only; I did not run it, because probing either team program needs an opportunity still open for proposals, and none is seeded.

**Oracle.** The first `oracle up` returned straight away because containers left by an earlier stage were still running, and those didn't have the new seed. I took them down and brought the oracle up fresh. All 78 migrations ran, and all four copies started. Signed in as the administrator through the session route, the application's own API showed the qualified organization's team including the pending candidate and leaving out the former member, and returned the former member's account. The override needed no changes, and I made none. I could not run a YAML parser: every script runner needed approval in this session. I checked the edited YAML by reading it back.

**Limits a test writer should know.**
- The old management screens report a refused submission only as a general "Unable to Submit Proposal" notice. `submission_refusal` therefore returns that notice, and the refusal's exact wording has to be read from `proposal-team-request`.
- `proposal-team-request` finds a Team With Us resource by its service area, by reading the opportunity back from the service. That is an instruction to the adapter, not something I tested.

re-address missing-test/R-2.14 to derive-tests: added the `proposal-cwu-request` page (organization proponent by identifier, or individual proponent as given, with `request_accepted`, `refusal_by_field`, `refusal_messages` and `refusal_status`), the `field_errors_by_field` observation on `proposal-cwu-create`, and the seed handle `unassigned_identifiers.organizationNeverCreated`; `seed.organizations.qualified` serves as an organization the vendor persona does not belong to.

re-address missing-test/R-2.18 to derive-tests: added the `proposal-team-request` page (team members by seed user handle, repeats allowed, with `refusal_messages`, `refusal_by_field` and `refusal_status`), seed users `teamCandidatePending`, `teamCandidateFormer` and `teamCandidateOutsider` with PENDING and INACTIVE memberships of `organizations.qualified`, `submission_refusal` on `proposal-swu-edit` and `proposal-twu-edit`, and `team_member_choices` on `proposal-swu-create` and `proposal-twu-create`.

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Is this the contract the tests for R-2.14 and R-2.18 will use? Approved. The proposal screens let a vendor choose only values the service accepts, so R-2.14's per-field refusals and R-2.18's membership and uniqueness refusals cannot be reached through them. The two new request-level pages (proposal-cwu-request, proposal-team-request) follow the pattern of the existing evaluation request pages and send any input straight to the service. Each reports whether the request was accepted, the refusal status, and each refusal message together with the field it names, which is what both criteria's 'then' clauses need. The seed now covers every case in R-2.18's 'given': a pending membership, an ended (INACTIVE) membership, and no membership at all. A well-formed organization identifier that is never inserted covers R-2.14's existence check, and seed.organizations.qualified serves as the organization the vendor does not belong to. I checked the new seed file against the existing ones: its column lists match and its identifiers do not clash. The new accounts have new-opportunity notices off, so existing announcement counts are unaffected. Nothing is removed or renamed; the only changes to existing pages are five added observations. Two behaviours of the old service are recorded as facts in the page comments. First, when the organization proponent does not exist, the service substitutes a blank individual, so the refusal names the individual's fields rather than 'organization'; this was confirmed on the oracle. Second, a Sprint With Us phase naming the same person twice fails when stored (503) rather than at validation; this comes from reading the source and schema only and is stated as such. What would change this ruling: calibration showing that the refusal for an organization that does not exist is not reported against the individual's fields, or that a duplicate in a Sprint With Us phase is not answered with 503. Either would mean the page comments misstate the old service's behaviour and need rewriting before tests rely on them.

**Conditions:**
none
