---
gate: G1
question: "15 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-1.3, R-3.3, R-3.7, R-3.8, R-4.14, R-3.15, R-8.17, R-7.20, R-1.21, R-7.21, R-8.21, R-6.26, R-4.31, R-3.32, R-4.32 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-14T21:20:21.896Z
---

# 15 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-1.3, R-3.3, R-3.7, R-3.8, R-4.14, R-3.15, R-8.17, R-7.20, R-1.21, R-7.21, R-8.21, R-6.26, R-4.31, R-3.32, R-4.32 with a calibration condition, so the next calibrate run can apply it.

15 criterion(s) failed against the **old** target at http://localhost:3000, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

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

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.

