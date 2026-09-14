---
gate: G3
question: "24 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.28, R-4.28, R-6.28, R-8.28, R-8.29, R-1.30, R-1.31, R-4.31, R-8.31, R-1.32, R-4.32, R-2.34, R-3.34, R-4.34, R-2.35, R-2.36, R-1.37, R-2.37, R-1.38, R-2.38, R-1.39, R-1.48, R-1.53, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-14T19:24:20.248Z
---

# 24 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.28, R-4.28, R-6.28, R-8.28, R-8.29, R-1.30, R-1.31, R-4.31, R-8.31, R-1.32, R-4.32, R-2.34, R-3.34, R-4.34, R-2.35, R-2.36, R-1.37, R-2.37, R-1.38, R-2.38, R-1.39, R-1.48, R-1.53, R-1.56 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

24 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

### R-1.28 · v1

Only an administrator may cancel an opportunity, and only once it has been published.

- given: an opportunity that is published or at any evaluation stage or in processing
- when: an administrator cancels it, giving an optional note of up to 1,000 characters
- then: the opportunity moves to cancelled and stops accepting proposals
- test: tests/acceptance/opportunities/R-1.28.spec.ts

**an administrator may cancel a published opportunity** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a member of public sector staff who is not an administrator may not cancel an opportunity** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an opportunity may only be cancelled once it has been published** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

### R-4.28 · v1

The job title is asked for and shown only on a public sector employee's profile; a vendor is never asked for one.

- given: a vendor and a public sector employee each editing their own profile
- when: each opens the profile form
- then: the public sector employee is offered a job title field and the vendor is not
- test: tests/acceptance/users/R-4.28.spec.ts

