---
gate: G1
question: "Which of the organizations criteria that are still inferred or open become the contract?"
recommendation: "14 criterion(s) in organizations are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them."
opened: 2026-09-07T03:42:43.479Z
---

# Which of the organizations criteria that are still inferred or open become the contract?

**Recommendation.** 14 criterion(s) in organizations are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

14 criterion(s) in the **organizations** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-organizations-2 · v1 · inferred · recovered

In the organization list, the owner's name and the organization's qualification status are shown only to an administrator and to the viewer's own organizations; every other viewer sees the organization's name alone.

- reconciliation: implemented-only
- given: an organization owned by one vendor
- when: a different vendor, who is neither its owner nor one of its administrators, opens the organization list
- then: that organization's row shows its legal name only, with no owner, no team size and no qualification marks, while the same row shown to an administrator carries all of them
- cites: src/back-end/lib/db/organization.ts:502
- cites: src/back-end/lib/db/organization.ts:251
- cites: src/front-end/typescript/lib/pages/organization/list.tsx:163
- cites: src/front-end/typescript/lib/pages/organization/list.tsx:204
- note: the owner and qualification columns are hidden entirely from a visitor who is not signed in and from public sector staff, so only vendors and administrators ever see them.

### D-organizations-4 · v1 · inferred · recovered

Registering an organization requires a legal name, street address, city, region, mail code, country, contact name and contact email, each no longer than one hundred characters, with the contact email in a valid email format; a website address, second address line, contact title and contact phone number may be left out but are rejected if given in an invalid format.

- reconciliation: implemented-only
- given: a signed-in vendor filling in the organization registration form
- when: they submit it with the legal name left blank, or with a contact email of "not-an-email"
- then: the organization is not created and the offending field is reported as invalid, while the same submission with the optional website, second address line, contact title and phone left empty succeeds
- cites: src/shared/lib/validation/organization.ts:10
- cites: src/shared/lib/validation/organization.ts:56
- cites: src/shared/lib/validation/organization.ts:60
- cites: src/shared/lib/validation/index.ts:218
- cites: src/shared/lib/validation/index.ts:423
- cites: src/shared/lib/validation/index.ts:436
- cites: src/back-end/docs/organization.yaml:102
- note: the published interface description lists the same set of fields but says nothing about which are required or how long they may be, so the required/optional split and the hundred-character limit rest on the code alone.

### D-organizations-5 · v1 · inferred · recovered

The vendor who registers an organization becomes its owner immediately, and the organization is active from the moment it is registered.

- reconciliation: implemented-only
- given: a signed-in vendor with no organizations
- when: they register a new organization
- then: the organization appears under their owned organizations with them recorded as its owner and its team counted as one member, and they are taken to that organization's management page
- cites: src/back-end/lib/db/organization.ts:595
- cites: src/back-end/lib/db/organization.ts:618
- cites: src/front-end/typescript/lib/pages/organization/create.tsx:148

### D-organizations-10 · v1 · inferred · recovered

When an administrator archives an organization they do not own, its owner is told by email that the organization has been archived.

- reconciliation: implemented-only
- given: an active organization owned by a vendor
- when: an administrator archives it
- then: the owner receives a message telling them their organization has been archived by an administrator and that they can no longer use it, and no such message is sent when the owner archives their own organization
- cites: src/back-end/lib/resources/organization.ts:692
- cites: src/back-end/lib/mailer/notifications/organization.tsx:11
- cites: src/back-end/lib/mailer/notifications/organization.tsx:32

### D-organizations-11 · v1 · inferred · recovered

An organization is qualified for Sprint With Us once it has at least two active team members, those members between them hold every capability the service recognises, and its Sprint With Us terms have been accepted.

- reconciliation: implemented-only
- given: an organization with an owner and one further active member who between them hold every capability, and whose Sprint With Us terms have not yet been accepted
- when: the owner opens the organization's Sprint With Us qualification page
- then: the team-size and capability requirements are shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- cites: src/shared/lib/resources/organization.ts:125
- cites: src/shared/lib/resources/organization.ts:131
- cites: src/back-end/lib/db/organization.ts:199
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/swu-qualification.tsx:74
- note: only active members count towards the capability total; a member who has been invited but has not yet accepted is excluded.

### D-organizations-12 · v1 · inferred · recovered

An organization is qualified for Team With Us once it has been approved for at least one service area and its Team With Us terms have been accepted.

- reconciliation: implemented-only
- given: an organization approved for one service area whose Team With Us terms have not been accepted
- when: the owner opens the organization's Team With Us qualification page
- then: the service-area requirement is shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- cites: src/shared/lib/resources/organization.ts:141
- cites: src/back-end/lib/db/organization.ts:386
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/twu-qualification.tsx:301
- cites: src/migrations/tasks/20230327102038_accept-twu-terms.ts
- note: the database description carried by the old application does not list the Team With Us terms field, the service-area approvals or the membership-rights history at all, so it is behind the schema the application actually uses.

### D-organizations-13 · v1 · inferred · recovered

Accepting an organization's Sprint With Us or Team With Us terms records the date of acceptance, and a second attempt to accept the same terms for the same organization is refused.

- reconciliation: implemented-only
- given: an organization whose Sprint With Us terms have not been accepted
- when: its owner reads the terms and accepts them, and then tries to accept them again
- then: the first acceptance is recorded with its date and shown on the qualification page, and the second is refused with a message saying the terms have already been accepted
- cites: src/back-end/lib/resources/organization.ts:509
- cites: src/back-end/lib/resources/organization.ts:524
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:155
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:224
- cites: src/back-end/docs/organization.yaml:148
- note: an administrator reading the terms page is not offered the accept control, so acceptance is in practice an act of the organization's own people.

