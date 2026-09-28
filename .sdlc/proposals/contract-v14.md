---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "The contract now gives R-2.27's last clause, \"draft proposals are not counted\", something to test: one new seeded opportunity."
opened: 2026-09-28T05:33:25.726Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** The contract now gives R-2.27's last clause, "draft proposals are not counted", something to test: one new seeded opportunity.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The contract now gives R-2.27's last clause, "draft proposals are not counted", something to test: one new seeded opportunity. I also brought the oracle up from scratch, and the application applied its migrations, loaded the seed and closed the new opportunity itself. The oracle is down again.

**What was owed.** R-2.27 says that once every proposal still in contention on an opportunity has been scored, the application moves the opportunity to processing by itself, and that disqualified, withdrawn and draft proposals don't count. The existing test covers the disqualified and withdrawn parts. It couldn't cover the draft part because no seeded opportunity past its deadline had a draft next to a proposal that could be scored. A test can't create one either: proposals can only be started while an opportunity is open, and the form refuses a deadline that has already passed.

**What I added.** A ninth Code With Us opportunity in `tests/seed/009-code-with-us-stages.sql`:
- It is seeded as published with its deadline thirty days past.
- One proposal was submitted by `users.organizationOwner` for `organizations.qualified`.
- One proposal was left as a draft by `users.proponentTwo` for `organizations.proponentTwo`.

In `tests/seed/manifest.yaml` these are:
- `opportunities.cwuLapsedWithSubmissionAndDraft` (`00000000-0000-4000-a009-000000000001`), marked `for: [R-2.27]`
- `proposals.cwuSubmissionBesideDraft` (`…a009-000000000101`)
- `proposals.cwuDraftBesideSubmission` (`…a009-000000000102`)

Only the starting point is seeded; the application produces everything after it. The old code's processing check (`src/back-end/lib/db/proposal/code-with-us.ts:1038`) excludes Withdrawn, Disqualified and Draft, and its closing routine only moves submitted proposals to review. So scoring the one submission should move the opportunity to processing. It gets its own opportunity rather than a draft added to the three-proposal one, so the existing R-2.27 test is unaffected and neither test depends on the order they run in. Nothing else in the contract changed. All five surface, persona, API, observables and compose files are exactly as the earlier approved versions left them, so everything recorded there about pages, sign-ins and unreachable states still holds.

**Proving the oracle.** My first `oracle up` did nothing, because an earlier run had left the oracle running, so the new rows weren't loaded. I ran `oracle down`, then `oracle up` again. It built and started all four copies with no errors, ran the migration service and loaded all fourteen seed files.

Checks against the running application:
- Signed in as the administrator through `/auth/createsessionadmin`, reading `/api/opportunities/code-with-us/…a009…0001` returned the new opportunity by title.
- The application's own scheduled step then closed it: the opportunity showed `EVALUATION` and the submission `UNDER_REVIEW`.
- Signed in as the draft's owner through `/auth/createsessionvendor/11`, the draft was still `DRAFT`.

I changed nothing in the Compose override. `$SDLC_BIN` couldn't be read in this sandbox, so I ran the same CLI from `~/GitHub/agentic-sdlc/bin/sdlc.mjs`.

**Sign-in and personas.** Unchanged. On the oracle every persona signs in through a session route: `/auth/createsessionadmin`, `/auth/createsessiongov`, and `/auth/createsessionvendor/N` for the vendors. On the rebuilt target they use the sandbox identity provider. The accounts the manifest lists as unreachable by the oracle's sign-in routes still are.

**For whoever writes the test next.**
- Close the opportunity with the scheduled-transition trigger.
- Score `cwuSubmissionBesideDraft` and watch the opportunity move to processing, with the note "Automatically moved to Processing as all proposals have been evaluated." in its history.
- As `persona.competingVendor` (`users.proponentTwo`), confirm the draft is still a draft.
- The administrator's proposal list doesn't show drafts, so read the draft as its owner.

`tests/generated/seed.ts` is generated from the manifest and belongs to a later stage, so I didn't edit it.

re-address missing-test/R-2.27 to derive-tests: seed.opportunities.cwuLapsedWithSubmissionAndDraft, a lapsed Code With Us opportunity with one submitted proposal (seed.proposals.cwuSubmissionBesideDraft, users.organizationOwner) and one draft (seed.proposals.cwuDraftBesideSubmission, users.proponentTwo); scoring the submission is scoring the last proposal in contention

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether the contract now gives R-2.27's last clause, "draft proposals are not counted", something a test can act on. It does, so I approve. The existing seeded opportunities could not exercise that clause. A test cannot build the situation either, because proposals can only be started while an opportunity is open and the form refuses a deadline that has already passed. The fix is one new opportunity, number nine. It is seeded as published with its deadline passed, and it carries one submitted proposal from users.organizationOwner and one draft from users.proponentTwo. Both vendors have personas, so each can open their own proposal. Only the starting condition is seeded. The application's own scheduled step does the closing, and the author confirmed on a freshly started oracle that it did: the opportunity went to EVALUATION, the submission to UNDER_REVIEW, and the draft stayed DRAFT. The seed uses the existing helpers, and opportunity 1 already seeds a DRAFT through the same path, so the new rows add no new mechanism. The opportunity's number matches the file's identifier scheme, the header count is updated to seven of nine, and the other contract files are untouched, so earlier approvals still hold. The page says tests/generated/seed.ts was not edited, yet it appears in the diff. That file is regenerated from the manifest, the 'generated' check passes, and its new entries match the manifest exactly, so the discrepancy is harmless. Two things would change this ruling: the application not counting the draft when scoring the one submission (that would be a calibration question, not a contract one), or evidence that closing the opportunity moves the draft instead of leaving it as DRAFT. The criterion's wording and confidence are unchanged, so no condition line is needed.

**Conditions:**
none
