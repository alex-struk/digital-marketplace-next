---
gate: G1
question: "Which of the users criteria that are still inferred or open become the contract?"
recommendation: "13 criterion(s) in users are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them."
opened: 2026-09-07T04:12:54.243Z
---

# Which of the users criteria that are still inferred or open become the contract?

**Recommendation.** 13 criterion(s) in users are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

13 criterion(s) in the **users** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-users-3 · v1 · inferred · recovered

After signing in, a person who already had an account is taken to their dashboard and a person whose account has just been created is taken to the page that completes their profile, unless they began signing in from a particular page, in which case they are returned to it.

- reconciliation: implemented-only
- given: a returning person and a person signing in for the first time
- when: each completes sign-in without having started from a particular page
- then: the returning person lands on their dashboard and the new person lands on the profile-completion page
- cites: src/back-end/lib/routers/auth.ts:169
- cites: src/back-end/lib/routers/auth.ts:87
- note: when sign-in was started from a page that requires signing in, that page is where both land instead.

### D-users-4 · v1 · open · recovered

The profile-completion page is offered only to vendors; anyone else who reaches it is sent to their dashboard, as is a vendor who has completed it before.

- reconciliation: implemented-only
- given: a public sector employee signing in for the first time, and a vendor who has already agreed to the terms once
- when: each is sent to the profile-completion page
- then: both are moved straight on to their dashboard without being asked to confirm anything
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:61
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:65
- note: every newly created account is sent to this page regardless of kind, so a public sector employee is never asked to confirm their details and never sees the notification choice offered there. Whether that is intended could not be settled from the source.
- note: Should a public sector employee be asked to confirm their name, email address and job title, and be offered the new-opportunity notification choice, when their account is first created - or should they continue to be sent straight to the dashboard? The profile-completion page is where that notification choice is first offered and a public sector employee never sees it there, so answering this decides whether the page admits them or the choice moves elsewhere.

**This criterion has already been answered once, with `contract` or `spike`.** Neither one
moves it toward the contract, so answering the same way again would leave it exactly where it
is: already answered once: confirm, edit, obsolete or defect it.

### D-users-6 · v1 · inferred · recovered

While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.

- reconciliation: implemented-only
- given: a vendor completing their profile
- when: they tick the box offering notice of new opportunities and complete the profile
- then: their account records that notifications are on, with the moment the choice was made
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:186
- cites: src/front-end/typescript/lib/pages/sign-up/step-two.tsx:270
- cites: src/back-end/lib/resources/user.ts:234
- cites: src/shared/lib/resources/user.ts:183
- note: turning notifications off does not record a date; the record simply becomes empty, so the service cannot say when somebody stopped wanting them.

### D-users-10 · v1 · inferred · recovered

A person's account record may be read only by that person or by an administrator; anyone else is refused and, in the interface, is shown a missing-page instead of a refusal.

- reconciliation: implemented-only
- given: two vendors and an administrator
- when: one vendor opens the other vendor's profile, and separately an administrator opens it
- then: the vendor is shown a missing page and the administrator sees the profile
- cites: src/back-end/lib/permissions.ts:159
- cites: src/back-end/lib/resources/user.ts:67
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:133
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:149
- cites: src/back-end/docs/user.yaml:14
- note: the published interface description of this route mentions no restriction at all.

### D-users-11 · v1 · inferred · recovered

A signed-in person can open their own profile through a fixed address that stands for whoever is signed in, without knowing their own account identifier.

- reconciliation: implemented-only
- given: any signed-in person
- when: they open the profile address that stands for the current person
- then: their own profile is shown
- cites: src/shared/lib/resources/user.ts:6
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:81
- note: a visitor who is not signed in is sent to sign in first and returned to the profile afterwards.

### D-users-12 · v1 · inferred · recovered

A profile requires a name of between one and one hundred characters and an email address in a valid format, while the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.

