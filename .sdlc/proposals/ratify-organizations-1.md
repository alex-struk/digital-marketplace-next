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


## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is which of the fourteen organizations criteria still inferred become the contract, and the ruling is approve with a condition on every one. I confirmed ten because in each case I read a second witness in the code independent of the recovery. D-organizations-5: createOrganization inserts with active: true and, in the same transaction, creates the registering vendor's affiliation as Owner/Active (db/organization.ts:602-623), so ownership and activity are one write rather than two hopes. D-organizations-10: the archive path writes active: false with deactivatedOn and deactivatedBy, then calls handleOrganizationArchived only when dbResult.value.owner.id differs from the archiver's id (resources/organization.ts:674-700) — and since only the owner or a service administrator may archive, 'a non-owner archiver' and 'an administrator who does not own it' are the same set. D-organizations-11: the two-member rule and the terms rule are in doesOrganizationMeetSWUQualification (shared/lib/resources/organization.ts:131), the capability rule is in doesOrganizationMeetAllCapabilities (db/organization.ts:199), which filters to membershipStatus Active before unioning capabilities, and numTeamMembers is itself a countDistinct restricted to Active affiliations in generateOrganizationQuery — three separate places agreeing, and the note about excluding invited-but-not-accepted members is exactly that filter. D-organizations-12: doesOrganizationMeetTWUQualification is possessOneServiceArea && acceptedTWUTerms and nothing else, with possessOneServiceArea set from serviceAreas.length > 0. D-organizations-13: acceptSWUTerms and acceptTWUTerms each refuse a second attempt with a named message at resources/organization.ts:511 and :526, and the respond half writes acceptedSWUTerms/acceptedTWUTerms as new Date() at :591 and :598, so both halves of the criterion — the recorded date and the refusal — are literal. D-organizations-14: the resource gates qualifyServiceAreas on permissions.isAdmin at :545, qualifyOrganizationServiceAreas deletes every existing row for the organization before inserting the new selection inside one transaction (db/organization.ts:695-719), and twu-qualification.tsx:404 offers the Edit control only when isAdmin(viewerUser) — service, store and interface all say the same thing. D-organizations-17: an unregistered invitee returns before any affiliation is created, calling inviteToRegister and answering with 'User is not registered, but has been notified.' (resources/affiliation.ts:196-206). D-organizations-20: handleUserAcceptedInvitation sends approvedRequestToJoin to the organization owner and membershipComplete to the new member, and the second template's own text is that the organization can now include them on Sprint With Us or Team With Us proposals. D-organizations-22: the delete path notifies the owner only when the prior membershipStatus was Pending and the requester is the invited person themselves (resources/affiliation.ts:562-570), which is precisely why a withdrawn invitation and a departure send nothing; I also checked the note's stronger claim and it holds — handleMemberLeavesTeam has no call site anywhere in src, its only other reference being the admin email-preview router. D-organizations-26: updateAdminStatus writes AdminStatusGranted or AdminStatusRevoked and changeOwner writes OwnerStatusRevoked and OwnerStatusGranted, each with createdAt and createdBy (db/affiliation.ts:300-316, :367-379), readOneOrganization reads affiliationEvents ordered createdAt desc, and OrganizationHistoryTypeToTitleCase renders the four labels the criterion quotes. D-organizations-28: the front end filters pending members out before computing capabilities (team.tsx:108) and the back end filters to Active (db/organization.ts:212), so the display and the qualification calculation cannot disagree. Two I am editing rather than confirming, because the behaviour is right and the wording is not. D-organizations-2 was left inferred at the archaeology gate on the stated ground that only the entry to the field-stripping branch had been read and not what it returns; I have now read the return, and the stripped branch yields id, legalName, logoImageFile, active and serviceAreas alone while the privileged branch adds owner, numTeamMembers, possessAllCapabilities, possessOneServiceArea and both terms dates (db/organization.ts:502-530) — that is the second witness, but it also shows the headline sentence is loose in two ways worth fixing before it becomes the contract: the privileged set is owner-or-administrator rather than 'the viewer's own', and the service does return the organization's service areas to everyone even though the interface hides the qualification columns. D-organizations-4 overstates the length rule: validateGenericString defaults to a one-to-one-hundred-character range and every required text field uses it, but the contact email goes through validateEmail, which checks format and imposes no length limit at all, so 'each no longer than one hundred characters' is wrong about the one field it names last. One is a defect the rebuild must not inherit, and I rule it without escalating because the code leaves one reading. D-organizations-16 is right that the invitation email offers both an Accept and a Reject button, but the two links do not behave alike: approveJoinRequestCallToAction points at tab=organizations while rejectJoinRequestCallToAction points at tab=organization (affiliation.tsx:254 and :267), and parseUserProfileTab returns null for the singular form, so the decline link lands on the default profile tab and the confirmation modal that reads invitationAffiliationId and invitationResponse never opens. The plural is the correct value and the sibling link uses it, so this is a typo rather than a policy, and the criterion's own scenario line — 'following either choice opens their own organizations page with that decision ready to confirm' — describes what was intended, not what happens. I am not escalating the gate: the tier is STANDARD, the stage reported no confidence shortfall, and nothing here has two plausible readings of intent. What would change this ruling: evidence that any confirm above rests on the old application's OpenAPI description or generated schema document rather than on the enforcing code — D-organizations-4 and D-organizations-12 both carry notes saying those documents are stale, and neither confirmation leans on them — or a reading of the user profile router showing an unrecognised tab value still delivers the invitation query parameters to the organizations tab, which would make D-organizations-16 a cosmetic inconsistency rather than a broken decline path.

**Conditions:**
- edit D-organizations-2: In the organization list, the owner's name, the team size and both qualification marks are shown only to a service administrator and, for a given organization, to the vendors who own or administer it; every other viewer sees that organization's legal name, logo, active state and service areas alone, and the owner and qualification columns are not offered at all to a visitor who is not signed in or to public sector staff.
- edit D-organizations-4: Registering an organization requires a legal name, street address, city, region, mail code, country and contact name, each between one and one hundred characters, together with a contact email in a valid email format and of any length; a website address, second address line, contact title and contact phone number may be left out, but each is rejected if given in an invalid format, with the second address line and contact title also limited to one hundred characters.
- confirm D-organizations-5
- confirm D-organizations-10
- confirm D-organizations-11
- confirm D-organizations-12
- confirm D-organizations-13
- confirm D-organizations-14
- defect D-organizations-16: The accept and the decline choice offered in an invitation email both open the invited person's own organizations page with the matching confirmation ready, so a person can decline from the message as readily as they can accept.
- confirm D-organizations-17
- confirm D-organizations-20
- confirm D-organizations-22
- confirm D-organizations-26
- confirm D-organizations-28
