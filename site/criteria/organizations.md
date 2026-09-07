# organizations

## Tests

| id | test |
| --- | --- |
| R-3.1 | — |
| R-3.2 | — |
| R-3.3 | — |
| R-3.4 | — |
| R-3.5 | — |
| R-3.6 | — |
| R-3.7 | — |
| R-3.8 | — |
| R-3.9 | — |
| R-3.10 | — |
| R-3.11 | — |
| R-3.12 | — |
| R-3.13 | — |
| R-3.14 | — |
| R-3.15 | — |
| R-3.16 | — |
| R-3.17 | — |
| R-3.18 | — |
| R-3.19 | — |
| R-3.20 | — |
| R-3.21 | — |
| R-3.22 | — |
| R-3.23 | — |
| R-3.24 | — |
| R-3.25 | — |
| R-3.26 | — |
| R-3.27 | — |
| R-3.28 | — |
| R-3.29 | — |
| R-3.30 | — |
| R-3.31 | — |
| R-3.32 | — |
| R-3.33 | — |
| R-3.34 | — |
| R-3.35 | — |

### R-3.1 · v1 · confirmed · accepted

Anyone, signed in or not, can browse the list of registered organizations, which shows only organizations that have not been archived, ordered by legal name and split into pages.
- cites: src/back-end/lib/resources/organization.ts:78
- cites: src/back-end/lib/db/organization.ts:232
- cites: src/back-end/lib/db/organization.ts:457
- cites: src/front-end/typescript/lib/pages/organization/list.tsx:86
- cites: src/back-end/docs/organization.yaml:9
- cites: CHANGELOG.md:137
- reconciliation: implemented-only
- given: three registered organizations, one of which has been archived
- when: a visitor who is not signed in opens the organization list
- then: the two organizations that are not archived are listed in alphabetical order by legal name, and the archived one is absent
- note: the page requests fifty organizations at a time; asking for a page beyond the last one returns the first page instead of an empty one.

### R-3.2 · v1 · confirmed · accepted

Only a signed-in vendor who has already accepted the service's terms and conditions may register a new organization; a request from anyone else is refused.
- cites: src/back-end/lib/permissions.ts:195
- cites: src/back-end/lib/resources/organization.ts:236
- cites: src/front-end/typescript/lib/pages/organization/create.tsx:57
- reconciliation: implemented-only
- given: a signed-in member of public sector staff and a signed-in vendor who has accepted the terms
- when: each tries to register an organization
- then: the vendor's organization is created and the public sector staff member's request is refused as not permitted

### R-3.3 · v1 · confirmed · accepted

An organization's full record can be opened only by an administrator or by a member who owns or administers that organization; anyone else is refused.
- cites: src/back-end/lib/permissions.ts:204
- cites: src/back-end/lib/resources/organization.ts:127
- cites: src/front-end/typescript/lib/pages/organization/edit/index.tsx:66
- reconciliation: implemented-only
- given: an organization with an owner, one administrator and one ordinary member
- when: the ordinary member, and separately a member of public sector staff, opens that organization's management page
- then: both are refused, while the owner, the organization's administrator and a service administrator each see the organization
- note: the ordinary member is shown a "not found" page rather than a refusal, because the front end turns the refused read into a missing page.

### R-3.4 · v1 · confirmed · accepted

An organization's profile details may be changed only by an administrator or by the organization's owner; an organization administrator who is not the owner cannot save changes to them.
- cites: src/back-end/lib/permissions.ts:218
- cites: src/back-end/lib/resources/organization.ts:377
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/organization.tsx:372
- reconciliation: defect
- given: an organization whose owner has granted administrator rights to another member
- when: that organization administrator opens the organization's profile, edits the legal name and saves
- then: the change is refused and an error is shown
- superseded-by: R-3.18
- note: the management page offers the Edit and Archive controls to anyone who can open it, including an organization administrator, but the service only accepts profile changes and archiving from the owner or a service administrator, so the controls are visible to a person who cannot use them. No corrected criterion has been written because it is unclear whether the intent is to widen the permission or to hide the controls.
- note: superseded by R-3.18