### D-organizations-14 · v1 · inferred · recovered

Only an administrator may set which service areas an organization is approved for, and saving a selection replaces the organization's previous approvals entirely.

- reconciliation: implemented-only
- given: an organization approved for two service areas
- when: an administrator edits the service areas, leaves one of the two ticked, ticks a third, and saves
- then: the organization is approved for exactly the two areas that were ticked and no longer for the one that was cleared, and the same page offers no editing control to the organization's own owner
- cites: src/back-end/lib/resources/organization.ts:545
- cites: src/back-end/lib/db/organization.ts:691
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/twu-qualification.tsx:400

### D-organizations-16 · v1 · inferred · recovered

An invited person is told by email that the organization has asked them to join, and is offered a way to accept or decline from that message.

- reconciliation: implemented-only
- given: a registered vendor who is not a member of a given organization
- when: that organization invites them
- then: they receive a message naming the organization and offering an accept and a decline choice, and following either choice opens their own organizations page with that decision ready to confirm
- cites: src/back-end/lib/resources/affiliation.ts:264
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:65
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:247
- cites: src/front-end/typescript/lib/pages/user/profile/tab/organizations.tsx:122

### D-organizations-17 · v1 · inferred · recovered

Inviting an email address that belongs to nobody registered with the service creates no membership; the address is instead sent an invitation to register, and the inviter is told the person was not registered but has been notified.

- reconciliation: implemented-only
- given: an organization whose owner is inviting team members
- when: they invite an email address that no registered account uses
- then: no pending membership appears on the team list, the address receives an invitation to register with the service, and the owner is shown a warning naming that address
- cites: src/back-end/lib/resources/affiliation.ts:196
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:270

### D-organizations-20 · v1 · inferred · recovered

When a person accepts an invitation, the organization's owner is told they have joined and the new member is told they may now be put forward on the organization's proposals.

- reconciliation: implemented-only
- given: a person with a pending invitation to an organization
- when: they accept it
- then: the organization's owner receives a message saying the person approved the request, and the person receives a message saying they have joined the organization's team
- cites: src/back-end/lib/resources/affiliation.ts:450
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:18
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:106
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:168

### D-organizations-22 · v1 · inferred · recovered

When an invited person declines an invitation rather than accepting it, the organization's owner is told the request was rejected.

- reconciliation: implemented-only
- given: a person with a pending invitation to an organization
- when: they decline it
- then: the pending membership is gone from the organization's team list and the owner receives a message saying the person rejected the team request
- cites: src/back-end/lib/resources/affiliation.ts:562
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:35
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:140
- cites: src/front-end/typescript/lib/pages/user/profile/tab/organizations.tsx:270
- note: no message is sent when the organization's own owner or administrator withdraws a pending invitation, nor when an established member leaves; the code that would tell the owner about a member leaving is present but nothing invokes it.

### D-organizations-26 · v1 · inferred · recovered

An organization keeps a changelog of every grant and withdrawal of administrator rights and every transfer of ownership, showing what happened, to whom, when and by whom, most recent first.

- reconciliation: implemented-only
- given: an organization whose owner has granted administrator rights to a member and then withdrawn them
- when: the owner opens the organization's changelog
- then: two entries are shown, "Admin Rights Removed" above "Admin Rights Given", each naming the member it concerns, the time it happened and the person who made the change
- cites: src/back-end/lib/db/organization.ts:388
- cites: src/back-end/lib/db/affiliation.ts:300
- cites: src/back-end/lib/db/affiliation.ts:367
- cites: src/front-end/typescript/lib/pages/organization/lib/index.tsx:4
- cites: src/migrations/tasks/20231108161232_affiliation-events.ts:13
- cites: src/migrations/tasks/20240410182955_update-affiliation-events.ts:7

### D-organizations-28 · v1 · inferred · recovered

An organization's summary of team capabilities counts only members who have accepted their invitation.

- reconciliation: implemented-only
- given: an organization whose only member holding a given capability has been invited but has not yet accepted
- when: the owner opens the organization's team page
- then: that capability is shown as one the team does not have, and it becomes shown as held once the invitation is accepted
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:104
- cites: src/back-end/lib/db/organization.ts:211

## Ratification conditions

One condition per line, and exactly one of these forms:

- `contract <ID>` — leave as recovered. It does not promote the criterion — `confirm`, `edit` and
  `defect` all do — so this is a no-op on anything still `inferred` or `open`. No text after the ID.
- `confirm <ID>` — the evidence now supports raising its confidence to `confirmed`. No text after the ID.
- `edit <ID>: <new statement>` — the behaviour is right, the wording is not; confidence rises to
  `confirmed` too, since the deliberate rewording is itself a second witness.
- `defect <ID>: <replacement statement>` — the old system does this and the new one should not; the row
  is kept as the record, its confidence rises to `confirmed` (it is a confirmed record of current
  behaviour, marked defect), and the replacement is filed against it.
- `spike <ID>: <question>` — not yet decided; confidence drops to `open` and the question is recorded.
- `obsolete <ID>: <why>` or `drop <ID>: <why>` — not to be carried forward at all.

The ID is the criterion's own id exactly as the domain file spells it. `contract` and `confirm`
take no text; every other verb requires a colon and text on the same line. A condition may not
span more than one line.

