---
gate: G3
question: "104 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.1, R-3.1, R-7.1, R-8.1, R-2.2, R-3.2, R-1.3, R-2.3, R-3.3, R-1.4, R-2.4, R-4.4, R-7.4, R-3.6, R-2.7, R-7.7, R-8.7, R-7.8, R-1.9, R-2.9, R-7.9, R-1.10, R-3.10, R-7.10, R-8.10, R-1.11, R-8.11, R-1.12, R-2.12, R-4.12, R-7.12, R-8.12, R-2.13, R-3.13, R-8.13, R-1.14, R-2.14, R-3.14, R-8.14, R-3.15 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-14T19:08:55.580Z
---

# 104 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.1, R-3.1, R-7.1, R-8.1, R-2.2, R-3.2, R-1.3, R-2.3, R-3.3, R-1.4, R-2.4, R-4.4, R-7.4, R-3.6, R-2.7, R-7.7, R-8.7, R-7.8, R-1.9, R-2.9, R-7.9, R-1.10, R-3.10, R-7.10, R-8.10, R-1.11, R-8.11, R-1.12, R-2.12, R-4.12, R-7.12, R-8.12, R-2.13, R-3.13, R-8.13, R-1.14, R-2.14, R-3.14, R-8.14, R-3.15 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

104 criterion(s) failed against the **old** target at http://localhost:3000, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

The 40 below are the ones to sort now; the remaining 64 come back on the next run.

### R-2.1 · v1

Only a signed-in vendor who has accepted the service's terms at some point may start a proposal; a request from public sector staff, an administrator or an anonymous visitor is refused.

- given: a visitor who is not signed in, or is signed in as public sector staff or as an administrator
- when: they attempt to start a proposal against a published opportunity
- then: the request is refused and no proposal is created
- test: tests/acceptance/proposals/R-2.1.spec.ts

**a signed-in vendor who has accepted the service's terms may start a proposal** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a request to start a proposal from public sector staff, an administrator or an anonymous visitor is refused** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.1 · v1

Anyone, signed in or not, can browse the list of registered organizations, which shows only organizations that have not been archived, ordered by legal name and split into pages.

- given: three registered organizations, one of which has been archived
- when: a visitor who is not signed in opens the organization list
- then: the two organizations that are not archived are listed in alphabetical order by legal name, and the archived one is absent
- test: tests/acceptance/organizations/R-3.1.spec.ts

