---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I added the one page this contract brings that the `old` adapter did not yet have."
opened: 2026-10-03T17:06:47.213Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the one page this contract brings that the `old` adapter did not yet have.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the one page this contract brings that the `old` adapter did not yet have. The type-check could not be run (the command needed approval this session doesn't have), so the new code has not been compiled. It hasn't been run end to end either.

**What I added.** `affiliation-removal-request` (route `/api/affiliations/:affiliationId`), with one action and three observations, all bound:

- **`end_membership_by_request`** sends `DELETE /api/affiliations/:id` from the signed-in session. It ends the membership named in the input if there is one, otherwise the one passed to `open()`. Either may be a seed handle such as `qualifiedOwner` or a raw identifier. If neither names a membership, it throws `unbound:`.
- **`request_accepted`** reads whether the last answer was accepted.
- **`refusal_messages`** returns the refusal's messages in the service's order, and is empty when the request was accepted.
- **`refusal_status`** returns the error status code, and is empty when the request was accepted.

The page follows the same pattern and reuses the same helpers as the existing `affiliation-approval-request` page, which sits right next to it in `tests/adapters/old/index.ts`. It is also added to the object the adapter returns.

**What the target answers.** I signed in through `/auth/createsessionvendor/2` (the organization-owner persona) and sent the `DELETE` for `affiliations.qualifiedOwner` (`…0401`). The target answered `400` with `{"affiliation":["Unable to remove membership. This is the sole owner for this organization."]}`, word for word what the contract's comment expects. Because it was refused, nothing in the seed changed. I did not send a removal that would have been accepted, since that would have permanently ended a seeded membership on the shared target. So the accepted path is bound but was not seen working.

**Bindings file.** `tests/adapters/old/bindings.yaml` now names `affiliation-removal-request` with all four members as `bound`, spelled the way `surface.yaml` spells them. All earlier bindings are unchanged.

**Routes.** Every route this run touched resolved on the target; none failed to resolve. Nothing outside `tests/adapters/old/` was changed, and nothing asked for such a change.
