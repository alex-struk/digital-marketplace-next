---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-11T08:50:14.345Z"
cost: 11.6101075
turns: 77
session: "6f053357-1ea5-454d-aca3-6a2cab721fdf"
---

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