- reconciliation: implemented-only
- given: a person editing their own profile
- when: they clear the name, or enter an email address that is not in a valid format
- then: the profile is not saved and the offending field is reported as invalid, while the same profile saves with the job title and picture left empty
- cites: src/shared/lib/validation/user.ts:22
- cites: src/shared/lib/validation/user.ts:26
- cites: src/shared/lib/validation/index.ts:218
- cites: src/shared/lib/validation/index.ts:444
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:77
- cites: src/back-end/lib/resources/user.ts:157
- cites: src/back-end/docs/user.yaml:93
- note: the published interface description lists the same fields but says nothing about which are required or how long they may be, and it gives this operation a different request method than the service accepts, so it cannot be followed literally.
- note: the sign-in username is shown on the profile as a permanently read-only field, so a person can see which identity their account belongs to but cannot change it.

### D-users-13 · v1 · inferred · recovered

The job title is asked for and shown only on a public sector employee's profile; a vendor is never asked for one.

- reconciliation: implemented-only
- given: a vendor and a public sector employee each editing their own profile
- when: each opens the profile form
- then: the public sector employee is offered a job title field and the vendor is not
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:283
- cites: src/shared/lib/resources/user.ts:99
- note: the service accepts a job title on any account, so a vendor's stored job title, if one ever existed, is carried through their profile edits unchanged and unseen.

### D-users-16 · v1 · inferred · recovered

A person may turn the notice of new opportunities on or off at any time from their profile, and following the unsubscribe link in such a message opens their profile and asks them to confirm before stopping.

- reconciliation: implemented-only
- given: a person who is being told about new opportunities
- when: they follow the unsubscribe link from one of those messages
- then: their notification settings open with a question asking whether they are sure, naming the email address that would stop receiving them, and the setting changes only once they confirm
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:44
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:101
- cites: src/front-end/typescript/lib/pages/user/profile/tab/notifications.tsx:194
- cites: src/back-end/lib/resources/user.ts:234
- cites: src/front-end/typescript/lib/app/router.ts:546
- cites: src/back-end/docs/user.yaml:113
- note: the settings page states the address notifications are sent to and tells the person to correct their profile if it is wrong; there is no separate notification address.

### D-users-18 · v1 · inferred · recovered

An administrator may deactivate another person's account, which records the date and who did it and tells that person by email that an administrator has removed their access.

- reconciliation: implemented-only
- given: an administrator viewing an active person's profile
- when: they deactivate that account and confirm
- then: the account is marked as deactivated by an administrator, carries the date and the identity of the administrator who did it, and the person receives a message saying their access has been removed and whom to contact with questions
- cites: src/back-end/lib/resources/user.ts:368
- cites: src/back-end/lib/resources/user.ts:393
- cites: src/back-end/lib/mailer/notifications/user.tsx:96
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:593

### D-users-19 · v1 · inferred · recovered

A request to deactivate an account that is already inactive is refused, and an administrator is never offered the option of deactivating their own account.

- reconciliation: implemented-only
- given: an already deactivated account, and an administrator viewing their own profile
- when: a second deactivation is requested for the first, and the administrator looks for a deactivation control on their own profile
- then: the second request is refused with a message saying the account is already inactive, and the administrator's own profile offers no such control
- cites: src/back-end/lib/resources/user.ts:357
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:516
- note: nothing prevents an administrator from deactivating the last remaining administrator account other than their own, so the service can be left with no usable administrator.

### D-users-26 · v1 · inferred · recovered

An administrator may export a contact list of active accounts as a spreadsheet file, choosing whether to include public sector employees, vendors or both, and which of first name, last name, email address and organization name to include; at least one kind and one field must be chosen.

- reconciliation: implemented-only
- given: one active vendor belonging to an active organization, one deactivated vendor and one administrator
- when: an administrator exports the contact list with both kinds and all four fields chosen
- then: the file contains the active vendor and the administrator but not the deactivated vendor, the administrator is labelled as such, and the vendor's row carries their organization's legal name
- cites: src/back-end/lib/resources/contact-list.ts:34
- cites: src/back-end/lib/resources/contact-list.ts:63
- cites: src/back-end/lib/resources/contact-list.ts:91
- cites: src/back-end/lib/db/user.ts:192
- cites: src/back-end/lib/validation.ts:1222
- cites: src/back-end/lib/validation.ts:1241
- cites: src/front-end/typescript/lib/pages/user/list.tsx:518
- note: a person's name is split into a first name and a last name at the first space, so a single-word name yields an empty last name and a three-word name puts two words in the last-name column. The account-kind column appears only when both kinds were chosen. Administrators are exported whenever public sector employees are chosen. Only organizations that are still active and memberships that are still current are named, joined into one field.
- note: the export is refused to anyone who is not an administrator, and the export control itself is unavailable until at least one kind and one field are ticked.

