| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T02:04:40.772Z |
| holder | agent:reviewer |

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

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — when its author adds a note with a file to a published Sprint With Us opportunity, the note and its file appear in the opportunity's history** — failed

```
Error: the file to attach should have been stored

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — when its author adds a note with a file to a published Code With Us opportunity, the note and its file appear in the opportunity's history** — failed

```
Error: the file to attach should have been stored

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one. — when an administrator adds a note with a file to a cancelled Code With Us opportunity, the note and its file appear in the opportunity's history** — failed

```
Error: the file to attach should have been stored

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

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

Question: which of R-1.33's failures against the old target did this project's own adapter cause? Ruling: approve, sending R-1.33 to the product owner. None of the evidence shows the adapter did the wrong thing. (1) The three adding cases fail with 'the file to attach should have been stored' because the test calls fileUpload.uploadFile with only a name and content. The adapter sends that upload with no read-access statement, as asked, and the oracle refuses any upload without one: sources/old/src/back-end/lib/resources/file.ts answers invalid(['Invalid metadata provided.']) when metadata is absent. The binding is right as it stands, because R-8.24's test uses the same uploadFile to check that exactly this bare upload is refused. Adding a statement to it would break R-8.24. The fault is in the R-1.33 test's choice of action: it should store its attachment with uploadFileStatingItsReadAccess. That is for the test writer, not the binding. (2) The signed-out reader case fails because the oracle returns the history, private note and file included, to a request with no session. The adapter's own binding notes recorded the same thing (index.ts, above opportunityHistoryRequest: 'GET answered the administrator, and a request with no session, the opportunity with history'), so the adapter read the right thing. The old application genuinely contradicts the criterion's 'visible only to the author and administrators', and whether the criterion or the old behaviour wins is the product owner's call. (3) The other-staff-member case is unbound because the oracle's session routes each mint one fixed account, so no second non-author public sector account can be acted as. No adapter change can reach that persona. With one line allowed per criterion and a real product contradiction in (2), product-question is the right answer. What would change this: evidence that the oracle withholds the history from a sessionless request when called the way the adapter calls it, which would make (2) an adapter fault.

**Conditions:**
- product-question R-1.33
