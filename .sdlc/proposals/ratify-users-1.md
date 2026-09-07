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

