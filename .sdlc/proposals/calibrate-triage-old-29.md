---
gate: G3
question: "2 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-8.12, R-1.39 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T16:12:29.340Z
---

# 2 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-8.12, R-1.39 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

2 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-8.12 · v1

A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.

- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- test: tests/acceptance/files/R-8.12.spec.ts

**a request for a file that does not exist is answered as not authorized** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.39 · v1

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- test: tests/acceptance/opportunities/R-1.39.spec.ts

**The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location. (by state)** — failed

```
Error: Timeout 15000ms exceeded while waiting on the predicate
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

Question: which of the two failures against the old target did this project's own adapter cause? Ruling: approve, with one triage condition per criterion. R-8.12 is the adapter's fault. The test asks whether a vendor requesting a file that does not exist is refused as not authorized. The adapter's reader for that question, fileDownload.refusedForUnknownFile (tests/adapters/old/index.ts:8617), only counts a refusal whose status is 404, so a not-authorized refusal comes back as "". That matches the recorded failure (Received: ""). R-1.39's by-state case goes to the product owner. The status chooser bound without error, and the groups were read by the same opportunityGroup function the by-program case uses. The failure is a predicate timeout, which does not point at the binding: either the draft was not stored or the old app does not narrow the list by status. What would change this: evidence that filterByStatus picked the wrong chooser, or that the list shows drafts under a group other than 'Unpublished Opportunities', would make R-1.39 adapter-wrong.

**Conditions:**
- adapter-wrong R-8.12: fileDownload.refusedForUnknownFile only reports a refusal whose status is 404, so a vendor refused as not authorized for an unknown file reads as ""; the vendor-facing reader must hand over a not-authorized refusal (401/403) as the criterion describes, leaving the 404 filter to notFoundForAdministrator only
- product-question R-1.39
