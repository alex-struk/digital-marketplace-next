---
gate: G3
question: "Do these tests follow from the evaluation criteria and from nothing else?"
recommendation: "I wrote the evaluation suite."
opened: 2026-09-11T08:50:14.393Z
---

# Do these tests follow from the evaluation criteria and from nothing else?

**Recommendation.** I wrote the evaluation suite.

I wrote the evaluation suite. Here is the journal entry.

**What I did.** This run is the first to see a contract that can reach a closed opportunity. The surface now carries a service status page whose action runs the pending transitions, and the seed carries one Sprint With Us and one Team With Us opportunity whose deadlines lapsed thirty days before the seed is applied, each with an evaluation panel, four questions worth five points apiece, and three submitted proposals. That unlocks the whole walk: close, every evaluator scores every proponent and submits, the chair agrees a score per proponent, the scores are finalised. Eighteen criteria that a previous pass had recorded as unreachable now have real tests behind them.

Counts for this domain:

| | |
|---|---|
| criteria in scope | 30 |
| criteria with a test file | 24 |
| criteria recorded as not testable | 6 |

**What I rewrote.** Six evaluation files already existed from an earlier contract. They addressed pages by opportunity title, while the contract's page opener takes an identifier, so each now reads the identifier off the screen the application lands on after a save. The panel criterion about changing a panel mid evaluation also gained the two stages that were previously out of reach.

**Not testable, all of them blocked rather than permanent.** Each needs something the contract could add. Named so the next contract pass can act on them:

- A refusal observation on the individual evaluation create and edit surfaces. Without it, an attempt made by the wrong person or at the wrong stage cannot be told from one that simply recorded nothing. This blocks the criteria on who may read an evaluation and on who may record one.
- A sign-in for the second public sector employee, which the persona file itself records as unavailable, and an administrator who is not on the panel. Both roles are required by the criteria on reader permission and on the split of evaluation tools by role.
- A seeded panel whose chair is not an evaluator. Today both panel members evaluate, so no test can show a chair being refused a score, nor a chair being left out of the closing notice.
- An action that saves a draft evaluation the browser form would refuse, in the shape the file upload page already uses for malformed requests. Without it the criterion about drafts going unchecked has no given.
- An action that submits one evaluation on its own, plus an observation of its rejection.
- An action that adds a panel member with no role, plus a field level refusal naming that member.

**Three things worth a decision.** First, each seeded closed opportunity can be walked to consensus exactly once, and thirteen of my tests need one in its starting state, so a full suite run will have them contending. The seed needs one closed opportunity per walking criterion, or a reset between files. Second, no observation returns a stage as an identity, so several tests read the stage from the status text by the words the criteria themselves use. Third, the criterion about the closing notice asserts messages the contract already warns do not arrive on the current target, which the contract says should be measured rather than assumed.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Question: do the tests in derive-tests-evaluation-6 follow from the evaluation criteria and from nothing else? Ruling: return. Most of the suite is sound. 24 test files plus 6 not-testable records account for all 30 criteria. Each of the six not-testable reasons names something really missing, checked against tests/generated/surface.d.ts and tests/seed/manifest.yaml: no refusal observation on the individual evaluation pages, no single-evaluation submit, no action that saves an unchecked draft, two-member seeded panels, and no sign-in for the second public sector employee. The blind-copy reasoning in R-5.31 comes from observables.yaml and R-6.15, not from the implementation. Three defects block approval. (1) R-5.22's decimal-places test enters 1.234, which is inside the range, and asserts scoreOutOfRangeError, so it claims the wrong rule; its own comment concedes this, and derive-tests-evaluation-4 returned exactly this defect. (2) R-5.25's first test asserts submitDisabledUntilComplete, a greyed-out control the criterion never mentions, and a disabled control would prevent the click whose refusal message the test then asserts. (3) The mail reads contradict each other: R-5.31 skips 'every administrator' on the grounds that mail.messagesTo cannot see blind copies, while R-5.20, R-5.27 and R-5.33 use the same search to find two recipients of a notice the contract says carries one visible recipient and blind copies for the rest; one of the two positions is wrong, and I have not confirmed which. Weaker tests the writer should also fix, though they would not block alone: R-5.28 reads evaluations as the administrator, whom the criterion lets read at any stage, so it cannot show panel-member access despite its comment; R-5.16's fifth test has the administrator attempt the locked change where the criterion names the owner. Not the writer's to fix but keeping the checks from going green: each seeded closed opportunity can be walked once and 13 tests contend for it, and the runner's typecheck failed. Its visible errors are all outside this diff, but the list is truncated and I could not run it locally. The ruling changes when conditions 1-3 are met and the runner's typecheck shows no errors under tests/acceptance/evaluation/.

