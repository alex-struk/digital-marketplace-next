| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T17:06:47.213Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation on old, and nothing else? Approve. The diff adds one page, affiliation-removal-request, matching spec/contract/surface.yaml:2105-2117: one action (end_membership_by_request) and three observations (request_accepted, refusal_messages, refusal_status). bindings.yaml lists all four as bound, spelled the way the surface spells them. The bindings stay an adapter. The action resolves the membership from the input or from open() and sends DELETE /api/affiliations/:id as whoever is signed in, which is what the surface comment asks for. It throws unbound only when no membership was named. The observations only read the last answer: whether it was accepted, the refusal's messages in the service's order, and the status code when it is 400 or higher. None of them asserts anything or contains business logic. They use the same helpers and shape as the affiliation-approval-request page next to them (tests/adapters/old/index.ts:10314), which was already accepted. The author's note that a type-check could not be run is answered by the runner's own type-check: it exited 2, but every diagnostic is under adapters/new/ and none is under adapters/old/, so this page compiles. Nothing under tests/acceptance or outside tests/adapters/old changed, and no protected path is touched. The receipt is honest that the accepted path was not exercised. Sending a removal that succeeds would permanently end a seeded membership on the shared target, which is a sound reason not to try. The refused path was checked live: it returned 400 with the sole-owner message the contract names, word for word. The tier is STANDARD and no residual risk is marked unaccepted. The two owed conditions build-slice-12#1 and #2 belong to build and are not settled by this adapter change, so they stay open. The untaken bind-adapter revision requests from build-slice-12 concern organizationEdit and organizationUserMembershipsSelf, not this page, so they wait for a --revise run. What would change this ruling: a diagnostic under adapters/old/, an observation that judges the outcome rather than reporting it, or a change outside tests/adapters/old.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `6870b475f77c5a7dd63179896a6e9813bde14d16`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
