---
gate: G3
question: "68 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.1, R-2.2, R-1.3, R-2.3, R-3.3, R-1.4, R-2.4, R-2.7, R-3.7, R-3.8, R-2.9, R-1.10, R-6.10, R-1.11, R-1.12, R-2.12, R-3.12, R-4.12, R-2.13, R-8.13, R-1.14, R-2.14, R-4.14, R-3.15, R-6.17, R-8.17, R-3.18, R-1.19, R-3.19, R-1.20, R-7.20, R-8.20, R-1.21, R-3.21, R-7.21, R-8.21, R-1.22, R-7.22, R-1.23, R-2.23 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-14T21:07:28.417Z
---

# 68 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.1, R-2.2, R-1.3, R-2.3, R-3.3, R-1.4, R-2.4, R-2.7, R-3.7, R-3.8, R-2.9, R-1.10, R-6.10, R-1.11, R-1.12, R-2.12, R-3.12, R-4.12, R-2.13, R-8.13, R-1.14, R-2.14, R-4.14, R-3.15, R-6.17, R-8.17, R-3.18, R-1.19, R-3.19, R-1.20, R-7.20, R-8.20, R-1.21, R-3.21, R-7.21, R-8.21, R-1.22, R-7.22, R-1.23, R-2.23 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

68 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

The 40 below are the ones to sort now; the remaining 28 come back on the next run.

### R-2.1 · v1

Only a signed-in vendor who has accepted the service's terms at some point may start a proposal; a request from public sector staff, an administrator or an anonymous visitor is refused.

- given: a visitor who is not signed in, or is signed in as public sector staff or as an administrator
- when: they attempt to start a proposal against a published opportunity
- then: the request is refused and no proposal is created
- test: tests/acceptance/proposals/R-2.1.spec.ts

**a signed-in vendor who has accepted the service's terms may start a proposal** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a request to start a proposal from public sector staff, an administrator or an anonymous visitor is refused** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.2 · v1

A vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one.

- given: a vendor who already has a proposal, in any state, against a published opportunity
- when: they start a second proposal against the same opportunity
- then: the request is refused with "You already have a proposal for this opportunity." and no second proposal is created
- test: tests/acceptance/proposals/R-2.2.spec.ts

**a vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.3 · v1

A member of public sector staff sees every published opportunity plus their own drafts and opportunities under review, and an administrator sees every opportunity.

- given: two members of public sector staff, each with an unpublished opportunity of their own
- when: each lists opportunities
- then: each sees their own unpublished opportunity and not the other's, while an administrator listing opportunities sees both
- test: tests/acceptance/opportunities/R-1.3.spec.ts