### D-users-28 · v1 · inferred · recovered

A vendor's profile carries a section setting out the privacy policy, the service's terms and conditions with the date and time they agreed to them, and the terms of each of the three programs; nobody but a vendor is shown it.

- reconciliation: implemented-only
- given: a vendor who has agreed to the terms and a public sector employee
- when: each opens their own profile
- then: the vendor sees the legal section stating the date and time they agreed, and the public sector employee is not offered the section at all and is shown their profile instead if they ask for it
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:23
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:122
- cites: src/front-end/typescript/lib/pages/user/profile/tab/legal.tsx:173
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:174
- note: the privacy policy is shown as text on the page and states that agreement to it was given when the account was created, so it is never separately accepted.

### D-users-30 · v1 · inferred · recovered

A profile shows different sections depending on whose it is: a vendor's own profile offers profile, capabilities, organizations, notifications and legal sections, a public sector employee's offers profile and notifications, and an administrator looking at somebody else's account sees the profile section alone.

- reconciliation: implemented-only
- given: a vendor, a public sector employee and an administrator
- when: each opens their own profile, and the administrator then opens the vendor's
- then: each own profile shows the sections belonging to that kind of account, and the vendor's profile seen by the administrator shows only the profile section
- cites: src/front-end/typescript/lib/pages/user/profile/tab/index.ts:174
- cites: src/front-end/typescript/lib/pages/user/profile/index.tsx:163
- cites: src/front-end/typescript/lib/pages/user/profile/tab/profile.tsx:448
- note: asking for a section that does not belong to the profile being viewed silently shows the profile section instead of refusing. An account's status is shown only to an administrator; everyone else sees the account kind alone.

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