### R-3.5 · v1 · confirmed · accepted

A change to an organization's contact phone number made while editing its profile is not saved.
- cites: src/back-end/lib/resources/organization.ts:357
- cites: src/front-end/typescript/lib/pages/organization/lib/components/form.tsx:760
- reconciliation: defect
- given: an organization whose owner is editing its profile
- when: they change the contact phone number and save
- then: every other edited field is saved but the contact phone number is not updated
- superseded-by: R-3.19
- note: the profile-update request is read field by field, and the contact phone is read from a differently named field than the one the form sends, so the submitted value never reaches the stored record. Whether the stored number is left as it was or cleared could not be settled from the source alone, because it depends on how the database layer treats a value it was not given.
- note: superseded by R-3.19

### R-3.6 · v1 · confirmed · accepted

An administrator or an organization's owner may archive the organization, after which it no longer appears in the organization list, cannot be used on proposals, and disappears from its members' lists of organizations; the archiving is recorded with the date and the person who did it.
- cites: src/back-end/lib/permissions.ts:232
- cites: src/back-end/lib/resources/organization.ts:674
- cites: src/back-end/lib/db/affiliation.ts:169
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/organization.tsx:294
- cites: src/back-end/docs/organization.yaml:88
- reconciliation: implemented-only
- given: an active organization with an owner and one other active member
- when: the owner archives it
- then: it is gone from the public organization list, gone from the other member's affiliated organizations, and its record carries the date it was archived and the identity of the person who archived it
- note: archiving does not delete the organization or its memberships; the record is retained and simply marked inactive.

### R-3.7 · v1 · confirmed · accepted

An organization's owner, its administrators and a service administrator may invite people to the team by email address, and each invitation is created as a pending membership.
- cites: src/back-end/lib/permissions.ts:271
- cites: src/back-end/lib/resources/affiliation.ts:233
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:243
- cites: src/back-end/docs/affiliation.yaml:25
- reconciliation: implemented-only
- given: an organization with an owner and no other members
- when: the owner invites two email addresses at once from the team page
- then: both people appear on the team list marked as pending, and neither counts towards the organization's team size until they accept
- note: an ordinary member of the organization is not permitted to invite anybody.

### R-3.8 · v1 · confirmed · accepted

A person may only be invited to an organization if they hold an active vendor account, and cannot be invited twice to the same organization.
- cites: src/back-end/lib/resources/affiliation.ts:208
- cites: src/back-end/lib/resources/affiliation.ts:214
- cites: src/back-end/lib/resources/affiliation.ts:219
- cites: src/back-end/lib/db/affiliation.ts:112
- reconciliation: implemented-only
- given: an organization with one pending invitation outstanding for a given person
- when: the owner invites that same person again, and separately invites a member of public sector staff
- then: the repeat invitation is refused as the person already being a member of the organization, and the invitation to public sector staff is refused because only vendors may be invited
- note: a person whose membership was previously ended can be invited again, because ended memberships are not counted when checking for an existing one; this was read from the shape of the duplicate check rather than observed.

### R-3.9 · v1 · confirmed · accepted

A pending invitation becomes an active membership only when the invited person accepts it, or when an administrator accepts it on their behalf; nobody else can accept it and an invitation that is not pending cannot be accepted.
- cites: src/back-end/lib/permissions.ts:284
- cites: src/back-end/lib/resources/affiliation.ts:347
- cites: src/back-end/lib/db/affiliation.ts:246
- cites: src/front-end/typescript/lib/pages/user/profile/tab/organizations.tsx:216
- cites: src/back-end/docs/affiliation.yaml:46
- reconciliation: implemented-only
- given: a person with a pending invitation to an organization
- when: the organization's owner tries to accept it on their behalf, and then the invited person accepts it themselves
- then: the owner's attempt is refused, the invited person's acceptance makes the membership active, and a further attempt to accept the now-active membership is refused as not pending
- note: the published interface description gives this operation a different request method than the service actually accepts, so the description cannot be followed literally.

