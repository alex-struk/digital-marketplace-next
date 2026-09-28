| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T22:17:30.519Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I rewrote all five evaluation criteria as tests: R-5.3, R-5.13, R-5.19, R-5.30 and R-5.32.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote all five evaluation criteria as tests: R-5.3, R-5.13, R-5.19, R-5.30 and R-5.32. None was left fully untestable. Two of them test only part of their criterion, and each of those has a clause entry in `tests/acceptance/not-testable.yaml` so the rest stays owed. Nothing has been run. The typecheck (`tsc --noEmit`) needed an approval this session could not get, so the files are checked only by reading them against `tests/generated/surface.d.ts`. A text search found no selectors, routes, `page.` references or locator calls in them.

**R-5.3 (rewritten per the ruling).** For each program, the evaluator starts an evaluation of one proponent and saves it, then starts a second one through the same create screen. That second attempt is allowed to fail, and a screen that sends them back to the evaluation they already hold counts as a refusal. What decides the test is what stands afterwards:
- the evaluator's own list names that proponent as many times as before;
- their stored evaluation for that proponent is still there.

The quoted message is checked only when the create screen actually reports a duplicate refusal. The Team With Us wording is taken from the criterion's own note.
- **Clause entry, owed to `contract`:** "a second attempt is refused with a message saying they already have one". No action asks the service directly to create an evaluation, so if the screen never makes that request, the message is never produced.

**R-5.13 (rewritten per the ruling).** This uses the seeded opportunity at consensus whose third proponent has no consensus. There are two tests: in one nobody has started that consensus, in the other the chair saves it as a draft and does not submit it.
- The finalise is attempted from both places the contract offers it (the consensus list and the opportunity's management screen), and either is allowed to be stopped. No message is required.
- The assertions are that the opportunity's status is unchanged, and that no proponent's history gained an entry, which is how "no proponent screened in or out" is read.
- History entries are counted rather than compared as text, so a timestamp shown relative to now can't read as a change.

**R-5.19 (rewritten per the ruling).** The administrator creates the draft, and the test checks against the seed that neither panel account is the administrator's. Nothing reads the creator's name from any screen any more; R-1.29 v2 withholds it from a panel member, which is why the old setup failed.
- **Opening it:** the opportunity's own screen shows its identifier and at least one detail that matches what the creator sees.
- **Listing:** the draft appears in the dashboard's panel-opportunities table, whose tab reads as "Evaluations".
- **Contrast:** an employee who neither created it nor sits on the panel finds it in none of the listings and sees none of its details.

**R-5.30 (v2, written from the new statement).** Each program's seeded opportunity with a submitted consensus is used.
- The chair changes the agreed scores twice on the edit screen and never submits again. After each save, the stored scores and notes show the change and the status still reads as submitted.
- On the seeded records that are past consensus, a change attempted by the chair leaves the consensus exactly as it was.
- The contrast in the criterion is also tested: an evaluator's submitted individual evaluation cannot be changed while the opportunity is still at individual evaluation.

**R-5.32 (rewritten per the ruling).** This uses the seeded opportunities at consensus with six Sprint With Us and five Team With Us proponents. Screening is now read from each proposal's own history, compared before and after finalising, and never from the vendor's view of their proposal:
- the proponents that should be screened in (four for Sprint With Us, three for Team With Us) all gained a common entry;
- neither the proponent below a minimum nor the next-ranked proponent that did qualify gained it.

The agreed scores being recorded is read as the questions score each proposal carries, which must follow the order of the agreed totals. The move to the next stage is read as the opportunity's status changing and naming the challenge.
- **Clause entry, owed to `contract`:** "every proponent's history records the agreed scores question by question". The history is only available as one block of prose.

**Missing from the surface** — the contract would need to add:
- an action on `evaluation-individual-request-swu` and `-twu` that asks the service to create a new individual evaluation, plus an observation of its refusal message (for R-5.3);
- an observation on `proposal-swu-view` and `proposal-twu-view` that returns history entries one by one with the per-question scores each records (for R-5.32).

Nothing asked me to change a read-only path, and I changed none. The only files I wrote are the five tests and `not-testable.yaml`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten evaluation tests (R-5.3, R-5.13, R-5.19, R-5.30 v2, R-5.32) follow from their criteria and from nothing else? Ruling: approve. Each test asserts what its criterion states and carries out the redo it was returned for. R-5.3 decides on what stands afterwards: the evaluator's own list names the proponent as many times as before, and the stored evaluation is still there. It checks the quoted refusal only where the create screen actually reports one. The Team With Us wording comes from the criterion's own note ('resource question' in place of 'team question'). The message clause is kept owed to contract by a clause entry in not-testable.yaml, and the conditions check already carries it as missing-test/R-5.3. R-5.13 attempts the finalise from both places the contract offers it and asserts only what the criterion promises: the opportunity's status is unchanged and no proponent's history gained an entry. It covers both ways a consensus can be missing, never started and saved as a draft but not submitted. R-5.19 no longer reads the creator's name, which R-1.29 v2 withholds from a panel member. It establishes that the panel member is not the creator from the seed, and it asserts that the member can open the draft, that the draft is listed under the Evaluations heading, and that an unrelated employee finds it in no listing and is shown none of its details. R-5.30 v2 asserts every clause of its statement: the chair changes the agreed scores twice, each change is saved directly, the consensus stays submitted with no second submission, a change after finalising is not taken, and a submitted individual evaluation cannot be changed. R-5.32 reads screening from each proposal's own history and never from the vendor's view. It tests both the minimum (the proponent below a minimum outscores ones that are screened in and is still left behind) and the ceiling (four for Sprint With Us, three for Team With Us), plus the opportunity's move to the challenge stage. The 'question by question' clause is kept owed to contract by a clause entry and already appears as missing-test/R-5.32. The selectors, routes and status-code patterns the reviewer brief rules out are absent; the tests use only surface actions and observations. The runner's typecheck reports no diagnostics under acceptance/evaluation; the failure is two diagnostics in tests/adapters/new/, which this proposal does not touch. Two notes, neither a defect in these tests. First, R-5.30 v2's given/then ('submits again ... submitted afresh') contradicts its own statement ('with no second submission'); the test follows the statement, and the example needs correcting in the spec. Second, R-5.32's check that questions scores fall in the order of the seeded agreed totals assumes the shown score rises with the agreed total. Unequal question weights could put the proponent seeded at 17 below the one seeded at 16, and calibration would report that as test-wrong. What would change this ruling: a typecheck diagnostic in these files, or a calibration run showing any test failing on its own setup.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `e350e9ccf4bc40a0e8907eba5ae62097edf05531`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/evaluation/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