The question is which of the thirteen users criteria still short of the contract become it, and the ruling is approve with a condition on every one: ten confirmed and three edited, none waved through. What tipped each confirm is a second witness independent of the recovery, not a second reading of the same line. D-users-3 rests on a single ternary at routers/auth.ts:169-173 - redirectOnSuccess, else existingUser ? /dashboard : /sign-up/complete - with the redirect parameter plumbed through the sign-in and token requests at :87-92 and :140-144, and the front end independently builds that parameter when it bounces a signed-out visitor off a profile at profile/index.tsx:96-104, so both halves of the statement are witnessed on both sides of the wire. D-users-10 is enforced three times over: permissions.ts:159-161 is isOwnAccount-or-isAdmin, resources/user.ts:67-69 answers 401, and profile/index.tsx:133 and :149 turn both the failed read and the wrong viewer into the Not Found page, which is exactly the split the criterion describes between the service refusing and the interface hiding. D-users-11 is VIEWER_USER_ROUTE_PARAM = 'me' at shared/lib/resources/user.ts:6 with its only consumer at profile/index.tsx:81-83, and the fail branch at :90-105 is the note. D-users-6 turns on notificationsBooleanToNotificationsOn at shared/lib/resources/user.ts:183-187, which is literally `notificationsOn ? new Date() : null`; the sign-up page writes the choice at step-two.tsx:83-89 and resources/user.ts:234-243 is the only path that converts it, so both the recorded moment and the note that switching off records nothing are single-sited. D-users-13 is the isPublicSectorUserType gate at profile-form.tsx:283 against the definition at shared/lib/resources/user.ts:99-101, corroborated in the opposite direction by resources/user.ts:157-160 validating jobTitle on every account regardless of kind, which is the note. D-users-16 is confirmed on four sites that agree: router.ts:563 reads the bare `unsubscribe` query key, notifications.tsx:50 arms the modal only when the person is currently subscribed, :194-209 is the confirmation naming their email address, and the setting only reaches resources/user.ts:234 through :101-112 after they confirm. D-users-18 matches its mail word for word - resources/user.ts:372-394 sets InactiveByAdmin with deactivatedOn and deactivatedBy and calls accountDeactivatedAdmin, and mailer/notifications/user.tsx:96-122 is deactivated by an administrator, no longer have access, and the contact address. D-users-26 I checked end to end and every clause of the statement and both notes resolve: contact-list.ts:34 is admin-only, validation.ts:1222-1258 requires at least one kind and one of exactly four fields, :62-68 pushes Admin in alongside Government, :83-86 adds the kind column only when both were chosen, :98-101 splits the name at the first space, and db/user.ts:192-222 passes includeInactive false and joins only active organizations and non-inactive memberships on legalName. D-users-28 is the three programs at legal.tsx:202, :210 and :218 under the vendor-only comment at :23, with the agreement date and time rendered at :173-178 and the privacy policy stating at :153-156 that it was agreed at account creation, and profile/index.tsx:174-176 silently substitutes the profile section for a non-vendor. D-users-30 is the sidebar switch at tab/index.ts:174-199 read against the tab coercion at profile/index.tsx:163-180, which together give the vendor five sections, the public sector employee two, and the administrator viewing somebody else the profile section alone; profile.tsx:448-455 is the status note. Three I am editing rather than confirming, because the recovered behaviour is right and the wording is not, and in each case the rewording is the second witness. D-users-4 is the one that was spiked at the last gate and I am answering it now rather than asking again: the product question was whether a public sector employee loses the new-opportunity notification choice by never reaching the profile-completion page, and tab/index.ts:185-189 answers it - a Government account's own profile carries the notifications section, so the choice is reachable and nothing has to move; a public sector employee continues straight to the dashboard. The wording needed fixing regardless, because 'anyone else who reaches it is sent to their dashboard' is false for a visitor who is not signed in, whom step-two.tsx:128-136 sends to sign in instead. D-users-12 gains one fact a rebuild cannot afford to miss: validation/index.ts:444-450 lowercases the address before returning it, so the stored email is normalised and not merely checked; the lengths themselves are validateGenericString's min 1 max 100 at :218-232 with jobTitle overridden to min 0 at validation/user.ts:26-28, and the front-end gate at profile-form.tsx:77-86 requires name and email independently. D-users-19 conflated two levels of enforcement: resources/user.ts:357-359 genuinely refuses a second deactivation, but the administrator's own account is protected only by profile.tsx:516-518 hiding the control, since permissions.deleteUser at permissions.ts:167-169 is isOwnAccount-or-isAdmin and passes on the first clause - the edited statement says which half is the service and which is the interface. Two things to carry forward that are not conditions here. The note on D-users-19 that nothing stops an administrator deactivating the last other administrator is accurate and is a real operational risk for the rebuild, but it is a gap in the old system's rules rather than a defect in this criterion, so it belongs in the rebuilt system's own access rules rather than in a replacement statement attached to this row. And docs/user.yaml documents the profile update under `post` at :30 while the service registers it as a CRUD update, and describes /users/{id} at :14 with no access restriction at all, so the published interface description is not usable as a source for either D-users-10 or D-users-12 and neither confirmation leans on it. Not escalating: the tier is STANDARD, the stage reported no confidence shortfall, and the one genuinely two-reading criterion had a mechanism for being ruled on directly. What would change this ruling: a second registration of the user update or read route with different permissions, evidence that a public sector employee was meant to be prompted for notifications at first sign-in rather than only from their profile, or any of these citations failing to resolve at the pinned commit.

**Conditions:**
- confirm D-users-3
- edit D-users-4: The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.
- confirm D-users-6
- confirm D-users-10
- confirm D-users-11
- edit D-users-12: A profile requires a name of between one and one hundred characters and an email address in a valid format, which is stored in lower case; the job title may be left blank and is limited to one hundred characters, and the profile picture is optional.
- confirm D-users-13
- confirm D-users-16
- confirm D-users-18
- edit D-users-19: A request to deactivate an account that is already inactive is refused with a message saying the account is already inactive; an administrator viewing their own profile is offered no deactivation control, but that restriction rests on the interface alone, since the service accepts a deactivation request made against the requester's own account.
- confirm D-users-26
- confirm D-users-28
- confirm D-users-30