### R-3.10 · v1 · confirmed · accepted

A membership can be ended by the member themselves, by the organization's owner or administrators, or by a service administrator; the membership becomes inactive rather than being erased, and the person stops counting towards the organization's team.
- cites: src/back-end/lib/permissions.ts:306
- cites: src/back-end/lib/db/affiliation.ts:421
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:372
- cites: src/front-end/typescript/lib/pages/user/profile/tab/organizations.tsx:169
- cites: src/back-end/docs/affiliation.yaml:63
- reconciliation: implemented-only
- given: an organization with an owner and one further active member
- when: that member chooses to leave the organization
- then: they no longer appear on the organization's team list, the organization's team size falls to one, and the organization is no longer listed among their affiliated organizations

### R-3.11 · v1 · confirmed · accepted

An organization's last remaining owner cannot be removed from it.
- cites: src/back-end/lib/resources/affiliation.ts:518
- cites: src/back-end/lib/db/affiliation.ts:492
- reconciliation: implemented-only
- given: an organization with exactly one owner and two other active members
- when: an administrator tries to end the owner's membership
- then: the request is refused with a message saying this is the sole owner for the organization, and the membership remains

### R-3.12 · v1 · confirmed · accepted

An organization's owner, its administrators and a service administrator may grant or withdraw administrator rights over the organization to an active member, but nobody may change their own rights and the owner's own membership cannot be changed this way.
- cites: src/back-end/lib/permissions.ts:294
- cites: src/back-end/lib/resources/affiliation.ts:370
- cites: src/back-end/lib/db/affiliation.ts:272
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:630
- reconciliation: implemented-only
- given: an organization with an owner and two other active members, one of whom already has administrator rights
- when: the owner grants administrator rights to the second member, that administrator tries to withdraw their own rights, and someone tries to change the owner's
- then: the second member gains administrator rights, and both the self-change and the change to the owner are refused
- note: granting administrator rights requires the person granting them to confirm a statement about what those rights allow before the change is offered.

### R-3.13 · v1 · confirmed · accepted

Only a service administrator may transfer ownership of an organization, and only to a member whose membership is already active; the previous owner becomes an ordinary member.
- cites: src/back-end/lib/resources/affiliation.ts:408
- cites: src/back-end/lib/db/affiliation.ts:353
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:1047
- reconciliation: implemented-only
- given: an organization with an owner, one active member and one member whose invitation is still pending
- when: an administrator transfers ownership to the active member
- then: that member becomes the organization's owner, the previous owner becomes an ordinary member, and the pending member cannot be chosen as the new owner
- note: the organization's own owner is not offered this action; it is offered only to a service administrator, and only when the organization has at least one member other than the owner.

### R-3.14 · v1 · confirmed · accepted

The list of an organization's team members can be read only by a service administrator or by someone who owns or administers that organization.
- cites: src/back-end/lib/permissions.ts:258
- cites: src/back-end/lib/resources/affiliation.ts:98
- reconciliation: implemented-only
- given: an organization with an owner and one ordinary member
- when: that ordinary member, and separately a vendor unconnected to the organization, asks for the organization's team list
- then: both are refused, while the owner and a service administrator receive the list

### R-3.15 · v1 · confirmed · accepted

The organizations a vendor may act on behalf of are those they own and those they administer, excluding any that have been archived.
- cites: src/back-end/lib/db/organization.ts:541
- cites: src/back-end/lib/resources/owned-organization.ts:28
- reconciliation: implemented-only
- given: a vendor who owns one organization, administers a second, is an ordinary member of a third, and owns a fourth that has been archived
- when: they ask for the organizations they can act for
- then: the first two are returned and the third and fourth are not

### R-3.16 · v1 · confirmed · accepted

