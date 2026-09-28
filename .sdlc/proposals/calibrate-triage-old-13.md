---
gate: G3
question: "37 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-5.1, R-6.2, R-4.4, R-5.9, R-1.10, R-7.12, R-3.13, R-2.14, R-4.14, R-1.16, R-5.17, R-7.17, R-2.19, R-3.20, R-1.21, R-4.21, R-5.21, R-7.22, R-8.22, R-8.25, R-1.27, R-2.27, R-2.29, R-5.29, R-8.31, R-2.33, R-1.34, R-2.34, R-1.35, R-1.36, R-1.37, R-5.37, R-1.40, R-1.41, R-1.48, R-1.53, R-1.55 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-28T03:03:57.441Z
---

# 37 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-5.1, R-6.2, R-4.4, R-5.9, R-1.10, R-7.12, R-3.13, R-2.14, R-4.14, R-1.16, R-5.17, R-7.17, R-2.19, R-3.20, R-1.21, R-4.21, R-5.21, R-7.22, R-8.22, R-8.25, R-1.27, R-2.27, R-2.29, R-5.29, R-8.31, R-2.33, R-1.34, R-2.34, R-1.35, R-1.36, R-1.37, R-5.37, R-1.40, R-1.41, R-1.48, R-1.53, R-1.55 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

