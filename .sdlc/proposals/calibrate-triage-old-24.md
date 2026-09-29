---
gate: G3
question: "6 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.7, R-2.11, R-3.11, R-2.19, R-3.24, R-2.37 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T07:03:29.524Z
---

# 6 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.7, R-2.11, R-3.11, R-2.19, R-3.24, R-2.37 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

6 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-2.7 · v2

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- test: tests/acceptance/proposals/R-2.7.spec.ts

**a proposal may be created as a draft, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a proposal may be created as a submission, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.11 · v1

An organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused with a pointer to the existing proposal.

- given: an opportunity that already carries a proposal naming a given organization
- when: a different vendor who administers that same organization names it on a new proposal, or an existing proposal is edited to name it
- then: the request is refused with "Please select a different organization." and the identifier of the existing proposal is returned alongside the refusal
- test: tests/acceptance/proposals/R-2.11.spec.ts

**an organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
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

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal must stay within each phase's budget** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.24 · v1

When an administrator archives an organization they do not own, its owner is told by email that the organization has been archived.

- given: an active organization owned by a vendor
- when: an administrator archives it
- then: the owner receives a message telling them their organization has been archived by an administrator and that they can no longer use it, and no such message is sent when the owner archives their own organization
- test: tests/acceptance/organizations/R-3.24.spec.ts

**when an administrator archives an organization they do not own, its owner receives a message telling them it has been archived** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m
```

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**the vendor's own copy of a Sprint With Us proposal names the organization** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
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

