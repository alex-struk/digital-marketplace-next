---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T02:15:26.319Z"
cost: 2.0184004
turns: 38
session: "35def5db-0993-402e-a5c9-16121b6d47f7"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rewrote all three criteria. Each now has a test file, and each also has a `not-testable.yaml` entry for the one clause its test can't reach, so none of them counts as fully tested yet. I could not run the type check or parse the YAML: both commands needed approval this session doesn't have. I checked by reading instead. The new files use only surface methods, seed handles and personas that exist in `tests/generated`. A search found no selectors, routes, URLs or `page.` calls in them.

**R-2.16 (v1): rewritten per the ruling.** The earlier test claimed the criterion's starting state could not be built. It can, because members can leave an organization (`leave_organization`). The first test now does exactly what the criterion describes:
- The organization owner registers a new organization, two colleagues join, and it accepts the Sprint With Us terms. It now qualifies.
- A complete draft is saved for it. The team is the owner, an active member of that organization who holds the capability the phase asks for.
- One colleague leaves, taking three capabilities with them. The owner then submits the draft.
- The test asserts only that the draft did not become submitted.

The second test covers a proposal naming no organization. The form holding back the submission counts as the refusal, so the test asserts only that no proposal was submitted. It no longer reads a message from the form.

The quoted service message ("An organization must be specified before submitting.") is recorded as an open clause (blocked, owner `contract`). Nothing in the surface sends the service a submission with the organization left out: the form won't send it, the edit screen shows only a general notice, and the direct-request page is described as always carrying an organization.

**R-2.22 (v1): rewritten per the ruling.** Every organization change now names the team again from the new organization's members, so the proposal is complete after the change and only the organization rule is under test. That team is the owner, an active member of both organizations. There are six tests: submitted, withdrawn and draft, each for both programs. The submitted proposal must still name its original organization; the withdrawn and draft ones must take the change. I added the Sprint With Us draft case for symmetry.

The quoted refusal message stays an open clause. I updated the existing entry to add what the new test needed and didn't find:
- The edit screens have no action for choosing an organization or team members.
- `save_changes` has no described input. The test passes it `{ organization, team }` or `{ organization, phases }`, copying the direct-request page's input shape. That is my guess, not something the contract states.

**R-2.28 (now v2): rewritten because the criterion changed.** Two tests, both starting from seeded records:
- **Sprint With Us:** an opportunity still at its code challenge. The proposal page must say the proposal can be scored once the opportunity reaches the team scenario, and no team scenario score may be recorded.
- **Team With Us:** an opportunity still at question consensus. The same checks, for the challenge score.

I don't know the exact wording of the page's note, so the test looks for "can be scored once" in the stage tab plus `wrong_stage_error`. That observation has no description, and I'm assuming it may carry the note. The criterion's other two clauses are an open entry (blocked, owner `contract`): no observation says whether the score control is offered, and no surface sends a stage score straight to the service.

**Surface additions needed**, so the contract stage can close these clauses:
1. Whether each score action is offered, on `proposal-swu-view` and `proposal-twu-view`.
2. A request page that sends a Sprint With Us team scenario score or a Team With Us challenge score straight to the service, with accepted, refusal-message and refusal-status observations.
3. On `proposal-swu-edit` and `proposal-twu-edit`: actions for choosing the organization and team members (or a described `save_changes` input), plus an observation of the service's message when `save_changes` is refused.
4. `proposal-team-request` (sprint-with-us) described as accepting a submission with no organization.

Nothing asked me to change any read-only path, and I changed none.