**a member of public sector staff sees every published opportunity plus their own drafts, and not another staff member's** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Seeded draft Code With Us opportunity of another staff member"[39m
Received string:        [31m"R-1.3 draft belonging to the member of staff who is signed in[39m
[31mCode With Us[39m
[31mDraft[39m
[31mClosed Sep 28, 2026 at 1:45 PM PDT[39m
[31m$0[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mR-1.28 draft an administrator asked to cancel[39m
[31mCode With Us[39m
[31mDraft[39m
[31mClosed Sep 27, 2026 at 4:00 PM PDT[39m
[31mA short summary of the work to be done.[39m
[31m$5,000[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mWatch[39m
[31mR-1.28 published opportunity its author asked to cancel[39m
… 627 more line(s)
```

### R-2.3 · v1

Submitting a proposal requires the vendor to accept both the program's terms and the service's current terms, and the act of submitting records that acceptance.

- given: a vendor with a complete proposal whose acceptance of the current terms has been reset
- when: they submit the proposal without ticking both the program terms and the service terms
- then: the submit action is unavailable, and a submission that reaches the service anyway is refused
- test: tests/acceptance/proposals/R-2.3.spec.ts

**submitting a proposal requires the vendor to accept both the program's terms and the service's current terms** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**the act of submitting a proposal records the vendor's acceptance of the terms** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-3.3 · v1

An organization's full record can be opened only by an administrator or by a member who owns or administers that organization; anyone else is refused.

- given: an organization with an owner, one administrator and one ordinary member
- when: the ordinary member, and separately a member of public sector staff, opens that organization's management page
- then: both are refused, while the owner, the organization's administrator and a service administrator each see the organization
- test: tests/acceptance/organizations/R-3.3.spec.ts

**a member of public sector staff is refused the organization's full record** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Northern Pines Digital Ltd."[39m
Received string:        [31m"Organization[39m
[31mTeam[39m
[31mSWU Qualification[39m
[31mTWU Qualification[39m
[31mChangelog[39m
[31m[7mNorthern Pines Digital Ltd.[27m[39m
[31mSprint With Us Qualified[39m
[31mTeam With Us Qualified[39m
[31mProfile Picture (Optional)[39m
[31mLegal Name[39m
[31mWebsite Url (Optional)[39m
[31mLegal Address[39m
[31mStreet Address[39m
[31mStreet Address[39m
[31mCity[39m
[31mProvince/State[39m
[31mPostal / ZIP Code[39m
… 11 more line(s)
```

### R-1.4 · v1

Every change to an opportunity's content creates a new version of it and records an edit in its history; the opportunity always shows its most recent version.

- given: a published opportunity
- when: an administrator changes its description and saves
- then: the opportunity shows the new description, its history gains an entry recording that it was edited, by whom and when, and the previous content is retained
- test: tests/acceptance/opportunities/R-1.4.spec.ts

**every change to an opportunity's content creates a new version of it and the opportunity always shows its most recent version** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**every change to an opportunity's content records an edit in its history** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.4 · v1

Only a draft proposal can be deleted, and deleting it removes it permanently.

- given: a proposal that has been submitted
- when: its author asks for it to be deleted
- then: the request is refused, whereas deleting a draft succeeds and the proposal can no longer be opened
- test: tests/acceptance/proposals/R-2.4.spec.ts

**a proposal that has been submitted cannot be deleted** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**only a draft proposal can be deleted, and deleting it removes it permanently** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.7 · v2

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- test: tests/acceptance/proposals/R-2.7.spec.ts

**a proposal may be created as a draft, in all three programs** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a proposal may be created as a submission, in all three programs** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-3.7 · v1

An organization's owner, its administrators and a service administrator may invite people to the team by email address, and each invitation is created as a pending membership.

- given: an organization with an owner and no other members
- when: the owner invites two email addresses at once from the team page
- then: both people appear on the team list marked as pending, and neither counts towards the organization's team size until they accept
- test: tests/acceptance/organizations/R-3.7.spec.ts

**when the owner invites two email addresses at once both people appear on the team list marked as pending, and neither counts towards the organization's team size** — failed

```
Error: organization-edit.add_team_members — "Add Team Member(s)" is disabled on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000302/edit?tab=team; the page shows no message
```

### R-3.8 · v1

A person may only be invited to an organization if they hold an active vendor account, and cannot be invited twice to the same organization.

- given: an organization with one pending invitation outstanding for a given person
- when: the owner invites that same person again, and separately invites a member of public sector staff
- then: the repeat invitation is refused as the person already being a member of the organization, and the invitation to public sector staff is refused because only vendors may be invited
- test: tests/acceptance/organizations/R-3.8.spec.ts

**the repeat invitation is refused as the person already being a member of the organization** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the invitation to public sector staff is refused because only vendors may be invited** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.9 · v1

A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.

- test: tests/acceptance/proposals/R-2.9.spec.ts

**a vendor may read the history of a proposal they authored, in all three programs** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a vendor may read the history of a proposal belonging to an organization they own or administer, in all three programs** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**an opportunity that is not a draft is rejected when its title is missing** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its title is over 200 characters** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its teaser is over 500 characters** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its location is missing** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its description is missing** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its description is over 10,000 characters** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-6.10 · v1

The only notification a person can choose to stop is the announcement of newly published opportunities; every other message is sent regardless of that choice.

- given: a person who has turned notifications off
- when: an opportunity they are watching is changed, or a proposal of theirs is awarded, or an organization asks them to join its team
- then: they receive each of those messages, and only the announcement of a newly published opportunity is withheld
- test: tests/acceptance/notifications/R-6.10.spec.ts

**the only notification a person can choose to stop is the announcement of newly published opportunities; every other message is sent regardless of that choice** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-1.11 · v1

An opportunity that is not a draft must state whether remote work is acceptable, and must carry a remote-work description of up to 500 characters whenever remote work is acceptable.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they mark it as accepting remote work but leave the remote-work description empty
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.11.spec.ts

**an opportunity that is not a draft must state whether remote work is acceptable** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that accepts remote work must carry a remote-work description** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a remote-work description of more than 500 characters is rejected** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.12 · v1

A Code With Us opportunity must offer a reward of at least $1 and at most $70,000, and must name at least one skill.

- given: a member of public sector staff creating or editing a Code With Us opportunity that is not a draft
- when: they submit a reward outside $1 to $70,000, or submit no skills
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.12.spec.ts

**a Code With Us opportunity offering a reward below one dollar is rejected** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a Code With Us opportunity offering a reward above seventy thousand dollars is rejected** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a Code With Us opportunity naming no skill is rejected** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.12 · v1

A proposal saved as a draft is accepted however incomplete it is, but its attachments are checked even in draft.

- given: a vendor filling in a new proposal with most fields still blank
- when: they save it as a draft, attaching a file that does not exist
- then: no content validation error is raised for the blank fields, and the save is refused only because of the attachment
- test: tests/acceptance/proposals/R-2.12.spec.ts

**a proposal saved as a draft is accepted however incomplete it is** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-3.12 · v1

An organization's owner, its administrators and a service administrator may grant or withdraw administrator rights over the organization to an active member, but nobody may change their own rights and the owner's own membership cannot be changed this way.

- given: an organization with an owner and two other active members, one of whom already has administrator rights
- when: the owner grants administrator rights to the second member, that administrator tries to withdraw their own rights, and someone tries to change the owner's
- then: the second member gains administrator rights, and both the self-change and the change to the owner are refused
- test: tests/acceptance/organizations/R-3.12.spec.ts

**the owner grants administrator rights to the second member and that member gains them** — failed

```
Error: unbound: organization-edit.accept_org_admin_terms — no dialog is open on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000301/edit
```

**an organization administrator trying to withdraw their own rights is refused** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('checkbox').visible().first()[22m
[2m    - locator resolved to <input checked disabled type="checkbox" class="form-check-input" id="affiliations-admin-checkbox-0"/>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not enabled[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

```

**a change to the owner's own membership is refused** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('checkbox').visible().first()[22m
[2m    - locator resolved to <input checked disabled type="checkbox" class="form-check-input" id="affiliations-admin-checkbox-0"/>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not enabled[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not enabled[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

```

### R-4.12 · v1

Only an administrator may grant or withdraw administrator rights, only over a public sector employee's account, and a vendor can never be granted them; withdrawing the rights returns the person to an ordinary public sector employee account.

- given: an administrator, a public sector employee and a vendor
- when: the administrator opens each of the other two profiles and ticks the administrator box
- then: the public sector employee becomes an administrator immediately, and the request against the vendor is refused with a message saying vendors cannot be granted administrator permissions
- test: tests/acceptance/users/R-4.12.spec.ts

**a public sector employee becomes an administrator immediately when an administrator grants them administrator rights** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"Public Sector Employee"[39m
```

**a vendor can never be granted administrator rights, and the request against a vendor's account is refused** — failed

```
Error: unbound: user-profile.toggle_admin_permission — no box labelled "Admin" on http://localhost:3000/users/00000000-0000-4000-8000-000000000201
```

**an ordinary public sector employee is offered no control to grant administrator rights, only a statement of their permissions** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.13 · v1

A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.

- given: a vendor submitting a Code With Us proposal
- when: the proposal text is empty or longer than 10,000 characters, or the additional comments are longer than 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/proposals/R-2.13.spec.ts

**a Code With Us proposal that is not a draft is rejected when its proposal text is empty** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a Code With Us proposal that is not a draft is rejected when its proposal text is longer than 10,000 characters** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a Code With Us proposal that is not a draft is rejected when its additional comments are longer than 10,000 characters** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a Code With Us proposal that is not a draft is rejected when it carries no complete proponent** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-8.13 · v1

A profile picture or an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, and one taller than 500 pixels is shortened to 500 pixels, in both cases keeping its proportions.

- given: a signed-in person choosing a new profile picture
- when: they upload an image 2000 pixels wide and 300 pixels tall
- then: it is stored 500 pixels wide, still in its original proportions
- test: tests/acceptance/files/R-8.13.spec.ts

**an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, keeping its proportions** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m500[39m
Received: [31mNaN[39m
```

### R-1.14 · v1

An opportunity's key dates must run in order — the proposal deadline no earlier than today, then the assignment date, then the start date, then the completion date — and each date is recorded as 4:00 p.m. Pacific time on the day chosen.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a proposal deadline in the past, or any later date that falls before the date preceding it
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.14.spec.ts

**an opportunity that is not a draft is rejected when its proposal deadline is earlier than today** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its assignment date falls before its proposal deadline** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its start date falls before its assignment date** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity that is not a draft is rejected when its completion date falls before its start date** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**each of an opportunity's key dates is recorded as four o'clock in the afternoon on the day chosen** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**a Code With Us proponent named as an individual carries a legal name, an email address and a full postal address, each field validated in turn** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a Code With Us proponent named as an organization is checked only for existence and active status** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-4.14 · v1

An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.

- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- test: tests/acceptance/users/R-4.14.spec.ts

**an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator** — failed

```
Error: unbound: user-list.admin_check — the Admin? column shows an unlabelled tick with no accessible name or text, and the list's rows are drawn as one flattened block, so there is nothing on the page to read the mark from
```

**everyone registered is listed by status, then account kind, then name** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeLessThan[2m([22m[32mexpected[39m[2m)[22m

Expected: < [32m763[39m
Received:   [31m807[39m
```

**an administrator can narrow the list by typing part of a name** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Zinnia Quillfeather"[39m
Received string:        [31m"STATUS	ACCOUNT TYPE	NAME	ADMIN?[39m
[31mActive[39m
[31m	[39m
[31mPublic Sector Employee[39m
[31m	[39m
[31mCasey Placeholder[39m
[31m	[39m
[31m[39m
[31m[39m
[31mActive[39m
[31m	[39m
[31mPublic Sector Employee[39m
[31m	[39m
[31mDevon Placeholder[39m
[31m	[39m
[31m[39m
[31m[39m
… 133 more line(s)
```

### R-3.15 · v1

The organizations a vendor may act on behalf of are those they own and those they administer, excluding any that have been archived.

- given: a vendor who owns one organization, administers a second, is an ordinary member of a third, and owns a fourth that has been archived
- when: they ask for the organizations they can act for
- then: the first two are returned and the third and fourth are not
- test: tests/acceptance/organizations/R-3.15.spec.ts

**an organization a vendor is only an ordinary member of is not returned** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Northern Pines Digital Ltd."[39m
Received string:        [31m"[7mNorthern Pines Digital Ltd.[27m"[39m
```

### R-6.17 · v1

A deactivated account receives no notification of any kind, including notices about opportunities it was watching, while the watch itself is retained so that reactivating the account restores it.

- test: tests/acceptance/notifications/R-6.17.spec.ts

**a deactivated account receives no notification of any kind** — failed

```
Error: unbound: user-profile.deactivate_account — no control labelled "Deactivate Account" on http://localhost:3000/users/00000000-0000-4000-8000-000000000210
```

**the watch itself is retained so that reactivating the account restores it** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-8.17 · v1

An upload larger than the service's size limit is refused as the requester's error, with a message naming the limit, and the limit is stated in the interface before a person chooses a file rather than only after they submit it.

- test: tests/acceptance/files/R-8.17.spec.ts

**an upload larger than the service's size limit is refused as the requester's error, with a message naming the limit** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an attachment larger than the service's size limit is refused in the interface with a message naming the limit** — failed

```
Error: "" names the stated limit

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

### R-3.18 · v1

The Edit and Archive controls on an organization's management page are offered only to a person permitted to use them — the organization's owner or a service administrator; an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control, and the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator.

- test: tests/acceptance/organizations/R-3.18.spec.ts

**an organization administrator who is not the owner sees the profile read-only, with no Edit and no Archive control** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Edit"[39m
Received string:    [31m"Organization[39m
[31mTeam[39m
[31mSWU Qualification[39m
[31mTWU Qualification[39m
[31mChangelog[39m
[31mThe Digital Marketplace Terms & Conditions for E-Bidding have been updated. Please save what you are working on, review the latest version and agree to the updated terms.[39m
[31mNorthern Pines Digital Ltd.[39m
[31mSprint With Us Qualified[39m
[31mTeam With Us Qualified[39m
[31mProfile Picture (Optional)[39m
[31mLegal Name[39m
[31mWebsite Url (Optional)[39m
[31mLegal Address[39m
[31mStreet Address[39m
[31mStreet Address[39m
[31mCity[39m
[31mProvince/State[39m
… 10 more line(s)
```

### R-1.19 · v1

An opportunity moves through the states draft, under review, published, one or more program-specific evaluation stages, processing, and finally awarded or cancelled.

- given: any opportunity
- when: its state is read at any point in its life
- then: the state is one of the values recognised for its program, and no other value is accepted by the store
- test: tests/acceptance/opportunities/R-1.19.spec.ts

**an opportunity moves through the states draft, under review and published** — failed

```
Error: unbound: opportunity-cwu-edit.submit_for_review — no control labelled "Submit for Review" on http://localhost:3000/opportunities/code-with-us/703f786c-56ed-42d6-bd26-1aeadcdf9a24/edit?tab=opportunity
```

**an opportunity finally reaches cancelled** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-3.19 · v1

A change to an organization's contact phone number made while editing its profile is saved along with every other profile field, and clearing the field removes the stored number.

- test: tests/acceptance/organizations/R-3.19.spec.ts

**a change to the contact phone number is saved along with every other profile field** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: 'Organization', exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" href="/organizations/00000000-0000-4000-8000-000000000301/edit?tab=organization" class="a d-inline-flex align-items-center flex-nowrap mb-3 text-start text-wrap text-c-sidebar-menu-link-active-fg position-relative btn btn-md btn-c-sidebar-menu-link-active-bg">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade show">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade show">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 100ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
… 11 more line(s)
```

**clearing the contact phone number removes the stored number** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: 'Organization', exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" href="/organizations/00000000-0000-4000-8000-000000000301/edit?tab=organization" class="a d-inline-flex align-items-center flex-nowrap mb-3 text-start text-wrap text-c-sidebar-menu-link-active-fg position-relative btn btn-md btn-c-sidebar-menu-link-active-bg">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade show">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade show">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
… 7 more line(s)
```

### R-1.20 · v1

An opportunity may only change state along the permitted path for its program, and a request for any other change is refused.

- given: an opportunity in a given state
- when: someone requests a change to a state that is not reachable from it — for example from draft straight to an evaluation stage, or out of an awarded or cancelled opportunity
- then: the request is refused and the opportunity's state is unchanged
- test: tests/acceptance/opportunities/R-1.20.spec.ts

**a request to change an opportunity to a state that is not reachable from its own is refused and its state is unchanged** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an opportunity may only change state along the permitted path for its program** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-7.20 · v1

A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named.

- given: an administrator creating or changing a page
- when: they submit it with an empty title, or with a body longer than fifty thousand characters
- then: nothing is saved and the failing field is marked with the reason
- test: tests/acceptance/content/R-7.20.spec.ts

**a page whose title is empty is refused with the failing field named, and nothing is saved** — failed

```
Error: content-create.publish_page — "Publish" is disabled on http://localhost:3000/content/create; the page shows no message
```

**a page whose body is longer than fifty thousand characters is refused with the failing field named, and nothing is saved** — failed

```
Error: content-create.publish_page — "Publish" is disabled on http://localhost:3000/content/create; the page shows no message
```

**a page whose title is longer than a hundred characters is refused with the failing field named** — failed

```
Error: content-create.publish_page — "Publish" is disabled on http://localhost:3000/content/create; the page shows no message
```

**a page whose body is empty is refused with the failing field named** — failed

```
Error: content-create.publish_page — "Publish" is disabled on http://localhost:3000/content/create; the page shows no message
```

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Code With Us opportunity is readable by whoever may read the opportunity** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a file attached to a Sprint With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-swu-create.add_phase — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "maxBudget", "capabilities"
```

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-twu-create.add_resource — no field on http://localhost:3000/opportunities/team-with-us/create takes "order"
```

**a file attached to a proposal is readable by whoever may read the proposal** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.21 · v1

Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.

- given: a draft opportunity with a field still blank
- when: its author submits it for review
- then: the request is refused with a message saying the opportunity is incomplete and asking the author to complete and save the form
- test: tests/acceptance/opportunities/R-1.21.spec.ts

**submitting a draft opportunity for review is refused unless the opportunity is complete** — failed

```
Error: unbound: opportunity-cwu-edit.submit_for_review — no control labelled "Submit for Review" on http://localhost:3000/opportunities/code-with-us/d926188b-1892-496e-8b6f-efc47361fb9c/edit?tab=opportunity
```

**the person is told the opportunity is incomplete rather than which field is missing** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"complete"[39m
Received string:    [31m""[39m
```

### R-3.21 · v2

In the organization list, the owner's name, the team size and both qualification marks are shown only to a service administrator and, for a given organization, to the vendors who own or administer it; every other viewer sees that organization's legal name, logo, active state and service areas alone, and the owner and qualification columns are not offered at all to a visitor who is not signed in or to public sector staff.

- given: an organization owned by one vendor
- when: a different vendor, who is neither its owner nor one of its administrators, opens the organization list
- then: that organization's row shows its legal name only, with no owner, no team size and no qualification marks, while the same row shown to an administrator carries all of them
- test: tests/acceptance/organizations/R-3.21.spec.ts

**a vendor who is neither owner nor administrator of an organization sees its legal name without the owner, the team size or the qualification marks** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"—"[39m
```

**the owner and qualification columns are not offered at all to public sector staff** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Larkin Placeholder"[39m
```

### R-7.21 · v1

A page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused.

- given: an administrator creating a page
- when: they give it an address containing a capital letter, a space, an underscore, or a leading or trailing hyphen
- then: the page is not created and the address is marked as invalid
- test: tests/acceptance/content/R-7.21.spec.ts

**a page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused** — failed

```
Error: content-create.publish_page — "Publish" is disabled on http://localhost:3000/content/create; the page shows no message
```

### R-8.21 · v1

A profile picture or organization logo is accepted only if its content can be read as a JPEG or a PNG, and a file whose content is neither is refused whatever its name says; an image that reads successfully but cannot be resized is stored at its original size rather than refused.

- test: tests/acceptance/files/R-8.21.spec.ts

**a profile picture whose content is neither a JPEG nor a PNG is refused whatever its name says** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an organization logo whose content is neither a JPEG nor a PNG is refused whatever its name says** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.22 · v1

Only an administrator may publish an opportunity.

- given: an opportunity in draft or under review
- when: a member of public sector staff who is not an administrator asks to publish it
- then: the request is refused and the opportunity stays unpublished
- test: tests/acceptance/opportunities/R-1.22.spec.ts

**only an administrator may publish an opportunity** — failed

```
Error: opportunity-cwu-edit.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/330dcb03-d905-4ab9-8328-11c5c11fe08c/edit?tab=opportunity; the page shows no message
```

### R-7.22 · v1

No two pages may share an address, whether the clash arises on creating a page or on renaming one.

- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use
- test: tests/acceptance/content/R-7.22.spec.ts

**a page cannot be created at an address another page already holds, and the existing page is untouched** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a page cannot be renamed to an address another page already holds, and the existing page is untouched** — failed

```
Error: unbound: content-create.confirm_publish — no control labelled "Publish" or "Yes" on http://localhost:3000/content/create
```

### R-1.23 · v1

Publishing an opportunity records the moment of publication, which is thereafter shown as the opportunity's published date.

- given: an opportunity that has been published
- when: anyone views it
- then: the date shown as its publication date is the moment of the first publication, even if it was later republished
- test: tests/acceptance/opportunities/R-1.23.spec.ts

**publishing an opportunity records the moment of publication, which is thereafter shown as its published date** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.23 · v1

A vendor may withdraw a submitted proposal at any time, and may put a withdrawn proposal back in only while the opportunity is still accepting proposals.

- given: a submitted proposal on an opportunity whose deadline has passed
- when: the vendor withdraws it, and then tries to submit it again
- then: the withdrawal is accepted and the re-submission is refused, whereas before the deadline both are accepted
- test: tests/acceptance/proposals/R-2.23.spec.ts

**a vendor may withdraw a submitted proposal** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a vendor may put a withdrawn proposal back in while the opportunity is still accepting proposals** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
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

The question was which of the 40 failing criteria on this page were caused by this project's own old-target adapter. Ruling: approve, with one triage line per criterion: 29 adapter-wrong and 11 product-question. The adapter changed in bind-adapter-old-10, and the saved snapshots under tests/test-results show what the new form filler does. The largest group is 19 criteria that fail on the Code With Us publish or draft step. opportunityCwuCreate.publish now enters every field the test gives and walks to '3. Details'. The old form also requires 'Acceptance Criteria*' and 'Evaluation Criteria*', which the surface contract's input never carries. The snapshots show both blank, so Publish stays disabled and press() throws before the test reaches what it is about. In the rejection tests (R-1.10, R-1.11, R-1.12, R-1.14) that disabled Publish cannot be traced to the field under test, and fieldError() is never read. Other binding faults are visible directly. organizationEdit.saveChanges leaves the 'Save Changes?' dialog open (R-3.19, R-8.13). acceptOrgAdminTerms expects a dialog nothing has opened, and toggleMemberAdminStatus drops the member nested under 'member' and clicks the owner's disabled box (R-3.12). addTeamMembers drops the email nested under 'user' (R-6.10). organizationTab drops the top bar that holds 'Edit Organization' (R-3.18). ownerName returns the placeholder '—' (R-3.21). toggleAdminPermission throws unbound where a vendor profile's missing Admin box is the refusal (R-4.12). publishPage's click opens no confirmation on a valid page (R-7.22). addPhase and addResource leave keys unmapped (R-8.20). Eleven go to the product owner because nothing points at the binding. In R-3.3, staff are shown the full record read-only. In R-1.3, staff see other staff members' drafts. In R-3.15, the member's page lists the organization under Affiliated Organizations. In R-7.20 and R-7.21, every field is entered and Publish is disabled with no field marked. In R-1.21, staff are offered no Submit for Review. In R-8.17, the service answered the oversized upload with no refusal status. In R-8.21, the page shows no error for a non-image file. In R-3.8, the invitation dialog was filled and confirmed and no message shows. In R-3.7, the owner's account is inactive. In R-4.14, the admin column is a genuine unbound, and the ordering failure comes from an inactive account. The product owner should see two data caveats. First, staff.one's snapshots in R-1.3, R-1.19, R-1.22, R-3.3, R-3.21 and R-8.17 show the admin-only Users and Content links, while R-4.12's tests toggle that account's Admin box during the same run, so staff results may reflect a temporarily elevated account. Second, accounts left inactive by earlier runs (vendor.one, vendor.terms.reset) account for R-3.7, the R-4.14 ordering and the first half of R-6.17. What would change this ruling: a fresh run, with these adapter defects fixed, that still fails a criterion at the same assertion. That criterion would come back as a product question.

**Conditions:**
- adapter-wrong R-2.1: publishOpportunity's opportunityCwuCreate.publish(input) fills every field the test gives, but the old form's '3. Details' step also requires 'Acceptance Criteria*' and 'Evaluation Criteria*', which the contract's input never carries; the snapshot shows both blank, so Publish stays disabled and press() throws before the proposal is reached. Enter valid values into required fields the input does not name before pressing Publish.
- adapter-wrong R-2.2: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' fields on '3. Details' blank because the contract's input never names them, so Publish stays disabled and press() throws before the second proposal is attempted. Fill required fields the input does not name before pressing Publish.
- product-question R-1.3
- adapter-wrong R-2.3: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (the contract's input never names them), so Publish stays disabled and press() throws before any proposal is submitted. Fill required fields the input does not name before pressing Publish.
- product-question R-3.3
- adapter-wrong R-1.4: opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank because the contract's input never names them, so Publish stays disabled and press() throws before any edit is made. Fill required fields the input does not name before pressing Publish.
- adapter-wrong R-2.4: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (not in the contract's input), so Publish stays disabled and press() throws before any proposal exists to delete. Fill required fields the input does not name before pressing Publish.
- adapter-wrong R-2.7: opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank because the contract's input never names them, so Publish stays disabled and press() throws before any proposal is created. Fill required fields the input does not name before pressing Publish.
- product-question R-3.7
- product-question R-3.8
- adapter-wrong R-2.9: opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank because the contract's input never names them, so Publish stays disabled and press() throws before any proposal history exists. Fill required fields the input does not name before pressing Publish.
- adapter-wrong R-1.10: in all six tests opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (the contract's input never names them), so Publish is disabled whatever the field under test holds, and press() throws instead of letting fieldError() be read. Fill required fields the input does not name, and when Publish is still disabled after that, return so the test can read the refusal.
- adapter-wrong R-6.10: organizationEdit.addTeamMembers({user}) reads only top-level 'emails' or 'email' keys, so the address nested under 'user' is dropped, nothing is typed into 'Email Addresses', the dialog is never confirmed and no invitation is sent. Read the email from a nested user record.
- adapter-wrong R-1.11: in all three tests opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank, so Publish is disabled regardless of the remote-work fields under test, and press() throws instead of letting fieldError() be read. Fill required fields the input does not name, and return on a still-disabled Publish so the refusal can be read.
- adapter-wrong R-1.12: in all three tests opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank, so Publish is disabled regardless of the reward or skills under test, and press() throws instead of letting fieldError() be read. Fill required fields the input does not name, and return on a still-disabled Publish so the refusal can be read.
- adapter-wrong R-2.12: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (not in the contract's input), so Publish stays disabled and press() throws before the draft proposal is saved. Fill required fields the input does not name before pressing Publish.
- adapter-wrong R-3.12: acceptOrgAdminTerms() throws 'no dialog is open' because the test calls it before anything has raised the terms dialog; open it from the member's Admin box, or return when none is open. toggleMemberAdminStatus({member}) gets '' from asText for the nested seed user, so it falls back to the first checkbox on the Team tab, the owner's checked and disabled box, and clicks it until the 15 s timeout. Find the row by the member's name, and treat a disabled box as the refusal rather than clicking it.
- adapter-wrong R-4.12: userProfile.toggleAdminPermission() throws unbound when a vendor's profile offers no Admin box (vendor.one's page shows Status, Account Type and no Permission(s)), although that absence is the refusal the test goes on to read; return quietly as opportunityCreate does for a withheld control. In the first test, after the tick and a reopen, the Admin box reads unchecked; confirm that the click was saved (wait for any confirmation or save) before the page is reopened.
- adapter-wrong R-2.13: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (not in the contract's input), so Publish stays disabled and press() throws before any proposal is submitted. Fill required fields the input does not name before pressing Publish.
- adapter-wrong R-8.13: after editOrganization and chooseImage, organizationEdit.saveChanges() presses 'Save Changes' but never confirms the 'Save Changes?' dialog it raises (seen open in R-3.19), so the snapshot is still in edit mode with no stored logo and storedImageWidth() reads nothing (NaN). Confirm the dialog and wait for the save before reading the stored image.
- adapter-wrong R-1.14: in all five tests opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank, so Publish is disabled regardless of the dates under test, and press() throws instead of letting fieldError() or the stored dates be read. Fill required fields the input does not name, and return on a still-disabled Publish so the refusal can be read.
- adapter-wrong R-2.14: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (not in the contract's input), so Publish stays disabled and press() throws before any proponent is chosen. Fill required fields the input does not name before pressing Publish.
- product-question R-4.14
- product-question R-3.15
- adapter-wrong R-6.17: in 'the watch itself is retained', opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank, so Publish stays disabled and press() throws. Fill required fields the input does not name before pressing Publish. The first test's missing 'Deactivate Account' is not a binding fault: that account (vendor.terms.reset) already shows Status Inactive with only 'Reactivate Account'.
- product-question R-8.17
- adapter-wrong R-3.18: organizationEdit.organizationTab() returns tabContent(['Organization']), which drops the top bar, so for the owner the reading lacks the 'Edit Organization' control the snapshot shows there and 'Edit' is not found. Include the screen's top-bar controls in this reading, as profileTab now does.
- adapter-wrong R-1.19: opportunityCwuCreate.saveDraft and publish(input) leave the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank because the contract's input never names them. The draft is therefore incomplete, its Actions menu offers Publish disabled and no 'Submit for Review', and the create page's Publish throws disabled. Fill required fields the input does not name before saving or publishing.
- adapter-wrong R-3.19: organizationEdit.saveChanges(input) fills the phone number and presses 'Save Changes', but never confirms the 'Save Changes?' dialog that opens; the dialog is still open in the snapshot and intercepts the next click on the Organization tab for 15 s. Confirm the dialog with its 'Save Changes' control and wait for the save to finish.
- adapter-wrong R-1.20: in both tests opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (not in the contract's input), so Publish stays disabled and press() throws before any state change is requested. Fill required fields the input does not name before pressing Publish.
- product-question R-7.20
- adapter-wrong R-8.20: the Code With Us and proposal tests fail because opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' blank, so Publish stays disabled. opportunitySwuCreate.addPhase maps none of 'startDate', 'completionDate', 'maxBudget' or 'capabilities' to the phase step's fields, and opportunityTwuCreate.addResource has no mapping for 'order'; map those keys to the phase and resource fields on those steps.
- product-question R-1.21
- adapter-wrong R-3.21: for the vendor who neither owns nor administers it, organizationList.ownerName() returns '—', the placeholder the Owner cell shows when the owner is withheld; read that placeholder as ''. The public sector staff test is not a binding fault: that list shows owner names such as 'Larkin Placeholder' in links.
- product-question R-7.21
- product-question R-8.21
- adapter-wrong R-1.22: opportunityCwuCreate.saveDraft(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' blank, so the draft is incomplete and its Actions menu shows Publish disabled for that reason. opportunityCwuEdit.publish() then throws on the disabled entry instead of letting the unchanged status be read. Fill required fields the input does not name, and treat a disabled Publish entry as the refusal and return.
- adapter-wrong R-7.22: in both tests contentCreate.publishPage() clicked the enabled top-bar Publish, but no confirmation dialog appeared and the page stayed on /content/create with every field filled, even for the unique slug 'derived-rename-clash-…'. confirmPublish therefore finds no dialog, and duplicateSlugError() reads before anything was submitted. Make sure the click reaches the Publish anchor itself, and wait for the confirmation dialog before returning.
- adapter-wrong R-1.23: opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank because the contract's input never names them, so Publish stays disabled and press() throws before anything is published. Fill required fields the input does not name before pressing Publish.
- adapter-wrong R-2.23: publishOpportunity's opportunityCwuCreate.publish(input) leaves the required 'Acceptance Criteria*' and 'Evaluation Criteria*' on '3. Details' blank (not in the contract's input), so Publish stays disabled and press() throws before any proposal is withdrawn. Fill required fields the input does not name before pressing Publish.
