---
gate: G3
question: "1 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-7.29 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-10-03T01:07:00.020Z
---

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-7.29 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-7.29 · v1

Where a screen embeds the body of a page beside its own material, a page that is missing or unreadable leaves that part of the screen empty and the screen otherwise works.

- given: an opportunity whose screen embeds the scope page's body, and that page having been removed
- when: a vendor opens the opportunity
- then: the opportunity is shown in full and the scope section is empty, with nothing said about why
- test: tests/acceptance/content/R-7.29.spec.ts

**Where a screen embeds the body of a page beside its own material, a page that is missing or unreadable leaves that part of the screen empty and the screen otherwise works. (Sprint With Us evaluation instructions)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m""[39m
Received: [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mEvaluation Panel[39m
[31mAddenda[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mInstructions[39m
[31mEvaluation[39m
[31mTeam Questions[39m
[31mConsensus[39m
[31mCode Challenge[39m
[31mTeam Scenario[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
… 9 more line(s)
```

**Where a screen embeds the body of a page beside its own material, a page that is missing or unreadable leaves that part of the screen empty and the screen otherwise works. (Team With Us evaluation instructions)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m""[39m
Received: [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mEvaluation Panel[39m
[31mAddenda[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mInstructions[39m
[31mEvaluation[39m
[31mResource Questions[39m
[31mConsensus[39m
[31mInterview/Challenge[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mTeam With Us: Seeded closed Team With Us opportunity[39m
… 8 more line(s)
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

