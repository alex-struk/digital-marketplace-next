---
gate: G3
question: "1 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.36 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-10-04T22:40:40.609Z
---

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.36 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:3100, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-2.36 · v1

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.

- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator
- test: tests/acceptance/proposals/R-2.36.spec.ts

**Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator. (withdrawing)** — failed

```
Error: administrators missing from the blind-copy list of the withdrawal notice

administrators missing from the blind-copy list of the withdrawal notice

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 4[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   "admin.one@example.test",[39m
[31m+   "admin.two@example.test",[39m
[31m+ ][39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
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
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

Question: did this project's adapter for the old target cause R-2.36's withdrawal failure? Ruling: approve, sorted as a product question. The adapter reads blind copies from Mailpit's per-message Bcc field (tests/adapters/old/index.ts:9917), the field the criterion depends on, and the awarding test in the same file passed through that same Bcc path. The withdrawal itself was driven through: the vendor's notice arrived after the catcher was emptied. The failure lists the two administrator addresses as absent from every message addressed to the service, which is an observation of what the old app sent, not an empty or misread answer. One doubt remains: the vendor check could be satisfied by a late-arriving submission confirmation. Nothing in the evidence shows that, and an unclear case goes to the product owner. The product owner should also note that the test requires administrators specifically as blind copies under the service address, which comes from R-6.15; R-2.36 itself only says administrators receive a notice. Evidence that the withdrawal never took effect, or that Mailpit drops these blind copies, would change this to adapter-wrong.

**Conditions:**
- product-question R-2.36
