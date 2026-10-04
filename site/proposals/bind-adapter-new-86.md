| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T16:21:01.909Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** One problem: the seeded opportunity the contract tells the test to start from is not on the running target, so I could only try out the refusal, never an accepted submission.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've bound all four missing members, on the evaluation-individual-submission-request-swu page, in `tests/adapters/new/index.ts`, and listed each as `bound` in `tests/adapters/new/bindings.yaml`. One problem: the seeded opportunity the contract tells the test to start from is not on the running target, so I could only try out the refusal, never an accepted submission. I also couldn't type-check the file, because running the TypeScript compiler needed approval that this session couldn't get.

**What I did.** I added the page to the existing adapter rather than walking the target again. The page is sent as a request, not shown as a screen, so there is nothing to click on it. I signed in through the identity provider's own form as the evaluator persona's account (`test-gov`), with the password filled in from the environment, then sent requests from that signed-in session.

**What the target answered.** The route `/api/opportunities/sprint-with-us/:opportunityId` works on this target:
- Other seeded Sprint With Us opportunities answer 200 with their status.
- A change with an unknown tag is refused 400. The refusal lists the allowed tags, and `submitIndividualQuestionEvaluations` is one of them.
- On the seeded opportunity `…-8000-…0701`, which is in individual evaluation, I sent that change naming a proposal this evaluator holds no draft of. It was refused 400 with `{"errors":["This evaluation could not be submitted for review because it is incomplete. Please edit, complete and save the appropriate form before trying to submit it again."]}`. That is word for word the refusal the contract describes, and the status stayed at `EVAL_QUESTIONS_INDIVIDUAL`.

**How each member works.** I matched the old target's binding:
- **`open`** takes an opportunity handle or identifier and resolves it through the seed.
- **`submit_scores_for_consensus_naming`** accepts the same spellings of its input as the old binding: proposal handles or identifiers, as a list, a comma-separated string, under a key such as `proposals`, or as records with an `id`, plus an optional note. It sends `PUT {tag: "submitIndividualQuestionEvaluations", value: {note, proposals}}`. If the input names no proposals, it throws `unbound:` rather than sending an empty list.
- **`request_accepted`** returns the answer's status and body on success, and empty otherwise.
- **`refusal_messages`** returns the refusal's messages joined by newlines, in the service's order, and empty when accepted.
- **`stored_status`** reads the opportunity again as the signed-in person and returns its `status`.

**The missing seed record.** The starting point the contract names, `seed.opportunities.swuSubmissionNamesTwoOfThree` (`00000000-0000-4000-a042-000000000001`), answers 404 `{"errors":["No opportunity is held at that address."]}` on this target. Its proposal `swuNamedOne` answers 404 `"There is no such proposal."` as well. The route itself works, so this is a record missing from the running target, not a missing page or binding. It looks like the database was seeded from an older manifest. Until that seed is loaded, the test for this page will fail when it opens the opportunity, and that failure is not the adapter's. Fixing the seed is outside this stage's paths.

I deliberately did not send a submission that would succeed against any opportunity, because it would have changed shared seeded state and sent email. So I never saw an accepted answer on this target, and `request_accepted` is written on the assumption that a success comes back as an ordinary 2xx answer, as it does on the old target.

No other page needed rebinding this run, and I changed nothing outside `tests/adapters/new/`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: does this adapter bind every surface action and observation on new for evaluation-individual-submission-request-swu, and nothing else? Approve. The diff adds exactly the contract page's members (open, submit_scores_for_consensus_naming, request_accepted, refusal_messages, stored_status) to tests/adapters/new/ and lists them bound in bindings.yaml; each is navigation or request transport only — open resolves the opportunity through the seed, the action builds the PUT {tag: submitIndividualQuestionEvaluations, value: {note, proposals}} from seed handles or identifiers and throws unbound rather than send an empty list, request_accepted and refusal_messages report the last answer, and stored_status re-reads the opportunity as the signed-in person as the contract specifies. Nothing decides a pass, nothing under tests/acceptance changed (no test for this page exists yet), and the runner's own typecheck on 60e142ef8 passed with no diagnostics under adapters/new/. The live probe on the target refused an incomplete submission with the contract's exact refusal text and left the status unchanged, which is evidence the route and request shape are right. The seed opportunity swuSubmissionNamesTwoOfThree answering 404 is a target whose database predates the manifest (the record is defined in tests/seed/manifest.yaml), not an adapter fault, and verify will surface it. Residual risk: an accepted submission was not observed on this target, so request_accepted assumes a 2xx success as on old. The already-owed missing-test on R-5.27 stands unchanged. This becomes a return if a verify run with the seed loaded shows the adapter mis-reading an accepted answer or failing to reach the page's members.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `60e142ef8ca7d96d559ae14893b782170e734734`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
