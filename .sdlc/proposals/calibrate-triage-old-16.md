---
gate: G3
question: "7 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.9, R-8.10, R-5.13, R-2.14, R-6.15, R-6.16, R-4.20 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-28T15:31:13.289Z
---

# 7 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.9, R-8.10, R-5.13, R-2.14, R-6.15, R-6.16, R-4.20 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

7 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-1.9 · v2

An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.

- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- test: tests/acceptance/opportunities/R-1.9.spec.ts

**a draft whose proposal deadline is missing is given one fourteen days from the day of saving** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"12"[39m
Received string:    [31m"Closed Oct 11, 2026 at 4:00 PM PDT"[39m
```

### R-8.10 · v1

Asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display.

- given: a stored file named "terms.pdf" that the requester may read
- when: they ask for it with its content requested
- then: the bytes are returned, described as a PDF, and named "terms.pdf" for saving
- test: tests/acceptance/files/R-8.10.spec.ts

**asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.13 · v1

Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.

- test: tests/acceptance/evaluation/R-5.13.spec.ts

**finalising is refused unless every proponent still under review has a submitted consensus** — failed

```
Error: evaluation-consensus-list-swu.submit_final_consensus_scores — "Submit Final Consensus Scores" is disabled on http://localhost:3101/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=consensus; the page shows no message
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name. (a named individual)** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-6.15 · v1

A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice.

- test: tests/acceptance/notifications/R-6.15.spec.ts

**A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice (the notice sent to an opportunity's owner)** — failed

```
Error: visible recipients of jyqforoEMaN7yriKFNp8AP

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 3[39m

[2m  Array [[22m
[32m-   "donotreply@example.test",[39m
[31m+   "staff.one@example.test",[39m
[31m+   "admin.one@example.test",[39m
[31m+   "admin.two@example.test",[39m
[2m  ][22m
```

### R-6.16 · v1

A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.

- test: tests/acceptance/notifications/R-6.16.spec.ts

**A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.** — failed

```
Error: links offering to unsubscribe

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 6[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   Object {[39m
[31m+     "href": "http://localhost:3100/users/me?tab=notifications&unsubscribe",[39m
[31m+     "label": "Unsubscribe",[39m
[31m+   },[39m
[31m+ ][39m
```

### R-4.20 · v1

A person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions; the message telling a person they reactivated the account themselves is sent only when they did so by signing in again.

- test: tests/acceptance/users/R-4.20.spec.ts

**a person whose account an administrator reactivates is told that an administrator has reactivated their Digital Marketplace account and whom to contact with questions** — failed

```
Error: no message says an administrator reactivated the account

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mundefined[39m
```

**the message telling a person they reactivated the account themselves is not sent when an administrator reactivates it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/successfully reactivated/i[39m
Received string:      [31m"Digital Marketplace [http://localhost:3101/images/logo_test.png]http://localhost:3101Your Account Has Been ReactivatedYou have[39m
[31m[7msuccessfully reactivated[27m your Digital Marketplace account.Sign In [http://localhost:3101/sign-in]Unsubscribe[39m
[31m[http://localhost:3101/users/me?tab=notifications&unsubscribe]"[39m
```

**the message telling a person they reactivated the account themselves is sent when they did so by signing in again** — failed

```
Error: unbound: signIn.self-reactivating-vendor — /auth/createsessionvendor/13 reaches this account, but it creates a session without the identity provider and without looking at the account's status, so it is not the sign-in that reactivates a self-deactivated account. The oracle has no identity provider to sign in through, so the ordinary sign-in this persona exists for cannot happen there.
```

## Triage conditions

One condition per line, one for every failing criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.

