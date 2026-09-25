---
gate: G3
question: "78 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-5.1, R-8.1, R-1.2, R-3.2, R-6.2, R-8.2, R-3.3, R-6.5, R-7.5, R-8.5, R-4.6, R-7.6, R-8.6, R-1.7, R-8.7, R-4.8, R-1.9, R-4.9, R-5.9, R-1.10, R-8.10, R-8.11, R-3.12, R-7.12, R-8.12, R-3.13, R-8.13, R-2.14, R-3.14, R-4.14, R-8.14, R-3.15, R-1.16, R-4.17, R-7.17, R-4.18, R-2.19, R-3.20, R-4.20, R-6.20 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-25T19:23:57.063Z
---

# 78 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-5.1, R-8.1, R-1.2, R-3.2, R-6.2, R-8.2, R-3.3, R-6.5, R-7.5, R-8.5, R-4.6, R-7.6, R-8.6, R-1.7, R-8.7, R-4.8, R-1.9, R-4.9, R-5.9, R-1.10, R-8.10, R-8.11, R-3.12, R-7.12, R-8.12, R-3.13, R-8.13, R-2.14, R-3.14, R-4.14, R-8.14, R-3.15, R-1.16, R-4.17, R-7.17, R-4.18, R-2.19, R-3.20, R-4.20, R-6.20 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

78 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

The 40 below are the ones to sort now; the remaining 38 come back on the next run.

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

### R-8.1 · v1

Any person who is signed in may upload a file, and a visitor who is not signed in cannot.

- given: a visitor who is not signed in
- when: they submit a file for upload
- then: the upload is refused as not permitted and no file is stored
- test: tests/acceptance/files/R-8.1.spec.ts

**any person who is signed in may upload a file** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/api/files", waiting until "domcontentloaded"[22m

```

### R-1.2 · v1

An anonymous visitor or a vendor sees only opportunities that have been published; drafts and opportunities under review are not listed to them and cannot be opened by them.

- given: an opportunity in draft or under review
- when: an anonymous visitor or a vendor lists opportunities, or opens that opportunity's address directly
- then: the opportunity does not appear in the list, and opening it directly reports that it was not found
- test: tests/acceptance/opportunities/R-1.2.spec.ts

**an anonymous visitor or a vendor cannot open a draft or an opportunity under review** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/auth/createsessionvendor/1", waiting until "domcontentloaded"[22m

```

### R-3.2 · v1

Only a signed-in vendor who has already accepted the service's terms and conditions may register a new organization; a request from anyone else is refused.

- given: a signed-in member of public sector staff and a signed-in vendor who has accepted the terms
- when: each tries to register an organization
- then: the vendor's organization is created and the public sector staff member's request is refused as not permitted
- test: tests/acceptance/organizations/R-3.2.spec.ts

**the vendor's organization is created** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/organizations/create", waiting until "domcontentloaded"[22m

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

### R-8.2 · v1

An upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission.

- given: a signed-in person with a document to upload
- when: they submit the document together with a name and a read-access statement
- then: the file is stored and its record — its identifier, its name and the date it was stored — is returned
- test: tests/acceptance/files/R-8.2.spec.ts

**an upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3102/api/files", waiting until "domcontentloaded"[22m

```

### R-3.3 · v1

An organization's full record can be opened only by an administrator or by a member who owns or administers that organization; anyone else is refused.

- given: an organization with an owner, one administrator and one ordinary member
- when: the ordinary member, and separately a member of public sector staff, opens that organization's management page
- then: both are refused, while the owner, the organization's administrator and a service administrator each see the organization
- test: tests/acceptance/organizations/R-3.3.spec.ts

**an organization's full record cannot be opened by an ordinary member of that organization** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/organizations/00000000-0000-4000-8000-000000000301/edit", waiting until "domcontentloaded"[22m

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

### R-7.5 · v1

Only an administrator can see the list of pages, and it names every page with its title, its public address, whether the service needs it, and when it was created and last updated, ordered by title.

- given: an administrator signed in, and pages existing in the service
- when: they open the content area from the navigation menu
- then: every page is listed once, in order of title, showing its title, its public address, whether it is one the service needs, and its created and updated dates
- test: tests/acceptance/content/R-7.5.spec.ts

**only an administrator can see the list of pages** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3102/content", waiting until "domcontentloaded"[22m

```

### R-8.5 · v1

Two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access.

