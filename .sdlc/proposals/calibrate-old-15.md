---
gate: G1
question: "3 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-6.1, R-3.11, R-2.19 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-29T10:29:43.646Z
---

# 3 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-3.11, R-2.19 with a calibration condition, so the next calibrate run can apply it.

3 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-6.1 · v1

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.

- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- test: tests/acceptance/notifications/R-6.1.spec.ts

**When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.** — failed

```
Error: messages sent with notifications switched off

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m11[39m
```

### R-3.11 · v1

An organization's last remaining owner cannot be removed from it.

- given: an organization with exactly one owner and two other active members
- when: an administrator tries to end the owner's membership
- then: the request is refused with a message saying this is the sole owner for the organization, and the membership remains
- test: tests/acceptance/organizations/R-3.11.spec.ts

**when an administrator tries to end the sole owner's membership the request is refused and the membership remains** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.19 · v2

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — failed

```
Error: proposal-swu-create.add_phase_team_member — refused: this opportunity has no "Inception" phase on http://localhost:4300/opportunities/sprint-with-us/a9d4ed4b-2db5-4cc9-a97c-602fabdcdbb5/proposals/create (its phases: Proof of Concept, Implementation)
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us proposal must stay within each phase's budget** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: which of R-6.1, R-3.11 and R-2.19, failing against old, are the application's fault, the spec's, or the test's? Ruling: approve with two conditions, defect-in-old R-3.11 and spec-wrong R-2.19. R-6.1 is left unruled because none of the three forms is true of it. R-3.11: the old service refuses to remove a sole owner with exactly the criterion's message, 'Unable to remove membership. This is the sole owner for this organization.' (sources/old/src/back-end/lib/resources/affiliation.ts:518-529). The old screen drops that reason. Its only feedback is the generic toast 'Unable to Remove Team Member: <name> could not be removed from this organization.' (pages/organization/lib/toasts.tsx:101-104). The fieldError read therefore came back empty and the membership stayed. This matches the earlier R-1.16 ruling: the rule is right and the old application enforces it, but it withholds the reason, so telling the administrator why is a fair obligation on the rebuild. The reviewer said the owner's row offers no Remove, but team.tsx:687-688 shows Remove to an administrator on every row, the owner's included. That affects only how the refusal is reached, not this ruling. R-2.19: the criterion misdescribes the old application in three ways. (1) The form offers a team section only for the opportunity's own phases, and Scrum Master is a single choice per phase (phase.tsx:130-145 and 233-256), so an extra phase and a second scrum master are prevented by construction rather than refused on submission. The reviewer's evidence confirms both: the form listed only Proof of Concept and Implementation, and ticking a second scrum master unticked the first, after which the proposal submitted with one per phase. Requiring the rebuild to accept such input and then refuse it would oblige it to build something the old product rightly never exposed. (2) Capabilities are checked per phase, not across phases: a phase is complete only when it has at least one confirmed member and those members hold every capability that phase requires (phase.tsx:104-115 and 328-335). (3) The 'Select at least two members for each phase' text the reviewer flagged as a possible confounder is not enforced. isValid needs only one confirmed member, so the one-member tests were not confounded. The phase cost is validated against the phase's own budget (shared/lib/validation/proposal/sprint-with-us.ts:69-71) and the total against the opportunity's maximum (line 248), which the corrected statement keeps. The test's given also lacked the inception phase that the criterion's given names. The spec-wrong ruling marks the test stale, so it is re-derived from the corrected statement. R-6.1: the old application honours the switch, because makeSend returns before composing anything when DISABLE_NOTIFICATIONS is set (sources/old/src/back-end/lib/mailer/transport.ts:54). The test is correctly tagged @notifications_disabled. Its 11 caught messages show it again ran against the default instance with notifications on, contrary to spec/contract/observables.yaml configurations.notifications_disabled. This is the third calibration to hit it (calibrate-old-10 and calibrate-old-14 also left it unruled). It needs a pipeline change: calibrate must start a second oracle with SDLC_ORACLE_DISABLE_NOTIFICATIONS=1, run only the tagged test there, and exclude that test from the default run. This belongs to whoever owns the pipeline, not to this gate. Tier is STANDARD and there are not two plausible readings of intent, so nothing escalates. What would change this ruling: an old screen that shows the sole-owner reason would make R-3.11 test-wrong. A decision that the rebuild must accept and then refuse an extra phase or a second scrum master, rather than prevent them, would make R-2.19 defect-in-old against its original wording. Any R-6.1 run against a notifications-off instance that still catches a message would make it defect-in-old.

**Conditions:**
- defect-in-old R-3.11
- spec-wrong R-2.19: A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget.
