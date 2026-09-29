| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T15:04:46.623Z |
| holder | agent:reviewer |

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-4.14 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-4.14 · v1

An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.

- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- test: tests/acceptance/users/R-4.14.spec.ts

**an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator** — failed

```
Error: Timeout 5000ms exceeded while waiting on the predicate
```

**everyone registered is listed by status, then account kind, then name** — failed

```
Error: Timeout 5000ms exceeded while waiting on the predicate
```

**an administrator can narrow the list by typing part of a name** — failed

```
Error: Timeout 5000ms exceeded while waiting on the predicate
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

The question is whether R-4.14's failure against old was caused by this project's adapter. Approve, with an adapter-wrong condition. All three tests stop at their first expect.poll on surface.userList.userRow(). The setup steps before it (activating accounts, each person naming themselves) completed. The error is only expect.poll's 'Timeout 5000ms exceeded while waiting on the predicate', with no received value, so the observation never returned inside the poll's default 5 s window. That matches the adapter: userRow() goes through userTableRows() (tests/adapters/old/index.ts:6796), which on every call waits 300 ms, waits up to 10 s for the first status badge, then wheel-scrolls the whole ~143-row list 400 px at a time with a 200 ms pause each turn until four turns add nothing. One pass takes longer than the 5 s poll window, so the test never receives a reading. The test's use of expect.poll with its default window is a fair ask, and every assertion follows from the criterion, so the evidence points at the binding, not at the application or the criterion. This would change if a corrected binding returns within the window and the list still lacks the named people, or orders or narrows them wrongly; that would then be a product-question.

**Conditions:**
- adapter-wrong R-4.14: user-list.user_row (and status_badge, account_type and admin_check, which share userTableRows) takes longer than 5 s per call, because each read resets the scroll, waits up to 10 s for a badge, then wheel-scrolls the whole ~143-row list 400 px at a time with 200 ms pauses until four quiet turns. Inside the test's expect.poll (default 5 s) no call ever returns, so every test times out with no value read. Make one read of the list finish well within 5 s, for example by scrolling the list's scroll container directly in larger steps or reading the rows in one evaluate pass without per-turn waits, while still covering every row.
