---
gate: G3
question: "28 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.24, R-8.25, R-6.26, R-4.27, R-1.28, R-3.28, R-8.28, R-3.30, R-1.31, R-4.31, R-8.31, R-1.32, R-3.32, R-4.32, R-1.34, R-2.34, R-1.35, R-2.35, R-1.36, R-2.36, R-1.37, R-2.37, R-1.38, R-2.38, R-1.39, R-1.48, R-1.53, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-14T21:15:50.806Z
---

# 28 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.24, R-8.25, R-6.26, R-4.27, R-1.28, R-3.28, R-8.28, R-3.30, R-1.31, R-4.31, R-8.31, R-1.32, R-3.32, R-4.32, R-1.34, R-2.34, R-1.35, R-2.35, R-1.36, R-2.36, R-1.37, R-2.37, R-1.38, R-2.38, R-1.39, R-1.48, R-1.53, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

28 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-2.24 · v1

A vendor sees only the proposals they authored, plus the proposals of organizations they own or administer, and never another vendor's proposal.

- given: two vendors who each hold a proposal against the same opportunity
- when: each lists their proposals and each opens the other's proposal directly
- then: each list shows only that vendor's own proposal, an organization owner additionally sees their organization's proposals under a separate heading, and opening the other vendor's proposal is refused
- test: tests/acceptance/proposals/R-2.24.spec.ts

**a vendor sees only the proposals they authored** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a vendor additionally sees the proposals of organizations they own or administer, under a separate heading** — failed

```
Error: unbound: opportunity-twu-create.add_resource — no field on http://localhost:3000/opportunities/team-with-us/create takes "order"
```

**a vendor never sees another vendor's proposal** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-8.25 · v1

A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.

- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- test: tests/acceptance/files/R-8.25.spec.ts

**an attachment on a Code With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: unbound: file-attachment-control.add_attachment — could not reach a step showing "Add Attachment" on http://localhost:3000/opportunities/code-with-us/3ccb82f6-91e2-4d09-95cb-a417f21bb0b2/edit?tab=opportunity
```

**an attachment on a Sprint With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: unbound: opportunity-swu-create.add_phase — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "maxBudget", "capabilities"
```

**an attachment on an opportunity that is not yet publicly visible is readable by the opportunity's creator** — failed

```
Error: unbound: file-attachment-control.add_attachment — could not reach a step showing "Add Attachment" on http://localhost:3000/opportunities/code-with-us/30c3533d-5672-4d68-aecf-7d5570a2e254/edit?tab=opportunity
```

**an attachment on a proposal is readable by whoever may read that proposal** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-6.26 · v2

When the service notifies an account that holds no email address it composes the message all the same and hands it over with an empty list of recipients; any resulting failure is written to the operational log only, nothing in the service records that the person was not reached, and a broadcast to many vendors always continues to the next recipient because no failure in composing or sending can interrupt it.

- given: a vendor whose account holds no email address, because the identity provider supplied none
- when: an administrator announces changed terms
- then: the service composes a message for that account addressed to nobody and hands it on to be sent, and what follows depends on the sending machinery rather than on anything the service decides
- test: tests/acceptance/notifications/R-6.26.spec.ts

**when the service notifies an account that holds no email address, a broadcast to many vendors always continues to the next recipient because no failure in composing or sending can interrupt it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-4.27 · v2

A profile requires a name of between one and one hundred characters and an email address in a valid format, which is stored in lower case; the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.

- given: a person editing their own profile
- when: they clear the name, or enter an email address that is not in a valid format
- then: the profile is not saved and the offending field is reported as invalid, while the same profile saves with the job title and picture left empty
- test: tests/acceptance/users/R-4.27.spec.ts

**a profile requires a name, so clearing the name is refused and the profile is not saved** — failed

```
Error: user-profile-self.save_changes — "Save Changes" is disabled on http://localhost:3000/users/me; the page shows no message
```

**a profile requires a name of no more than one hundred characters** — failed

```
Error: user-profile-self.save_changes — "Save Changes" is disabled on http://localhost:3000/users/me; the page shows no message
```

**a profile requires an email address in a valid format** — failed

```
Error: user-profile-self.save_changes — "Save Changes" is disabled on http://localhost:3000/users/me; the page shows no message
```

**the job title is limited to one hundred characters** — failed

```
Error: user-profile-self.save_changes — "Save Changes" is disabled on http://localhost:3000/users/me; the page shows no message
```

### R-1.28 · v1

Only an administrator may cancel an opportunity, and only once it has been published.

- given: an opportunity that is published or at any evaluation stage or in processing
- when: an administrator cancels it, giving an optional note of up to 1,000 characters
- then: the opportunity moves to cancelled and stops accepting proposals
- test: tests/acceptance/opportunities/R-1.28.spec.ts

