---
gate: G3
question: "2 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-8.13, R-2.18 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-30T03:46:21.084Z
---

# 2 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-8.13, R-2.18 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

2 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-8.13 · v1

A profile picture or an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, and one taller than 500 pixels is shortened to 500 pixels, in both cases keeping its proportions.

- given: a signed-in person choosing a new profile picture
- when: they upload an image 2000 pixels wide and 300 pixels tall
- then: it is stored 500 pixels wide, still in its original proportions
- test: tests/acceptance/files/R-8.13.spec.ts

**an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, keeping its proportions** — failed

```
TimeoutError: locator.getAttribute: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('img').visible().nth(16)[22m

```

### R-2.18 · v4

Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, and the service refuses anyone else with "User is not an active member of the organization."; a Team With Us proposal is additionally refused by the service when the same person is named twice, with "Please select unique team members.", while the service applies no such uniqueness check to a Sprint With Us phase. The Team With Us proposal form offers only the organization's active members; the Sprint With Us form also lists members whose invitation is still pending, marked pending, and a proposal naming one can be saved as a draft but is refused on submission. Neither form offers a person already named on the proposal.

- given: a proposal naming a person whose membership of the organization is pending, inactive or absent
- when: the vendor submits it
- then: the submission is refused with "User is not an active member of the organization.", and naming the same person twice is refused with "Please select unique team members."
- test: tests/acceptance/proposals/R-2.18.spec.ts

**Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, and the service refuses anyone else with "User is not an active member of the organization."; a Team With Us proposal is additionally refused by the service when the same person is named twice, with "Please select unique team members.", while the service applies no such uniqueness check to a Sprint With Us phase. The Team With Us proposal form offers only the organization's active members; the Sprint With Us form also lists members whose invitation is still pending, marked pending, and a proposal naming one can be saved as a draft but is refused on submission. Neither form offers a person already named on the proposal. (the Sprint With Us form offers the active members and lists a pending member, marked pending, and not a person already named)** — failed

```
Error: the pending person, once named, is not marked pending

the pending person, once named, is not marked pending

[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Quinn Placeholder"[39m
Received string:    [31m"To satisfy this phase's requirements, your team must only consist of confirmed (non-pending) members of the selected organization.[39m
[31mPending[39m
[31mThis list will automatically update to reflect the combined capabilities of your selected team (includes pending team members). To satisfy this phase's requirements, your team must collectively possess all capabilities listed here."[39m

Call Log:
- Timeout 20000ms exceeded while waiting on the predicate
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