**Conditions:**
- R-5.22: make the decimal-places test assert only that the entry was rejected, through an observation that does not claim the value was out of range. If the individual-create pages have none, record that half in not-testable.yaml and name the missing decimal-places observation. This is condition 1 of derive-tests-evaluation-4, still unmet.
- R-5.25: remove the submitDisabledUntilComplete assertion from the first test. The criterion concerns the service's refusal sentence and that none of the set is submitted, not a disabled control.
- Make the mail reads consistent. Either R-5.20, R-5.27 and R-5.33 read recipients the way observables.yaml prescribes for a batch (the blind-copy list, via reading one message), or R-5.31 stops justifying its narrowing on the claim that the search cannot see blind copies and reads every administrator. Whichever is right, all four files must rest on the same premise.
- Writer, non-blocking: R-5.28 should read the other evaluator's scores as a panel member who is not an administrator, or record the limit and stop claiming the test discriminates; R-5.16's fifth test should have the owner attempt the change after consensus.
- Seed or harness owner, not the writer: provide one closed opportunity per walking test, or a reset between files, so that verify results reflect the rules rather than tests colliding over the two seeded opportunities.
- Runner: the next typecheck report must show no errors under tests/acceptance/evaluation/; the current report is failed and truncated.

### Runner-owned typecheck evidence

Proposal revision: `212152c2d0b3226a1082bfcc86120821123f543a`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`

    acceptance/files/R-8.1.spec.ts(17,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.12.spec.ts(17,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.12.spec.ts(27,37): error TS2353: Object literal may only specify known properties, and 'file' does not exist in type '{ fileId: string; }'.
    acceptance/files/R-8.14.spec.ts(18,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.20.spec.ts(23,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.20.spec.ts(31,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.21.spec.ts(19,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.25.spec.ts(36,5): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ program: string; opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.25.spec.ts(41,43): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/files/R-8.28.spec.ts(11,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/files/R-8.28.spec.ts(18,38): error TS2554: Expected 0 arguments, but got 1.
    acceptance/files/R-8.28.spec.ts(24,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/files/R-8.30.spec.ts(14,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.10.spec.ts(19,41): error TS2353: Object literal may only specify known properties, and 'organization' does not exist in type '{ orgId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(37,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
    acceptance/notifications/R-6.17.spec.ts(43,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/notifications/R-6.21.spec.ts(23,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.21.spec.ts(30,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.22.spec.ts(16,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.23.spec.ts(32,34): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(14,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(20,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(29,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/notifications/R-6.7.spec.ts(34,42): error TS2554: Expected 1 arguments, but got 0.
    acceptance/opportunities/R-1.13.spec.ts(132,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(49,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.19.spec.ts(63,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.2.spec.ts(30,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.2.spec.ts(35,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.20.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.20.spec.ts(46,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.21.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.21.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(55,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.22.spec.ts(58,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(39,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(52,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(71,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.28.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(14,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(22,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.30.spec.ts(33,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(19,42): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(29,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.31.spec.ts(34,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(19,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(27,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(54,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.32.spec.ts(58,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.33.spec.ts(24,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.33.spec.ts(42,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.34.spec.ts(49,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.35.spec.ts(22,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.35.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.36.spec.ts(44,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.36.spec.ts(48,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.37.spec.ts(37,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.37.spec.ts(56,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(40,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.4.spec.ts(60,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(20,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(25,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(30,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(36,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.5.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(46,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(51,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(70,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(85,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(100,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.53.spec.ts(116,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.55.spec.ts(19,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.56.spec.ts(47,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.56.spec.ts(52,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.56.spec.ts(57,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.56.spec.ts(71,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.56.spec.ts(74,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.6.spec.ts(15,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.6.spec.ts(19,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.6.spec.ts(23,43): error TS2353: Object literal may only specify known properties, and 'id' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.8.spec.ts(71,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.8.spec.ts(77,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/opportunities/R-1.9.spec.ts(41,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/proposals/R-2.1.spec.ts(54,43): error TS2353: Object literal may only specify known properties, and 'title' does not exist in type '{ opportunityId: string; }'.
    acceptance/proposals/R-2.1.spec.ts(67,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.1.spec.ts(72,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.1.spec.ts(76,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.10.spec.ts(72,42): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; }'. Did you mean to write 'opportunityId'?
    acceptance/proposals/R-2.10.spec.ts(103,40): error TS2561: Object literal may only specify known properties, but 'opportunity' does not exist in type '{ opportunityId: string; 
    [diagnostics truncated]
