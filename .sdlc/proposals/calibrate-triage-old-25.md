---
gate: G3
question: "1 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?"
recommendation: "Sort R-4.24 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T08:10:16.022Z
---

# 1 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?

**Recommendation.** Sort R-4.24 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) are unbound on the **old** target after bind-adapter was sent them as often as `policy.loops.rebind` allows.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

## Unbound after binding

Every failing test of each criterion below ended in the adapter's own `unbound:` error, quoted as it said it, and
bind-adapter was sent it 2 times without binding it. Answer `adapter-wrong` where the
application does offer what the test needs — under another label, behind a step, as another persona —
and the binding run goes back for it. Answer `oracle-cannot` only where the oracle genuinely cannot be
driven into, or observed in, the state the test needs without changing its code: behind an external
identity provider, reachable only through a link the application emails, enforced only by a
browser-native dialog. It is never a way to skip binding work. Answer `product-question` where the
criterion itself looks suspect.

### R-4.24 · v1

While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.

- given: a vendor completing their profile
- when: they tick the box offering notice of new opportunities and complete the profile
- then: their account records that notifications are on, with the moment the choice was made
- test: tests/acceptance/users/R-4.24.spec.ts

**While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.** — failed

```
Error: unbound: user-sign-up-complete.toggle_new_opportunity_notifications — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
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

