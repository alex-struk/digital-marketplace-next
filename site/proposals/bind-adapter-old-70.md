| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T16:16:33.214Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the four members the new contract declared for `evaluation-individual-submission-request-swu`, and they are all marked `bound` in `tests/adapters/old/index.ts` and `tests/adapters/old/bindings…

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I added the four members the new contract declared for `evaluation-individual-submission-request-swu`, and they are all marked `bound` in `tests/adapters/old/index.ts` and `tests/adapters/old/bindings.yaml`. Two limits: I could not compile the file, and I never sent a submission the target accepts. Nothing else in the existing adapter was changed.

**How each member works.** This page is a request to the service, not a screen. It is bound the same way as the adapter's other request pages: requests go out through the browser's signed-in session, and the observations read the latest answer.
- **`open`** takes the opportunity's seed handle (such as `swuSubmissionNamesTwoOfThree`) or a raw identifier, and remembers it. It does not navigate anywhere.
- **`submit_scores_for_consensus_naming`** sends a change to the Sprint With Us opportunity tagged `submitIndividualQuestionEvaluations`, carrying an optional note and the list of named proposals. The contract's API description gives this request shape. The input can name proposals as seed handles, identifiers or records with an `id`, either as a list or under a key such as `proposals`. It throws if no proposal is named.
- **`request_accepted`** returns the status and body of a successful answer, and nothing for a refusal.
- **`refusal_messages`** returns the refusal's messages, one per line in the service's order, using the reader the other request pages already use. It is empty when the request was accepted.
- **`stored_status`** reads the opportunity again as the signed-in person after the request, as the contract asks, rather than taking the status from the answer.

**What I checked on the running target.** I signed in as the public sector employee through `/auth/createsessiongov`, the route the evaluator persona uses. The seeded opportunity read `EVAL_QUESTIONS_INDIVIDUAL`. I then sent the request naming only the proponent nobody has begun evaluating (`swuLeftOut`). The service recognised the tag and refused with 400 and the message "The specified team question response evaluation was not found." The opportunity was still `EVAL_QUESTIONS_INDIVIDUAL` afterwards. The contract's comment quotes a different refusal message, about an incomplete evaluation, for a related case. This target uses different wording, and the adapter passes on whatever text the target sends.

**What I did not do.** I did not send the successful case, naming `swuNamedOne` and `swuNamedTwo`. That would have moved the shared seeded opportunity to consensus and spoiled it for the test that relies on it. So the accepted path and the move to `EVAL_QUESTIONS_CONSENSUS` have not been seen on this target. The bindings rest on the documented request shape and the confirmed refusal path.

The workspace would not let me run the type-check (`tsc`) without approval, so it was never run. I compared the new code by hand against the helpers and types the file already uses, but the first real compile will be calibration.

The route `/api/opportunities/sprint-with-us/:opportunityId` resolved on the target. No route in this change failed to resolve. I did not need to change anything outside `tests/adapters/old/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does the adapter bind every surface action and observation of evaluation-individual-submission-request-swu on old, and nothing else? Approve. The four members (submit_scores_for_consensus_naming, request_accepted, refusal_messages, stored_status) match spec/contract/surface.yaml and the generated page type. They only send the documented PUT, read the latest answer through the existing accepted/lastRefusal helpers, and re-read the opportunity's status as the signed-in person, as the contract asks. None of them asserts anything or decides a pass. Nothing under tests/acceptance changed and no member is marked unbound. The runner typecheck reports no diagnostics under adapters/old/; its failure is confined to adapters/new/, which this proposal does not answer for. The refusal path was exercised on the running target. The accepted path was not, because sending it would have consumed the shared seed, so calibration is its first real exercise. The target's refusal wording differs from the contract comment, which is a product question; the adapter passes through whatever text the target sends. The existing R-5.27 missing-test, owed by derive-tests, already records the unasserted clause, so no new condition is added. This would become a return if diagnostics appeared under adapters/old/, if any tests/acceptance file changed, or if calibration showed the accepted request shape is wrong.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5725ae605d775cceed2df68cf6684867b1c28dea`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
