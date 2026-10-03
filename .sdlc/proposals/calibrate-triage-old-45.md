---
gate: G3
question: "1 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.33 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-10-03T03:15:39.917Z
---

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.33 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-1.33 · v2

The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one.

- given: a Code With Us or Sprint With Us opportunity in any state
- when: its author adds a note of up to 1,000 characters with attachments
- then: the note and its attachments appear in the opportunity's history, which only the author and administrators can see
- test: tests/acceptance/opportunities/R-1.33.spec.ts

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — a public sector staff member who is not the opportunity's author is not shown a private note or its file** — failed

```
Error: unbound: signIn.public-sector-staff-other — The oracle carries exactly three sign-in routes outside production — /auth/createsessionadmin, /auth/createsessiongov and /auth/createsessionvendor/:n — and the two public sector ones each mint a session for one fixed account. No route, and no parameter on the government route, reaches a second non-administrator public sector account, so this persona can be seeded and observed on the oracle but never acted as.
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — a reader who is not signed in is not shown a private note or its file** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Seeded private note: placeholder text for the history visibility check."[39m
Received string:        [31m"NOTE_ADDED | [7mSeeded private note: placeholder text for the history visibility check.[27m | Casey Placeholder | 2026-01-06T18:00:00.000Z | opportunity-note-attachment.txt (00000000-0000-4000-8000-000000000903)[39m
[31mPUBLISHED |  | Robin Placeholder | 2026-01-05T18:00:00.000Z | [39m
[31mDRAFT |  | Casey Placeholder | 2026-01-05T17:00:00.000Z |"[39m
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

Question: did this project's own adapter cause R-1.33's failures against old? Ruling: approve, with R-1.33 sorted as a product question. The not-signed-in test never signs anyone in. The fixture gives each test a fresh page, so no session carries over from an earlier test. The adapter's history read (tests/adapters/old/index.ts:11269 accountAnswer and :11477 historyEntries) is a cookie-less GET of /api/opportunities/<program>/<id> that only turns the service's own history array into text. The note and its file it returned came from the service, so nothing points at the binding: the old application serves a private note to a reader who is not signed in. The other row, unbound on signIn.public-sector-staff-other, says the oracle's government session route mints one fixed account. That is a limit of the oracle's session routes rather than a binding fault, and with one condition allowed per criterion, the signed-out failure has to reach the product owner. What would change the ruling: evidence that the adapter's page carried a session into the signed-out test, or that historyEntries read something other than the service's answer to that reader. Either would make it adapter-wrong.

**Conditions:**
- product-question R-1.33