Asking for the organizations one may act on behalf of as anyone other than a vendor returns an empty list rather than being refused.
- cites: src/back-end/lib/resources/owned-organization.ts:25
- cites: src/back-end/lib/db/organization.ts:542
- reconciliation: defect
- given: a signed-in member of public sector staff, and a visitor who is not signed in
- when: each asks for the organizations they may act on behalf of
- then: each receives an empty list and neither is told they are not permitted
- superseded-by: R-3.20
- note: the permission rule for this request is written but never applied — the check tests that the rule exists rather than running it — so nothing is refused here. No harm follows, because the underlying lookup returns nothing for anyone who is not a vendor, but the outcome is an empty success where a refusal was intended. No corrected criterion has been written because it has not been decided whether the new system should refuse or should keep answering with an empty list.
- note: superseded by R-3.20

### R-3.17 · v1 · confirmed · accepted

An invitation may name the invited person as an ordinary member or as an owner, and any other membership type is rejected.
- cites: src/shared/lib/resources/affiliation.ts:85
- cites: src/back-end/lib/resources/affiliation.ts:186
- cites: src/back-end/docs/affiliation.yaml:83
- reconciliation: implemented-only
- given: an organization whose owner is inviting a team member
- when: the invitation names a membership type other than member or owner
- then: the invitation is refused as an invalid membership type
- note: administrator rights are never granted by an invitation; they are granted afterwards to a member who has already joined, as in R-3.12. In practice the team page always sends "member".

### R-3.18 · v1 · confirmed · accepted

The Edit and Archive controls on an organization's management page are offered only to a person permitted to use them — the organization's owner or a service administrator; an organization administrator who is not the owner sees the organization's profile as read-only, with no Edit and no Archive control, and the service continues to refuse a profile change or an archive request from anyone other than the owner or a service administrator.
- replaces: R-3.4

### R-3.19 · v1 · confirmed · accepted

A change to an organization's contact phone number made while editing its profile is saved along with every other profile field, and clearing the field removes the stored number.
- replaces: R-3.5

### R-3.20 · v1 · confirmed · accepted

Asking for the organizations one may act on behalf of is refused as not permitted for anyone who is not a signed-in vendor, rather than answered with an empty list.
- replaces: R-3.16

### R-3.21 · v2 · confirmed · accepted

In the organization list, the owner's name, the team size and both qualification marks are shown only to a service administrator and, for a given organization, to the vendors who own or administer it; every other viewer sees that organization's legal name, logo, active state and service areas alone, and the owner and qualification columns are not offered at all to a visitor who is not signed in or to public sector staff.
- cites: src/back-end/lib/db/organization.ts:502
- cites: src/back-end/lib/db/organization.ts:251
- cites: src/front-end/typescript/lib/pages/organization/list.tsx:163
- cites: src/front-end/typescript/lib/pages/organization/list.tsx:204
- reconciliation: implemented-only
- given: an organization owned by one vendor
- when: a different vendor, who is neither its owner nor one of its administrators, opens the organization list
- then: that organization's row shows its legal name only, with no owner, no team size and no qualification marks, while the same row shown to an administrator carries all of them
- note: the owner and qualification columns are hidden entirely from a visitor who is not signed in and from public sector staff, so only vendors and administrators ever see them.

### R-3.22 · v2 · confirmed · accepted

Registering an organization requires a legal name, street address, city, region, mail code, country and contact name, each between one and one hundred characters, together with a contact email in a valid email format and of any length; a website address, second address line, contact title and contact phone number may be left out, but each is rejected if given in an invalid format, with the second address line and contact title also limited to one hundred characters.
- cites: src/shared/lib/validation/organization.ts:10
- cites: src/shared/lib/validation/organization.ts:56
- cites: src/shared/lib/validation/organization.ts:60
- cites: src/shared/lib/validation/index.ts:218
- cites: src/shared/lib/validation/index.ts:423
- cites: src/shared/lib/validation/index.ts:436
- cites: src/back-end/docs/organization.yaml:102
- reconciliation: implemented-only
- given: a signed-in vendor filling in the organization registration form
- when: they submit it with the legal name left blank, or with a contact email of "not-an-email"
- then: the organization is not created and the offending field is reported as invalid, while the same submission with the optional website, second address line, contact title and phone left empty succeeds
- note: the published interface description lists the same set of fields but says nothing about which are required or how long they may be, so the required/optional split and the hundred-character limit rest on the code alone.