**an administrator may cancel a published opportunity** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a member of public sector staff who is not an administrator may not cancel an opportunity** — failed

```
Error: opportunity-cwu-edit.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/694d6182-0705-4bf5-94ec-820ca57e8180/edit?tab=opportunity; the page shows no message
```

**an opportunity may only be cancelled once it has been published** — failed

```
Error: unbound: opportunity-cwu-edit.cancel_opportunity — no control labelled "Cancel" on http://localhost:3000/opportunities/code-with-us/d9cc1a74-c953-46dc-a8c9-bcf2cddb3123/edit?tab=opportunity
```

### R-3.28 · v1

Only an administrator may set which service areas an organization is approved for, and saving a selection replaces the organization's previous approvals entirely.

- given: an organization approved for two service areas
- when: an administrator edits the service areas, leaves one of the two ticked, ticks a third, and saves
- then: the organization is approved for exactly the two areas that were ticked and no longer for the one that was cleared, and the same page offers no editing control to the organization's own owner
- test: tests/acceptance/organizations/R-3.28.spec.ts

**when an administrator saves a selection of service areas the organization is approved for exactly the areas that were ticked and no longer for the one that was cleared** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('link', { name: 'TWU Qualification', exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" href="/organizations/00000000-0000-4000-8000-000000000301/edit?tab=twuQualification" class="a d-inline-flex align-items-center flex-nowrap mb-3 text-start text-wrap text-c-sidebar-menu-link-active-fg position-relative btn btn-md btn-c-sidebar-menu-link-active-bg">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
… 7 more line(s)
```

### R-8.28 · v1

Profile pictures and organization logos are marked readable by anyone.

- given: an organization with a logo
- when: a visitor who is not signed in opens the organization list
- then: the logo is shown to them
- test: tests/acceptance/files/R-8.28.spec.ts

**organization logos are marked readable by anyone** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.30 · v1

Inviting an email address that belongs to nobody registered with the service creates no membership; the address is instead sent an invitation to register, and the inviter is told the person was not registered but has been notified.

- given: an organization whose owner is inviting team members
- when: they invite an email address that no registered account uses
- then: no pending membership appears on the team list, the address receives an invitation to register with the service, and the owner is shown a warning naming that address
- test: tests/acceptance/organizations/R-3.30.spec.ts

**inviting an email address that no registered account uses creates no pending membership, sends that address an invitation to register, and warns the inviter** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"nobody.registered.here@example.test"[39m
Received string:    [31m""[39m
```

### R-1.31 · v1

Public sector staff cannot see the proposals submitted against an opportunity until it has left the published state.

- given: a published opportunity that has received proposals
- when: its author or an administrator asks to see the proposals
- then: the request is refused until the opportunity has closed and moved to an evaluation stage
- test: tests/acceptance/opportunities/R-1.31.spec.ts

**public sector staff cannot see the proposals submitted against an opportunity while it is published** — failed

```
Error: proposal-cwu-create.accept_program_terms — "Submit" is disabled on http://localhost:3000/opportunities/code-with-us/00000000-0000-4000-8000-000000000601/proposals/create; the page shows no message
```

### R-4.31 · v2

A request to deactivate an account that is already inactive is refused with a message saying the account is already inactive; an administrator viewing their own profile is offered no deactivation control, but that restriction rests on the interface alone, since the service accepts a deactivation request made against the requester's own account.

- given: an already deactivated account, and an administrator viewing their own profile
- when: a second deactivation is requested for the first, and the administrator looks for a deactivation control on their own profile
- then: the second request is refused with a message saying the account is already inactive, and the administrator's own profile offers no such control
- test: tests/acceptance/users/R-4.31.spec.ts

**an administrator viewing their own profile is offered no deactivation control** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Deactivate"[39m
Received string:    [31m"Digital Marketplace[39m
[31madmin.one@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31m|[39m
[31mUsers[39m
[31m|[39m
[31mContent[39m
[31mAldous Quillfeather[39m
[31mStatus[39m
[31mInactive[39m
[31mAccount Type[39m
[31mVendor[39m
[31mProfile Picture (Optional)[39m
… 6 more line(s)
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**deleting the opportunity an attachment hangs on withdraws the read path the file held through that opportunity** — failed

```
Error: unbound: file-attachment-control.add_attachment — could not reach a step showing "Add Attachment" on http://localhost:3000/opportunities/code-with-us/1f12924b-7c49-4ce3-bf4f-5460f7f7d3b9/edit?tab=opportunity
```

**removing an attachment from a proposal withdraws the read path the file held through that proposal** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.32 · v1

An addendum of 1 to 5,000 characters may be added to any opportunity that is no longer a draft, by an administrator or by the staff member who created it, and cannot be removed afterwards.

- given: a published opportunity
- when: its author adds an addendum
- then: the addendum is appended to the opportunity with its author and date, an entry is added to the opportunity's history, and there is no action that removes it
- test: tests/acceptance/opportunities/R-1.32.spec.ts

**an addendum may be added to an opportunity that is no longer a draft by the staff member who created it** — failed

```
Error: opportunity-cwu-edit.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/d9770c69-06a9-49c9-b041-18ccd4b41d53/edit?tab=opportunity; the page shows no message
```

**an addendum may be added to an opportunity that is no longer a draft by an administrator** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**an addendum cannot be added to an opportunity that is still a draft** — failed

```
Error: unbound: opportunity-cwu-edit.add_addendum — no tab labelled "Addenda" on http://localhost:3000/opportunities/code-with-us/6b153f12-dae1-45ee-bc71-e1feb076fbf1/edit
```

**an addendum of more than five thousand characters is refused** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-3.32 · v1

When an invited person declines an invitation rather than accepting it, the organization's owner is told the request was rejected.

- given: a person with a pending invitation to an organization
- when: they decline it
- then: the pending membership is gone from the organization's team list and the owner receives a message saying the person rejected the team request
- test: tests/acceptance/organizations/R-3.32.spec.ts

**when an invited person declines the invitation the pending membership is gone from the team list and the owner is told the request was rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"vendor.invited@example.test"[39m
Received string:    [31m"TEAM MEMBER	CAPABILITIES	ADMIN··[39m
[31mBlake Placeholder[39m
[31mOwner··[39m
[31m3·····[39m
[31mCharlie Placeholder··[39m
[31m3·····[39m
[31mDana Placeholder··[39m
[31m3·····[39m
[31mIndigo Placeholder[39m
[31mPending··[39m
[31m0"[39m
```

### R-4.32 · v1

An administrator may export a contact list of active accounts as a spreadsheet file, choosing whether to include public sector employees, vendors or both, and which of first name, last name, email address and organization name to include; at least one kind and one field must be chosen.

- given: one active vendor belonging to an active organization, one deactivated vendor and one administrator
- when: an administrator exports the contact list with both kinds and all four fields chosen
- then: the file contains the active vendor and the administrator but not the deactivated vendor, the administrator is labelled as such, and the vendor's row carries their organization's legal name
- test: tests/acceptance/users/R-4.32.spec.ts

**at least one kind and one field must be chosen before an administrator may export the contact list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.34 · v1

Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author.

- given: an opportunity ready to be published and people who have turned notifications on
- when: an administrator publishes it
- then: each of those people receives a notice that a new opportunity has been posted, and the opportunity's author receives a confirmation
- test: tests/acceptance/opportunities/R-1.34.spec.ts

**publishing an opportunity confirms the publication to the opportunity's author** — failed

```
Error: opportunity-cwu-edit.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/f5d77489-57ef-4dc1-8ebc-fe5a412e5afe/edit?tab=opportunity; the page shows no message
```

### R-2.34 · v1

A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.

- given: a proposal at any stage after the opportunity has closed
- when: an administrator disqualifies it without giving a reason
- then: the request is refused, and with a reason given the proposal becomes disqualified, the reason is kept in its history, and the opportunity is re-checked for whether every remaining proposal is now evaluated
- test: tests/acceptance/proposals/R-2.34.spec.ts

**disqualifying a proposal requires a written reason of 1 to 5,000 characters** — failed

```
Error: proposal-twu-view.disqualify_proposal — "Disqualify" is disabled on http://localhost:3000/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/proposals/00000000-0000-4000-8000-000000000843; the page shows no message
```

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

**changing an opportunity that is neither a draft nor cancelled notifies its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**adding an addendum to an opportunity that is neither a draft nor cancelled notifies its author** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.35 · v1

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.

- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note
- test: tests/acceptance/proposals/R-2.35.spec.ts

**every change of state against a proposal is recorded in its history** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.36 · v1

Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.

- given: a published opportunity with watchers and submitted proposals
- when: an administrator cancels it
- then: its watchers and proponents are told it has been cancelled, and its author is told separately that the cancellation was actioned
- test: tests/acceptance/opportunities/R-1.36.spec.ts

**cancelling an opportunity notifies its author** — failed

```
Error: opportunity-cwu-edit.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/d7caab1a-f1b6-42c4-84d7-de4ebdc9e6d4/edit?tab=opportunity; the page shows no message
```

### R-2.36 · v1

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.

- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator
- test: tests/acceptance/proposals/R-2.36.spec.ts

**submitting a proposal sends a confirmation to the submitting vendor** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**withdrawing a proposal sends a notice to the vendor and to every administrator** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
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

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**anyone entitled to read a proposal can take away a printable copy of it** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**the vendor's own copy of a Sprint With Us proposal names the organization** — failed

```
Error: unbound: opportunity-swu-create.add_phase — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "maxBudget", "capabilities"
```

### R-1.38 · v1

The opportunity list groups opportunities into unpublished, open and closed, showing open opportunities with the nearest proposal deadline first, closed ones most recently closed first, and unpublished ones most recently changed first.

- given: a set of opportunities in a mix of states
- when: someone opens the opportunity list
- then: each opportunity appears in exactly one of the three groups, ordered as described
- test: tests/acceptance/opportunities/R-1.38.spec.ts

**the opportunity list shows open opportunities with the nearest proposal deadline first** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-2.38 · v1

Only public sector staff and administrators may take away every proposal of an opportunity in one document, and they choose whether that document names the proponents.

- given: a closed opportunity carrying several submitted proposals
- when: a vendor opens the address that exports all of them, and then the opportunity's author opens it
- then: the vendor is refused, the author receives every proposal they are entitled to see in one document, and the author can ask for the same document with the proponents named anonymously
- test: tests/acceptance/proposals/R-2.38.spec.ts

**a vendor may not take away every proposal of an opportunity in one document** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.39 · v1

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- test: tests/acceptance/opportunities/R-1.39.spec.ts

**the opportunity list can be narrowed by program** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**the opportunity list can be narrowed by state** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**the opportunity list can be narrowed to remote-friendly opportunities only** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**the opportunity list can be narrowed by free text matched against title and location** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.48 · v1

Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.

- test: tests/acceptance/opportunities/R-1.48.spec.ts

**creating an opportunity with its state set to published is refused unless the requester is an administrator** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**a public sector employee who is not an administrator may create an opportunity as a draft, in all three programs** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.48 Sprint With Us draft created by an ordinary member of staff"[39m
Received string:    [31m"R-1.48 Code With Us draft created by an ordinary member of staff[39m
[31mCode With Us[39m
[31mDraft[39m
[31mClosed Sep 28, 2026 at 1:49 PM PDT[39m
[31m$0[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mR-1.38 unpublished opportunity changed later[39m
[31mCode With Us[39m
[31mDraft[39m
[31mClosed Sep 28, 2026 at 1:48 PM PDT[39m
[31m$0[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mR-1.38 unpublished opportunity changed earlier[39m
[31mCode With Us[39m
[31mDraft[39m
… 695 more line(s)
```

**a public sector employee who is not an administrator may create an opportunity under review** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.48 Code With Us opportunity created under review"[39m
Received string:    [31m"R-1.48 Code With Us draft created by an ordinary member of staff[39m
[31mCode With Us[39m
[31mDraft[39m
[31mClosed Sep 28, 2026 at 1:49 PM PDT[39m
[31m$0[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mR-1.38 unpublished opportunity changed later[39m
[31mCode With Us[39m
[31mDraft[39m
[31mClosed Sep 28, 2026 at 1:48 PM PDT[39m
[31m$0[39m
[31mVictoria[39m
[31mRemote OK[39m
[31mR-1.38 unpublished opportunity changed earlier[39m
[31mCode With Us[39m
[31mDraft[39m
… 695 more line(s)
```

### R-1.53 · v2

An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.

- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- test: tests/acceptance/opportunities/R-1.53.spec.ts

**an administrator may delete a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/sprint-with-us/create
```

**an administrator may delete an opportunity that is under review** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**the public sector employee who created an opportunity may not delete it once it is under review** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**any other request to delete an opportunity is refused and the opportunity remains** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

### R-1.56 · v1

Once an opportunity is published, only an administrator may change its details; a request from the public sector employee who created it is refused, and the same rule governs Code With Us, Sprint With Us and Team With Us alike.

- test: tests/acceptance/opportunities/R-1.56.spec.ts

**once an opportunity is published, an administrator may change its details** — failed

```
Error: opportunity-cwu-create.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/create; the page shows no message
```

**once an opportunity is published, a request to change its details from the public sector employee who created it is refused** — failed

```
Error: opportunity-cwu-edit.publish — "Publish" is disabled on http://localhost:3000/opportunities/code-with-us/602a192f-bf42-478c-aebc-5b77a74767c9/edit?tab=opportunity; the page shows no message
```

**the same rule governs a published Sprint With Us opportunity** — failed

```
Error: unbound: opportunity-swu-create.add_phase — no field on http://localhost:3000/opportunities/sprint-with-us/create takes "startDate", "completionDate", "maxBudget"
```

**the same rule governs a published Team With Us opportunity** — failed

```
Error: unbound: opportunity-twu-create.add_resource_question — no field on http://localhost:3000/opportunities/team-with-us/create takes "order"
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

