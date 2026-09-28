---
gate: G3
question: "18 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-5.1, R-6.1, R-6.2, R-6.5, R-2.14, R-4.14, R-1.15, R-6.15, R-5.17, R-7.17, R-1.27, R-2.29, R-5.29, R-8.31, R-1.34, R-1.36, R-5.37, R-1.55 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-28T06:35:00.070Z
---

# 18 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-5.1, R-6.1, R-6.2, R-6.5, R-2.14, R-4.14, R-1.15, R-6.15, R-5.17, R-7.17, R-1.27, R-2.29, R-5.29, R-8.31, R-1.34, R-1.36, R-5.37, R-1.55 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

18 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-5.1 · v1

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.

- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- test: tests/acceptance/evaluation/R-5.1.spec.ts

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming the same person twice is rejected with the rule named, and the opportunity keeps the panel it had)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-6.1 · v1

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.

- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- test: tests/acceptance/notifications/R-6.1.spec.ts

```
no result recorded
```

### R-6.2 · v1

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.

- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- test: tests/acceptance/notifications/R-6.2.spec.ts

**When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/deliver|undeliver|bounce|could not be sent|failed to send/[39m
Received string:      [31m"summary[39m
[31msummary[39m
[31mopportunity management[39m
[31mopportunity[39m
[31maddenda[39m
[31mhistory[39m
[31mopportunity evaluation[39m
[31mproposals[39m
[31mneed help?[39m
[31mread guide[39m
[31mcode with us: r-6.2 opportunity published while mail cannot be [7mdeliver[27med[39m
[31mpublished sep 27, 2026[39m
[31m|[39m
[31mupdated sep 27, 2026[39m
[31mstatus[39m
[31mpublished[39m
[31mcreated by[39m
… 11 more line(s)
```

### R-6.5 · v1

Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.

- given: a reader whose mail program shows plain text only
- when: they open any message from the service
- then: they see a readable plain-text rendering carrying the same words and links as the formatted version
- test: tests/acceptance/notifications/R-6.5.spec.ts

**Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.** — failed

```
Error: words of "[TEST] Our Terms and Conditions Have Been Updated" written in its plain text but nowhere in the formatted

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 3[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   "updatedthe",[39m
[31m+ ][39m
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name. (a named individual)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-4.14 · v1

An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.

- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- test: tests/acceptance/users/R-4.14.spec.ts

**an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Aldous Quillfeather"[39m
Received string:    [31m"Active | Vendor | Subscriber Placeholder 107[39m
[31mActive | Vendor | Subscriber Placeholder 108[39m
[31mActive | Vendor | Subscriber Placeholder 109[39m
[31mActive | Vendor | Subscriber Placeholder 110[39m
[31mActive | Vendor | Subscriber Placeholder 111[39m
[31mActive | Vendor | Subscriber Placeholder 112[39m
[31mActive | Vendor | Subscriber Placeholder 113[39m
[31mActive | Vendor | Subscriber Placeholder 114[39m
[31mActive | Vendor | Subscriber Placeholder 115[39m
[31mActive | Vendor | Subscriber Placeholder 116[39m
[31mActive | Vendor | Subscriber Placeholder 117[39m
[31mActive | Vendor | Subscriber Placeholder 118[39m
[31mActive | Vendor | Subscriber Placeholder 119[39m
[31mActive | Vendor | Subscriber Placeholder 120[39m
[31mActive | Vendor | Zinnia Quillfeather[39m
[31mInactive | Vendor | Ellis Placeholder"[39m
```

**everyone registered is listed by status, then account kind, then name** — failed

```
Error: unbound: signIn.deactivated-vendor — vendor sign-in on this target goes through github.com and no sandbox account exists there; the session route /auth/createsessionvendor/:id creates a session without the account-status check the identity-provider sign-in applies, so it cannot show the refusal
```

### R-1.15 · v1

A Sprint With Us or Team With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent.

- given: a member of public sector staff creating or editing a Sprint With Us or Team With Us opportunity that is not a draft
- when: they submit weights that do not total one hundred per cent
- then: the submission is rejected with a message saying the scoring weights must total 100%
- test: tests/acceptance/opportunities/R-1.15.spec.ts

**a Sprint With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent** — failed

```
Error: opportunity-swu-create.publish — "Publish" is disabled on http://localhost:3100/opportunities/sprint-with-us/create; the form marks "7. Scoring" incomplete; the form shows: The scoring weights should total 100% exactly.
```

**a Team With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent** — failed

```
Error: opportunity-twu-create.publish — "Publish" is disabled on http://localhost:3100/opportunities/team-with-us/create; the form marks "7. Scoring" incomplete; the form shows: The scoring weights should total 100% exactly.
```

### R-6.15 · v1

A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice.

- test: tests/acceptance/notifications/R-6.15.spec.ts

**A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice (the notice sent to an evaluation panel)** — failed

```
Error: people carried as blind copies on ijB4TgVy5CZXDZLfvHUVHZ

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m1[39m
Received:   [31m0[39m
```

**A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice (the notice sent to an opportunity's owner)** — failed

```
Error: unbound: evaluation-consensus-list-twu.submit_final_consensus_scores — no control labelled "Submit Consensus Scores" or "Submit Scores" or "Submit" on http://localhost:3100/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus
```

### R-5.17 · v1

When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft.

- given: a published opportunity whose panel already names two people
- when: a third person is added to the panel
- then: only the third person is notified, and the two already on the panel are not
- test: tests/acceptance/evaluation/R-5.17.spec.ts

**When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (a third person added to a published opportunity's panel is notified, and the two already on it are not)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m14[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (the same change made while the opportunity is still a draft notifies nobody)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m63[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-7.17 · v1

A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it.

- test: tests/acceptance/content/R-7.17.spec.ts

**the same body renders identically on the page's own address and wherever another screen embeds it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"Formatting marks make these words bold. Raw markup tries to make these words bold and these words emphasised."[39m
Received: [31m"Formatting marks make these words bold. Raw markup tries to make [7m<strong>[27mthese words bold[7m</strong>[27m and [7m<em>[27mthese words emphasised[7m</em>[27m."[39m
```

### R-1.27 · v1

An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score.

- given: an awarded opportunity
- when: a visitor who may not see proposal scores views it
- then: the successful proponent's name is shown and their contact details and score are withheld
- test: tests/acceptance/opportunities/R-1.27.spec.ts

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Code With Us: a visitor who may not see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/awarded/[39m
Received string:  [31m"completed"[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Code With Us: a reader permitted to see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Sprint With Us: a visitor who may not see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/awarded/[39m
Received string:  [31m"completed"[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**An awarded opportunity shows its successful proponent's name to everyone, and shows the proponent's contact details and score only to those permitted to see the proposal's score. (Sprint With Us: a reader permitted to see proposal scores)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.29 · v1

After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage.

- given: a Sprint With Us opportunity with six proposals scored on its questions, one of them below a question's minimum score
- when: the panel's agreed scores are finalised
- then: the proposal below the minimum is left behind, the remaining five are ranked by their question score and the top four move to the code challenge, while on a Team With Us opportunity the top three move to the challenge
- test: tests/acceptance/proposals/R-2.29.spec.ts

**After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage. (Sprint With Us)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/code challenge/[39m
Received string:  [31m"team questions score entered | team question scores were entered. q1: 5; q2: 5; q3: 5; q4: 5. | sep 27, 2026 11:29 pm pdt robin placeholder[39m
[31munder review (cc) | — | sep 27, 2026 11:29 pm pdt robin placeholder[39m
[31munder review (tq) | — | aug 29, 2026 11:29 pm pdt system[39m
[31msubmitted | — | aug 18, 2026 11:29 pm pdt blake placeholder[39m
[31mdraft | — | aug 8, 2026 11:29 pm pdt blake placeholder"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

**After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage. (Team With Us)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/challenge/[39m
Received string:  [31m"team questions score entered | resource question scores were entered. q1: 5; q2: 5; q3: 5; q4: 5. | sep 27, 2026 11:30 pm pdt robin placeholder[39m
[31munder review (c) | — | sep 27, 2026 11:30 pm pdt robin placeholder[39m
[31munder review (q) | — | aug 29, 2026 11:30 pm pdt system[39m
[31msubmitted | — | aug 18, 2026 11:30 pm pdt blake placeholder[39m
[31mdraft | — | aug 8, 2026 11:30 pm pdt blake placeholder"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-5.29 · v1

Only the chair may record and change the consensus, one consensus per proponent, and only while the opportunity is in consensus.

- given: an opportunity in consensus
- when: an evaluator who is not the chair tries to record an agreed score for a proponent, and the chair records a second consensus for a proponent they have already agreed
- then: the evaluator's attempt is refused, and the chair's second attempt is refused as a duplicate
- test: tests/acceptance/evaluation/R-5.29.spec.ts

**only the chair may record the consensus, and only one consensus per proponent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**removing an attachment from a proposal withdraws the read path the file held through that proposal** — failed

```
Error: unbound: proposal-cwu-edit.save_changes — no control labelled "Save Changes" on http://localhost:3101/opportunities/code-with-us/92099319-5173-49f4-83ba-f6d427b13e11/proposals/ff433f35-bd78-4621-933c-fd6082aca71a/edit
```

### R-1.34 · v1

Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author.

- given: an opportunity ready to be published and people who have turned notifications on
- when: an administrator publishes it
- then: each of those people receives a notice that a new opportunity has been posted, and the opportunity's author receives a confirmation
- test: tests/acceptance/opportunities/R-1.34.spec.ts

**Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author. — everyone who has asked for new-opportunity notifications is notified** — failed

```
Error: the catcher was emptied

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m413[39m
```

**Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author. — the opportunity's author receives a separate confirmation** — failed

```
Error: the catcher was emptied

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m424[39m
```

### R-1.36 · v1

Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.

- given: a published opportunity with watchers and submitted proposals
- when: an administrator cancels it
- then: its watchers and proponents are told it has been cancelled, and its author is told separately that the cancellation was actioned
- test: tests/acceptance/opportunities/R-1.36.spec.ts

**Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author. — everyone watching it and everyone who has submitted a proposal to it is notified** — failed

```
Error: unbound: caught-message.open — the mail catcher answered 404 for http://localhost:8025/api/v1/message/2JZYRg4hpnB4doui3vP2rz
```

**Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author. — its author is notified separately** — failed

```
Error: the catcher was emptied

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m21[39m
```

### R-5.37 · v1

A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation.

- test: tests/acceptance/evaluation/R-5.37.spec.ts

**A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

### R-1.55 · v1

A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.

- test: tests/acceptance/opportunities/R-1.55.spec.ts

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: the same person twice)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: no chair)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: the same person twice)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: no chair)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
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


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: which of the 18 failures against the old target did this project's adapter cause? Approve with one triage condition per criterion. Nine are adapter-wrong. The clearest is shared: mailApi (tests/adapters/old/index.ts:6083) reads the unnumbered SDLC_MAIL_API while the test fixture reads its own worker's SDLC_MAIL_API_<n> (tests/fixtures/index.ts:37). Under 4 instances, tests clear their own catcher while the adapter counts, opens and faults copy 0's. That explains R-5.17, R-1.34, R-1.36, R-6.15 and part of R-6.2. The rest are specific binding faults: a missing button label, reading the whole page instead of the history rows, throwing on a disabled control whose refusal message is on screen, swallowing a refused submit, never saving an attachment removal, the wrong proposal save label, and a virtualized list read from its scrolled position. The other nine are the old app's own behaviour read correctly (undisplayed or unnamed panel errors, a database error, enforcement without a message, inconsistent markdown escaping, 'Completed' and '(CC)' labels, joined plain-text words), so the product owner decides them. R-6.1 skipped because the oracle was never started with notifications disabled. That is a harness configuration gap, not an adapter or product failure; lacking a third form it goes to the product owner, who should know that a copy started with SDLC_ORACLE_DISABLE_NOTIFICATIONS=1 is what exercises it. This ruling would change if a binding run fixed the mail lookup and R-5.17, R-1.34 or R-1.36 still failed on panel or recipient counts; those would then be product questions.

**Conditions:**
- adapter-wrong R-6.2: the history tab binding (opportunityCwuEdit.historyTab, tabContent(["History"])) returns the whole page, including the opportunity title the test wrote, so 'delivered' in the title fails the check; read only the history table rows, as historyRows() does for proposals. The refuse-delivery fault switch also goes through mailApi to the unnumbered SDLC_MAIL_API (copy 0) instead of this worker's SDLC_MAIL_API_<TEST_PARALLEL_INDEX>, so the fault never reached this worker's app
- adapter-wrong R-6.15: mailApi reads the unnumbered SDLC_MAIL_API (copy 0's catcher) instead of this worker's SDLC_MAIL_API_<TEST_PARALLEL_INDEX>, so the panel notice's blind copies are looked for in another copy's mail; and evaluation-consensus-list-twu.submit_final_consensus_scores and confirm_submit_consensus lack the label the page renders, 'Submit Final Consensus Scores'
- adapter-wrong R-5.17: mailApi reads the unnumbered SDLC_MAIL_API (copy 0's catcher) while the test's mail.clear() empties this worker's SDLC_MAIL_API_<TEST_PARALLEL_INDEX>, so caughtMessageList.messageCount counts another copy's mail (14, 63) and the empty-catcher precondition fails before any panel notice is checked; resolve the catcher per worker as the fixture's forThisWorker does
- adapter-wrong R-1.34: mailApi reads the unnumbered SDLC_MAIL_API (copy 0's catcher) while the test clears this worker's SDLC_MAIL_API_<TEST_PARALLEL_INDEX>, so the empty-catcher check counts another copy's 413/424 messages; resolve the catcher per worker as the fixture's forThisWorker does
- adapter-wrong R-1.36: mailApi reads the unnumbered SDLC_MAIL_API (copy 0's catcher), so caught-message.open looks up a message id the test found in this worker's SDLC_MAIL_API_<TEST_PARALLEL_INDEX> and gets 404, and the empty-catcher check counts another copy's 21 messages; resolve the catcher per worker as the fixture's forThisWorker does
- adapter-wrong R-1.15: opportunity-swu-create.publish and opportunity-twu-create.publish throw when Publish is disabled even though the form is showing the refusal ('The scoring weights should total 100% exactly.'); when the disabled control comes with a form message, publish should return quietly so scoreWeightError can read the message
- adapter-wrong R-2.14: submitProposal returns silently when openTermsDialog reports the form refused (Submit disabled with field errors shown), and fieldError/stepMessages then reads an empty string although the page renders 'Please enter a valid email.' / 'Please enter a valid phone number.' under the fields; surface the refusal and read the rendered field messages
- adapter-wrong R-8.31: removeExistingAttachment clicks the remove mark but never saves the opportunity form, so the removal never reaches the service; save after removing ('Publish Changes' / 'Save Changes' / 'Submit Changes for Review'). And proposal-cwu-edit.save_changes looks only for 'Save Changes', while a submitted Code With Us proposal's edit page offers 'Submit Changes', which opens a terms dialog whose boxes must be ticked before its 'Submit Changes' confirm
- adapter-wrong R-4.14: everyUserRow reads the virtualized user table from its current scroll position and only scrolls down, so after the test's first poll leaves the table at the bottom it sees only the tail rows; reset the table body's scrollTop to 0 before reading. And signIn.deactivated-vendor refuses unconditionally, although the test only signs this persona in (after reactivating the account) so they can set their own name; let it use its session-route entry like every other persona, and keep 'cannot show a refusal' only for the refusal-checking reads
- product-question R-5.1
- product-question R-1.55
- product-question R-5.37
- product-question R-5.29
- product-question R-7.17
- product-question R-1.27
- product-question R-2.29
- product-question R-6.5
- product-question R-6.1
