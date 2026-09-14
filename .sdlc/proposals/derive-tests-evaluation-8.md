---
gate: G3
question: "Do the revised evaluation tests now follow from their criteria and from nothing else?"
recommendation: "I couldn't run the typecheck here because the command needed an approval I don't have, so I'm handing it to the runner's typecheck."
opened: 2026-09-14T00:40:31.916Z
---

# Do the revised evaluation tests now follow from their criteria and from nothing else?

**Recommendation.** I couldn't run the typecheck here because the command needed an approval I don't have, so I'm handing it to the runner's typecheck.

I've made the R-5.22 fix. I couldn't run the typecheck here because the command needed an approval I don't have, so I'm handing it to the runner's typecheck. Here is the journal entry.

---

This run was a revision of the evaluation domain's acceptance tests after a return with two conditions. The only file I changed is `tests/acceptance/evaluation/R-5.22.spec.ts`. No other file in the domain and no entry in `tests/acceptance/not-testable.yaml` was touched.

**Condition 1 (R-5.22, second test).** I removed the `submitDisabledUntilComplete` check and the opening of the individual evaluation list that came before it. The test now signs in as the staff evaluator, types a score of 4 and an empty comment on the first question, and stops at `emptyNotesError`.

The reviewer offered a second route: save an incomplete draft, submit, and read `incompleteEvaluationError`. I didn't take it for two reasons:
- The draft it saves would not be the empty-comment evaluation the criterion describes, because the form refuses to save that one.
- It would add another write to the shared seeded opportunity, which condition 2 already flags as a problem.

I renamed the test from "an empty comment is rejected and the evaluation cannot be submitted" to "an empty comment is rejected", so the title only claims what the test shows. The file comment now says the "cannot be submitted until complete" half is untested, for these reasons:
- Showing it needs a saved empty-comment draft, which the form won't create. The existing R-5.23 entry records this as needing an action on `evaluation-individual-create` that saves a draft the form would refuse.
- A disabled submit control isn't used in its place, because the criterion never mentions one and R-5.25 submits an incomplete set from that same list.

Nothing else changed. The first test (a score of 6 rejected through `scoreOutOfRangeError`), the note about the missing decimal-places observation, the imports and the header all stay. The header's derived date is still 2026-09-13, which is today and the day this content changed.

**Condition 2 (seed contention).** I couldn't act on this one, and it isn't mine to act on. It asks the seed or harness owner to give each test that walks the stages its own closed opportunity, or to reset between files. Both live in `tests/seed/` and the fixtures, which this stage doesn't own. R-5.12 and R-5.16 still change the shared seeded panel, and nothing restores it.

**Verification.** I couldn't run a typecheck, because the command needed an approval this session didn't have. The edit only removed statements and changed a title and a comment. Every import (`test`, `expect`, `persona`, `seed`) and both constants (`opportunityId`, `proposalId`) are still used by the first test, so I don't expect new type errors. The runner's typecheck should confirm that.

**Still missing from the contract for this area:**
- A decimal-places refusal observation on `evaluation-individual-create-swu` and `-twu`, such as `score_too_many_decimal_places_error`.
- An action on `evaluation-individual-create` that saves a draft the browser form would refuse, plus an observation that it was stored as entered. That would unblock R-5.23 and the submission half of R-5.22.

The domain still has 24 test files and 6 not-testable entries, the same count the ruling reviewed.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Question: do the revised evaluation tests now follow from their criteria and from nothing else? Ruling: approve. The one condition from derive-tests-evaluation-7 that belonged to the writer is met. R-5.22's second test no longer checks that the submit control is disabled or opens the individual evaluation list. It enters a score of 4 with an empty comment and stops at emptyNotesError, which follows from the criterion's statement that an empty comment is rejected. It is titled 'an empty comment is rejected', so it claims nothing more. The file comment names what the two untested parts need from the contract: a decimal-places observation on the individual create surfaces for the too-precise score, and an action that saves a draft the form would refuse for the 'cannot be submitted until complete' half, which the R-5.23 not-testable entry already records. A search of the R-5.22 file on this branch finds neither submitDisabledUntilComplete nor incompleteEvaluationError. The evaluation domain still has 24 test files and 6 not-testable entries, and the branch changes nothing under app/, tests/seed/, tests/fixtures/ or spec/, so no protected path is touched. The runner's typecheck failed for the whole suite but reports no diagnostics under acceptance/evaluation/; the failures are in users, files and notifications, which this proposal does not answer for. The tier is STANDARD and no residual risk is marked unaccepted, so none of the escalation triggers apply. The ruling would change to return if the runner reported a type error under acceptance/evaluation/, or if any test were found to assert something its criterion does not state.

**Conditions:**
- Carried forward, not the writer's: the seed or harness owner should give each test that walks the evaluation stages its own closed opportunity, or reset state between files, so that R-5.12 and R-5.16 stop leaving the shared seeded panel changed for the tests that run after them.

### Runner-owned typecheck evidence

Proposal revision: `7349393052140be2d9cf53f93445942957c11265`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    acceptance/users/: 89 diagnostics
    acceptance/files/: 13 diagnostics
    acceptance/notifications/: 13 diagnostics
