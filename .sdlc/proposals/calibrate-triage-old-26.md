---
gate: G3
question: "1 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T09:00:12.533Z
---

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

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
Error: proposal-swu-create.add_phase_team_member — refused: this opportunity has no "Inception" phase on http://localhost:3100/opportunities/sprint-with-us/102860b9-fb86-4216-ba3c-afb9f4b936f7/proposals/create (its phases: Proof of Concept, Implementation)
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

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: of R-2.19's five failing tests against old, which did this project's adapter cause? Ruling: approve with product-question R-2.19. After the bind-adapter-old-40 fix to how the adapter finds each phase's section and moves from Team to Pricing, every test now completes the whole proposal form, so each failure reflects the application's behaviour and not the binding's. I read the page snapshots under tests/test-results/proposals-R-2.19-* against tests/adapters/old/index.ts. (1) The phase-without-a-team, capability-not-covered and over-phase-budget tests: the app withholds the submission. 'Submit' is rendered without a pointer cursor, meaning disabled, and the form stays on '6. Review Proposal'. openTermsDialog (index.ts:3716) then runs surfaceRefusal, which walks every step, touches the fields, gathers messages and finds none, so fieldError, capabilityGapError and budgetExceededError honestly answer empty. The only related text is the review step's 'You have not yet assigned team members for this phase.' Whether a disabled Submit with no stated reason meets 'refused, naming the phase, the team or the cost' is a product question. (2) The two-scrum-masters test: the old form's Scrum Master is single-choice per phase, so ticking Dana unticked Blake, and the proposal was accepted ('Proposal Status: Submitted') with one scrum master per phase. The adapter clicked what the test asked. (3) The Inception test: the form shows only the opportunity's own phases (Proof of Concept, Implementation), and add_phase_team_member reported that accurately instead of inventing a control. The product owner should also note two things. Cases (2) and (3) are cases the old app makes impossible rather than refuses, so they should decide whether that meets the criterion or whether the tests ask for more than it does. The Team step also states 'Select at least two members for each phase', and every test offers one member per phase, which may confound the three withheld submissions. Nothing in the evidence points at the binding. Tier STANDARD, no unaccepted residual risk, so nothing escalates. What would change this: a snapshot of the Pricing or Team step showing an error message that surfaceRefusal's message filter missed would make it adapter-wrong.

**Conditions:**
- product-question R-2.19
