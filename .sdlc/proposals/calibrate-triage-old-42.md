---
gate: G3
question: "1 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.10 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-30T21:39:48.295Z
---

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.10 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters. (a teaser over 500 characters)** — failed

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

Question: did this project's adapter for the old target cause R-1.10's one failing case, the 501-character teaser? Approve, with one adapter-wrong condition. Old does what the criterion says: the last binding run saw in a browser that the Teaser box keeps all 501 characters, that old shows 'Teaser must be between 0 and 500 characters long.' under it, and that Publish stays disabled. Nothing points at the product. The calibration error is only 'Timeout 15000ms exceeded while waiting on the predicate', with no assertion message and no value read. From how Playwright's expect.poll reports a timeout, as I recall it (its source is not installed here to check), that means the adapter's first fieldError() call never returned within the test's 15-second window. It does not mean fieldError() read an empty string. The adapter explains why: when stepFormErrors() finds nothing, the fallback namedFieldErrors() goes through every step again and waits up to 2 seconds for each text box the test filled, so one call can run past 15 seconds. The title and description cases pass because their first read finds the message and the fallback never runs. The earlier approval of bind-adapter-old-56 said to escalate rather than send this back a fifth time. It is sent back anyway because this is a specific timing fault the binding stage can fix without running the test. What would change the ruling: if the next calibration returns fieldError() in time and the message is still missing, the adapter has no remaining explanation and the item should be escalated to the tech lead. None of the owed build conditions (build-slice-2-5#1, build-slice-2-11#4, build-slice-2-11#5) is settled by this triage page, so they stay open.

**Conditions:**
- adapter-wrong R-1.10: on the Code With Us create form, with a 501-character teaser, the first opportunityCwuCreate.fieldError() call never returned within the test's 15-second expect.poll window: the error has no received value, only the poll timeout. When stepFormErrors() reads nothing, the fallback namedFieldErrors() goes through every step again and waits up to 2 seconds for each text box the test filled (title, teaser, location, description, remote description), which can take the whole 15 seconds. Make one fieldError() call return within about 3 seconds: read the Teaser field's own group on '1. Overview' first, spend one shared short wait across all named boxes rather than 2 seconds each, and do not go through the steps twice in one call. Also find out why stepFormErrors() missed the teaser message that old draws on step 1, when it finds the title and description messages.
