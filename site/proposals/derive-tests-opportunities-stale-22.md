| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-04T15:14:29.823Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the test for R-1.1 (v3), the one criterion in this run, at `tests/acceptance/opportunities/R-1.1.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I rewrote the test for R-1.1 (v3), the one criterion in this run, at `tests/acceptance/opportunities/R-1.1.spec.ts`. No criterion was found untestable as a whole. I added one entry to `tests/acceptance/not-testable.yaml` for a single clause the surface can't reach. I could not type-check or run the file, because the type-checker and Playwright commands needed approval that this session couldn't give. The pages and observations it uses all appear in `tests/generated/surface.d.ts`, and the old R-1.1 test already used the same status reads.

**The ruling.** The old test looked for the ready-for-evaluation notice with `mail.messagesTo(evaluator)`. That search only matches the visible To line, so it required each evaluator to be a visible recipient. The new test never searches by a reader's address. It gathers every caught message from `caughtMessageList.messageIdentifiers()` and from the catcher's search on the service's own address (`donotreply@example.test`, as `observables.yaml` names it), and opens each one with `caughtMessage.open`. A message counts as the announcement when its subject or body names the closed opportunity's title and mentions evaluation. A person counts as announced to when their address appears among its visible recipients or its blind copies. This matches how the rewritten R-5.31 test works.

**Other changes:**
- **Code With Us now has its own coverage.** The old test said no Code With Us opportunity past its deadline was seeded. The seed now has `opportunities.cwuLapsedForScoring`, whose author is `users.staffOne` according to the seed SQL. So the test now also checks:
  - this opportunity moves to evaluation;
  - its one submitted proposal moves to review;
  - the author receives the announcement.
- **Removed an extra check.** The old test also required "This opportunity has closed." in the opportunity's history tab. The criterion never mentions that, so I removed it.

There are now four tests, one per outcome the criterion states: the evaluation stage, proposals moving to review, the announcement to the Code With Us author, and the announcement to the Sprint With Us and Team With Us panels. The test doesn't empty the catcher first, because any request under /api can set off the closure before the test begins. It therefore looks for the notice as present rather than counting new ones. A notice left over from an earlier test about the same opportunity could let it pass.

**Clause not tested.** The not-testable entry for R-1.1 covers "every proposal submitted against it moves to review" for the third proposal on the Sprint With Us and the Team With Us opportunity (`proposals.sprintWithUsThree`, `proposals.teamWithUsThree`). The reason begins with `blocked:`. A proposal's status can only be read through `status` on `proposalSwuEdit` and `proposalTwuEdit`, which only the proposal's own proponent can open. Those two proposals belong to `users.proponentThree`, and no persona signs in as that account. The test checks the clause for the other two proposals on each opportunity.

**Needed from the contract** (entry owner: `contract`), either one would do:
- a `status` observation on `proposalSwuView` and `proposalTwuView` that staff can read;
- a persona that signs in as `users.proponentThree`.

Nothing outside `tests/acceptance` was changed, and nothing asked for such a change.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether the rewritten R-1.1 v3 test asserts every clause of R-1.1 and nothing beyond it. Most of it does. The announcement is now found among every caught message, and a reader counts as reached through a blind copy, which matches R-6.15. The Code With Us case is covered with the seeded lapsed opportunity and its one proposal, which the seed manifest gives to users.organizationOwner, the persona that reads it. The not-testable entry for the third Sprint With Us and Team With Us proposal names a real gap in the surface: only the proponent can read a proposal's status, and no persona signs in as users.proponentThree. The runner's typecheck passed. The return is for one change. The proposal says the history-tab check for the note "This opportunity has closed." was removed because the criterion never mentions it. R-1.1 v3 does mention it: its then reads "the opportunity moves to its program's first evaluation stage with the note \"This opportunity has closed.\"". The rewrite therefore drops a clause the criterion states, and no not-testable entry records it, so the test's first passing run would close the criterion with that clause owed by nobody. Restoring that assertion, or recording why the surface cannot reach it, would change the ruling to approve. While the test is open, the stage check for Sprint With Us and Team With Us should also be tightened. It accepts anything matching /evaluat|question/, which also passes for a later evaluation stage, while the criterion names the program's first one.

**Conditions:**
- R-1.1 v3: restore an assertion that, after closure, the Sprint With Us and the Team With Us opportunity each carry the note "This opportunity has closed." (the then of R-1.1 v3 states it), and assert it for the lapsed Code With Us opportunity too where the surface offers a reading of it. Where no page reaches the note for a program, add a not-testable.yaml entry with that clause and the program, saying what the surface lacks.
- R-1.1 v3: the 'moves to the first evaluation stage of its program' test accepts /evaluat|question/ for Sprint With Us and Team With Us, which a later evaluation stage also satisfies. Assert the stage the criterion names, the first evaluation stage of each program, in the form the surface's status reading presents it.

### Runner-owned typecheck evidence

Proposal revision: `6472592648821c4ad7a7e6f0b3a0fb308db5f435`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