- given: a file already stored by one person
- when: a second person uploads a file with byte-for-byte identical content under a different name
- then: a second, separate record is created that shares the stored content, and the second person's read access does not extend to the first record
- test: tests/acceptance/files/R-8.5.spec.ts

**two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/api/files", waiting until "domcontentloaded"[22m

```

### R-4.6 · v1

A person may hold only one account for a given identity and kind, and two accounts of the same kind may not share an email address.

- given: an existing vendor account using a given email address
- when: a second vendor signs in for the first time carrying the same email address, or an existing vendor edits their profile to that address
- then: neither the new account nor the change is saved
- test: tests/acceptance/users/R-4.6.spec.ts

**two accounts of the same kind may not share an email address, so a vendor's change to an address another vendor holds is not saved** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/users/me", waiting until "domcontentloaded"[22m

```

### R-7.6 · v1

The route into the content area is offered only to an administrator, and anybody else who reaches any of the managing screens directly is shown the not-found screen.

- given: a signed-in vendor or public sector employee
- when: they look at the navigation menu, and then open the address of the content area directly
- then: no route into the content area is offered to them, and opening it directly shows the not-found screen
- test: tests/acceptance/content/R-7.6.spec.ts

**a signed-in vendor who reaches any of the managing screens directly is shown the not-found screen** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/content", waiting until "domcontentloaded"[22m

```

### R-8.6 · v1

Every stored file records who uploaded it and when, and neither can be changed afterwards.

- given: a signed-in person
- when: they upload a file
- then: the file is permanently marked as theirs and stamped with the moment it was stored
- test: tests/acceptance/files/R-8.6.spec.ts

**every stored file records who uploaded it and when, and neither can be changed afterwards** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/api/files", waiting until "domcontentloaded"[22m

```

### R-1.7 · v1

Only signed-in public sector staff and administrators may create an opportunity; a request from a vendor or an anonymous visitor is refused.

- given: a visitor who is not signed in, or is signed in as a vendor
- when: they attempt to create an opportunity
- then: the request is refused and no opportunity is created
- test: tests/acceptance/opportunities/R-1.7.spec.ts

**an anonymous visitor's attempt to create an opportunity is refused and no opportunity is created** — failed

```
Error: unbound: opportunity-cwu-create.save_draft — no field on http://localhost:3100/opportunities/code-with-us/create takes "title"
```

**a vendor's attempt to create an opportunity is refused and no opportunity is created** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/opportunities/code-with-us/create", waiting until "domcontentloaded"[22m

```

### R-8.7 · v1

A file is readable by anyone if it was marked readable by anyone, by a person it names, by anyone holding an account type it names, by whoever uploaded it, and by any administrator.

- given: a file uploaded by one vendor and marked readable by no one else
- when: a second vendor asks for it, and then an administrator asks for it
- then: the second vendor is refused and the administrator receives it
- test: tests/acceptance/files/R-8.7.spec.ts

**a file marked readable by no one else is readable by whoever uploaded it and by any administrator, and refused to another vendor** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/api/files", waiting until "domcontentloaded"[22m

```

**a file is readable by anyone if it was marked readable by anyone** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/api/files", waiting until "domcontentloaded"[22m

```

**a file is readable by a person it names** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/api/files", waiting until "domcontentloaded"[22m

```

**a file is readable by anyone holding an account type it names** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/api/files", waiting until "domcontentloaded"[22m

```

### R-4.8 · v1

A vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile, and only they may change them.

- given: a vendor with no capabilities recorded and an administrator viewing that vendor's profile
- when: the vendor turns two capabilities on and the administrator tries to turn a third on
- then: the vendor's two capabilities are saved and shown as held, and the administrator is offered no working control
- test: tests/acceptance/users/R-4.8.spec.ts

**a vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3102/users/me?tab=capabilities", waiting until "domcontentloaded"[22m

```

**only the vendor may change their capabilities, so an administrator viewing that vendor's profile is offered no working control** — failed

```
Error: unbound: user-profile-self-capabilities.capability_checked — whether a capability is held is shown only by the colour and shape of an unlabelled icon; the row carries no text, no checkbox and no state in the accessibility tree
```

### R-1.9 · v2

An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.

- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- test: tests/acceptance/opportunities/R-1.9.spec.ts