### R-3.23 · v1 · confirmed · accepted

The vendor who registers an organization becomes its owner immediately, and the organization is active from the moment it is registered.
- cites: src/back-end/lib/db/organization.ts:595
- cites: src/back-end/lib/db/organization.ts:618
- cites: src/front-end/typescript/lib/pages/organization/create.tsx:148
- reconciliation: implemented-only
- given: a signed-in vendor with no organizations
- when: they register a new organization
- then: the organization appears under their owned organizations with them recorded as its owner and its team counted as one member, and they are taken to that organization's management page

### R-3.24 · v1 · confirmed · accepted

When an administrator archives an organization they do not own, its owner is told by email that the organization has been archived.
- cites: src/back-end/lib/resources/organization.ts:692
- cites: src/back-end/lib/mailer/notifications/organization.tsx:11
- cites: src/back-end/lib/mailer/notifications/organization.tsx:32
- reconciliation: implemented-only
- given: an active organization owned by a vendor
- when: an administrator archives it
- then: the owner receives a message telling them their organization has been archived by an administrator and that they can no longer use it, and no such message is sent when the owner archives their own organization

### R-3.25 · v1 · confirmed · accepted

An organization is qualified for Sprint With Us once it has at least two active team members, those members between them hold every capability the service recognises, and its Sprint With Us terms have been accepted.
- cites: src/shared/lib/resources/organization.ts:125
- cites: src/shared/lib/resources/organization.ts:131
- cites: src/back-end/lib/db/organization.ts:199
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/swu-qualification.tsx:74
- reconciliation: implemented-only
- given: an organization with an owner and one further active member who between them hold every capability, and whose Sprint With Us terms have not yet been accepted
- when: the owner opens the organization's Sprint With Us qualification page
- then: the team-size and capability requirements are shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- note: only active members count towards the capability total; a member who has been invited but has not yet accepted is excluded.

### R-3.26 · v1 · confirmed · accepted

An organization is qualified for Team With Us once it has been approved for at least one service area and its Team With Us terms have been accepted.
- cites: src/shared/lib/resources/organization.ts:141
- cites: src/back-end/lib/db/organization.ts:386
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/twu-qualification.tsx:301
- cites: src/migrations/tasks/20230327102038_accept-twu-terms.ts
- reconciliation: implemented-only
- given: an organization approved for one service area whose Team With Us terms have not been accepted
- when: the owner opens the organization's Team With Us qualification page
- then: the service-area requirement is shown as met, the terms requirement as unmet, and the organization is marked as not qualified
- note: the database description carried by the old application does not list the Team With Us terms field, the service-area approvals or the membership-rights history at all, so it is behind the schema the application actually uses.

### R-3.27 · v1 · confirmed · accepted

Accepting an organization's Sprint With Us or Team With Us terms records the date of acceptance, and a second attempt to accept the same terms for the same organization is refused.
- cites: src/back-end/lib/resources/organization.ts:509
- cites: src/back-end/lib/resources/organization.ts:524
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:155
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:224
- cites: src/back-end/docs/organization.yaml:148
- reconciliation: implemented-only
- given: an organization whose Sprint With Us terms have not been accepted
- when: its owner reads the terms and accepts them, and then tries to accept them again
- then: the first acceptance is recorded with its date and shown on the qualification page, and the second is refused with a message saying the terms have already been accepted
- note: an administrator reading the terms page is not offered the accept control, so acceptance is in practice an act of the organization's own people.

### R-3.28 · v1 · confirmed · accepted

Only an administrator may set which service areas an organization is approved for, and saving a selection replaces the organization's previous approvals entirely.
- cites: src/back-end/lib/resources/organization.ts:545
- cites: src/back-end/lib/db/organization.ts:691
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/twu-qualification.tsx:400
- reconciliation: implemented-only
- given: an organization approved for two service areas
- when: an administrator edits the service areas, leaves one of the two ticked, ticks a third, and saves
- then: the organization is approved for exactly the two areas that were ticked and no longer for the one that was cleared, and the same page offers no editing control to the organization's own owner

