| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T19:18:15.612Z |
| holder | agent:reviewer |

# 64 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.17, R-6.17, R-7.17, R-8.17, R-3.18, R-4.18, R-7.18, R-8.18, R-1.19, R-4.19, R-6.19, R-1.20, R-5.20, R-7.20, R-8.20, R-1.21, R-3.21, R-7.21, R-8.21, R-3.22, R-7.22, R-1.23, R-2.23, R-3.23, R-6.23, R-2.24, R-3.24, R-7.24, R-8.24, R-3.25, R-4.25, R-7.25, R-8.25, R-3.26, R-6.26, R-7.26, R-4.27, R-6.27, R-7.27, R-8.27 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

64 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

The 40 below are the ones to sort now; the remaining 24 come back on the next run.

### R-1.17 · v1

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question, a guideline, a maximum score, a response word limit and a position, and an optional minimum score that must be lower than the question's maximum score.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**an evaluation question whose question runs over one thousand characters is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose guideline runs over one thousand characters is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose maximum score is below one is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose response word limit falls outside one to three thousand is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an evaluation question whose position falls outside nought to one hundred is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Sprint With Us evaluation question whose minimum score is not lower than its maximum is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Team With Us evaluation question whose minimum score is not lower than its maximum is rejected** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-6.17 · v1

A deactivated account receives no notification of any kind, including notices about opportunities it was watching, while the watch itself is retained so that reactivating the account restores it.

- test: tests/acceptance/notifications/R-6.17.spec.ts

**a deactivated account receives no notification of any kind** — failed

```
Error: unbound: user-profile.deactivate_account — no control labelled "Deactivate Account" on http://localhost:3000/users/00000000-0000-4000-8000-000000000210
```

**the watch itself is retained so that reactivating the account restores it** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-7.17 · v1

A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it.

- test: tests/acceptance/content/R-7.17.spec.ts

**a page's body is rendered as formatted text only** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-8.17 · v1

An upload larger than the service's size limit is refused as the requester's error, with a message naming the limit, and the limit is stated in the interface before a person chooses a file rather than only after they submit it.

- test: tests/acceptance/files/R-8.17.spec.ts

**the size limit on an upload is stated in the interface before a person chooses a file** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**an upload larger than the service's size limit is refused as the requester's error, with a message naming the limit** — failed

```
Error: a size named in ""

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mnull[39m
```

**an attachment larger than the service's size limit is refused in the interface with a message naming the limit** — failed

```
Error: a size named in ""

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mnull[39m
```

### R-3.18 · v1

The Edit and Archive controls on an organization's management page are offered only to a person permitted to use them — the organization's owner or a service administrator; an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control, and the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator.

- test: tests/acceptance/organizations/R-3.18.spec.ts