**a draft whose proposal deadline is missing is given one fourteen days from the day of saving** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"9"[39m
Received string:    [31m"Closed Oct 8, 2026 at 4:00 PM PDT"[39m
```

### R-4.9 · v1

A person may deactivate their own account, which ends their session at once, records the date, marks the account as deactivated by them, tells them by email and keeps the record rather than erasing it.

- given: a signed-in person on their own profile
- when: they choose to deactivate their account and confirm
- then: they are signed out, shown a page confirming the deactivation, sent a message telling them they can return by signing in again, and their account is kept with the date of deactivation and the fact that they did it themselves
- test: tests/acceptance/users/R-4.9.spec.ts

**a person may deactivate their own account, which ends their session at once** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/users/me", waiting until "domcontentloaded"[22m

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

### R-8.10 · v1

Asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display.

- given: a stored file named "terms.pdf" that the requester may read
- when: they ask for it with its content requested
- then: the bytes are returned, described as a PDF, and named "terms.pdf" for saving
- test: tests/acceptance/files/R-8.10.spec.ts

**asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/api/files", waiting until "domcontentloaded"[22m

```

### R-8.11 · v1

Asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored — under the same permission rules as the content itself.

- given: a stored file the requester may read
- when: they ask for it without requesting its content
- then: its identifier, name and stored date are returned, and its content is not
- test: tests/acceptance/files/R-8.11.spec.ts

**asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/api/files", waiting until "domcontentloaded"[22m

```

**a description of a file is given under the same permission rules as the content itself** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/api/files", waiting until "domcontentloaded"[22m

```

### R-3.12 · v1

An organization's owner, its administrators and a service administrator may grant or withdraw administrator rights over the organization to an active member, but nobody may change their own rights and the owner's own membership cannot be changed this way.

- given: an organization with an owner and two other active members, one of whom already has administrator rights
- when: the owner grants administrator rights to the second member, that administrator tries to withdraw their own rights, and someone tries to change the owner's
- then: the second member gains administrator rights, and both the self-change and the change to the owner are refused
- test: tests/acceptance/organizations/R-3.12.spec.ts

**nobody may change their own administrator rights over the organization** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/organizations/00000000-0000-4000-8000-000000000301/edit", waiting until "domcontentloaded"[22m

```

**the owner's own membership cannot be changed by granting or withdrawing administrator rights** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/organizations/00000000-0000-4000-8000-000000000301/edit", waiting until "domcontentloaded"[22m

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
[31mPublished Sep 25, 2026 11:36 AM[39m
[31m|[39m
[31mUpdated Sep 25, 2026 11:36 AM·[39m
[31mInitial version"[39m
```

### R-8.12 · v1

A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.

- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- test: tests/acceptance/files/R-8.12.spec.ts

**a request for a file the requester may not read is answered as not authorized** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3102/api/files", waiting until "domcontentloaded"[22m

```

**a request for a file that does not exist is answered as not authorized** — failed

```
Error: unbound: file-download.open — http://localhost:3102/api/files/00000000-0000-4000-8000-000000000601?type=blob could not be reached (TimeoutError: apiRequestContext.get: Timeout 15000ms exceeded.
Call log:
[2m  - → GET http://localhost:3102/api/files/00000000-0000-4000-8000-000000000601?type=blob[22m
[2m    - user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - cookie: sid=s%3Ade83e0cd-7618-4c76-815b-97f7db2c1353.xuyit6c6KMxswj%2Fl2AO8bTIiz3OPmwucmQXgnFJs4RM[22m
)
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

### R-8.13 · v1

A profile picture or an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, and one taller than 500 pixels is shortened to 500 pixels, in both cases keeping its proportions.

- given: a signed-in person choosing a new profile picture
- when: they upload an image 2000 pixels wide and 300 pixels tall
- then: it is stored 500 pixels wide, still in its original proportions
- test: tests/acceptance/files/R-8.13.spec.ts

**a profile picture taller than 500 pixels is shortened to 500 pixels before it is stored, keeping its proportions** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/users/me", waiting until "domcontentloaded"[22m

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

### R-3.14 · v1

The list of an organization's team members can be read only by a service administrator or by someone who owns or administers that organization.

- given: an organization with an owner and one ordinary member
- when: that ordinary member, and separately a vendor unconnected to the organization, asks for the organization's team list
- then: both are refused, while the owner and a service administrator receive the list
- test: tests/acceptance/organizations/R-3.14.spec.ts

**the ordinary member asking for the organization's team list is refused** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/organizations/00000000-0000-4000-8000-000000000301/edit", waiting until "domcontentloaded"[22m

```

**a vendor unconnected to the organization asking for its team list is refused** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/organizations/00000000-0000-4000-8000-000000000301/edit", waiting until "domcontentloaded"[22m

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
Error: unbound: signIn.deactivated-vendor — SDLC_SANDBOX_PASSWORD is not set, so there is no password to sign in with
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

### R-8.14 · v1

A profile picture or logo that cannot be read as an image is stored as it was uploaded rather than refused.

- given: a signed-in person with a file that is not an image but is named "portrait.png"
- when: they upload it as their profile picture
- then: the resizing step fails quietly, the file is stored unchanged, and it is set as their profile picture
- test: tests/acceptance/files/R-8.14.spec.ts

**a profile picture or logo that cannot be read as an image is stored as it was uploaded rather than refused** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/users/00000000-0000-4000-8000-000000000206", waiting until "domcontentloaded"[22m

```

### R-3.15 · v1

The organizations a vendor may act on behalf of are those they own and those they administer, excluding any that have been archived.

- given: a vendor who owns one organization, administers a second, is an ordinary member of a third, and owns a fourth that has been archived
- when: they ask for the organizations they can act for
- then: the first two are returned and the third and fourth are not
- test: tests/acceptance/organizations/R-3.15.spec.ts

**the organizations a vendor may act on behalf of are those they own and those they administer, excluding any that have been archived** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/organizations/create", waiting until "domcontentloaded"[22m

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

### R-4.17 · v1

Signing out ends the person's session both with the service and with the identity provider, and the person is told they have been signed out or, if it could not be done, that it failed.

- given: a signed-in person
- when: they sign out
- then: they are told they have successfully signed out, their session no longer exists, and the pages that require signing in send them back to sign in
- test: tests/acceptance/users/R-4.17.spec.ts

**signing out ends the person's session with the service, and the person is told they have been signed out** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3100/users/me", waiting until "domcontentloaded"[22m

```

### R-7.17 · v1

A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it.

- test: tests/acceptance/content/R-7.17.spec.ts

**the same body renders identically on the page's own address and wherever another screen embeds it** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"[7msprint-with-us-opportunity-scope Published Sep 25, 2026 11:36 AM | Updated Sep 25, 2026 11:36 AM [27mFormatting marks make these words bold. Raw markup tries to make these words bold and these words emphasised."[39m
Received: [31m"Formatting marks make these words bold. Raw markup tries to make [7m<strong>[27mthese words bold[7m</strong>[27m and [7m<em>[27mthese words emphasised[7m</em>[27m."[39m
```

### R-4.18 · v1

A person's profile details - name, email address, job title and picture - may be changed only by that person. An administrator viewing somebody else's profile is offered no editing control, and the service refuses a profile change submitted against an account that is not the requester's own; an administrator's powers over another person's account are limited to deactivating it, reactivating it, and granting or withdrawing administrator rights.

- test: tests/acceptance/users/R-4.18.spec.ts

**a person's profile details may be changed only by that person, so an administrator viewing somebody else's profile is offered no editing control** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/users/00000000-0000-4000-8000-000000000201", waiting until "domcontentloaded"[22m

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
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

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
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not visible[22m
[2m    - retrying click action[22m
[2m      - waiting 100ms[22m
[2m    29 × waiting for element to be visible, enabled and stable[22m
[2m       - element is not visible[22m
[2m     - retrying click action[22m
[2m       - waiting 500ms[22m

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
Received string:      [31m"Digital Marketplace [http://localhost:4300/images/logo_test.png]http://localhost:4300Your Account Has Been ReactivatedYou have[39m
[31m[7msuccessfully reactivated[27m your Digital Marketplace account.Sign In [http://localhost:4300/sign-in]Unsubscribe[39m
[31m[http://localhost:4300/users/me?tab=notifications&unsubscribe]"[39m
```

**the message telling a person they reactivated the account themselves is sent when they did so by signing in again** — failed

```
Error: unbound: signIn.self-reactivating-vendor — /auth/createsessionvendor/13 reaches this account, but it creates a session without the identity provider and without looking at the account's status, so it is not the sign-in that reactivates a self-deactivated account. The oracle has no identity provider to sign in through, so the ordinary sign-in this persona exists for cannot happen there.
```

### R-6.20 · v1

A newly created account has new-opportunity notifications off until its holder asks for them.

- given: a person signing in to the service for the first time
- when: their account is created
- then: it records no request for new-opportunity notices, and none is sent to them until they ask
- test: tests/acceptance/notifications/R-6.20.spec.ts

**A newly created account has new-opportunity notifications off until its holder asks for them.** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3101/users/me?tab=notifications", waiting until "domcontentloaded"[22m

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