37 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
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

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming a vendor is rejected with the rule named, and the opportunity keeps the panel it had)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"00000000-0000-4000-8000-000000000201"[39m
Received array: [31m["00000000-0000-4000-8000-000000000102"][39m
```

### R-6.2 · v1

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.

- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- test: tests/acceptance/notifications/R-6.2.spec.ts

**When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Code With Us: R-6.2 opportunity published while mail cannot be delivered"[39m
```

### R-4.4 · v1

A person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in.

- given: an account an administrator has deactivated
- when: that person signs in through the identity provider
- then: no session is created and they are shown a page saying sign-in failed and inviting them to try again
- test: tests/acceptance/users/R-4.4.spec.ts

**a person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in** — failed

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByLabel(/username/i).first()[22m

```

### R-5.9 · v1

The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score.

- test: tests/acceptance/evaluation/R-5.9.spec.ts

**The service must reject an evaluation panel that names no chair, applying the same rule the browser form already applies, so that no opportunity can enter consensus with nobody able to record the agreed score** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters. (a teaser over 500 characters)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-7.12 · v1

A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it.

- given: a newly prepared installation of the service that nobody has edited and an administrator looking at the list of pages on that installation
- when: a visitor opens any of the pages the service needs, such as its terms and conditions and they read it
- then: the page exists and answers, its title is its own address, and its body reads "Initial version" and twenty-two pages are listed, all marked as needed by the service
- test: tests/acceptance/content/R-7.12.spec.ts

**a fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it** — failed

```
Error: about

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"about[39m
[31mPublished Sep 27, 2026 7:30 PM[39m
[31m|[39m
[31mUpdated Sep 27, 2026 7:30 PM·[39m
[31mInitial version"[39m
```

### R-3.13 · v1

Only a service administrator may transfer ownership of an organization, and only to a member whose membership is already active; the previous owner becomes an ordinary member.

- given: an organization with an owner, one active member and one member whose invitation is still pending
- when: an administrator transfers ownership to the active member
- then: that member becomes the organization's owner, the previous owner becomes an ordinary member, and the pending member cannot be chosen as the new owner
- test: tests/acceptance/organizations/R-3.13.spec.ts

**a service administrator may transfer ownership of an organization to a member whose membership is already active** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"You do not own any organizations."[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

**once ownership is transferred the previous owner becomes an ordinary member** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"You are not affiliated with any organizations."[39m

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
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

### R-4.14 · v1

An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.

- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- test: tests/acceptance/users/R-4.14.spec.ts

**an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Zinnia Quillfeather"[39m
Received string:    [31m"STATUS	ACCOUNT TYPE	NAME	ADMIN?[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mCasey Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mDevon Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mEmerson Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mEmery Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mMIGRATION_USER····[39m
[31mActive··[39m
… 47 more line(s)
```

**everyone registered is listed by status, then account kind, then name** — failed

```
Error: unbound: signIn.deactivated-vendor — no control labelled "Sign In Using GitHub" on http://localhost:3102/dashboard
```

**an administrator can narrow the list by typing part of a name** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Zinnia Quillfeather"[39m
Received string:    [31m"STATUS	ACCOUNT TYPE	NAME	ADMIN?[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mDevon Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mEmerson Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mEmery Placeholder····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mMarlowe Quillfeather····[39m
[31mActive··[39m
[31mPublic Sector Employee··[39m
[31mMIGRATION_USER····[39m
[31mActive··[39m
… 47 more line(s)
```

### R-1.16 · v1

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- test: tests/acceptance/opportunities/R-1.16.spec.ts

**a Sprint With Us opportunity must have an implementation phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us opportunity may only have an inception phase if it also has a prototype phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.17 · v1

When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft.

- given: a published opportunity whose panel already names two people
- when: a third person is added to the panel
- then: only the third person is notified, and the two already on the panel are not
- test: tests/acceptance/evaluation/R-5.17.spec.ts

**When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (a third person added to a published opportunity's panel is notified, and the two already on it are not)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"staff.one@example.test"[39m
Received string:        [31m" donotreply@example.test staff.two@example.test [7mstaff.one@example.test[27m  admin.one@example.test  admin.two@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  admin.one@example.test[39m
[31mstaff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test "[39m
```

**When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (the same change made while the opportunity is still a draft notifies nobody)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"staff.two@example.test"[39m
Received string:        [31m" staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  donotreply@example.test [7mstaff.two@example.test[27m staff.one@example.test  admin.one@example.test  admin.two@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  admin.one@example.test[39m
[31mstaff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test  staff.one@example.test "[39m
```

### R-7.17 · v1

A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it.

- test: tests/acceptance/content/R-7.17.spec.ts

**the same body renders identically on the page's own address and wherever another screen embeds it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"[7msprint-with-us-opportunity-scope Published Sep 27, 2026 7:31 PM | Updated Sep 27, 2026 7:31 PM [27mFormatting marks make these words bold. Raw markup tries to make these words bold and these words emphasised."[39m
Received: [31m"Formatting marks make these words bold. Raw markup tries to make [7m<strong>[27mthese words bold[7m</strong>[27m and [7m<em>[27mthese words emphasised[7m</em>[27m."[39m
```

### R-2.19 · v2

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText('Frontend Development', { exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-body text-hover-body py-1 font-size-small text-nowrap">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText('Frontend Development', { exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-body text-hover-body py-1 font-size-small text-nowrap">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is not stable[22m
[2m  2 × retrying click action[22m
[2m      - waiting 100ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m  28 × retrying click action[22m
[2m       - waiting 500ms[22m
[2m       - waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m  - retrying click action[22m
… 2 more line(s)
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText('Frontend Development', { exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-body text-hover-body py-1 font-size-small text-nowrap">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is not stable[22m
[2m  2 × retrying click action[22m
[2m      - waiting 100ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m  28 × retrying click action[22m
[2m       - waiting 500ms[22m
[2m       - waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m  - retrying click action[22m
… 2 more line(s)
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText('Frontend Development', { exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-body text-hover-body py-1 font-size-small text-nowrap">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

```

**a Sprint With Us proposal must stay within each phase's budget** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText('Frontend Development', { exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-body text-hover-body py-1 font-size-small text-nowrap">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

```

### R-3.20 · v1

Asking for the organizations one may act on behalf of is refused as not permitted for anyone who is not a signed-in vendor, rather than answered with an empty list.

- test: tests/acceptance/organizations/R-3.20.spec.ts

**asking for the organizations one may act on behalf of is refused as not permitted for a visitor who is not signed in, rather than answered with an empty list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**asking for the organizations one may act on behalf of is refused as not permitted for a member of public sector staff, rather than answered with an empty list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**asking for the organizations one may act on behalf of is refused as not permitted for a service administrator, rather than answered with an empty list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.21 · v1

Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.

- given: a draft opportunity with a field still blank
- when: its author submits it for review
- then: the request is refused with a message saying the opportunity is incomplete and asking the author to complete and save the form
- test: tests/acceptance/opportunities/R-1.21.spec.ts

**Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/incomplete/i[39m
Received string:  [31m"SUMMARY[39m
[31mSummary[39m
[31mOPPORTUNITY MANAGEMENT[39m
[31mOpportunity[39m
[31mHistory[39m
[31mOPPORTUNITY EVALUATION[39m
[31mProposals[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mCode With Us: R-1.21 saved draft with its location emptied, submitted for review[39m
[31mUpdated Sep 27, 2026[39m
[31mStatus[39m
[31mDraft[39m
[31mCreated By[39m
[31mCasey Placeholder[39m
[31m1. Overview[39m
[31mTitle[39m
… 91 more line(s)
```

### R-4.21 · v1

The list of everyone registered with the service may be read only by an administrator. The same request made by a public sector employee who is not an administrator, or by anyone else, is refused rather than answered, so the email address and account status of every registered person are never disclosed more widely than the interface offers them.

- test: tests/acceptance/users/R-4.21.spec.ts

**the list of everyone registered with the service, requested by a public sector employee who is not an administrator, is refused rather than answered** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.21 · v1

Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation.

- given: an opportunity in individual question evaluation
- when: the chair who is not an evaluator, or the opportunity's owner who is not on the panel, tries to score a proponent
- then: the attempt is refused, whereas an evaluator on the panel may score
- test: tests/acceptance/evaluation/R-5.21.spec.ts

**Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the chair who is not an evaluator is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the opportunity's owner who is not on the panel is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-7.22 · v1

No two pages may share an address, whether the clash arises on creating a page or on renaming one.

- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use
- test: tests/acceptance/content/R-7.22.spec.ts

**No two pages may share an address, whether the clash arises on creating a page or on renaming one — on creating a page** — failed

```
Error: the creation was submitted and the screen answered it

the creation was submitted and the screen answered it

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-8.22 · v1

A file may be attached to an opportunity or a proposal only by someone who is permitted to read that file.

- test: tests/acceptance/files/R-8.22.spec.ts

**a file may be attached to an opportunity only by someone who is permitted to read that file: someone who may not read it is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a file may be attached to a proposal only by someone who is permitted to read that file: someone who may not read it is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.25 · v1

A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.

- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- test: tests/acceptance/files/R-8.25.spec.ts

**an attachment on a Sprint With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
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
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m""[39m
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
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m""[39m
```

### R-2.27 · v1

When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.

- given: an opportunity in evaluation with two proposals under review and one already disqualified
- when: the last of the two is scored
- then: the opportunity moves to processing with the note "Automatically moved to Processing as all proposals have been evaluated.", and disqualified, withdrawn and draft proposals are not counted
- test: tests/acceptance/proposals/R-2.27.spec.ts

**When every proposal still in contention on an opportunity has been evaluated, the opportunity moves to processing on its own.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/disqualif/[39m
Received string:  [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mmanagement[39m
[31mproposal history[39m
[31mcode with us: vendor proposal[39m
[31mstatus[39m
[31mnon-compliant[39m
[31mproponent[39m
[31mnorthern pines digital ltd.[39m
[31mproponent type[39m
[31morganization[39m
[31msubmitted by[39m
[31mblake placeholder[39m
[31mexport proposal[39m
[31mhistory[39m
[31mentry type	note	created·[39m
… 23 more line(s)
```

### R-2.29 · v1

After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage.

- given: a Sprint With Us opportunity with six proposals scored on its questions, one of them below a question's minimum score
- when: the panel's agreed scores are finalised
- then: the proposal below the minimum is left behind, the remaining five are ranked by their question score and the top four move to the code challenge, while on a Team With Us opportunity the top three move to the challenge
- test: tests/acceptance/proposals/R-2.29.spec.ts

**After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage. (Sprint With Us)** — failed

```
Error: the fifth-ranked proponent was carried on

[2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/challenge/[39m
Received string:      [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mvendor evaluation[39m
[31mteam questions[39m
[31mcode [7mchallenge[27m[39m
[31mteam scenario[39m
[31mmanagement[39m
[31mproposal history[39m
[31msprint with us: vendor proposal[39m
[31mstatus[39m
[31munder review (tq)[39m
[31mproponent[39m
[31mred alder studio ltd.  (proponent 5)[39m
[31mqualified supplier[39m
… 39 more line(s)
```

**After the questions of a Sprint With Us or Team With Us opportunity have been scored, only proposals meeting every question's minimum score are ranked by that score and the highest few are carried into the next stage. (Team With Us)** — failed

```
Error: the fourth-ranked proponent was carried on

[2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: not [32m/challenge/[39m
Received string:      [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mvendor evaluation[39m
[31mresource questions[39m
[31minterview/[7mchallenge[27m[39m
[31mmanagement[39m
[31mproposal history[39m
[31mteam with us: vendor proposal[39m
[31mstatus[39m
[31munder review (q)[39m
[31mproponent[39m
[31mquiet meadow works ltd.  (proponent 4)[39m
[31mqualified supplier[39m
[31msubmitted by[39m
… 38 more line(s)
```

### R-5.29 · v1

Only the chair may record and change the consensus, one consensus per proponent, and only while the opportunity is in consensus.

- given: an opportunity in consensus
- when: an evaluator who is not the chair tries to record an agreed score for a proponent, and the chair records a second consensus for a proponent they have already agreed
- then: the evaluator's attempt is refused, and the chair's second attempt is refused as a duplicate
- test: tests/acceptance/evaluation/R-5.29.spec.ts

**only the chair may record the consensus, and only one consensus per proponent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Back to Opportunity[39m
[31mVENDOR PROPOSAL[39m
[31mProposal Details[39m
[31mVENDOR EVALUATION[39m
[31mResource Questions (Eval)[39m
[31mInterview/Challenge[39m
[31mMANAGEMENT[39m
[31mProposal History[39m
[31mTeam With Us: Vendor Proposal[39m
[31mStatus[39m
[31mUnder Review (Q)[39m
[31mProponent[39m
[31mProponent 1[39m
[31mProponent 1[39m
[31mQuestion 1·[39m
[31mSeeded resource question one.·[39m
[31mAnswer in your own words.·[39m
[31mThe first proponent's answer to question one.·[39m
… 49 more line(s)
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
Error: unbound: proposal-cwu-edit.start_editing — no "Actions" menu on http://localhost:3100/opportunities/code-with-us/9a5161bb-312c-41fc-b424-14ff523c6b98/proposals/d95dadf3-9340-4441-ac2d-fdf6d4e68796/edit
```

### R-2.33 · v1

Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.

- given: an opportunity with one evaluated proposal, one already disqualified and one withdrawn
- when: an administrator awards the evaluated proposal
- then: that proposal becomes awarded, the opportunity becomes awarded, and the disqualified and withdrawn proposals keep the state they were in
- test: tests/acceptance/proposals/R-2.33.spec.ts

**Awarding a proposal marks every other proposal still in contention on that opportunity as not awarded and awards the opportunity itself.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/disqualif/[39m
Received string:  [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mmanagement[39m
[31mproposal history[39m
[31mcode with us: vendor proposal[39m
[31mstatus[39m
[31mnon-compliant[39m
[31mproponent[39m
[31msilver creek software ltd.[39m
[31mproponent type[39m
[31morganization[39m
[31msubmitted by[39m
[31mkai placeholder[39m
[31mexport proposal[39m
[31mhistory[39m
[31mentry type	note	created·[39m
… 23 more line(s)
```

### R-1.34 · v1

Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author.

- given: an opportunity ready to be published and people who have turned notifications on
- when: an administrator publishes it
- then: each of those people receives a notice that a new opportunity has been posted, and the opportunity's author receives a confirmation
- test: tests/acceptance/opportunities/R-1.34.spec.ts

**publishing an opportunity confirms the publication to the opportunity's author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m50[39m
Received:   [31m50[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.34 · v1

A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.

- given: a proposal at any stage after the opportunity has closed
- when: an administrator disqualifies it without giving a reason
- then: the request is refused, and with a reason given the proposal becomes disqualified, the reason is kept in its history, and the opportunity is re-checked for whether every remaining proposal is now evaluated
- test: tests/acceptance/proposals/R-2.34.spec.ts

**a proposal may be disqualified at any stage of evaluation, and the reason is kept in its history** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"disqualif"[39m
Received string:    [31m"back to opportunity[39m
[31mvendor proposal[39m
[31mproposal details[39m
[31mvendor evaluation[39m
[31mresource questions[39m
[31minterview/challenge[39m
[31mmanagement[39m
[31mproposal history[39m
[31mteam with us: vendor proposal[39m
[31mstatus[39m
[31mnon-compliant[39m
[31mproponent[39m
[31mproponent 3[39m
[31mthis proposal's history will be available once the opportunity reaches the challenge."[39m
```

### R-1.35 · v1

Changing or adding an addendum to an opportunity that is neither a draft nor cancelled notifies everyone watching it, everyone who has submitted a proposal to it, and its author.

- given: a published opportunity with watchers and submitted proposals
- when: an administrator edits it or adds an addendum
- then: its watchers, its proponents and its author are each notified once
- test: tests/acceptance/opportunities/R-1.35.spec.ts

**Changing or adding an addendum to an opportunity that is neither a draft nor cancelled notifies everyone watching it, everyone who has submitted a proposal to it, and its author.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/submit/[39m
Received string:  [31m"seeded published code with us opportunity"[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-1.36 · v1

Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.

- given: a published opportunity with watchers and submitted proposals
- when: an administrator cancels it
- then: its watchers and proponents are told it has been cancelled, and its author is told separately that the cancellation was actioned
- test: tests/acceptance/opportunities/R-1.36.spec.ts

**cancelling an opportunity notifies its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m50[39m
Received:   [31m50[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.37 · v1

Submitting an opportunity for review notifies every administrator, and confirms the submission to its author.

- given: a complete draft opportunity
- when: its author submits it for review
- then: every administrator is notified that an opportunity awaits review, and the author receives a confirmation
- test: tests/acceptance/opportunities/R-1.37.spec.ts

**submitting an opportunity for review confirms the submission to its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m50[39m
Received:   [31m50[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-5.37 · v1

A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation.

- test: tests/acceptance/evaluation/R-5.37.spec.ts

**A panel member who is neither an evaluator nor the chair must be refused by the service when the panel is submitted, with a field-level message identifying the offending member, rather than being allowed through to a database constraint violation** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.40 · v1

Only an administrator can open the full report of a completed opportunity, which shows the opportunity, its addenda, its history and every proposal in one continuous document.

- given: an opportunity that has been evaluated
- when: a member of public sector staff who is not an administrator opens its report address
- then: they are refused, while an administrator opening the same address sees the whole record in one document
- test: tests/acceptance/opportunities/R-1.40.spec.ts

**Only an administrator can open the full report of a completed opportunity, which shows the opportunity, its addenda, its history and every proposal in one continuous document. (a member of public sector staff who is not an administrator is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Not Found·[39m
[31mThe page you are looking for doesn't exist.·[39m
[31mGo Home"[39m
```

### R-1.41 · v1

Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one.

- given: a Sprint With Us or Team With Us opportunity at the questions consensus stage
- when: its author asks to move it on while a consensus is unsubmitted, or while no proponent has cleared every question's minimum score
- then: the request is refused and the reason is named
- test: tests/acceptance/opportunities/R-1.41.spec.ts

**Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one. (Sprint With Us: a consensus evaluation still unsubmitted)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Advancing a Sprint With Us or Team With Us opportunity out of the consensus stage is refused unless every consensus evaluation has been submitted and at least one proponent has met the minimum score on every question that sets one. (Sprint With Us: no proponent has met every minimum score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-1.48 · v1

Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.

- test: tests/acceptance/opportunities/R-1.48.spec.ts

**Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs. (Sprint With Us: created under review by a public sector employee who is not an administrator)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.53 · v2

An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.

- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- test: tests/acceptance/opportunities/R-1.53.spec.ts

**An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains. (Sprint With Us: an administrator deletes an opportunity under review)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains. (Sprint With Us: the public sector employee who created it is refused once it is under review, and it remains)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
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

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Sprint With Us: somebody who is not a public sector employee)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"00000000-0000-4000-8000-000000000201"[39m
Received array: [31m["00000000-0000-4000-8000-000000000101"][39m
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

**A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named. (Team With Us: somebody who is not a public sector employee)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"00000000-0000-4000-8000-000000000201"[39m
Received array: [31m["00000000-0000-4000-8000-000000000101"][39m
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

Question: which of the 37 calibration failures against old did this project's own adapter cause? Ruling: approve, with one triage line per failing criterion. Reason: each failure was read against its test and against tests/adapters/old/index.ts. Twenty-two point at the binding, each for a specific defect named in its condition. Examples: index.ts:2275 returns quietly when a vendor is not offered, so a refused vendor reads as added. Several reads bind to contentText() and return the whole page where the test asks for one part: fullReport, notFoundForUnknownAddress, chairOnly, historyTab. messages() drops alerts outside main and any wording missing from the MESSAGE vocabulary. Disabled Publish and Submit for Review controls return without error. changeOwner reads an empty name from an object input. The sign-in for a deactivated account takes the identity-provider path and fills a username field on whatever page it lands on. Fifteen are product questions because the adapter asked the right thing and the app answered it. The service did not refuse where refusal was expected (R-4.21, R-3.20, R-8.22, R-8.25, R-5.9). The legacy app says Non-compliant, not disqualified (R-2.27, R-2.33, R-2.34). R-1.21's alert says 'could not be updated', not 'incomplete'. R-5.21 and R-1.41 reached the right screen and no refusal message was found. R-1.34, R-1.36 and R-1.37 fail at a cap of 50 in tests/fixtures/mail.ts:18, where the Mailpit search is called without a limit. R-5.17 counts mail left over from earlier tests because mail.clear() is never checked. Both are in the shared fixture, not the adapter, and the product owner should route them to the test's author. What would change this: if the next binding run fixes the named adapter defects and the same criteria still fail for the same reason, they become product questions.

**Conditions:**
- adapter-wrong R-5.1: pickPanelMember (index.ts:2275) returns quietly when the chooser does not offer a vendor, so addPanelMember({member: vendorOne}) reads as a success and the test finds the vendor missing from the panel; it must throw so the refusal is seen. duplicateMemberError reads messages(/duplicate|already/i), which only reads inside main, skips paragraph and list-item text and needs a MESSAGE vocabulary word; read the panel's alerts (alertMessages) and field errors so the duplicate-member message is found
- adapter-wrong R-5.37: submitPanelWithMemberHoldingNoRole (index.ts:~6116) looks for the member with field(input, 'member') and asText(input), and neither accepts a nested user object, so it throws before sending anything and memberWithoutRoleError reads the earlier 200 from open; get the member's id or email from input.member (personKey or userIdFor) and send the panel
- adapter-wrong R-1.55: the vendor case has the same quiet return at index.ts:2275, so the vendor reads as added and the test never sees a refusal; throw instead. For the no-chair case, makeChair (index.ts:4265-4269) can only tick a Panel Chair box, so a panel with no chair can never be composed; with a null member it must untick every chair box. duplicateMemberError and missingChairError use messages(), which misses alerts outside main and wording without a MESSAGE word; read alerts and field errors
- adapter-wrong R-5.29: chairOnly is bound to contentText() (index.ts:4547, 4605), which returns the whole proposal page for every reader and so can never read falsy; return empty when the consensus form is offered to the reader, and non-empty only when the page refuses them (Not Found or a notice that only the chair may record)
- adapter-wrong R-4.4: the identity-provider sign-in (index.ts:1632-1670) is forced for the deactivated persona although this target's identity is session-route, and after pressing Sign In Using GitHub it fills getByLabel(/username/i) on any page that is not github.com; sign the deactivated persona in through the session route, or throw unbound whenever the destination is not a known identity-provider form
- adapter-wrong R-4.14: userRow (index.ts:3950) reads only the first page of the paginated user list (20 rows, ending before the seeded names later in the alphabet); read every page. signInThroughIdentityProvider goes to /sign-in without signing out first, so while the administrator is still signed in it lands on /dashboard and reports the sign-in control missing; sign out first
- adapter-wrong R-3.13: changeOwner (index.ts:3544-3551) gets the new owner with asText(input), which returns an empty string for {newOwner: <user object>}, so nobody is chosen and no transfer is made; read input.newOwner and choose that person by name or email, then confirm Change Owner
- adapter-wrong R-7.12: notFoundForUnknownAddress (index.ts:4999) returns contentText() even when the page exists, so the about page's own text reads as a Not Found screen; return text only when notFoundShown() is true, as userProfile.notFoundPage does
- adapter-wrong R-7.17: pageBody (index.ts:4959) includes the page's heading and its Published/Updated line, while embeddedSection (index.ts:2425-2437) returns only the body, so the two readings can never be equal; make pageBody skip the heading and the dated line the way bodyElementNames does, so that only the bodies are compared
- adapter-wrong R-7.22: the content create screen's duplicateSlugError, publishedSuccess and fieldError read contentText() (index.ts:4843, 4858-4859), which drops alerts rendered after the footer; read them with alertLines, as deletedSuccess does. confirmPublish waits up to 15s for the address to leave /content/create, and a refused creation never leaves, so read the notice as soon as the submit is answered
- adapter-wrong R-1.40: fullReport (index.ts:2727) returns contentText() without checking for the Not Found screen, so the refusal a non-administrator gets reads as a report; return empty when notFoundShown() is true
- adapter-wrong R-1.10: publish (index.ts:1856-1859, 1880) returns quietly when the Publish control is disabled, so the test treats the submission as made and waits for a field error; it must throw when Publish is disabled. fieldError (index.ts:1885 via messages) also misses the teaser's validation text because it needs a MESSAGE word and skips paragraph lines; read the field's own error
- adapter-wrong R-1.16: publish turns the opportunity's startDate/completionDate into an Implementation phase (phaseDatesOf, index.ts:2011-2014 and 1849), so the case without an implementation phase gets one; do not add phases the input does not name. publish also returns quietly when Publish is disabled (index.ts:1880) instead of throwing, and it stops at step 8 Attachments with the form incomplete
- adapter-wrong R-1.48: submitForReview (index.ts:1870) returns quietly when Submit for Review is disabled. The Sprint With Us form is left incomplete because neither addPhase (index.ts:2092) nor completeRequired (index.ts:1014-1056) ticks a phase's required capabilities; complete the form fully, or throw naming the step that is still invalid
- adapter-wrong R-1.53: the same defect as R-1.48. The Sprint With Us draft cannot be submitted for review because its phase capabilities are never ticked, and submitForReview (index.ts:1870) returns quietly on the disabled control, so the under-review cases never reach under review
- adapter-wrong R-1.35: myProposalsTable (index.ts:3232) returns the tab's page text, where each table row spans several lines, so the title line never carries its Submitted status; return one line per table row, with the cells joined
- adapter-wrong R-6.2: fieldError (index.ts:1885 -> 627, MESSAGE at 241) read the record's page heading as an error, because the opportunity title contains 'cannot ' and headings are not excluded; exclude headings and titles, and read only alerts and field-level errors
- adapter-wrong R-2.14: each refused individual-proponent attempt walks the whole proposal wizard about six times (openTermsDialog from acceptProgramTerms, acceptAppTerms and submitProposal; completeRequired(true) plus toStepShowingMessages, index.ts:2766-2830), with a settle wait of up to 10s on each step, so the nine attempts run past the 120s budget; once an attempt is known to be refused, skip the later walks until the form is reopened
- adapter-wrong R-2.19: addPhase clicks a capability chip (index.ts:2115) chosen from bounding boxes between the phase headings (index.ts:2096), after an unfold click (index.ts:2061-2067) that may close the section again, so the chip is animating or hidden when clicked; look for the chip inside the expanded phase's own container, wait until the section is open and stable, and find the chip again before clicking
- adapter-wrong R-2.29: historyTab for the Sprint With Us and Team With Us proposal views (index.ts:3139, 3186) returns the whole page through tabContent -> contentText, which includes the tab labels Code Challenge and Interview/Challenge, so /challenge/ always matches; read only the History panel's table rows
- adapter-wrong R-1.27: successfulProponent (index.ts:2389-2391) needs an exact 'Successful Proponent' or 'Awarded To' line and never reads the award banner sentence ('awarded to <name>') that awardBanner (index.ts:2412-2421) already finds, so the reader who may see scores gets empty; take the proponent's name from that banner. The visitor-case status is read verbatim and is not an adapter defect
- adapter-wrong R-8.31: proposalCwuEdit.startEditing (index.ts:3015) only goes through the Actions menu, which the proposal's /edit page does not have; like addAttachment (index.ts:1381-1389), use the top-bar Edit or the Proposal Details tab when they are present, and do nothing when the form is already editable
- product-question R-5.9
- product-question R-5.21
- product-question R-5.17
- product-question R-1.41
- product-question R-4.21
- product-question R-3.20
- product-question R-1.21
- product-question R-1.34
- product-question R-1.36
- product-question R-1.37
- product-question R-8.22
- product-question R-8.25
- product-question R-2.27
- product-question R-2.33
- product-question R-2.34