**the job title is asked for and shown on a public sector employee's profile** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Procurement Lead"[39m
Received string:    [31m"Program Analyst"[39m
```

### R-6.28 · v1

The service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach.

- test: tests/acceptance/notifications/R-6.28.spec.ts

**the service skips a recipient that holds no email address rather than composing a message addressed to nobody, and a broadcast to many people always continues past a recipient it cannot address or cannot reach** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-8.28 · v1

Profile pictures and organization logos are marked readable by anyone.

- given: an organization with a logo
- when: a visitor who is not signed in opens the organization list
- then: the logo is shown to them
- test: tests/acceptance/files/R-8.28.spec.ts

**profile pictures are marked readable by anyone** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

**organization logos are marked readable by anyone** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.29 · v1

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- test: tests/acceptance/files/R-8.29.spec.ts

**an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.30 · v1

An opportunity's administrator and its author can see its full change history, how many times it has been viewed, how many people are watching it and how many proposals have been submitted; nobody else can.

- given: a published opportunity that has been viewed, watched and proposed against
- when: its author or an administrator opens it
- then: they see its history of state changes and events and its counts of views, watchers and submitted proposals
- test: tests/acceptance/opportunities/R-1.30.spec.ts

**an opportunity's administrator and its author can see its full change history and its counts of views, watchers and proposals** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**nobody else can see an opportunity's change history or its counts of views, watchers and proposals** — failed

```
Error: unbound: opportunity-cwu-edit.reporting_views — no tab labelled "Opportunity" on http://localhost:3000/opportunities/code-with-us/00000000-0000-4000-8000-000000000601/edit
```

### R-1.31 · v1

Public sector staff cannot see the proposals submitted against an opportunity until it has left the published state.

- given: a published opportunity that has received proposals
- when: its author or an administrator asks to see the proposals
- then: the request is refused until the opportunity has closed and moved to an evaluation stage
- test: tests/acceptance/opportunities/R-1.31.spec.ts

**public sector staff cannot see the proposals submitted against an opportunity while it is published** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
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
Received string:    [31m""[39m
```

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**deleting the opportunity an attachment hangs on withdraws the read path the file held through that opportunity** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**removing an attachment from a proposal withdraws the read path the file held through that proposal** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.32 · v1

An addendum of 1 to 5,000 characters may be added to any opportunity that is no longer a draft, by an administrator or by the staff member who created it, and cannot be removed afterwards.

- given: a published opportunity
- when: its author adds an addendum
- then: the addendum is appended to the opportunity with its author and date, an entry is added to the opportunity's history, and there is no action that removes it
- test: tests/acceptance/opportunities/R-1.32.spec.ts

**an addendum may be added to an opportunity that is no longer a draft by the staff member who created it** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an addendum may be added to an opportunity that is no longer a draft by an administrator** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an addendum cannot be added to an opportunity that is still a draft** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an addendum of more than five thousand characters is refused** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-4.32 · v1

An administrator may export a contact list of active accounts as a spreadsheet file, choosing whether to include public sector employees, vendors or both, and which of first name, last name, email address and organization name to include; at least one kind and one field must be chosen.

- given: one active vendor belonging to an active organization, one deactivated vendor and one administrator
- when: an administrator exports the contact list with both kinds and all four fields chosen
- then: the file contains the active vendor and the administrator but not the deactivated vendor, the administrator is labelled as such, and the vendor's row carries their organization's legal name
- test: tests/acceptance/users/R-4.32.spec.ts

**at least one kind and one field must be chosen before an administrator may export the contact list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"enabled"[39m
```

### R-2.34 · v1

A proposal may be disqualified at any stage of evaluation, and doing so requires a written reason of 1 to 5,000 characters.

- given: a proposal at any stage after the opportunity has closed
- when: an administrator disqualifies it without giving a reason
- then: the request is refused, and with a reason given the proposal becomes disqualified, the reason is kept in its history, and the opportunity is re-checked for whether every remaining proposal is now evaluated
- test: tests/acceptance/proposals/R-2.34.spec.ts

**disqualifying a proposal requires a written reason of 1 to 5,000 characters** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a proposal may be disqualified at any stage of evaluation, and the reason is kept in its history** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.34 · v1

An organization's summary of team capabilities counts only members who have accepted their invitation.

- given: an organization whose only member holding a given capability has been invited but has not yet accepted
- when: the owner opens the organization's team page
- then: that capability is shown as one the team does not have, and it becomes shown as held once the invitation is accepted
- test: tests/acceptance/organizations/R-3.34.spec.ts

**a capability held only by an invited person who has not yet accepted is shown as one the team does not have, and becomes shown as held once the invitation is accepted** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-4.34 · v1

A profile shows different sections depending on whose it is: a vendor's own profile offers profile, capabilities, organizations, notifications and legal sections, a public sector employee's offers profile and notifications, and an administrator looking at somebody else's account sees the profile section alone.

- given: a vendor, a public sector employee and an administrator
- when: each opens their own profile, and the administrator then opens the vendor's
- then: each own profile shows the sections belonging to that kind of account, and the vendor's profile seen by the administrator shows only the profile section
- test: tests/acceptance/users/R-4.34.spec.ts

**a vendor's own profile offers profile, capabilities, organizations, notifications and legal sections** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a public sector employee's own profile offers profile and notifications** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Profile[39m
[31mNotifications[39m
[31mNotifications·[39m
[31mEmail notifications will be sent to staff.one@example.test for the options selected below. If this email address is incorrect please update your profile.·[39m
[31mNotify me about...[39m
[31mNew opportunities."[39m
```

**an administrator looking at somebody else's account sees the profile section alone** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.35 · v1

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.

- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note
- test: tests/acceptance/proposals/R-2.35.spec.ts

**every change of state against a proposal is recorded in its history** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.36 · v1

Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator.

- given: an opportunity with three submitted proposals
- when: one of them is awarded
- then: its vendor receives an award notice and the other two vendors each receive a decision notice, and a later withdrawal sends a notice to the withdrawing vendor and to every administrator
- test: tests/acceptance/proposals/R-2.36.spec.ts

**submitting a proposal sends a confirmation to the submitting vendor** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**withdrawing a proposal sends a notice to the vendor and to every administrator** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.37 · v1

Submitting an opportunity for review notifies every administrator, and confirms the submission to its author.

- given: a complete draft opportunity
- when: its author submits it for review
- then: every administrator is notified that an opportunity awaits review, and the author receives a confirmation
- test: tests/acceptance/opportunities/R-1.37.spec.ts

**submitting an opportunity for review confirms the submission to its author** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**anyone entitled to read a proposal can take away a printable copy of it** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the vendor's own copy of a Sprint With Us proposal names the organization** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/sprint-with-us/create
```

### R-1.38 · v1

The opportunity list groups opportunities into unpublished, open and closed, showing open opportunities with the nearest proposal deadline first, closed ones most recently closed first, and unpublished ones most recently changed first.

- given: a set of opportunities in a mix of states
- when: someone opens the opportunity list
- then: each opportunity appears in exactly one of the three groups, ordered as described
- test: tests/acceptance/opportunities/R-1.38.spec.ts

**the opportunity list shows open opportunities with the nearest proposal deadline first** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the opportunity list groups unpublished opportunities apart, most recently changed first** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.38 unpublished opportunity changed earlier"[39m
Received string:    [31m"58"[39m
```

**the opportunity list groups closed opportunities apart from open and unpublished ones** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Seeded closed Sprint With Us opportunity"[39m
Received string:    [31m""[39m
```

### R-2.38 · v1

Only public sector staff and administrators may take away every proposal of an opportunity in one document, and they choose whether that document names the proponents.

- given: a closed opportunity carrying several submitted proposals
- when: a vendor opens the address that exports all of them, and then the opportunity's author opens it
- then: the vendor is refused, the author receives every proposal they are entitled to see in one document, and the author can ask for the same document with the proponents named anonymously
- test: tests/acceptance/proposals/R-2.38.spec.ts

**a vendor may not take away every proposal of an opportunity in one document** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**public sector staff and administrators may take away every proposal of a closed opportunity in one document** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"The Digital Marketplace Terms & Conditions for E-Bidding have been updated. Please save what you are working on, review the latest version and agree to the updated terms.[39m
[31mNot Found·[39m
[31mThe page you are looking for doesn't exist.·[39m
[31mGo Home"[39m
```

### R-1.39 · v1

The opportunity list can be narrowed by program, by state, to remote-friendly opportunities only, and by free text matched against title and location.

- given: a list of opportunities across all three programs
- when: someone selects a program, selects a state, ticks remote-only, or types words into the search box
- then: only opportunities matching every chosen condition remain visible
- test: tests/acceptance/opportunities/R-1.39.spec.ts

**the opportunity list can be narrowed by program** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the opportunity list can be narrowed by state** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the opportunity list can be narrowed to remote-friendly opportunities only** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the opportunity list can be narrowed by free text matched against title and location** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.48 · v1

Creating an opportunity with its state set to published is refused unless the requester is an administrator; a public sector employee who is not an administrator may create an opportunity only as a draft or under review, in all three programs.

- test: tests/acceptance/opportunities/R-1.48.spec.ts

**creating an opportunity with its state set to published is refused unless the requester is an administrator** — failed

```
Error: unbound: opportunity-cwu-create.publish — no control labelled "Publish" on http://localhost:3000/opportunities/code-with-us/create
```

**a public sector employee who is not an administrator may create an opportunity as a draft, in all three programs** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.48 Code With Us draft created by an ordinary member of staff"[39m
Received string:    [31m"59"[39m
```

**a public sector employee who is not an administrator may create an opportunity under review** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.53 · v2

An opportunity may be deleted only while it is a draft or under review: an administrator may delete one in either state, and the public sector employee who created it may delete it only while it is a draft. The same rule governs Code With Us, Sprint With Us and Team With Us alike, and any other request to delete is refused and the opportunity remains.

- given: an opportunity that has been published at any point
- when: anyone asks to delete it
- then: the request is refused and the opportunity remains
- test: tests/acceptance/opportunities/R-1.53.spec.ts

**an administrator may delete a draft, in Code With Us, Sprint With Us and Team With Us alike** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an administrator may delete an opportunity that is under review** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the public sector employee who created an opportunity may delete it while it is a draft** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**the public sector employee who created an opportunity may not delete it once it is under review** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**any other request to delete an opportunity is refused and the opportunity remains** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.56 · v1

Once an opportunity is published, only an administrator may change its details; a request from the public sector employee who created it is refused, and the same rule governs Code With Us, Sprint With Us and Team With Us alike.

- test: tests/acceptance/opportunities/R-1.56.spec.ts

**once an opportunity is published, an administrator may change its details** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**once an opportunity is published, a request to change its details from the public sector employee who created it is refused** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**the same rule governs a published Sprint With Us opportunity** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/sprint-with-us/create
```

**the same rule governs a published Team With Us opportunity** — failed

```
Error: unbound: opportunity-twu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/team-with-us/create
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

The question was which of the 24 criteria failing against the old target were caused by this project's own adapter. Ruling: approve, with one triage line per criterion: 23 adapter-wrong and 1 product-question. The adapter is unchanged since bind-adapter-old-9, and the saved snapshots and click logs show the defects named in calibrate-triage-old-1 and -2 again. opportunityCwuCreate.publish/saveDraft/submitForReview, organizationCreate.createOrganization, the profile's saveChanges and the proposal forms drop their input, and press() then clicks a disabled anchor (tabindex=-1) until the 120 s timeout. asText() never reads slug or body. opportunityIdentifier() is read while the address is still /create. setEvaluationPanel only walks forward. fileDownload.downloadFile() ignores the file that open() was given. profileTab() returns '' on an administrator's view of another person's profile. This page also shows new binding faults. tabContent() matches a label anywhere on the page, so organizationsTab clicked the top-navigation 'Organizations' link and left the profile (R-4.34). exportedProposal returns a Not Found screen as text (R-2.38). controlState returns 'enabled', a truthy string, for export_disabled_until_selection (R-4.32). The opportunity-list group readers read a collapsed group as its count, '58' (R-1.38). reportingViews returned '' on a tab showing '22' over 'Total Views', and throws unbound when the tab is withheld (R-1.30). disqualifyProposal never types the reason into the open 'Disqualification Reason' dialog (R-2.34). R-6.28 goes to the product owner: the adapter sent and confirmed the broadcast, the 'Vendors Notified' alert rendered, and no mail reached any addressable vendor, which is the same evidence that sent R-6.23 there. Residual uncertainty: R-1.38's closed-group snapshot shows the heading with no count, so the group could be collapsed or empty, and R-8.28's logo half stayed in edit mode with no image shown after save. Both carry a clear adapter fault in another test of the same criterion. What would change this ruling: a fresh run, with these adapter defects fixed, that still fails a criterion at the same assertion. That criterion becomes a product question on the next page.

**Conditions:**
- adapter-wrong R-1.28: opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout. opportunityCwuCreate.saveDraft(input) also drops its input, and opportunityCwuEdit.opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create. Fill the form from the input, wait for the save to land on the record's own address, and have press() fail at once on a disabled control.
- adapter-wrong R-4.28: the profile's saveChanges(input) ignores its input and only presses 'Save Changes', so the job title under test is never typed and the field still reads 'Program Analyst'. Fill the name, email and job title fields from the input before saving.
- product-question R-6.28
- adapter-wrong R-8.28: fileDownload.downloadFile() ignores the fileId passed to fileDownload.open() and rebuilds the address with an empty id, throwing 'called without a value for :fileId' after the profile picture was stored. It must reuse the file opened. In the logo test, after organizationEdit.editOrganization, chooseImage and organizationEdit.saveChanges, the form is still in edit mode with no chosen image shown, and imageAddress() reads ''. Confirm that the chooser took the file and that the save completed before reading the stored address.
- adapter-wrong R-8.29: contentCreate.enterSlug({slug}) and enterBody({body}) send an empty string because asText() never reads the slug or body keys, so Publish stays disabled and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-1.30: opportunityCwuEdit.reportingViews() returned '' for the opportunity's author, although the Opportunity tab it opened shows '22' over 'Total Views', '0' over 'Watching' and '0' over 'Proposals'. statFor() does not find a figure rendered this way; read the figure from the box its label sits in. For the vendor, reportingViews/Watchers/Proposals call openTab, which throws unbound when the 'Opportunity' tab is withheld; read '' as tabContent does.
- adapter-wrong R-1.31: proposalCwuCreate.acceptProgramTerms opens the terms dialog through the top-bar 'Submit' anchor, which is disabled (tabindex=-1) while the proposal form is unfilled, and press() clicks it until the 120 s timeout. submitProposal(input) also drops proposalText. Fill the proposal from its input, and have press() fail at once on a disabled control.
- adapter-wrong R-4.31: userProfile.profileTab() goes through tabContent(['Profile']), which returns '' on an administrator's view of vendor.one's profile, a screen with no tab strip that renders 'Deactivate Account'. Read the profile screen itself when no Profile tab is offered.
- adapter-wrong R-8.31: opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout. opportunityCwuCreate.saveDraft(input) drops its input, and opportunityCwuEdit.opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create.
- adapter-wrong R-1.32: opportunityCwuCreate.saveDraft(input) drops its input, and opportunityCwuEdit.opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create. opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-4.32: userList.exportDisabledUntilSelection() returns controlState(), whose 'enabled' and 'disabled' are both non-empty. After a kind and a field were ticked, it answered 'enabled' for a control that is not disabled, which reads as disabled. Return a value only while the Export control is disabled, and '' once it is enabled.
- adapter-wrong R-2.34: proposalTwuView.disqualifyProposal(input) ignores the reason. The 'Disqualification Reason' dialog opens, but nothing is typed into it, and press() clicks the dialog's disabled 'Disqualify' anchor (tabindex=-1) until the 120 s timeout. Type the reason from the input into the dialog before confirming, and fail at once on a disabled control.
- adapter-wrong R-3.34: organizationCreate.createOrganization(input) never fills Legal Name, the address fields or the contact fields from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-4.34: tabContent() looks for its label anywhere on the page, so userProfileSelf.organizationsTab() clicked the top-navigation 'Organizations' link and left the profile for /organizations. For the vendor, notificationsTab() then found nothing and read ''. For the public sector employee, organizationsTab() returned the notifications text it read while navigating away. Look for tabs only in the profile's own tab list. userProfile.profileTab() also returns '' on an administrator's view of another person's profile, which has no tab strip.
- adapter-wrong R-2.35: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout. proposalCwuCreate.saveDraft(input) also drops proposalText.
- adapter-wrong R-2.36: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout. proposalCwuCreate.submitProposal(input) also drops proposalText.
- adapter-wrong R-1.37: opportunityCwuCreate.submitForReview(input) never fills the form from its input, and press() clicks the disabled 'Submit for Review' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-2.37: opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout. For Sprint With Us, setEvaluationPanel's advanceTo() only presses Next forward from the step it was left on, and never reaches a step showing 'Panel Member'. addTeamQuestion(input) also ignores its input.
- adapter-wrong R-1.38: opportunityCwuCreate.publish(input) drops its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout. saveDraft(input) drops the title. opportunityList.unpublishedGroup() and closedGroup() read a group while it is collapsed, so the unpublished group read only its count, '58', and the closed group read ''. The snapshot shows 'Unpublished Opportunities 70' with no rows listed. Expand each group before reading its opportunities.
- adapter-wrong R-2.38: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout. proposalSwuExportAll.exportedProposal() returns contentText() whole, so the organization owner's 'Not Found' screen, with its terms-updated banner, reads as an exported document. Return '' when the Not Found screen is shown.
- adapter-wrong R-1.39: in all four tests, opportunityCwuCreate.publish(input) never fills the form from its input (title, location, remoteOk and the rest), and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-1.48: opportunityCwuCreate.publish throws unbound when the create page offers a public sector employee no 'Publish' control, instead of letting the refusal be observed. saveDraft(input) drops the title, and opportunityList.unpublishedGroup() reads the collapsed group as its count, '59'. submitForReview(input) drops its input, and press() clicks the disabled 'Submit for Review' anchor (tabindex=-1) until the timeout.
- adapter-wrong R-1.53: opportunityCwuCreate.saveDraft(input) drops its input, and opportunityCwuEdit.opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create. submitForReview(input) and publish(input) never fill the form, and press() clicks the disabled anchor (tabindex=-1) until the timeout. allOpportunitiesForAdministrator reads only the 'My Opportunities' tab.
- adapter-wrong R-1.56: opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout. saveDraft(input) drops its input, and opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create. For Sprint With Us and Team With Us, setEvaluationPanel's advanceTo() only presses Next forward and never reaches a step showing 'Panel Member'. addTeamQuestion and addResourceQuestion ignore their input.