### R-3.29 · v1 · confirmed · accepted

An invited person is told by email that the organization has asked them to join, and is offered a way to accept or decline from that message.
- cites: src/back-end/lib/resources/affiliation.ts:264
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:65
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:247
- cites: src/front-end/typescript/lib/pages/user/profile/tab/organizations.tsx:122
- reconciliation: defect
- given: a registered vendor who is not a member of a given organization
- when: that organization invites them
- then: they receive a message naming the organization and offering an accept and a decline choice, and following either choice opens their own organizations page with that decision ready to confirm
- superseded-by: R-3.35
- note: superseded by R-3.35

### R-3.30 · v1 · confirmed · accepted

Inviting an email address that belongs to nobody registered with the service creates no membership; the address is instead sent an invitation to register, and the inviter is told the person was not registered but has been notified.
- cites: src/back-end/lib/resources/affiliation.ts:196
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:270
- reconciliation: implemented-only
- given: an organization whose owner is inviting team members
- when: they invite an email address that no registered account uses
- then: no pending membership appears on the team list, the address receives an invitation to register with the service, and the owner is shown a warning naming that address

### R-3.31 · v1 · confirmed · accepted

When a person accepts an invitation, the organization's owner is told they have joined and the new member is told they may now be put forward on the organization's proposals.
- cites: src/back-end/lib/resources/affiliation.ts:450
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:18
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:106
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:168
- reconciliation: implemented-only
- given: a person with a pending invitation to an organization
- when: they accept it
- then: the organization's owner receives a message saying the person approved the request, and the person receives a message saying they have joined the organization's team

### R-3.32 · v1 · confirmed · accepted

When an invited person declines an invitation rather than accepting it, the organization's owner is told the request was rejected.
- cites: src/back-end/lib/resources/affiliation.ts:562
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:35
- cites: src/back-end/lib/mailer/notifications/affiliation.tsx:140
- cites: src/front-end/typescript/lib/pages/user/profile/tab/organizations.tsx:270
- reconciliation: implemented-only
- given: a person with a pending invitation to an organization
- when: they decline it
- then: the pending membership is gone from the organization's team list and the owner receives a message saying the person rejected the team request
- note: no message is sent when the organization's own owner or administrator withdraws a pending invitation, nor when an established member leaves; the code that would tell the owner about a member leaving is present but nothing invokes it.

### R-3.33 · v1 · confirmed · accepted

An organization keeps a changelog of every grant and withdrawal of administrator rights and every transfer of ownership, showing what happened, to whom, when and by whom, most recent first.
- cites: src/back-end/lib/db/organization.ts:388
- cites: src/back-end/lib/db/affiliation.ts:300
- cites: src/back-end/lib/db/affiliation.ts:367
- cites: src/front-end/typescript/lib/pages/organization/lib/index.tsx:4
- cites: src/migrations/tasks/20231108161232_affiliation-events.ts:13
- cites: src/migrations/tasks/20240410182955_update-affiliation-events.ts:7
- reconciliation: implemented-only
- given: an organization whose owner has granted administrator rights to a member and then withdrawn them
- when: the owner opens the organization's changelog
- then: two entries are shown, "Admin Rights Removed" above "Admin Rights Given", each naming the member it concerns, the time it happened and the person who made the change

### R-3.34 · v1 · confirmed · accepted

An organization's summary of team capabilities counts only members who have accepted their invitation.
- cites: src/front-end/typescript/lib/pages/organization/edit/tab/team.tsx:104
- cites: src/back-end/lib/db/organization.ts:211
- reconciliation: implemented-only
- given: an organization whose only member holding a given capability has been invited but has not yet accepted
- when: the owner opens the organization's team page
- then: that capability is shown as one the team does not have, and it becomes shown as held once the invitation is accepted

### R-3.35 · v1 · confirmed · accepted

The accept and the decline choice offered in an invitation email both open the invited person's own organizations page with the matching confirmation ready, so a person can decline from the message as readily as they can accept.
- replaces: R-3.29
