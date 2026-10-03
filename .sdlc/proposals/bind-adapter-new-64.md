---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I couldn't type-check the changed file, and the fix has not been run against the target."
opened: 2026-10-03T18:15:13.052Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I couldn't type-check the changed file, and the fix has not been run against the target.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've changed `removeTeamMember` so it now waits for the server to answer the removal before it returns, which should stop R-3.11 from reading an empty refusal. I couldn't type-check the changed file, and the fix has not been run against the target.

**The problem.** R-3.11 removes the organization's sole owner and expects the refusal. The adapter clicked Remove, answered the confirmation and returned straight away. The refusal is only drawn after the server answers the delete request for that membership. So whether `organizationEdit.fieldError` saw it depended on timing, which is why R-3.11 failed, passed and failed again with nothing changed in the application.

**The change.** It is in the shared row helper `orgInRow` in `tests/adapters/new/index.ts`, which `removeTeamMember` and `approvePendingMember` both use:
- Before pressing the row's control, it starts listening for the next request to `/api/affiliations` that isn't a plain read (GET).
- After the confirmation, it waits up to 15 seconds for that answer.
- Once the answer arrives, it waits for the page to go quiet. It then gives an alert in the Team members section up to 2 seconds to appear.
- If no answer comes, it carries on as before rather than failing, because the action itself didn't fail.

I chose to fix the action rather than make `fieldError` wait for an alert. `fieldError` is also used where the right answer is that nothing is shown. Making it wait would slow every one of those reads and risk deciding those tests. The cost is that a successful removal or approval now takes up to about 2 extra seconds, spent waiting for an alert that never comes.

**Unverified assumption.** I matched the request by the `/api/affiliations` path the ruling gave, and did not watch it in the browser this run. I also assumed approving a pending member goes to the same endpoint; if it doesn't, that action just behaves as before.

**Not checked.** The tool permissions in this session blocked the TypeScript compiler. I did confirm that the two helpers the new code uses are defined at the top of the adapter, where `orgInRow` can reach them.

Nothing else in the adapter changed. `tests/adapters/new/bindings.yaml` is untouched, because no member moved between bound and unbound. I wrote nothing outside `tests/adapters/new/`, and no page's route was rechecked this run.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does this adapter bind the new target's surface, and nothing else, while fixing the timing race that made R-3.11 fail, pass and fail again? Ruling: approve. The change in orgInRow (tests/adapters/new/index.ts) starts listening for the next non-GET response from /api/affiliations before pressing the row control. After the confirmation it waits up to 15 seconds for that response, then waits for the page to settle and gives an alert in the Team members region up to 2 seconds to appear. Every wait swallows its timeout, so the change controls only when the next read happens; it asserts nothing and does not decide whether any test passes. Nothing under tests/acceptance changed and bindings.yaml is untouched. The runner's typecheck on this revision passed with no diagnostics under adapters/new/. The author's unverified assumption holds on proposal/build-slice-12-4: removal is DELETE /api/affiliations/{id} and approval is PUT /api/affiliations/{id}, so the listener matches both actions that use the helper. This answers the revision request from build-slice-12-4. What would change the ruling: R-3.11 still alternating between pass and fail in the next verify run with this adapter, which would show the race lies elsewhere.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `f6581fce3714edc4dfd08e4f19a245519b8f7413`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