**a visitor who is not signed in sees the two organizations that are not archived listed in alphabetical order by legal name, and the archived one is absent** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Cedar Hollow Systems Inc."[39m
Received string:    [31m"Broken Compass Delivery Ltd."[39m
```

### R-7.1 · v1

Anyone, including a visitor who has not signed in, can read a page by its address and sees its title, its body as formatted text, and the dates it was first published and last updated.

- given: a page that exists at the address "privacy"
- when: a visitor who is not signed in opens that address
- then: the page's title, its body as formatted text, and its published and updated dates are shown
- test: tests/acceptance/content/R-7.1.spec.ts

**anyone, including a visitor who has not signed in, can read a page by its address and sees its title, its body as formatted text, and the dates it was first published and last updated** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"About us"[39m
Received: [31m"About us[7m — B.C. Digital Marketplace[27m"[39m
```

### R-8.1 · v1

Any person who is signed in may upload a file, and a visitor who is not signed in cannot.

- given: a visitor who is not signed in
- when: they submit a file for upload
- then: the upload is refused as not permitted and no file is stored
- test: tests/acceptance/files/R-8.1.spec.ts

**any person who is signed in may upload a file** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.2 · v1

A vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one.

- given: a vendor who already has a proposal, in any state, against a published opportunity
- when: they start a second proposal against the same opportunity
- then: the request is refused with "You already have a proposal for this opportunity." and no second proposal is created
- test: tests/acceptance/proposals/R-2.2.spec.ts

**a vendor may hold at most one proposal per opportunity, and a second attempt is refused with a message saying they already have one** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.2 · v1

Only a signed-in vendor who has already accepted the service's terms and conditions may register a new organization; a request from anyone else is refused.

- given: a signed-in member of public sector staff and a signed-in vendor who has accepted the terms
- when: each tries to register an organization
- then: the vendor's organization is created and the public sector staff member's request is refused as not permitted
- test: tests/acceptance/organizations/R-3.2.spec.ts

**the vendor's organization is created** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the public sector staff member's request to register an organization is refused as not permitted** — failed

```
Error: unbound: organization-create.create_organization — no control labelled "Create Organization" on http://localhost:3000/organizations/create
```

### R-1.3 · v1

A member of public sector staff sees every published opportunity plus their own drafts and opportunities under review, and an administrator sees every opportunity.

- given: two members of public sector staff, each with an unpublished opportunity of their own
- when: each lists opportunities
- then: each sees their own unpublished opportunity and not the other's, while an administrator listing opportunities sees both
- test: tests/acceptance/opportunities/R-1.3.spec.ts

**a member of public sector staff sees every published opportunity plus their own drafts, and not another staff member's** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.3 draft belonging to the member of staff who is signed in"[39m
Received string:    [31m"51"[39m
```

**an administrator sees every opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.3 draft an administrator must also be able to see"[39m
Received string:    [31m"Dashboard[39m
[31mMy Opportunities[39m
[31mEvaluations[39m
[31mMy Opportunities[39m
[31mView all opportunities[39m
[31mTITLE	STATUS	CREATED·[39m
[31mUntitled[39m
[31mCODE WITH US··[39m
[31mDraft··[39m
[31mSep 14, 2026[39m
[31mROBIN PLACEHOLDER··[39m
[31mUntitled[39m
[31mCODE WITH US··[39m
[31mDraft··[39m
[31mSep 14, 2026[39m
[31mROBIN PLACEHOLDER··[39m
[31mUntitled[39m
… 39 more line(s)
```

### R-2.3 · v1

Submitting a proposal requires the vendor to accept both the program's terms and the service's current terms, and the act of submitting records that acceptance.

- given: a vendor with a complete proposal whose acceptance of the current terms has been reset
- when: they submit the proposal without ticking both the program terms and the service terms
- then: the submit action is unavailable, and a submission that reaches the service anyway is refused
- test: tests/acceptance/proposals/R-2.3.spec.ts

**submitting a proposal requires the vendor to accept both the program's terms and the service's current terms** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the act of submitting a proposal records the vendor's acceptance of the terms** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.3 · v1

An organization's full record can be opened only by an administrator or by a member who owns or administers that organization; anyone else is refused.

- given: an organization with an owner, one administrator and one ordinary member
- when: the ordinary member, and separately a member of public sector staff, opens that organization's management page
- then: both are refused, while the owner, the organization's administrator and a service administrator each see the organization
- test: tests/acceptance/organizations/R-3.3.spec.ts

**the owner sees the organization** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"The Digital Marketplace Terms & Conditions for E-Bidding have been updated. Please save what you are working on, review the latest version and agree to the updated terms."[39m
```

**the organization's administrator sees the organization** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"The Digital Marketplace Terms & Conditions for E-Bidding have been updated. Please save what you are working on, review the latest version and agree to the updated terms."[39m
```

**a service administrator sees the organization** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
Received string:    [31m"Home|[39m
[31mAbout|[39m
[31mDisclaimer|[39m
[31mPrivacy|[39m
[31mAccessibility|[39m
[31mCopyright|[39m
[31mContact Us|[39m
[31mSource Code[39m
[31mOwned and operated by the B.C. Government."[39m
```

### R-1.4 · v1

Every change to an opportunity's content creates a new version of it and records an edit in its history; the opportunity always shows its most recent version.

- given: a published opportunity
- when: an administrator changes its description and saves
- then: the opportunity shows the new description, its history gains an entry recording that it was edited, by whom and when, and the previous content is retained
- test: tests/acceptance/opportunities/R-1.4.spec.ts

**every change to an opportunity's content creates a new version of it and the opportunity always shows its most recent version** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**every change to an opportunity's content records an edit in its history** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.4 · v1

Only a draft proposal can be deleted, and deleting it removes it permanently.

- given: a proposal that has been submitted
- when: its author asks for it to be deleted
- then: the request is refused, whereas deleting a draft succeeds and the proposal can no longer be opened
- test: tests/acceptance/proposals/R-2.4.spec.ts

**a proposal that has been submitted cannot be deleted** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**only a draft proposal can be deleted, and deleting it removes it permanently** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-4.4 · v1

A person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in.

- given: an account an administrator has deactivated
- when: that person signs in through the identity provider
- then: no session is created and they are shown a page saying sign-in failed and inviting them to try again
- test: tests/acceptance/users/R-4.4.spec.ts

**a person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-7.4 · v1

A page can also be read by its identifier, and the service falls back to treating the same value as an address when no page carries that identifier.

- given: a page whose identifier is known
- when: that identifier is used in place of the page's address
- then: the same page is returned
- test: tests/acceptance/content/R-7.4.spec.ts

**a page can also be read by its identifier** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"About us"[39m
Received: [31m"About us[7m — B.C. Digital Marketplace[27m"[39m
```

**the service falls back to treating the same value as an address when no page carries that identifier** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"About us"[39m
Received: [31m"About us[7m — B.C. Digital Marketplace[27m"[39m
```

### R-3.6 · v1

An administrator or an organization's owner may archive the organization, after which it no longer appears in the organization list, cannot be used on proposals, and disappears from its members' lists of organizations; the archiving is recorded with the date and the person who did it.

- given: an active organization with an owner and one other active member
- when: the owner archives it
- then: it is gone from the public organization list, gone from the other member's affiliated organizations, and its record carries the date it was archived and the identity of the person who archived it
- test: tests/acceptance/organizations/R-3.6.spec.ts

**when the owner archives an active organization it is gone from the public organization list** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**when the owner archives an active organization it is gone from the other member's affiliated organizations** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.7 · v2

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- test: tests/acceptance/proposals/R-2.7.spec.ts

**a proposal may be created as a draft, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a proposal may be created as a submission, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-7.7 · v1

An administrator can create a page by giving it a title, an address and a body, and once published it is readable by anyone at that address.

- given: an administrator in the content area
- when: they create a page, fill in its title, address and body, and confirm publishing it
- then: the page exists, they are taken to its managing screen, and any visitor opening its address sees it
- test: tests/acceptance/content/R-7.7.spec.ts

**an administrator can create a page by giving it a title, an address and a body, and once published it is readable by anyone at that address** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"derived-created-mu1em1pc"[39m
Received string:    [31m""[39m
```

### R-8.7 · v1

A file is readable by anyone if it was marked readable by anyone, by a person it names, by anyone holding an account type it names, by whoever uploaded it, and by any administrator.

- given: a file uploaded by one vendor and marked readable by no one else
- when: a second vendor asks for it, and then an administrator asks for it
- then: the second vendor is refused and the administrator receives it
- test: tests/acceptance/files/R-8.7.spec.ts

**a file marked readable by no one else is readable by whoever uploaded it and by any administrator, and refused to another vendor** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a file is readable by anyone if it was marked readable by anyone** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

**a file is readable by a person it names** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

**a file is readable by anyone holding an account type it names** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

### R-7.8 · v1

Publishing a change to a page keeps the text it replaces as an earlier version of that page and shows the new text to every reader from that moment.

- given: a published page an administrator has changed the body of
- when: they confirm publishing the change
- then: readers of the page's address see the new body, the page's updated date becomes the moment of the change, and the replaced title and body are kept as an earlier version
- test: tests/acceptance/content/R-7.8.spec.ts

**publishing a change to a page shows the new text to every reader from that moment, and the page's updated date becomes the moment of the change** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"Updated Jan 7, 2026 9:00 AM[39m
[32mUpdated By"[39m
```

### R-1.9 · v2

An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.

- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- test: tests/acceptance/opportunities/R-1.9.spec.ts

**an opportunity saved as a draft is accepted with incomplete content** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-1.9 draft saved with nothing but a title"[39m
Received string:    [31m"Dashboard[39m
[31mMy Opportunities[39m
[31mEvaluations[39m
[31mMy Opportunities[39m
[31mView all opportunities[39m
[31mTITLE	STATUS	CREATED·[39m
[31mUntitled[39m
[31mCODE WITH US··[39m
[31mDraft··[39m
[31mSep 14, 2026[39m
[31mCASEY PLACEHOLDER··[39m
[31mUntitled[39m
[31mCODE WITH US··[39m
[31mDraft··[39m
[31mSep 14, 2026[39m
[31mCASEY PLACEHOLDER··[39m
[31mUntitled[39m
… 314 more line(s)
```

**a draft whose proposal deadline is missing is given one fourteen days from the day of saving** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3000/opportunities/code-with-us/create
```

### R-2.9 · v1

A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.

- test: tests/acceptance/proposals/R-2.9.spec.ts

**a vendor may read the history of a proposal they authored, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a vendor may read the history of a proposal belonging to an organization they own or administer, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-7.9 · v1

Removing an ordinary page removes it and every version of it permanently, and its address stops answering.

- given: an ordinary page with several versions behind it
- when: an administrator confirms removing it
- then: they are returned to the list of pages, told it was removed, its address is answered as not found, and no version of its text survives anywhere in the service
- test: tests/acceptance/content/R-7.9.spec.ts

**removing an ordinary page removes it, and its address stops answering** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-1.10 · v1

An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit it with a missing title, a title over 200 characters, a teaser over 500 characters, a missing location, or a description that is missing or over 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/opportunities/R-1.10.spec.ts

**an opportunity that is not a draft is rejected when its title is missing** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its title is over 200 characters** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its teaser is over 500 characters** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its location is missing** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its description is missing** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its description is over 10,000 characters** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.10 · v1

A membership can be ended by the member themselves, by the organization's owner or administrators, or by a service administrator; the membership becomes inactive rather than being erased, and the person stops counting towards the organization's team.

- given: an organization with an owner and one further active member
- when: that member chooses to leave the organization
- then: they no longer appear on the organization's team list, the organization's team size falls to one, and the organization is no longer listed among their affiliated organizations
- test: tests/acceptance/organizations/R-3.10.spec.ts

**when an active member chooses to leave, the membership becomes inactive and the person stops counting towards the organization's team** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-7.10 · v1

Only an administrator may create, change or remove a page; the same request from anybody else, signed in or not, changes nothing.

- given: a signed-in vendor, a signed-in public sector employee, and a visitor who is not signed in
- when: each of them asks the service to create, change or remove a page
- then: each request is refused and no page is created, changed or removed
- test: tests/acceptance/content/R-7.10.spec.ts

**a signed-in vendor asking the service to create, change or remove a page is refused, and nothing is created, changed or removed** — failed

```
Error: unbound: content-create.enter_title — no field labelled "Title" on http://localhost:3000/content/create
```

**a signed-in public sector employee asking the service to create, change or remove a page is refused, and nothing is created, changed or removed** — failed

```
Error: unbound: content-create.enter_title — no field labelled "Title" on http://localhost:3000/content/create
```

**a visitor who is not signed in asking the service to create, change or remove a page is refused, and nothing is created, changed or removed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"About us"[39m
Received: [31m"About us[7m — B.C. Digital Marketplace[27m"[39m
```

### R-8.10 · v1

Asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display.

- given: a stored file named "terms.pdf" that the requester may read
- when: they ask for it with its content requested
- then: the bytes are returned, described as a PDF, and named "terms.pdf" for saving
- test: tests/acceptance/files/R-8.10.spec.ts

**asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

### R-1.11 · v1

An opportunity that is not a draft must state whether remote work is acceptable, and must carry a remote-work description of up to 500 characters whenever remote work is acceptable.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they mark it as accepting remote work but leave the remote-work description empty
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.11.spec.ts

**an opportunity that is not a draft must state whether remote work is acceptable** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that accepts remote work must carry a remote-work description** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a remote-work description of more than 500 characters is rejected** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-8.11 · v1

Asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored — under the same permission rules as the content itself.

- given: a stored file the requester may read
- when: they ask for it without requesting its content
- then: its identifier, name and stored date are returned, and its content is not
- test: tests/acceptance/files/R-8.11.spec.ts

**a description of a file is given under the same permission rules as the content itself** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

### R-1.12 · v1

A Code With Us opportunity must offer a reward of at least $1 and at most $70,000, and must name at least one skill.

- given: a member of public sector staff creating or editing a Code With Us opportunity that is not a draft
- when: they submit a reward outside $1 to $70,000, or submit no skills
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.12.spec.ts

**a Code With Us opportunity offering a reward below one dollar is rejected** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Code With Us opportunity offering a reward above seventy thousand dollars is rejected** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Code With Us opportunity naming no skill is rejected** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.12 · v1

A proposal saved as a draft is accepted however incomplete it is, but its attachments are checked even in draft.

- given: a vendor filling in a new proposal with most fields still blank
- when: they save it as a draft, attaching a file that does not exist
- then: no content validation error is raised for the blank fields, and the save is refused only because of the attachment
- test: tests/acceptance/proposals/R-2.12.spec.ts

**a proposal saved as a draft is accepted however incomplete it is** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
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
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Profile[39m
[31mNotifications[39m
[31mCasey Placeholder[39m
[31mStatus[39m
[31mActive[39m
[31mAccount Type[39m
[31mPublic Sector Employee[39m
[31mPermission(s)[39m
[31mAdmin[39m
[31mProfile Information[39m
[31mProfile Picture (Optional)[39m
[31mIDIR[39m
[31mName[39m
[31mJob Title[39m
[31mEmail Address"[39m
```

### R-7.12 · v1

A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it.

- given: a newly prepared installation of the service that nobody has edited and an administrator looking at the list of pages on that installation
- when: a visitor opens any of the pages the service needs, such as its terms and conditions and they read it
- then: the page exists and answers, its title is its own address, and its body reads "Initial version" and twenty-two pages are listed, all marked as needed by the service
- test: tests/acceptance/content/R-7.12.spec.ts

**a page the service needs exists and answers, its title is its own address, and its body holds placeholder text until somebody writes it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"copyright"[39m
Received: [31m"copyright[7m — B.C. Digital Marketplace[27m"[39m
```

### R-8.12 · v1

A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.

- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- test: tests/acceptance/files/R-8.12.spec.ts

**a request for a file the requester may not read is answered as not authorized** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

**a request for a file that does not exist is answered as not authorized** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

**a request for a file that does not exist is answered as not found when the requester is an administrator** — failed

```
Error: open() of /api/files/:fileId?type=blob was called without a value for ":fileId" (given: {"fileId":""})
```

### R-2.13 · v1

A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.

- given: a vendor submitting a Code With Us proposal
- when: the proposal text is empty or longer than 10,000 characters, or the additional comments are longer than 10,000 characters
- then: the submission is rejected and the offending field is named in the response
- test: tests/acceptance/proposals/R-2.13.spec.ts

**a Code With Us proposal that is not a draft is rejected when its proposal text is empty** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Code With Us proposal that is not a draft is rejected when its proposal text is longer than 10,000 characters** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Code With Us proposal that is not a draft is rejected when its additional comments are longer than 10,000 characters** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Code With Us proposal that is not a draft is rejected when it carries no complete proponent** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.13 · v1

Only a service administrator may transfer ownership of an organization, and only to a member whose membership is already active; the previous owner becomes an ordinary member.

- given: an organization with an owner, one active member and one member whose invitation is still pending
- when: an administrator transfers ownership to the active member
- then: that member becomes the organization's owner, the previous owner becomes an ordinary member, and the pending member cannot be chosen as the new owner
- test: tests/acceptance/organizations/R-3.13.spec.ts

**an administrator transfers ownership to the active member, who becomes the owner while the previous owner becomes an ordinary member** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**the pending member cannot be chosen as the new owner** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-8.13 · v1

A profile picture or an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, and one taller than 500 pixels is shortened to 500 pixels, in both cases keeping its proportions.

- given: a signed-in person choosing a new profile picture
- when: they upload an image 2000 pixels wide and 300 pixels tall
- then: it is stored 500 pixels wide, still in its original proportions
- test: tests/acceptance/files/R-8.13.spec.ts

**a profile picture wider than 500 pixels is narrowed to 500 pixels before it is stored, keeping its proportions** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m500[39m
Received: [31mNaN[39m
```

**a profile picture taller than 500 pixels is shortened to 500 pixels before it is stored, keeping its proportions** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m75[39m
Received: [31mNaN[39m
```

**an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, keeping its proportions** — failed

```
Error: unbound: organization-edit.edit_organization — no control labelled "Edit Organization" on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000301/edit?tab=organization
```

### R-1.14 · v1

An opportunity's key dates must run in order — the proposal deadline no earlier than today, then the assignment date, then the start date, then the completion date — and each date is recorded as 4:00 p.m. Pacific time on the day chosen.

- given: a member of public sector staff creating or editing an opportunity that is not a draft
- when: they submit a proposal deadline in the past, or any later date that falls before the date preceding it
- then: the submission is rejected
- test: tests/acceptance/opportunities/R-1.14.spec.ts

**an opportunity that is not a draft is rejected when its proposal deadline is earlier than today** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its assignment date falls before its proposal deadline** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its start date falls before its assignment date** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**an opportunity that is not a draft is rejected when its completion date falls before its start date** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**each of an opportunity's key dates is recorded as four o'clock in the afternoon on the day chosen** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.14 · v2

A Code With Us proponent is either a named individual carrying a legal name, an email address and a full postal address, each field validated in turn, or an organization identified by id and checked only for existence and active status, since the service does not verify that the vendor belongs to the organization they name.

- given: a vendor submitting a Code With Us proposal as an individual
- when: the legal name, email address, street address, city, province, postal code or country is missing, or the email address or phone number is malformed
- then: the submission is rejected and each offending field is named in the response
- test: tests/acceptance/proposals/R-2.14.spec.ts

**a Code With Us proponent named as an individual carries a legal name, an email address and a full postal address, each field validated in turn** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Code With Us proponent named as an organization is checked only for existence and active status** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-3.14 · v1

The list of an organization's team members can be read only by a service administrator or by someone who owns or administers that organization.

- given: an organization with an owner and one ordinary member
- when: that ordinary member, and separately a vendor unconnected to the organization, asks for the organization's team list
- then: both are refused, while the owner and a service administrator receive the list
- test: tests/acceptance/organizations/R-3.14.spec.ts

**the ordinary member asking for the organization's team list is refused** — failed

```
Error: unbound: organization-edit.team_member_row — no tab labelled "Team" on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000301/edit
```

**a vendor unconnected to the organization asking for its team list is refused** — failed

```
Error: unbound: organization-edit.team_member_row — no tab labelled "Team" on http://localhost:3000/organizations/00000000-0000-4000-8000-000000000301/edit
```

**the owner receives the organization's team list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a service administrator receives the organization's team list** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.14 · v1

A profile picture or logo that cannot be read as an image is stored as it was uploaded rather than refused.

- given: a signed-in person with a file that is not an image but is named "portrait.png"
- when: they upload it as their profile picture
- then: the resizing step fails quietly, the file is stored unchanged, and it is set as their profile picture
- test: tests/acceptance/files/R-8.14.spec.ts

**a profile picture or logo that cannot be read as an image is stored as it was uploaded rather than refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m"/images/logo.svg"[39m
```

### R-3.15 · v1

The organizations a vendor may act on behalf of are those they own and those they administer, excluding any that have been archived.

- given: a vendor who owns one organization, administers a second, is an ordinary member of a third, and owns a fourth that has been archived
- when: they ask for the organizations they can act for
- then: the first two are returned and the third and fourth are not
- test: tests/acceptance/organizations/R-3.15.spec.ts

**the organizations a vendor owns are returned, and an archived one they own is not** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Salt Marsh Labs Ltd."[39m
Received string:    [31m"Northern Pines Digital Ltd."[39m
```

**an organization a vendor administers is returned** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"Northern Pines Digital Ltd."[39m
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

The question was which of the 40 failing criteria on this page this project's own old-target adapter caused. Ruling: approve, with one triage line per criterion (39 adapter-wrong, 1 product-question). The reason is in the saved page snapshots and call logs under tests/test-results. Every timed-out test stalled clicking a disabled anchor (tabindex=-1). It was disabled because opportunityCwuCreate.publish, saveDraft and organizationCreate.createOrganization drop their input and the form was never filled, and press() does not refuse a disabled control. The content tests typed an empty slug and body because asText() never reads the slug or body keys. contentView.pageTitle returns the browser tab title. fileDownload.downloadFile() discards the id given to open(), even after uploads that succeeded. Several readers read the wrong region or read before the page finished loading. R-8.1 goes to the product owner because nothing points at the adapter: the page shows it failing, but the run's own results file records both of its tests as passing, and uploads through the same code passed in R-8.2, R-8.5 and R-8.6. What would change this ruling: a fresh run with these adapter defects fixed that still fails a criterion at the same assertion. That criterion would then be a product question, and it would come back on the next page.

**Conditions:**
- adapter-wrong R-2.1: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input (title, teaser, location, description, remoteOk, reward, skills, dates), and press() clicks the Publish anchor while it is disabled (tabindex=-1, class disabled), retrying until the 120 s timeout. Fill the fields from the input, and have press() fail at once on a disabled control instead of clicking it.
- adapter-wrong R-3.1: organizationList.organizationName() uses textUnder('', 'Organization Name'), which returns only the first body row's cell ('Broken Compass Delivery Ltd.'). It must return every name in that column, in page order.
- adapter-wrong R-7.1: contentView.pageTitle() returns page.title(), the browser tab title ('About us — B.C. Digital Marketplace'). It must read the page's own heading text.
- product-question R-8.1
- adapter-wrong R-2.2: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out. proposalCwuCreate.saveDraft(input) likewise drops proposalText.
- adapter-wrong R-3.2: organizationCreate.createOrganization(input) never fills Legal Name, address and contact fields from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout. For public sector staff it throws unbound when the create page is withheld, instead of letting the refusal be observed.
- adapter-wrong R-1.3: opportunityCwuCreate.saveDraft(input) drops the title, so drafts are saved as 'Untitled' (the dashboard shows rows of Untitled drafts). allOpportunitiesForAdministrator reads only the administrator's own 'My Opportunities' tab rather than a list of every opportunity.
- adapter-wrong R-2.3: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-3.3: organizationEdit.organizationTab() reads the page before it has rendered. For the service administrator the snapshot shows heading 'Northern Pines Digital Ltd.', but the reader returned only the footer; for the owner and the organization admin it read while the page showed 'Loading...'. Wait for the tab's content to appear before reading it.
- adapter-wrong R-1.4: opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out. opportunityCwuEdit.editDetails(input) also ignores the description it is given.
- adapter-wrong R-2.4: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out. proposalCwuCreate.saveDraft/submitProposal also drop proposalText.
- adapter-wrong R-4.4: signIn() always uses the persona's session-route (/auth/createsessionvendor/5), which minted a session for the deactivated account and landed on the Dashboard. It bypassed the identity provider the criterion names. For a sign-in that is meant to be refused, use the persona's sandbox-idp entry.
- adapter-wrong R-7.4: contentView.pageTitle() returns page.title(), the browser tab title ('About us — B.C. Digital Marketplace'). It must read the page's own heading text.
- adapter-wrong R-3.6: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-2.7: publishCodeWithUs's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out. The Sprint With Us and Team With Us create publish and the proposal saveDraft/submitProposal share the same dropped input.
- adapter-wrong R-7.7: contentCreate.enterSlug and enterBody send an empty string because asText() only reads the value/name/text/title/label/answer/score/id keys and never slug or body. The snapshot shows Slug and Body blank, so resultingPublicAddress() finds nothing.
- adapter-wrong R-8.7: fileDownload.downloadFile() ignores the fileId passed to fileDownload.open() and rebuilds the address from its own missing input, throwing 'called without a value for :fileId'. It must reuse the file opened.
- adapter-wrong R-7.8: contentEdit.editBody sends an empty string because asText() never reads the body key. The page then shows 'Body must be between 1 and 50000 characters long.' and nothing publishes. contentEdit.updatedDate() also matches the 'Updated By' label along with the date.
- adapter-wrong R-1.9: opportunityCwuCreate.saveDraft(input) drops the title, so the draft is saved as 'Untitled'. opportunityCwuEdit.opportunityIdentifier() is read while Save Draft still shows 'Loading...' and the address is still /opportunities/code-with-us/create. Wait for the save to finish.
- adapter-wrong R-2.9: publishAllThree's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-7.9: contentCreate.enterSlug and enterBody send an empty string (asText() never reads slug or body), so Publish stays disabled, and press() clicks the disabled Publish anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-1.10: opportunityCwuCreate.publish(input) never fills the form from its input, so the one invalid field under test is never entered, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-3.10: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-7.10: contentView.pageTitle() returns page.title(), the browser tab title ('About us — B.C. Digital Marketplace'), not the page's own heading.
- adapter-wrong R-8.10: fileDownload.downloadFile() ignores the fileId passed to fileDownload.open() and throws 'called without a value for :fileId'. It must reuse the file opened.
- adapter-wrong R-1.11: opportunityCwuCreate.publish(input) never fills the form from its input (remoteOk, remoteDescription and the rest), and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-8.11: fileDownload.downloadFile() ignores the fileId passed to fileDownload.open() and throws 'called without a value for :fileId' after the upload and description checks succeeded. It must reuse the file opened.
- adapter-wrong R-1.12: opportunityCwuCreate.publish(input) never fills the form from its input (reward, skills and the rest), and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-2.12: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-4.12: userProfile.notFoundPage() returns the whole page text, so any rendered profile reads as a not-found page. It must return something only when the Not Found screen is shown.
- adapter-wrong R-7.12: contentView.pageTitle() returns page.title(), the browser tab title ('copyright — B.C. Digital Marketplace'). It must read the page's own heading text.
- adapter-wrong R-8.12: fileDownload.downloadFile() ignores the fileId passed to fileDownload.open() and throws 'called without a value for :fileId', even when open() was given the seeded identifier. It must reuse the file opened.
- adapter-wrong R-2.13: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out. proposalCwuCreate.submitProposal also drops proposalText and additionalComments.
- adapter-wrong R-3.13: organizationCreate.createOrganization(input) never fills the form from its input, then clicks the disabled 'Create Organization' anchor (tabindex=-1) until the 120 s timeout.
- adapter-wrong R-8.13: storedImageWidth/Height are read while Save Changes still shows 'Loading...', and only an img whose src contains /api/ is looked for, so no stored picture is found. organizationEdit.editOrganization presses 'Edit Organization' while the organization page still shows 'Loading...', though R-3.3's administrator snapshot shows that control in the nav bar.
- adapter-wrong R-1.14: opportunityCwuCreate.publish(input) never fills the form from its input (the four dates and the rest), and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out.
- adapter-wrong R-2.14: publishOpportunity's opportunityCwuCreate.publish(input) never fills the form from its input, and press() clicks the disabled Publish anchor (tabindex=-1) until the test times out. proposalCwuCreate.chooseProponentIndividual(input) also ignores the individual's details.
- adapter-wrong R-3.14: organizationEdit.teamMemberRow() calls openTab, which throws unbound when the Team tab is withheld from the ordinary member and the unconnected vendor. It should read '' as tabContent does. For the owner and the administrator it reads the table before the page has loaded (snapshot shows 'Loading...').
- adapter-wrong R-8.14: fileImagePicker.currentImage() returns the first img on the page, the site header logo '/images/logo.svg', rather than the profile picture, and reads it while Save Changes still shows 'Loading...'.
- adapter-wrong R-3.15: after myOrganizations the page is the profile Organizations tab, whose Owned and Affiliated tables are headed 'Legal Name', but organizationName() reads only one cell under 'Organization Name'. It returned a single name on the public list and '' on this tab, where the snapshot lists 'Northern Pines Digital Ltd.'.