**an organization administrator who is not the owner sees the profile read-only, with no Edit and no Archive control** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: not [32m"Edit"[39m
Received string:        [31m"[7mEdit[27m Organization[39m
[31mOrganization[39m
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
… 13 more line(s)
```

**the service refuses a profile change from an organization administrator who is not the owner** — failed

```
Error: unbound: organization-edit.edit_organization — no control labelled "Edit Organization" on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000301/edit?tab=organization
```

**the service refuses an archive request from an organization administrator who is not the owner** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"Broken Compass Delivery Ltd."[39m
```

### R-4.18 · v1

A person's profile details - name, email address, job title and picture - may be changed only by that person. An administrator viewing somebody else's profile is offered no editing control, and the service refuses a profile change submitted against an account that is not the requester's own; an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights.

- test: tests/acceptance/users/R-4.18.spec.ts

**a person's profile details may be changed only by that person, so an administrator viewing somebody else's profile is offered no editing control** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Edit"[39m
Received string:    [31m"Digital Marketplace[39m
[31mLoading...[39m
[31mvendor.one@example.test[39m
[31mDashboard[39m
[31m|[39m
[31mOpportunities[39m
[31m|[39m
[31mOrganizations[39m
[31mThe Digital Marketplace Terms & Conditions for E-Bidding have been updated. Please save what you are working on, review the latest version and agree to the updated terms."[39m
```

**an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Deactivate"[39m
Received string:    [31m""[39m
```

### R-7.18 · v1

The service level agreement page is one the service creates for itself, so every screen that links to it — the learn-more index, the program cards, and the Code With Us, Sprint With Us and Team With Us opportunity forms — resolves on a fresh installation.

- test: tests/acceptance/content/R-7.18.spec.ts

**the service level agreement page is one the service creates for itself** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.18 · v1

A submission carrying no file part, or read-access information that is not well-formed, is refused as a bad request naming what was wrong with it, and is not recorded in the service's error log as a fault of the service; any working copy already written is removed whether the upload succeeds or fails.

- test: tests/acceptance/files/R-8.18.spec.ts

**a submission carrying no file part is refused as a bad request rather than as a fault of the service** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"500 No file uploaded"[39m
```

**a submission carrying read-access information that is not well-formed is refused as a bad request naming what was wrong with it, rather than as a fault of the service** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"500 Invalid `metadata` field."[39m
```

### R-1.19 · v1

An opportunity moves through the states draft, under review, published, one or more program-specific evaluation stages, processing, and finally awarded or cancelled.

- given: any opportunity
- when: its state is read at any point in its life
- then: the state is one of the values recognised for its program, and no other value is accepted by the store
- test: tests/acceptance/opportunities/R-1.19.spec.ts

**an opportunity moves through the states draft, under review and published** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an opportunity finally reaches cancelled** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-4.19 · v1

The control to reactivate an account is offered only for an account that an administrator deactivated. An account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again, and the service continues to refuse a reactivation request made against such an account.

- test: tests/acceptance/users/R-4.19.spec.ts

**the control to reactivate an account is offered for an account that an administrator deactivated** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Reactivate"[39m
Received string:    [31m""[39m
```

**an account its owner deactivated carries no reactivation control; the profile states instead that the person reactivates it themselves by signing in again** — failed

```
Error: unbound: user-profile-self.deactivate_account — no control labelled "Deactivate Account" on http://localhost:3000/users/me
```

### R-6.19 · v1

The administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it.

- test: tests/acceptance/notifications/R-6.19.spec.ts

**the administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"evaluation panel"[39m
Received string:    [31m"account registered[39m
[31mterms & conditions updated[39m
[31muser invited to join team[39m
[31man organization invites someone who has not registered[39m
[31muser account deactivated[39m
[31muser account reactivated[39m
[31muser approved request to join organization[39m
[31muser rejected request to join organization[39m
[31muser leaves an organization[39m
[31mcwu opportunity published[39m
[31mcwu opportunity updated[39m
[31mcwu opportunity cancelled[39m
[31mcwu opportunity ready for evaluation[39m
[31mcwu proposal submitted[39m
[31mcwu proposal awarded[39m
[31mcwu proposal withdrawn[39m
[31mswu opportunity published[39m
… 66 more line(s)
```

### R-1.20 · v1

An opportunity may only change state along the permitted path for its program, and a request for any other change is refused.

- given: an opportunity in a given state
- when: someone requests a change to a state that is not reachable from it — for example from draft straight to an evaluation stage, or out of an awarded or cancelled opportunity
- then: the request is refused and the opportunity's state is unchanged
- test: tests/acceptance/opportunities/R-1.20.spec.ts

**a request to change an opportunity to a state that is not reachable from its own is refused and its state is unchanged** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity may only change state along the permitted path for its program** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-5.20 · v1

When an opportunity closes it enters individual question evaluation, and every evaluator on its panel is told it is ready to evaluate.

- given: a published opportunity with a panel of two evaluators and a separate chair, and submitted proposals against it
- when: its proposal deadline passes
- then: the opportunity moves to individual question evaluation and the two evaluators are notified, while the chair who is not an evaluator is not
- test: tests/acceptance/evaluation/R-5.20.spec.ts

**when an opportunity closes it enters individual question evaluation and its evaluators are told** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-7.20 · v1

A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named.

- given: an administrator creating or changing a page
- when: they submit it with an empty title, or with a body longer than fifty thousand characters
- then: nothing is saved and the failing field is marked with the reason
- test: tests/acceptance/content/R-7.20.spec.ts

**a page whose title is empty is refused with the failing field named, and nothing is saved** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a page whose body is longer than fifty thousand characters is refused with the failing field named, and nothing is saved** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a page whose title is longer than a hundred characters is refused with the failing field named** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a page whose body is empty is refused with the failing field named** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Code With Us opportunity is readable by whoever may read the opportunity** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a file attached to a Sprint With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/sprint-with-us/create
```

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: unbound: opportunity-twu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/team-with-us/create
```

**a file attached to a proposal is readable by whoever may read the proposal** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.21 · v1

Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.

- given: a draft opportunity with a field still blank
- when: its author submits it for review
- then: the request is refused with a message saying the opportunity is incomplete and asking the author to complete and save the form
- test: tests/acceptance/opportunities/R-1.21.spec.ts

**submitting a draft opportunity for review is refused unless the opportunity is complete** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**the person is told the opportunity is incomplete rather than which field is missing** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.21 · v2

In the organization list, the owner's name, the team size and both qualification marks are shown only to a service administrator and, for a given organization, to the vendors who own or administer it; every other viewer sees that organization's legal name, logo, active state and service areas alone, and the owner and qualification columns are not offered at all to a visitor who is not signed in or to public sector staff.

- given: an organization owned by one vendor
- when: a different vendor, who is neither its owner nor one of its administrators, opens the organization list
- then: that organization's row shows its legal name only, with no owner, no team size and no qualification marks, while the same row shown to an administrator carries all of them
- test: tests/acceptance/organizations/R-3.21.spec.ts

**a vendor who is neither owner nor administrator of an organization sees its legal name without the owner, the team size or the qualification marks** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"Broken Compass Delivery Ltd."[39m
```

**the same row shown to a service administrator carries the owner's name and both qualification marks** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"Broken Compass Delivery Ltd."[39m
```

### R-7.21 · v1

A page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused.

- given: an administrator creating a page
- when: they give it an address containing a capital letter, a space, an underscore, or a leading or trailing hyphen
- then: the page is not created and the address is marked as invalid
- test: tests/acceptance/content/R-7.21.spec.ts

**a page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the rule for a page's address is stated on the form, alongside the full public address the page will have** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"derived-well-formed-mu1e7izn"[39m
Received string:    [31m""[39m
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
Error: unbound: organization-edit.edit_organization — no control labelled "Edit Organization" on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000301/edit?tab=organization
```

**a profile picture whose content can be read as a PNG is accepted** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"/images/logo.svg"[39m
```

### R-3.22 · v2

Registering an organization requires a legal name, street address, city, region, mail code, country and contact name, each between one and one hundred characters, together with a contact email in a valid email format and of any length; a website address, second address line, contact title and contact phone number may be left out, but each is rejected if given in an invalid format, with the second address line and contact title also limited to one hundred characters.

- given: a signed-in vendor filling in the organization registration form
- when: they submit it with the legal name left blank, or with a contact email of "not-an-email"
- then: the organization is not created and the offending field is reported as invalid, while the same submission with the optional website, second address line, contact title and phone left empty succeeds
- test: tests/acceptance/organizations/R-3.22.spec.ts

**a submission with the legal name left blank does not create the organization and reports the field as invalid** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a submission with a contact email of "not-an-email" does not create the organization and reports the field as invalid** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the same submission with the optional website, second address line, contact title and phone left empty succeeds** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-7.22 · v1

No two pages may share an address, whether the clash arises on creating a page or on renaming one.

- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use
- test: tests/acceptance/content/R-7.22.spec.ts

**a page cannot be created at an address another page already holds, and the existing page is untouched** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a page cannot be renamed to an address another page already holds, and the existing page is untouched** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.23 · v1

Publishing an opportunity records the moment of publication, which is thereafter shown as the opportunity's published date.

- given: an opportunity that has been published
- when: anyone views it
- then: the date shown as its publication date is the moment of the first publication, even if it was later republished
- test: tests/acceptance/opportunities/R-1.23.spec.ts

**publishing an opportunity records the moment of publication, which is thereafter shown as its published date** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.23 · v1

A vendor may withdraw a submitted proposal at any time, and may put a withdrawn proposal back in only while the opportunity is still accepting proposals.

- given: a submitted proposal on an opportunity whose deadline has passed
- when: the vendor withdraws it, and then tries to submit it again
- then: the withdrawal is accepted and the re-submission is refused, whereas before the deadline both are accepted
- test: tests/acceptance/proposals/R-2.23.spec.ts

**a vendor may withdraw a submitted proposal** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a vendor may put a withdrawn proposal back in while the opportunity is still accepting proposals** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.23 · v1

The vendor who registers an organization becomes its owner immediately, and the organization is active from the moment it is registered.

- given: a signed-in vendor with no organizations
- when: they register a new organization
- then: the organization appears under their owned organizations with them recorded as its owner and its team counted as one member, and they are taken to that organization's management page
- test: tests/acceptance/organizations/R-3.23.spec.ts

**the organization appears under the registering vendor's owned organizations with them recorded as its owner, and it is active from the moment it is registered** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-6.23 · v1

An administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms.

- given: an administrator on the page holding the service's terms and conditions, and a mix of active and deactivated vendors who had all accepted the previous terms
- when: the administrator chooses to notify vendors and confirms
- then: every vendor's acceptance is withdrawn and each active vendor receives a message naming the change and offering a link to read and accept the new terms
- test: tests/acceptance/notifications/R-6.23.spec.ts

**an administrator viewing the service's terms and conditions can announce that they have changed, which withdraws every vendor's standing acceptance and sends each active vendor a message asking them to read and accept the new terms** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

### R-2.24 · v1

A vendor sees only the proposals they authored, plus the proposals of organizations they own or administer, and never another vendor's proposal.

- given: two vendors who each hold a proposal against the same opportunity
- when: each lists their proposals and each opens the other's proposal directly
- then: each list shows only that vendor's own proposal, an organization owner additionally sees their organization's proposals under a separate heading, and opening the other vendor's proposal is refused
- test: tests/acceptance/proposals/R-2.24.spec.ts

**a vendor sees only the proposals they authored** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a vendor additionally sees the proposals of organizations they own or administer, under a separate heading** — failed

```
Error: unbound: opportunity-twu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/team-with-us/create
```

**a vendor never sees another vendor's proposal** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.24 · v1

When an administrator archives an organization they do not own, its owner is told by email that the organization has been archived.

- given: an active organization owned by a vendor
- when: an administrator archives it
- then: the owner receives a message telling them their organization has been archived by an administrator and that they can no longer use it, and no such message is sent when the owner archives their own organization
- test: tests/acceptance/organizations/R-3.24.spec.ts

**when an administrator archives an organization they do not own, its owner receives a message telling them it has been archived** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**no such message is sent when the owner archives their own organization** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-7.24 · v1

Renaming a page moves it to its new address at once and leaves nothing at the old one.

- given: a page published at the address "about-us" and links to it from elsewhere
- when: an administrator changes its address to "about"
- then: the page answers at "about", the old address is answered as not found, and no redirection is offered
- test: tests/acceptance/content/R-7.24.spec.ts

**renaming a page moves it to its new address at once and leaves nothing at the old one** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-8.24 · v2

An upload that carries no read-access statement, or one that is well-formed data but names a kind of access the service does not recognise, is refused as a bad request reporting that the information provided was invalid, and no file is stored; read-access information that is not well-formed data at all fails instead as the service fault described by R-8.4.

- given: a signed-in person uploading a file
- when: they omit the read-access statement, or give one naming a kind of access the service does not recognise
- then: the upload is refused as having invalid read-access information and no file is stored
- test: tests/acceptance/files/R-8.24.spec.ts

**an upload that carries no read-access statement is refused as a bad request reporting that the information provided was invalid, and no file is stored** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.25 · v1

An organization is qualified for Sprint With Us once it has at least two active team members, those members between them hold every capability the service recognises, and its Sprint With Us terms have been accepted.

- given: an organization with an owner and one further active member who between them hold every capability, and whose Sprint With Us terms have not yet been accepted
- when: the owner opens the organization's Sprint With Us qualification page
- then: the team-size and capability requirements are shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- test: tests/acceptance/organizations/R-3.25.spec.ts

**with the team-size and capability requirements met and the terms requirement unmet, the organization is marked as not qualified** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-4.25 · v1

A person's account record may be read only by that person or by an administrator; anyone else is refused and, in the interface, is shown a missing-page instead of a refusal.

- given: two vendors and an administrator
- when: one vendor opens the other vendor's profile, and separately an administrator opens it
- then: the vendor is shown a missing page and the administrator sees the profile
- test: tests/acceptance/users/R-4.25.spec.ts

**an administrator may read another person's account record** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Blake Placeholder[39m
[31mStatus[39m
[31mActive[39m
[31mAccount Type[39m
[31mVendor[39m
[31mProfile Picture (Optional)[39m
[31mGitHub[39m
[31mName[39m
[31mEmail Address[39m
[31mDeactivate Account·[39m
[31mDeactivating their account means that they will no longer have access to the Digital Marketplace.·[39m
[31mDeactivate Account"[39m
```

**a person may read their own account record** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Profile[39m
[31mCapabilities[39m
[31mOrganizations[39m
[31mNotifications[39m
[31mPolicies, Terms & Agreements[39m
[31mThe Digital Marketplace Terms & Conditions for E-Bidding have been updated. Please save what you are working on, review the latest version and agree to the updated terms.[39m
[31mBlake Placeholder[39m
[31mAccount Type[39m
[31mVendor[39m
[31mProfile Information[39m
[31mProfile Picture (Optional)[39m
[31mGitHub[39m
[31mName[39m
[31mEmail Address[39m
[31mDeactivate Account·[39m
[31mDeactivating your account means that you will no longer have access to the Digital Marketplace.·[39m
[31mDeactivate Account"[39m
```

### R-7.25 · v1

A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so.

- given: an administrator on the managing screen of a page the service needs
- when: they look for the ways to change it
- then: a warning explains that the service needs this page at this address, the address cannot be typed over, no removal is offered, and a request to rename or remove it made another way is refused
- test: tests/acceptance/content/R-7.25.spec.ts

**a page the service depends on may have its title and body changed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"[7mD[27misclaimer"[39m
Received: [31m"[7md[27misclaimer[7m — B.C. Digital Marketplace[27m"[39m
```

### R-8.25 · v1

A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.

- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- test: tests/acceptance/files/R-8.25.spec.ts

**an attachment on a Code With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an attachment on a Sprint With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is** — failed

```
Error: unbound: opportunity-swu-create.set_evaluation_panel — could not reach a step showing "Panel Member" on http://localhost:3000/opportunities/sprint-with-us/create
```

**an attachment on an opportunity that is not yet publicly visible is readable by the opportunity's creator** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

**an attachment on a proposal is readable by whoever may read that proposal** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.26 · v1

An organization is qualified for Team With Us once it has been approved for at least one service area and its Team With Us terms have been accepted.

- given: an organization approved for one service area whose Team With Us terms have not been accepted
- when: the owner opens the organization's Team With Us qualification page
- then: the service-area requirement is shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- test: tests/acceptance/organizations/R-3.26.spec.ts

**with the service-area requirement met and the terms requirement unmet, the organization is marked as not qualified** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-6.26 · v2

When the service notifies an account that holds no email address it composes the message all the same and hands it over with an empty list of recipients; any resulting failure is written to the operational log only, nothing in the service records that the person was not reached, and a broadcast to many vendors always continues to the next recipient because no failure in composing or sending can interrupt it.

- given: a vendor whose account holds no email address, because the identity provider supplied none
- when: an administrator announces changed terms
- then: the service composes a message for that account addressed to nobody and hands it on to be sent, and what follows depends on the sending machinery rather than on anything the service decides
- test: tests/acceptance/notifications/R-6.26.spec.ts

**when the service notifies an account that holds no email address, a broadcast to many vendors always continues to the next recipient because no failure in composing or sending can interrupt it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.26 · v1

A page's body is written as marked-up text with an editor offering formatting shortcuts, a link to the guidance page, and image upload that places the uploaded image into the body.

- given: an administrator editing a page's body
- when: they use the image control to choose an image file
- then: the image is stored by the service and a reference to it is inserted into the body at the cursor, and the published page shows the image
- test: tests/acceptance/content/R-7.26.spec.ts

**the editor's image control stores the image, places a reference to it in the body, and the published page shows it** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-4.27 · v2

A profile requires a name of between one and one hundred characters and an email address in a valid format, which is stored in lower case; the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.

- given: a person editing their own profile
- when: they clear the name, or enter an email address that is not in a valid format
- then: the profile is not saved and the offending field is reported as invalid, while the same profile saves with the job title and picture left empty
- test: tests/acceptance/users/R-4.27.spec.ts

**a profile requires a name, so clearing the name is refused and the profile is not saved** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a profile requires a name of no more than one hundred characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a profile requires an email address in a valid format** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**the job title may be left blank, and the profile picture is optional** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Senior Procurement Officer"[39m
Received string:    [31m"Program Analyst"[39m
```

**the job title is limited to one hundred characters** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-6.27 · v1

The choice to be notified about newly published opportunities is offered on the list of opportunities itself at every screen width, so a person reading the list on a phone reaches it the same way as a person reading it on a desktop.

- test: tests/acceptance/notifications/R-6.27.spec.ts

**the choice to be notified about newly published opportunities is offered on the list of opportunities itself at every screen width, so a person reading the list on a phone reaches it the same way as a person reading it on a desktop** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.27 · v1

The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded.

- given: a page the service created for itself and has never been edited, and a page an administrator created and another administrator later changed
- when: an administrator opens each page's managing screen
- then: the first names "System" as both publisher and last editor, and the second names the two people, each linked to their profile
- test: tests/acceptance/content/R-7.27.spec.ts

**the managing screen of a page an administrator created and changed names who first published it and who last changed it** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-8.27 · v1

An attachment can be given a different display name before it is uploaded, and the ending of the original file is put back on if the person leaves it off.

- given: a person attaching a file called "scan0001.pdf" to an opportunity
- when: they type "Statement of work" as its name and save
- then: the attachment is stored as "Statement of work.pdf"
- test: tests/acceptance/files/R-8.27.spec.ts

**an attachment can be given a different display name before it is uploaded, and the ending of the original file is put back on if the person leaves it off** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Statement of work.pdf"[39m
Received string:    [31m""[39m
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

The question was which of the 40 failing criteria on this page were caused by this project's own old-target adapter. Ruling: approve, with one triage line per criterion: 34 adapter-wrong and 6 product-question. The adapter has not changed since the calibrate-triage-old-1 ruling (its last commit is bind-adapter-old-9), and the saved page snapshots and click logs show the same defects again. opportunityCwuCreate.publish/saveDraft/submitForReview, organizationCreate.createOrganization, the profile's saveChanges and addTeamQuestion/addResourceQuestion all drop their input, and press() then clicks a disabled anchor (tabindex=-1) until the 120 s timeout. asText() never reads slug or body. organizationList.organizationName() returns only the first row. contentView.pageTitle() returns the browser tab title. userProfile.notFoundPage() returns the whole page, and profileTab() returns '' on an administrator's view of another person's profile, which has no tab strip. Several readers read while the page shows 'Loading...'. This run also exposes new binding faults: the size-limit reader never walks to the Attachments step; fileUpload.uploadFile sends '[]' where the test states no read access; notifyVendorsSuccess reads text that stops at the footer, while the 'Vendors Notified' alert renders after it; and setEvaluationPanel only walks forward. Six failures point at nothing in the adapter. R-6.19: the reference page's full list of titles and subjects has no evaluation-panel or consensus notice. R-6.23: the 'Vendors Notified' alert appeared but no mail arrived. R-6.27: the 390 px list renders no notify control. R-7.18: /content/service-level-agreement answers Not Found. R-5.20: the status moved to Team Questions Evaluation but no mail reached the evaluators. R-8.18: the adapter sent exactly the malformed uploads and the service answered 500. Residual notes: a second failure in each of R-6.17 and R-4.19 comes from accounts already inactive from earlier runs, not from the binding, and the checks flag R-6.26's test as superseded by R-6.28. What would change this ruling: a fresh run, with these adapter defects fixed, that still fails a criterion at the same assertion. That criterion would then be a product question and would come back on the next page.

**Conditions:**
- adapter-wrong R-1.17: opportunitySwuCreate.addTeamQuestion(input) and opportunityTwuCreate.addResourceQuestion(input) ignore their input. They walk to the questions step and press 'Add Question' but never type the question, guideline, word limit, score or minimum score (the snapshot shows 'Question*' empty and 'Score*' still at the default 5), so the invalid value under test is never entered and fieldError() has nothing to report. Fill the added question's fields from the input.
- adapter-wrong R-6.17: in 'the watch itself is retained', opportunityCwuCreate.publish(input) never fills the form from its input (Title blank), and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout. Fill the form from the input, and have press() fail at once on a disabled control. The first test's missing 'Deactivate Account' is not a binding fault: that account already shows Status Inactive with only 'Reactivate Account'.
- adapter-wrong R-7.17: contentCreate.enterSlug and enterBody send an empty string because asText() never reads the slug or body keys (the snapshot shows Title filled but Slug* and Body* blank), so Publish stays disabled and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-8.17: fileAttachmentControl.sizeLimitStatedBeforeChoosing() reads whichever step the create form is on (the snapshot shows '1. Overview') instead of walking to the Attachments step, where the form states 'Attachments must be smaller than 10MB.'. All three tests take the limit from this reader and got ''.
- adapter-wrong R-3.18: organizationEdit.editOrganization pressed 'Edit Organization' while the page still showed 'Loading...' (the same organization admin's organizationTab reading in the first test contains 'Edit Organization'), and organizationList.organizationName() still returns only the first body row's cell ('Broken Compass Delivery Ltd.') instead of every name in the column. Wait for the page to render before pressing, and return all names in page order.
- adapter-wrong R-4.18: userProfile.profileTab() goes through tabContent(['Profile']). That returns '' on an administrator's view of another person's profile, which has no tab strip but does render 'Deactivate Account' and the Admin checkbox. For the owner it read while the page showed 'Loading...', and contentText() strips the top bar where 'Edit Profile' sits. Read the profile screen itself when there is no tab, include its top-bar controls, and wait for it to load.
- product-question R-7.18
- product-question R-8.18
- adapter-wrong R-1.19: opportunityCwuCreate.saveDraft(input) never fills the form from its input (Title blank), and opportunityCwuEdit.opportunityIdentifier() is read while Save Draft still shows 'Loading...' and the address is still /opportunities/code-with-us/create. opportunityCwuCreate.publish(input) likewise drops its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-4.19: userProfile.profileTab() returns '' on an administrator's view of another person's profile because that screen has no 'Profile' tab, yet the snapshot shows the 'Reactivate Account' section rendered for the account an administrator deactivated. Read the profile screen itself when no tab is offered. The second test's missing 'Deactivate Account' is not a binding fault: vendor.one's own profile already shows only 'Reactivate Account'.
- product-question R-6.19
- adapter-wrong R-1.20: in both tests opportunityCwuCreate.publish(input) never fills the form from its input (title, teaser, location, reward, skills, dates), and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout.
- product-question R-5.20
- adapter-wrong R-7.20: contentCreate.enterSlug and enterBody send '' because asText() never reads the slug or body keys, so every submission lacks a slug and body, Publish stays disabled, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout instead of letting the refusal be read.
- adapter-wrong R-8.20: the Code With Us and proposal tests time out because opportunityCwuCreate.publish(input) drops its input and press() clicks the disabled Publish anchor (tabindex=-1). The Sprint With Us and Team With Us tests fail in setEvaluationPanel, whose advanceTo() only presses Next from wherever the previous action left the wizard; it reached the last step, '8. Attachments', without finding 'Panel Member', and never goes back or opens the panel step directly.
- adapter-wrong R-1.21: opportunityCwuCreate.saveDraft(input) and submitForReview(input) never fill the form from their input. opportunityCwuEdit.opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create, and press() clicks the disabled 'Submit for Review' anchor (tabindex=-1) until the timeout.
- adapter-wrong R-3.21: organizationList.organizationName() uses textUnder('', 'Organization Name'), which returns only the first body row's cell ('Broken Compass Delivery Ltd.'). It must return every name in that column, in page order.
- adapter-wrong R-7.21: contentCreate.enterSlug and enterBody send '' because asText() never reads the slug or body keys. Publish therefore stays disabled and press() clicks the disabled anchor (tabindex=-1) until the timeout, and resultingPublicAddress() finds no 'will be available at' line because no slug was ever typed.
- adapter-wrong R-8.21: organizationEdit.editOrganization pressed 'Edit Organization' while the page still showed 'Loading...', and fileImagePicker.currentImage() returns the first img on the page, the site header logo '/images/logo.svg', rather than the profile picture.
- adapter-wrong R-3.22: organizationCreate.createOrganization(input) never fills Legal Name, the address fields or the contact fields from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-7.22: contentCreate.enterSlug/enterBody and contentEdit.editSlug send '' because asText() never reads the slug or body keys, so Publish stays disabled and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-1.23: opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-2.23: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-3.23: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- product-question R-6.23
- adapter-wrong R-2.24: opportunityCwuCreate.publish(input) drops its input and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout. For Team With Us, setEvaluationPanel's advanceTo() only presses Next forward from the step it was left on and never reaches a step showing 'Panel Member'.
- adapter-wrong R-3.24: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-7.24: contentCreate.enterSlug/enterBody and contentEdit.editSlug send '' because asText() never reads the slug or body keys, so Publish stays disabled and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-8.24: fileUpload.uploadFile fills in metadata '[]' (NO_STATED_ACCESS) when the input states no read access, so the upload carried a read-access statement that the target accepts, and refusedForReadAccess() had no refusal to read. For this action, send no metadata field at all.
- adapter-wrong R-3.25: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-4.25: userProfile.notFoundPage() returns contentText(), the whole rendered profile, so a profile the administrator or its owner may read is reported as a not-found page. It must return something only when the 'Not Found' screen is shown.
- adapter-wrong R-7.25: contentView.pageTitle() returns page.title(), the browser tab title ('disclaimer — B.C. Digital Marketplace'). It must read the page's own heading text.
- adapter-wrong R-8.25: opportunityCwuCreate.saveDraft(input) drops its input and opportunityCwuEdit.opportunityIdentifier() is read while the address is still /opportunities/code-with-us/create. Sprint With Us setEvaluationPanel only walks forward and never reaches 'Panel Member', and opportunityCwuCreate.publish(input) drops its input and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-3.26: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-6.26: notificationTermsBroadcast.notifyVendorsSuccess() runs linesMatching over contentText(), which cuts off everything after the footer. That is where the 'Vendors Notified' alert renders (R-6.23's snapshot shows it there). It also read while the confirmation dialog was still closing. Read the alert wherever it renders, and wait for it to appear.
- adapter-wrong R-7.26: contentCreate.enterSlug and enterBody send '' because asText() never reads the slug or body keys, so Publish stays disabled and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-4.27: the profile's saveChanges(input) ignores its input and only presses 'Save Changes', so the name, email and job title under test are never typed (the job title stays 'Program Analyst'). Fill the fields from the input before saving.
- product-question R-6.27
- adapter-wrong R-7.27: contentCreate.enterSlug/enterBody and contentEdit.editBody send '' because asText() never reads the slug or body keys, so Publish stays disabled and press() clicks the disabled Publish anchor (tabindex=-1) until the timeout.
- adapter-wrong R-8.27: fileAttachmentControl.existingAttachmentRow() was read while Save Draft still showed 'Loading...' on /opportunities/code-with-us/create. It uses sectionFrom(['Attachments']), which looks for a line reading exactly 'Attachments', but the step is headed '4. Attachments'. opportunityCwuCreate.saveDraft(input) also drops the title. Wait for the save to finish, and read the attachment names from the Attachments step.
